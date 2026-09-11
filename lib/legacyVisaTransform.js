import { sql, ensureSchema } from './db';

function deriveLegacyTypeId(visaType) {
  if (!visaType) return 'electronic';
  if (visaType.needs_appointment) {
    return visaType.collects_passport && visaType.prepares_papers ? 'embassy' : 'appointment';
  }
  return visaType.collects_passport ? 'normal' : 'electronic';
}

function mapDocKind(kind) {
  // The widget's built-in kinds: file | photo | text | choice | yesno | number | date | repeat
  const map = {
    file: 'file',
    photo: 'photo',
    text: 'text',
    choice: 'choice',
    yesno: 'yesno',
    number_date: 'text',
    repeated: 'repeat',
  };
  return map[kind] || 'text';
}

function mapAudience(audience) {
  if (audience === 'adults') return 'adult';
  if (audience === 'children') return 'child';
  return 'all';
}

function mapDocument(doc) {
  const out = {
    id: String(doc.id),
    ar: doc.name_ar,
    en: doc.name_en,
    kind: mapDocKind(doc.kind),
    required: doc.required !== false,
    who: mapAudience(doc.audience),
  };
  if (doc.choices && doc.choices.length) {
    out.options = doc.choices;
    out.optionsEn = doc.choices;
  }
  if (doc.condition_field_id) {
    out.showIf = { line: String(doc.condition_field_id), equals: doc.condition_value };
  }
  return out;
}

/**
 * Fetches everything set up in the admin dashboard's visa tab and reshapes it
 * into the { countries, visas } format the site's built-in flights/visa
 * search widget already knows how to render. Returns empty arrays (not
 * defaults) when nothing has been configured yet, so the caller can decide
 * whether to fall back to the widget's original built-in sample data.
 */
export async function getLegacyVisaData() {
  try {
    await ensureSchema();

    const countries = await sql`SELECT * FROM countries ORDER BY name_ar ASC`;
    const cards = await sql`
      SELECT vc.*, vt.needs_appointment, vt.delivers_visa_file, vt.collects_passport,
             vt.prepares_papers, vt.result_guaranteed
      FROM visa_cards vc
      LEFT JOIN visa_types vt ON vt.id = vc.visa_type_id
      WHERE vc.active = true
    `;
    const docs = await sql`SELECT * FROM visa_documents ORDER BY sort_order ASC, id ASC`;

    const isFlagUrl = (v) => typeof v === 'string' && (/^https?:\/\//i.test(v) || v.startsWith('/'));

    const legacyCountries = countries.map((c) => ({
      code: c.flag_code && !isFlagUrl(c.flag_code) ? c.flag_code : String(c.id),
      flagUrl: c.flag_code ? (isFlagUrl(c.flag_code) ? c.flag_code : '/assets/flags/' + c.flag_code + '.png') : null,
      name: c.name_ar,
      en: c.name_en,
      region: c.region || '',
    }));

    const countryCodeById = new Map(
      countries.map((c) => [c.id, c.flag_code && !isFlagUrl(c.flag_code) ? c.flag_code : String(c.id)])
    );

    const legacyVisas = cards.map((card) => ({
      id: 'card-' + card.id,
      country: countryCodeById.get(card.country_id) || String(card.country_id),
      type: deriveLegacyTypeId(card),
      stay: card.stay_duration || '',
      issuing: card.issuing_time_days ? card.issuing_time_days + ' يوم عمل' : '',
      validity: card.validity_before_travel || '',
      adult: Number(card.adult_price) || 0,
      child: Number(card.child_price) || 0,
      docs: docs.filter((d) => d.visa_card_id === card.id).map(mapDocument),
      notes: card.booking_notes || '',
      notesEn: card.booking_notes_en || card.booking_notes || '',
    }));

    return { legacyCountries, legacyVisas };
  } catch (err) {
    console.error('getLegacyVisaData failed:', err);
    return { legacyCountries: [], legacyVisas: [] };
  }
}
