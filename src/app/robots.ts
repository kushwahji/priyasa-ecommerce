import type { MetadataRoute } from 'next';

export const dynamic = 'force-dynamic';

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'https://priyasa.com';
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/admin/', '/api/', '/account/', '/checkout/'] },
      { userAgent: 'GPTBot', disallow: ['/admin/', '/api/', '/account/', '/checkout/'] },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
