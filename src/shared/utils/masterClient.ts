import { prisma } from '../../database/db';

export interface MasterClient {
  id: string;
  zerodhaApiKey: string;
  accessToken: string;
}

/**
 * Resolve the Master Scanner Client from DB.
 *
 * Priority:
 *  1. Client configured via 'master_scanner_client_id' setting (by ID or zerodhaClientId)
 *  2. Fallback — any client with a valid accessToken + zerodhaApiKey
 *
 * Returns null if no valid master client is found.
 */
export async function getMasterClient(): Promise<MasterClient | null> {
  try {
    const masterSetting = await prisma.appSettings.findUnique({
      where: { settingKey: 'master_scanner_client_id' }
    });

    let masterClient = null;

    if (masterSetting?.settingValue) {
      masterClient = await prisma.client.findFirst({
        where: {
          OR: [
            { id: masterSetting.settingValue },
            { zerodhaClientId: masterSetting.settingValue }
          ],
          accessToken: { not: null },
          zerodhaApiKey: { not: null }
        }
      });
    }

    // Fallback: any connected client
    if (!masterClient) {
      masterClient = await prisma.client.findFirst({
        where: { accessToken: { not: null }, zerodhaApiKey: { not: null } }
      });
    }

    if (masterClient && masterClient.zerodhaApiKey && masterClient.accessToken) {
      return {
        id: masterClient.id,
        zerodhaApiKey: masterClient.zerodhaApiKey,
        accessToken: masterClient.accessToken
      };
    }
  } catch (err) {
    console.error('getMasterClient: Error resolving Master Client credentials:', err);
  }

  return null;
}
