// Search-engine helpers: site address, page titles and the data the sitemap
// and per-page titles need. Every database read here is wrapped so a database
// hiccup only drops the extra detail, never breaks the page itself.
import { cache } from 'react';
import { sql, ensureSchema } from './db';
import { normalizeVisaCountry, nightsLabel } from './destinations';
import { isPackageExpired } from './packageExpiry';

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
  SELECT id, title_ar, dest_ar, nights, day_count, nights_ar, image_url, created_at, departure_date, available_dates FROM packages WHERE active = true
    AND (publish_at IS NULL OR publish_at <= (now() AT TIME ZONE 'Asia/Baghdad')::date)
    AND (departure_date IS NULL OR departure_date >= (now() AT TIME ZONE 'Asia/Baghdad')::date)
  ORDER BY sort_order ASC, id ASC`;

export async function seoPackages() {
  try { await ensureSchema(); return (await ACTIVE_PACKAGES()).filter((p) => !isPackageExpired(p)); } catch (e) { console.error('seoPackages failed', e); return []; }
}

// cache(): generateMetadata and the layout's JSON-LD share one query per request.
export const seoPackage = cache(async (id) => {
  const n = Number(id);
  if (!Number.isInteger(n) || n <= 0) return null;
  try {
    await ensureSchema();
    const rows = await sql`SELECT id, title_ar, dest_ar, nights, day_count, nights_ar, image_url, active, price, includes_ar, available_dates, departure_date FROM packages WHERE id = ${n} LIMIT 1`;
    return rows[0] && rows[0].active && !isPackageExpired(rows[0]) ? rows[0] : null;
  } catch (e) { console.error('seoPackage failed', e); return null; }
});

// schema.org TouristTrip for one package, so search engines can show the
// price and departure dates. Prices are IQD per adult.
export function packageJsonLd(p) {
  if (!p) return null;
  const url = SITE_URL + '/packages/' + p.id;
  const today = new Date().toISOString().slice(0, 10);
  const dates = (Array.isArray(p.available_dates) ? p.available_dates : [])
    .map((d) => String((d && d.date) || d || '').slice(0, 10))
    .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d) && d >= today)
    .sort();
  const price = Number(p.price) || 0;
  const offer = (extra) => ({
    '@type': 'Offer', price, priceCurrency: 'IQD', url, availability: 'https://schema.org/InStock',
    seller: { '@type': 'TravelAgency', name: BRAND, url: SITE_URL }, ...extra,
  });
  return {
    '@context': 'https://schema.org',
    '@type': 'TouristTrip',
    name: p.title_ar || p.dest_ar,
    description: ['باقة سياحية', p.dest_ar, nightsLabel(p, 'ar')].filter(Boolean).join(' — '),
    url,
    image: p.image_url || SITE_URL + DEFAULT_OG,
    touristType: 'سياح من العراق',
    provider: { '@type': 'TravelAgency', name: BRAND, url: SITE_URL },
    itinerary: p.dest_ar ? { '@type': 'Place', name: p.dest_ar } : undefined,
    offers: price > 0 ? (dates.length ? dates.slice(0, 12).map((d) => offer({ validFrom: today, availabilityStarts: d })) : offer({})) : undefined,
  };
}

export async function seoVisaCards() {
  try {
    await ensureSchema();
    return await sql`
      SELECT vc.id, vc.stay_duration, vc.issuing_time_days, vc.image_url, c.id AS country_id, c.name_ar AS country_name_ar,
             c.name_en AS country_name_en, c.flag_code, c.card_image_url, vt.name_ar AS visa_type_name_ar
      FROM visa_cards vc
      LEFT JOIN countries c ON c.id = vc.country_id
      LEFT JOIN visa_types vt ON vt.id = vc.visa_type_id
      WHERE vc.active = true AND COALESCE(c.active, true) = true
      ORDER BY c.name_ar ASC`.then((rows) => rows.map(normalizeVisaCountry));
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
  return nightsLabel(p, 'ar');
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
