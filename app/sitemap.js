import { SITE_URL, seoPackages, seoVisaCards } from '../lib/seo';
import { listPublished } from '../lib/news';

// /sitemap.xml — every public page, package, visa and blog post, so Google
// finds them without having to run the site's JavaScript.
export const revalidate = 3600; // rebuilt at most once an hour

export default async function sitemap() {
  const now = new Date();
  const page = (path, priority, changeFrequency = 'weekly') => ({ url: SITE_URL + path, lastModified: now, changeFrequency, priority });
  const out = [
    page('/', 1, 'daily'),
    page('/packages', 0.9, 'daily'),
    page('/visa', 0.9, 'daily'),
    page('/flights', 0.7),
    page('/contact', 0.6, 'monthly'),
    page('/faq', 0.5, 'monthly'),
    page('/jobs', 0.4, 'monthly'),
    page('/news', 0.5, 'daily'),
  ];
  const [packages, cards] = await Promise.all([seoPackages(), seoVisaCards()]);
  packages.forEach((p) => out.push(page('/packages/' + p.id, 0.8)));
  const countries = new Set();
  cards.forEach((c) => {
    out.push(page('/visa/' + c.id, 0.7));
    if (c.country_id && !countries.has(c.country_id)) { countries.add(c.country_id); out.push(page('/visa/country/' + c.country_id, 0.7)); }
  });
  try {
    const posts = await listPublished({ limit: 500 });
    posts.forEach((p) => out.push({ url: SITE_URL + '/news/' + encodeURIComponent(p.slug), lastModified: p.published_at ? new Date(p.published_at) : now, changeFrequency: 'monthly', priority: 0.5 }));
  } catch (e) { console.error('sitemap news failed', e); }
  return out;
}
