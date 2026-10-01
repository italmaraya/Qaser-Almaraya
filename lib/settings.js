// Site-wide settings stored in Neon (site_settings table).
import { sql, ensureSchema } from './db';
import { IQD_PER_USD } from './exchangeRate';

let cache = { rate: null, at: 0 };

export async function getSetting(key) {
  await ensureSchema();
  const rows = await sql`SELECT value FROM site_settings WHERE key = ${key}`;
  return rows.length ? rows[0].value : null;
}

export async function setSetting(key, value) {
  await ensureSchema();
  await sql`INSERT INTO site_settings (key, value, updated_at) VALUES (${key}, ${String(value)}, now())
            ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`;
}

/** USD→IQD rate; falls back to the built-in default. Cached for 60 s. */
export async function getExchangeRate() {
  if (cache.rate && Date.now() - cache.at < 60000) return cache.rate;
  try {
    const v = Number(await getSetting('usd_iqd_rate'));
    cache = { rate: v > 0 ? v : IQD_PER_USD, at: Date.now() };
  } catch {
    cache = { rate: IQD_PER_USD, at: Date.now() };
  }
  return cache.rate;
}
export function clearRateCache() { cache = { rate: null, at: 0 }; }
