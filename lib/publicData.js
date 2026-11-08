// Customer-facing data shared by the public API routes and the server-rendered
// pages, so both always show exactly the same list.
import { sql, ensureSchema } from './db';
import { publicPackage } from './packagePricing';
import { getExchangeRate } from './settings';
import { normalizeVisaCountry } from './destinations';
import { withVisaSellPrices } from './visaPricing';
import { livePackages } from './packageExpiry';

export async function listPublicPackages() {
  await ensureSchema();
  const rows = await sql`
    SELECT * FROM packages WHERE active = true
      AND (publish_at IS NULL OR publish_at <= (now() AT TIME ZONE 'Asia/Baghdad')::date)
      AND (departure_date IS NULL OR departure_date >= (now() AT TIME ZONE 'Asia/Baghdad')::date)
    ORDER BY sort_order ASC, id ASC
  `;
  const rate = await getExchangeRate();
  // Customer-safe: computed prices only — no settlement, commission, supplier or hidden hotels
  return livePackages(rows).map((r) => publicPackage(r, rate));
}

export async function listVisaCards() {
  await ensureSchema();
  const cards = await sql`
    SELECT vc.id, vc.stay_duration, vc.issuing_time_days, vc.validity_before_travel,
           vc.adult_price, vc.child_price, vc.price_currency, vc.image_url,
           c.id AS country_id, c.name_ar AS country_name_ar, c.name_en AS country_name_en, c.flag_code, c.card_image_url, c.pdf_banner_url, c.region,
           vt.name_ar AS visa_type_name_ar, vt.name_en AS visa_type_name_en
    FROM visa_cards vc
    LEFT JOIN countries c ON c.id = vc.country_id
    LEFT JOIN visa_types vt ON vt.id = vc.visa_type_id
    WHERE vc.active = true AND COALESCE(c.active, true) = true
    ORDER BY c.name_ar ASC
  `;
  const rate = await getExchangeRate();
  // A card priced in USD follows the dashboard exchange rate; price_currency
  // itself never leaves the server — the customer always sees IQD.
  return cards.map((c) => {
    const { price_currency, ...safe } = withVisaSellPrices(c, rate);
    return normalizeVisaCountry(safe);
  });
}

// Plain JSON copy (Dates → strings) so it can be handed to client components.
export function toPlain(v) {
  return JSON.parse(JSON.stringify(v ?? null));
}
