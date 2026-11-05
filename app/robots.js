import { SITE_URL } from '../lib/seo';

// /robots.txt — lets search engines in, keeps the dashboard and API out.
export default function robots() {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/staff', '/api/'] }],
    sitemap: SITE_URL + '/sitemap.xml',
    host: SITE_URL,
  };
}
