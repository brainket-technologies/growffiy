import { NextResponse } from 'next/server';
import { prisma } from '../../../../database/db';
import { inMemoryClients } from '../../clients/route';
import { KiteClient } from '../../../../shared/services/kite';

function getRedirectUrl(path: string, request: Request): string {
  const envUrl = process.env.NEXT_PUBLIC_URL || process.env.NEXT_PUBLIC_SITE_URL;
  if (envUrl) {
    return new URL(path, envUrl).toString();
  }
  const host = request.headers.get('host');
  if (host && !host.includes('0.0.0.0')) {
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    return new URL(path, `${protocol}://${host}`).toString();
  }
  return new URL(path, request.url).toString();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const requestToken = searchParams.get('request_token');
  const clientId = searchParams.get('state');
  const status = searchParams.get('status');

  if (!clientId) {
    return NextResponse.redirect(getRedirectUrl('/admin/clients?error=missing_client_id', request));
  }

  if (!requestToken) {
    return NextResponse.redirect(getRedirectUrl(`/admin/clients/${clientId}?error=missing_request_token`, request));
  }

  try {
    // 1. Fetch the client to retrieve their api_key and api_secret
    let client: any = null;
    let isDemoMode = false;
    
    try {
      client = await prisma.client.findUnique({
        where: { id: clientId },
        include: { user: true }
      });
    } catch {
      // Fallback in-memory
      client = inMemoryClients.find((c) => c.id === clientId);
      isDemoMode = true;
    }

    if (!client) {
      return NextResponse.redirect(getRedirectUrl(`/admin/clients?error=client_not_found`, request));
    }

    const masterApiKeySetting = await prisma.appSettings.findUnique({ where: { settingKey: 'master_zerodha_api_key' } });
    const masterApiSecretSetting = await prisma.appSettings.findUnique({ where: { settingKey: 'master_zerodha_api_secret' } });
    const apiKey = masterApiKeySetting?.settingValue || '';
    const apiSecret = masterApiSecretSetting?.settingValue || '';

    if (!apiKey || !apiSecret) {
      return NextResponse.redirect(getRedirectUrl(`/admin/clients/${clientId}?error=missing_master_api_credentials`, request));
    }

    // 2. Request Session Access Token from Zerodha Kite Connect API using helper
    const kiteData = await KiteClient.generateSession(apiKey, apiSecret, requestToken);

    if (kiteData.status !== 'success' || !kiteData.data || !kiteData.data.access_token) {
      const errorMsg = kiteData.message || 'Kite token exchange failed';
      return NextResponse.redirect(
        getRedirectUrl(`/admin/clients/${clientId}?error=${encodeURIComponent(errorMsg)}`, request)
      );
    }

    const accessToken = kiteData.data.access_token;

    // 4. Update the Client with the official access token and session response JSON
    if (isDemoMode) {
      const idx = inMemoryClients.findIndex((c) => c.id === clientId);
      if (idx !== -1) {
        inMemoryClients[idx].accessToken = accessToken;
        inMemoryClients[idx].zerodhaSession = JSON.stringify(kiteData);
      }
    } else {
      await prisma.client.update({
        where: { id: clientId },
        data: { 
          accessToken,
          zerodhaSession: JSON.stringify(kiteData)
        },
      });

      // Write directly to database AuditLog table
      try {
        let admin = await prisma.user.findFirst({ where: { role: 'admin' } });
        if (!admin) {
          admin = await prisma.user.create({
            data: {
              name: 'Firoz Mohammad',
              email: 'admin@growffiy.com',
              userId: 'admin',
              password: 'admin_secure_password_123',
              role: 'admin'
            }
          });
        }
        if (admin) {
          await prisma.auditLog.create({
            data: {
              adminId: admin.id,
              action: 'Kite Token Refreshed',
              newValue: `Successfully refreshed Kite session token for ${client.name || client.user?.name || 'Client'} | Endpoint: GET /api/callback/zerodha | Payload: {"request_token": "${requestToken}"} | Response: {"access_token": "${accessToken.substring(0, 15)}..."}`,
            }
          });
        }
      } catch (logErr) {
        console.error('Failed to write callback log:', logErr);
      }
    }

    // 5. Redirect back to client details page
    return NextResponse.redirect(getRedirectUrl(`/admin/clients/${clientId}?success=connected`, request));
  } catch (err: any) {
    console.error('Zerodha OAuth Callback Error:', err);
    return NextResponse.redirect(
      getRedirectUrl(`/admin/clients/${clientId}?error=${encodeURIComponent(err.message || 'OAuth execution error')}`, request)
    );
  }
}
