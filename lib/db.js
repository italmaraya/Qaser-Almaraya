import { neon } from '@neondatabase/serverless';
import { SEED_PACKAGES } from './packagesData.js';
import { IQD_PER_USD } from './exchangeRate.js';

function getConnectionString() {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.POSTGRES_URL_NON_POOLING
  );
}

export function sql(strings, ...values) {
  const conn = getConnectionString();
  if (!conn) {
    throw new Error('No Postgres connection string found (expected DATABASE_URL).');
  }
  const client = neon(conn);
  return client(strings, ...values);
}

let schemaReady = false;

/**
 * Creates every table the visa module needs, if it doesn't already exist.
 * Safe to call on every request — CREATE TABLE IF NOT EXISTS is a cheap no-op
 * once the tables are there. This avoids needing a separate manual migration
 * step for a project this size.
 */
export async function ensureSchema() {
  if (schemaReady) return;

  await sql`
    CREATE TABLE IF NOT EXISTS countries (
      id SERIAL PRIMARY KEY,
      name_ar TEXT NOT NULL,
      name_en TEXT NOT NULL,
      region TEXT DEFAULT '',
      flag_code TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT now()
    )
  `;
  await sql`ALTER TABLE countries ADD COLUMN IF NOT EXISTS region TEXT DEFAULT ''`;
  await sql`ALTER TABLE countries ADD COLUMN IF NOT EXISTS flag_code TEXT DEFAULT ''`;
  await sql`ALTER TABLE countries ADD COLUMN IF NOT EXISTS card_image_url TEXT DEFAULT ''`;

  await sql`
    CREATE TABLE IF NOT EXISTS nationalities (
      id SERIAL PRIMARY KEY,
      name_ar TEXT NOT NULL,
      name_en TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT now()
    )
  `;
  const natCount = await sql`SELECT COUNT(*)::int AS n FROM nationalities`;
  if (natCount[0].n === 0) {
    await sql`INSERT INTO nationalities (name_ar, name_en, sort_order) VALUES ('عراقي', 'Iraqi', 0)`;
  }

  await sql`
    CREATE TABLE IF NOT EXISTS visa_types (
      id SERIAL PRIMARY KEY,
      name_ar TEXT NOT NULL,
      name_en TEXT NOT NULL,
      needs_appointment BOOLEAN DEFAULT false,
      delivers_visa_file BOOLEAN DEFAULT false,
      collects_passport BOOLEAN DEFAULT false,
      prepares_papers BOOLEAN DEFAULT false,
      result_guaranteed BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT now()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS providers (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      emails JSONB DEFAULT '[]',
      created_at TIMESTAMPTZ DEFAULT now()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS visa_cards (
      id SERIAL PRIMARY KEY,
      country_id INTEGER REFERENCES countries(id) ON DELETE CASCADE,
      visa_type_id INTEGER REFERENCES visa_types(id) ON DELETE SET NULL,
      stay_duration TEXT DEFAULT '',
      issuing_time_days INTEGER,
      validity_before_travel TEXT DEFAULT '',
      adult_price NUMERIC DEFAULT 0,
      child_price NUMERIC DEFAULT 0,
      adult_cost NUMERIC DEFAULT 0,
      child_cost NUMERIC DEFAULT 0,
      cost_currency TEXT DEFAULT 'IQD',
      booking_notes TEXT DEFAULT '',
      booking_notes_en TEXT DEFAULT '',
      image_url TEXT DEFAULT '',
      provider_id INTEGER REFERENCES providers(id) ON DELETE SET NULL,
      provider_email TEXT DEFAULT '',
      send_method TEXT DEFAULT 'provider',
      active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT now()
    )
  `;
  // Older deployments may already have visa_cards without this column.
  await sql`ALTER TABLE visa_cards ADD COLUMN IF NOT EXISTS cost_currency TEXT DEFAULT 'IQD'`;
  await sql`ALTER TABLE visa_cards ADD COLUMN IF NOT EXISTS booking_notes_en TEXT DEFAULT ''`;

  await sql`
    CREATE TABLE IF NOT EXISTS visa_documents (
      id SERIAL PRIMARY KEY,
      visa_card_id INTEGER REFERENCES visa_cards(id) ON DELETE CASCADE,
      sort_order INTEGER DEFAULT 0,
      name_ar TEXT NOT NULL,
      name_en TEXT NOT NULL,
      kind TEXT NOT NULL DEFAULT 'file',
      choices JSONB DEFAULT '[]',
      required BOOLEAN DEFAULT true,
      audience TEXT DEFAULT 'everyone',
      condition_field_id INTEGER REFERENCES visa_documents(id) ON DELETE SET NULL,
      condition_value TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT now()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS customer_statuses (
      id SERIAL PRIMARY KEY,
      name_ar TEXT NOT NULL,
      name_en TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS internal_statuses (
      id SERIAL PRIMARY KEY,
      name_ar TEXT NOT NULL,
      name_en TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0,
      customer_status_id INTEGER REFERENCES customer_statuses(id) ON DELETE SET NULL
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS visa_applications (
      id SERIAL PRIMARY KEY,
      visa_card_id INTEGER REFERENCES visa_cards(id),
      customer_name TEXT,
      customer_phone TEXT,
      customer_email TEXT,
      adult_count INTEGER DEFAULT 1,
      child_count INTEGER DEFAULT 0,
      internal_status_id INTEGER REFERENCES internal_statuses(id),
      payment_method TEXT,
      payment_status TEXT DEFAULT 'awaiting_review',
      payment_proof_url TEXT DEFAULT '',
      submitted_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    )
  `;
  // Older deployments may already have this table without these columns.
  await sql`ALTER TABLE visa_applications ADD COLUMN IF NOT EXISTS adult_count INTEGER DEFAULT 1`;
  await sql`ALTER TABLE visa_applications ADD COLUMN IF NOT EXISTS child_count INTEGER DEFAULT 0`;
  await sql`ALTER TABLE visa_applications ADD COLUMN IF NOT EXISTS result_file_url TEXT DEFAULT ''`;
  // Payment must be manually verified by staff before an application is ever
  // forwarded to a provider — see payment_status below. 'awaiting_review' is
  // the default for every new submission, regardless of payment method.
  await sql`ALTER TABLE visa_applications ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'awaiting_review'`;
  await sql`ALTER TABLE visa_applications ADD COLUMN IF NOT EXISTS payment_proof_url TEXT DEFAULT ''`;

  await sql`
    CREATE TABLE IF NOT EXISTS visa_travelers (
      id SERIAL PRIMARY KEY,
      application_id INTEGER REFERENCES visa_applications(id) ON DELETE CASCADE,
      traveler_type TEXT NOT NULL DEFAULT 'adult',
      full_name TEXT DEFAULT '',
      sort_order INTEGER DEFAULT 0
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS visa_application_answers (
      id SERIAL PRIMARY KEY,
      application_id INTEGER REFERENCES visa_applications(id) ON DELETE CASCADE,
      traveler_id INTEGER REFERENCES visa_travelers(id) ON DELETE CASCADE,
      visa_document_id INTEGER REFERENCES visa_documents(id),
      repeat_index INTEGER DEFAULT 0,
      value_text TEXT DEFAULT '',
      file_url TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT now()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS visa_status_history (
      id SERIAL PRIMARY KEY,
      application_id INTEGER REFERENCES visa_applications(id) ON DELETE CASCADE,
      internal_status_id INTEGER REFERENCES internal_statuses(id),
      changed_by TEXT,
      changed_at TIMESTAMPTZ DEFAULT now(),
      note TEXT DEFAULT ''
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS packages (
      id SERIAL PRIMARY KEY,
      cat TEXT NOT NULL DEFAULT 'family',
      countries JSONB DEFAULT '[]',
      dest_ar TEXT NOT NULL DEFAULT '',
      dest_en TEXT NOT NULL DEFAULT '',
      title_ar TEXT NOT NULL DEFAULT '',
      title_en TEXT NOT NULL DEFAULT '',
      nights_ar TEXT DEFAULT '',
      nights_en TEXT DEFAULT '',
      departs_ar TEXT DEFAULT '',
      departs_en TEXT DEFAULT '',
      price NUMERIC DEFAULT 0,
      child_price NUMERIC DEFAULT 0,
      adult_cost NUMERIC DEFAULT 0,
      child_cost NUMERIC DEFAULT 0,
      cost_currency TEXT DEFAULT 'IQD',
      badge_ar TEXT DEFAULT '',
      badge_en TEXT DEFAULT '',
      prefs JSONB DEFAULT '[]',
      includes_ar JSONB DEFAULT '[]',
      includes_en JSONB DEFAULT '[]',
      hotels JSONB DEFAULT '[]',
      flights JSONB DEFAULT '[]',
      days JSONB DEFAULT '[]',
      image_url TEXT DEFAULT '',
      active BOOLEAN DEFAULT true,
      sort_order INTEGER DEFAULT 0,
      iqd_migrated BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT now()
    )
  `;
  // Older deployments (before prices moved from USD to IQD, and before
  // internal-cost tracking existed) may already have this table without
  // these columns.
  await sql`ALTER TABLE packages ADD COLUMN IF NOT EXISTS adult_cost NUMERIC DEFAULT 0`;
  await sql`ALTER TABLE packages ADD COLUMN IF NOT EXISTS child_cost NUMERIC DEFAULT 0`;
  await sql`ALTER TABLE packages ADD COLUMN IF NOT EXISTS cost_currency TEXT DEFAULT 'IQD'`;
  await sql`ALTER TABLE packages ADD COLUMN IF NOT EXISTS iqd_migrated BOOLEAN DEFAULT false`;

  const pkgCount = await sql`SELECT COUNT(*)::int AS n FROM packages`;
  if (pkgCount[0].n === 0) {
    // Fresh table: the sample content below is authored in plain USD
    // numbers for readability, so convert to IQD (the site's real selling
    // currency, same as visa prices) at insert time.
    for (let i = 0; i < SEED_PACKAGES.length; i++) {
      const p = SEED_PACKAGES[i];
      const hotels = (p.hotels || []).map((h) => ({ ...h, diff: Math.round((h.diff || 0) * IQD_PER_USD) }));
      const flights = (p.flights || []).map((f) => ({ ...f, diff: Math.round((f.diff || 0) * IQD_PER_USD) }));
      await sql`
        INSERT INTO packages (
          cat, countries, dest_ar, dest_en, title_ar, title_en, nights_ar, nights_en,
          departs_ar, departs_en, price, child_price, adult_cost, child_cost, cost_currency,
          badge_ar, badge_en, prefs, includes_ar, includes_en, hotels, flights, days, sort_order, iqd_migrated
        ) VALUES (
          ${p.cat}, ${JSON.stringify(p.countries || [])}, ${p.destAr}, ${p.destEn}, ${p.titleAr}, ${p.titleEn},
          ${p.nightsAr}, ${p.nightsEn}, ${p.departsAr}, ${p.departsEn},
          ${Math.round(p.price * IQD_PER_USD)}, ${Math.round(p.childPrice * IQD_PER_USD)}, 0, 0, 'IQD',
          ${p.badgeAr || ''}, ${p.badgeEn || ''}, ${JSON.stringify(p.prefs || [])},
          ${JSON.stringify(p.includesAr || [])}, ${JSON.stringify(p.includesEn || [])},
          ${JSON.stringify(hotels)}, ${JSON.stringify(flights)}, ${JSON.stringify(p.days || [])}, ${i}, true
        )
      `;
    }
  } else {
    // One-time fix-up for packages that were created before prices switched
    // to IQD (this only ever touches rows that haven't been migrated yet,
    // so it's safe to run on every deploy and never double-converts).
    const unmigrated = await sql`SELECT * FROM packages WHERE iqd_migrated = false OR iqd_migrated IS NULL`;
    for (const row of unmigrated) {
      const hotels = (row.hotels || []).map((h) => ({ ...h, diff: Math.round((Number(h.diff) || 0) * IQD_PER_USD) }));
      const flights = (row.flights || []).map((f) => ({ ...f, diff: Math.round((Number(f.diff) || 0) * IQD_PER_USD) }));
      await sql`
        UPDATE packages SET
          price = ${Math.round((Number(row.price) || 0) * IQD_PER_USD)},
          child_price = ${Math.round((Number(row.child_price) || 0) * IQD_PER_USD)},
          hotels = ${JSON.stringify(hotels)},
          flights = ${JSON.stringify(flights)},
          iqd_migrated = true
        WHERE id = ${row.id}
      `;
    }
  }

  await sql`
    CREATE TABLE IF NOT EXISTS package_bookings (
      id SERIAL PRIMARY KEY,
      package_id INTEGER REFERENCES packages(id) ON DELETE SET NULL,
      hotel_choice TEXT DEFAULT '',
      hotel_diff NUMERIC DEFAULT 0,
      flight_choice TEXT DEFAULT '',
      flight_diff NUMERIC DEFAULT 0,
      adult_count INTEGER DEFAULT 1,
      child_count INTEGER DEFAULT 0,
      total_price NUMERIC DEFAULT 0,
      nationality TEXT DEFAULT '',
      customer_phone TEXT DEFAULT '',
      customer_email TEXT DEFAULT '',
      payment_method TEXT DEFAULT '',
      payment_status TEXT DEFAULT 'awaiting_review',
      payment_proof_url TEXT DEFAULT '',
      internal_status TEXT DEFAULT 'new',
      submitted_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS package_travelers (
      id SERIAL PRIMARY KEY,
      booking_id INTEGER REFERENCES package_bookings(id) ON DELETE CASCADE,
      traveler_type TEXT NOT NULL DEFAULT 'adult',
      full_name TEXT DEFAULT '',
      passport_number TEXT DEFAULT '',
      sort_order INTEGER DEFAULT 0
    )
  `;

  schemaReady = true;
}
