// WhatsApp contact used by the visa and package "apply" buttons.
// Change the number here and every button on the site updates.
export const WHATSAPP_NUMBER = '9647849999600'; // +964 784 999 9600

// The online application / booking steps are archived (kept in the code but
// switched off). Set to true to bring the old "Start now" steps back.
export const APPLY_FLOW_ENABLED = false;

export function waLink(text) {
  return 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(text);
}

export function openWhatsApp(text) {
  const url = waLink(text);
  const w = window.open(url, '_blank', 'noopener');
  if (!w) window.location.href = url;
}

const clean = (a) => a.filter((l) => l !== null && l !== undefined && l !== false && String(l).trim() !== '');

// { type, country, stay, issuing, validity, travellers, url } — filled from
// whichever visa the customer pressed, so every visa sends its own details.
export function visaMessage(v, lang = 'ar') {
  const en = lang === 'en';
  return clean([
    en ? 'Hello, I would like to apply for a visa:' : 'مرحباً، أرغب بالتقديم على تأشيرة:',
    '🛂 ' + [v.type, v.country].filter(Boolean).join(' — '),
    v.stay && (en ? 'Length of stay: ' : 'مدة الإقامة: ') + v.stay,
    v.issuing && (en ? 'Processing time: ' : 'مدة الإصدار: ') + v.issuing,
    v.validity && (en ? 'Validity before travel: ' : 'صلاحية قبل السفر: ') + v.validity,
    v.travellers && (en ? 'Travellers: ' : 'عدد المسافرين: ') + v.travellers,
    v.url && (en ? 'Link: ' : 'الرابط: ') + v.url,
  ]).join('\n');
}

// { title, dest, nights, hotel, flight, travellers, date, url }
export function packageMessage(p, lang = 'ar') {
  const en = lang === 'en';
  return clean([
    en ? 'Hello, I would like to book this package:' : 'مرحباً، أرغب بحجز هذه الباقة:',
    '🌍 ' + [p.title, p.dest].filter(Boolean).join(' — '),
    p.nights && (en ? 'Duration: ' : 'المدة: ') + p.nights,
    p.hotel && (en ? 'Hotel: ' : 'الفندق: ') + p.hotel,
    p.flight && (en ? 'Flight: ' : 'الطيران: ') + p.flight,
    p.travellers && (en ? 'Travellers: ' : 'المسافرون: ') + p.travellers,
    p.date && (en ? 'Travel date: ' : 'تاريخ السفر: ') + p.date,
    p.url && (en ? 'Link: ' : 'الرابط: ') + p.url,
  ]).join('\n');
}
