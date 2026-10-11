/**
 * Helper to fetch geographic location details (City, Region, Country, ISP) from an IP address.
 */
export async function getIpLocation(ip: string): Promise<{
  city: string;
  region: string;
  country: string;
  isp?: string;
  formatted: string;
}> {
  const cleanIp = ip.split(',')[0].trim();
  
  // Return local if private/localhost IP
  if (!cleanIp || cleanIp === '127.0.0.1' || cleanIp === '::1' || cleanIp.startsWith('192.168.') || cleanIp.startsWith('10.')) {
    return {
      city: 'Local',
      region: 'Development / Intranet',
      country: 'Local Network',
      formatted: 'Localhost / Internal Network'
    };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500); // 2.5s fast timeout

    const res = await fetch(`http://ip-api.com/json/${cleanIp}?fields=status,country,regionName,city,isp`, {
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (data && data.status === 'success') {
        const parts = [data.city, data.regionName, data.country].filter(Boolean);
        return {
          city: data.city || 'Unknown City',
          region: data.regionName || '',
          country: data.country || 'Unknown Country',
          isp: data.isp || '',
          formatted: parts.join(', ') + (data.isp ? ` (${data.isp})` : '')
        };
      }
    }
  } catch (err) {
    // Graceful fallback if geo API unreachable
  }

  return {
    city: 'Unknown',
    region: 'Unknown',
    country: 'Unknown',
    formatted: 'Location unavailable'
  };
}

/**
 * Parses user agent into human-readable Browser & OS.
 */
export function parseUserAgent(userAgent: string): { browser: string; os: string; formatted: string } {
  if (!userAgent) return { browser: 'Unknown Browser', os: 'Unknown OS', formatted: 'Unknown Device' };

  let os = 'Unknown OS';
  if (/windows/i.test(userAgent)) os = 'Windows';
  else if (/macintosh|mac os x/i.test(userAgent)) os = 'macOS';
  else if (/android/i.test(userAgent)) os = 'Android';
  else if (/iphone|ipad|ipod/i.test(userAgent)) os = 'iOS';
  else if (/linux/i.test(userAgent)) os = 'Linux';

  let browser = 'Unknown Browser';
  if (/edg/i.test(userAgent)) browser = 'Microsoft Edge';
  else if (/chrome|crios/i.test(userAgent)) browser = 'Google Chrome';
  else if (/firefox|fxios/i.test(userAgent)) browser = 'Mozilla Firefox';
  else if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) browser = 'Apple Safari';
  else if (/opera|opr/i.test(userAgent)) browser = 'Opera';

  return {
    browser,
    os,
    formatted: `${browser} on ${os}`
  };
}
