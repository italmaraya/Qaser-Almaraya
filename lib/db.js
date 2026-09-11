import { neon } from '@neondatabase/serverless';

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

  schemaReady = true;
}
