import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/staff/',
          '/api/',
          '/clients/',
          '/login',
          '/staff/login',
          '/admin/login',
        ],
      },
    ],
    sitemap: 'https://growffi.com/sitemap.xml',
  };
}
