// Search-engine helpers: site address, page titles and the data the sitemap
// and per-page titles need. Every database read here is wrapped so a database
// hiccup only drops the extra detail, never breaks the page itself.
import { sql, ensureSchema } from './db';

export const SITE_URL = 'https://www.almarayagroup.iq';
export const BRAND = 'قصر المرايا للسفر والسياحة';
export const DEFAULT_OG = '/og-default.jpg';

// Build the metadata object for one page.
export function pageMeta({ title, absoluteTitle, description, path, image }) {
  const fullTitle = absoluteTitle || (title ? title + ' | ' + BRAND : BRAND);
  const images = [image || DEFAULT_OG];
  return {
    title: fullTitle,
    description,
    alternates: { canonical: path },
    openGraph: { title: fullTitle, description, url: path, siteName: BRAND, locale: 'ar_IQ', type: 'website', images },
    twitter: { card: 'summary_large_image', title: fullTitle, description, images },
  };
}

const ACTIVE_PACKAGES = () => sql`
  SELECT id, title_ar, dest_ar, nights, day_count, nights_ar, image_url, created_at FROM packages WHERE active = true
    AND (publish_at IS NULL OR publish_at <= (now() AT TIME ZONE 'Asia/Baghdad')::date)
    AND (departure_date IS NULL OR departure_date >= (now() AT TIME ZONE 'Asia/Baghdad')::date)
  ORDER BY sort_order ASC, id ASC`;

export async function seoPackages() {
  try { await ensureSchema(); return await ACTIVE_PACKAGES(); } catch (e) { console.error('seoPackages failed', e); return []; }
}

export async function seoPackage(id) {
  const n = Number(id);
  if (!Number.isInteger(n) || n <= 0) return null;
  try {
    await ensureSchema();
    const rows = await sql`SELECT id, title_ar, dest_ar, nights, day_count, nights_ar, image_url, active FROM packages WHERE id = ${n} LIMIT 1`;
    return rows[0] && rows[0].active ? rows[0] : null;
  } catch (e) { console.error('seoPackage failed', e); return null; }
}

export async function seoVisaCards() {
  try {
    await ensureSchema();
    return await sql`
      SELECT vc.id, vc.stay_duration, vc.issuing_time_days, vc.image_url, c.id AS country_id, c.name_ar AS country_name_ar,
             c.card_image_url, vt.name_ar AS visa_type_name_ar
      FROM visa_cards vc
      LEFT JOIN countries c ON c.id = vc.country_id
      LEFT JOIN visa_types vt ON vt.id = vc.visa_type_id
      WHERE vc.active = true AND COALESCE(c.active, true) = true
      ORDER BY c.name_ar ASC`;
  } catch (e) { console.error('seoVisaCards failed', e); return []; }
}

export async function seoVisaCard(id) {
  const n = Number(id);
  if (!Number.isInteger(n) || n <= 0) return null;
  const all = await seoVisaCards();
  return all.find((c) => Number(c.id) === n) || null;
}

export async function seoCountry(id) {
  const n = Number(id);
  if (!Number.isInteger(n) || n <= 0) return null;
  const all = await seoVisaCards();
  const cards = all.filter((c) => Number(c.country_id) === n);
  return cards.length ? { id: n, name_ar: cards[0].country_name_ar, image: cards[0].card_image_url || cards[0].image_url, types: [...new Set(cards.map((c) => c.visa_type_name_ar).filter(Boolean))] } : null;
}

export function nightsText(p) {
  if (p.nights) return p.nights + (p.nights <= 10 ? ' ليالٍ' : ' ليلة');
  return p.nights_ar || '';
}

// Business details for Google (shown in search results and Maps panels)
export const ORG_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'TravelAgency',
  name: BRAND,
  alternateName: 'Qaser Almaraya for Travel & Tourism',
  url: SITE_URL,
  logo: SITE_URL + '/icon.png',
  image: SITE_URL + DEFAULT_OG,
  telephone: '+964-784-999-9600',
  email: 'sales@almarayagroup.com',
  address: { '@type': 'PostalAddress', streetAddress: 'شارع 14 رمضان', addressLocality: 'بغداد', addressCountry: 'IQ' },
  areaServed: 'IQ',
};
