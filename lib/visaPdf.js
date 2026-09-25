// Visa PDF — same visual language as the package voucher (lib/packagePdf.js).
// Rendered through printDoc(), which adds the letterhead header and footer.
import { esc } from './printDoc';
import { GRID_STEP, GRID_TOP, LAND_ROWS, COUNTRY_GEO } from './geoData';
import { waLink, WHATSAPP_NUMBER } from './whatsapp';

const BAGHDAD = [33.31, 44.36];

// ── Country lookup ──────────────────────────────────────────────────────
function norm(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي')
    .replace(/^ال/, '').replace(/[^\p{L}\p{N}]+/gu, '');
}
let NAME_INDEX = null;
function nameIndex() {
  if (NAME_INDEX) return NAME_INDEX;
  NAME_INDEX = {};
  for (const [iso, g] of Object.entries(COUNTRY_GEO)) {
    [g[3], g[4], g[5], g[6]].forEach((n) => { if (n) NAME_INDEX[norm(n)] = iso; });
  }
  // Common spellings used in Iraq / in the dashboard
  Object.assign(NAME_INDEX, { [norm('الامارات')]: 'ae', [norm('دبي')]: 'ae', [norm('ابوظبي')]: 'ae', [norm('بريطانيا')]: 'gb', [norm('انكلترا')]: 'gb', [norm('امريكا')]: 'us', [norm('تركيا')]: 'tr', [norm('uae')]: 'ae', [norm('uk')]: 'gb', [norm('usa')]: 'us', [norm('شنغن')]: 'de', [norm('schengen')]: 'de' });
  return NAME_INDEX;
}
// flag_code may be an ISO code ("jo") or an uploaded flag URL, so fall back
// to matching the country's Arabic/English name.
export function findCountryIso(card) {
  const fc = String(card.flag_code || '').trim().toLowerCase();
  if (/^[a-z]{2}$/.test(fc) && COUNTRY_GEO[fc]) return fc;
  const m = fc.match(/\/([a-z]{2})\.(png|svg|webp|jpg)/);
  if (m && COUNTRY_GEO[m[1]]) return m[1];
  const idx = nameIndex();
  return idx[norm(card.country_name_en)] || idx[norm(card.country_name_ar)] || null;
}

function distanceKm(a, b) {
  const R = 6371, rad = Math.PI / 180;
  const dLat = (b[0] - a[0]) * rad, dLng = (b[1] - a[1]) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * rad) * Math.cos(b[0] * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// ── Dotted route map (Baghdad → destination), drawn as inline SVG ─────
function routeMapSvg(dest, destLabel, en) {
  const [bLat, bLng] = BAGHDAD, [dLat, dLng] = dest;
  // Crop around both points; keep a wide 2.6:1 frame with at least 34° of longitude.
  let minX = Math.min(bLng, dLng), maxX = Math.max(bLng, dLng);
  let minY = Math.min(-bLat, -dLat), maxY = Math.max(-bLat, -dLat);
  let w = Math.max((maxX - minX) * 1.4, 72), h = Math.max((maxY - minY) * 1.7, 18);
  if (w / h < 2.6) w = h * 2.6; else h = w / 2.6;
  const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
  const vx = cx - w / 2, vy = cy - h / 2;
  const r = GRID_STEP * 0.3;

  let dots = '';
  LAND_ROWS.forEach((row, ri) => {
    if (!row) return;
    const lat = GRID_TOP - ri * GRID_STEP, y = -lat;
    if (y < vy - 1 || y > vy + h + 1) return;
    const p = row.split(',').map(Number);
    for (let k = 0; k < p.length; k += 2) {
      for (let c = p[k]; c < p[k] + p[k + 1]; c++) {
        const x = -180 + GRID_STEP / 2 + c * GRID_STEP;
        if (x < vx - 1 || x > vx + w + 1) continue;
        dots += 'M' + (x - r).toFixed(2) + ' ' + y.toFixed(2) + 'a' + r + ' ' + r + ' 0 1 0 ' + (2 * r) + ' 0a' + r + ' ' + r + ' 0 1 0 ' + (-2 * r) + ' 0';
      }
    }
  });

  const x1 = bLng, y1 = -bLat, x2 = dLng, y2 = -dLat;
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  const len = Math.hypot(x2 - x1, y2 - y1) || 1;
  const bend = Math.min(len * 0.28, h * 0.35);
  const qx = mx + ((y1 - y2) / len) * bend * (x2 >= x1 ? 1 : -1) * -1;
  const qy = my - Math.abs(((x2 - x1) / len) * bend) - bend * 0.2;
  const s = w / 100; // scale for strokes/labels
  const pin = (x, y, color) => '<circle cx="' + x + '" cy="' + y + '" r="' + (1.9 * s) + '" fill="' + color + '" opacity=".22"/><circle cx="' + x + '" cy="' + y + '" r="' + (0.9 * s) + '" fill="' + color + '" stroke="#fff" stroke-width="' + (0.35 * s) + '"/>';
  const label = (x, y, text, anchor) => '<text x="' + x + '" y="' + (y - 2.6 * s) + '" text-anchor="' + anchor + '" font-size="' + (2.9 * s) + '" font-weight="700" fill="#1d2733" stroke="#fff" stroke-width="' + (0.8 * s) + '" paint-order="stroke" font-family="IBM Plex Sans Arabic, IBM Plex Sans, sans-serif">' + esc(text) + '</text>';
  // Plane glyph at the curve's midpoint, rotated along the path.
  const tx = 0.25 * x1 + 0.5 * qx + 0.25 * x2, ty = 0.25 * y1 + 0.5 * qy + 0.25 * y2;
  const ang = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
  const plane = '<g transform="translate(' + tx + ' ' + ty + ') rotate(' + ang + ') scale(' + (0.2 * s) + ')"><circle r="11" fill="#fff"/><path d="M-9 1.5v-3l7-1.2V-9a2 2 0 0 1 4 0v6.3l7 1.2v3l-7-1v5.2l2.3 1.8v2l-4.3-1.2-4.3 1.2v-2l2.3-1.8V.5z" transform="rotate(90)" fill="#049dc5"/></g>';

  return '<svg class="map" viewBox="' + vx.toFixed(2) + ' ' + vy.toFixed(2) + ' ' + w.toFixed(2) + ' ' + h.toFixed(2) + '" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">' +
    '<rect x="' + vx + '" y="' + vy + '" width="' + w + '" height="' + h + '" fill="#f3fafc"/>' +
    '<path d="' + dots + '" fill="#b9dbe6"/>' +
    '<path d="M' + x1 + ' ' + y1 + ' Q' + qx + ' ' + qy + ' ' + x2 + ' ' + y2 + '" fill="none" stroke="#049dc5" stroke-width="' + (0.55 * s) + '" stroke-dasharray="' + (1.4 * s) + ' ' + (1 * s) + '" stroke-linecap="round"/>' +
    pin(x1, y1, '#f5b841') + pin(x2, y2, '#049dc5') + plane +
    label(x1, y1, en ? 'Baghdad' : 'بغداد', 'middle') + label(x2, y2, destLabel, 'middle') +
    '</svg>';
}

// ── Passport-stamp badge ───────────────────────────────────────────────
function stampSvg(top, big, bottom) {
  const t = (s, y, size, weight) => '<text x="60" y="' + y + '" text-anchor="middle" font-size="' + size + '" font-weight="' + weight + '" fill="currentColor" font-family="IBM Plex Sans Arabic, IBM Plex Sans, sans-serif">' + esc(s) + '</text>';
  return '<svg class="stamp" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">' +
    '<circle cx="60" cy="60" r="56" fill="none" stroke="currentColor" stroke-width="3.5"/>' +
    '<circle cx="60" cy="60" r="48" fill="none" stroke="currentColor" stroke-width="1.2" stroke-dasharray="3 3"/>' +
    t(top, 38, 10.5, 700) + t(big, 62, 18, 700) + t(bottom, 78, 9.5, 600) +
    '<text x="60" y="94" text-anchor="middle" font-size="6" letter-spacing="1.5" fill="currentColor" font-family="IBM Plex Sans, sans-serif" font-weight="700">QASER ALMARAYA</text>' +
    '</svg>';
}

const ICON = {
  check: '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  cross: '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="3"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  wa: '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M12.04 2a9.9 9.9 0 0 0-8.5 14.98L2 22l5.16-1.5A9.93 9.93 0 1 0 12.04 2zm4.5 11.96c-.25-.12-1.46-.72-1.69-.8-.23-.09-.39-.13-.56.12-.16.25-.64.8-.79.97-.14.16-.29.19-.54.06a6.7 6.7 0 0 1-3.34-2.92c-.25-.43.25-.4.72-1.34.08-.16.04-.3-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.41-.56-.42h-.48a.92.92 0 0 0-.66.31 2.78 2.78 0 0 0-.87 2.07 4.83 4.83 0 0 0 1.01 2.56 11.05 11.05 0 0 0 4.23 3.74c1.58.68 2.2.74 2.99.62.48-.07 1.46-.6 1.67-1.18.2-.58.2-1.07.14-1.18-.06-.1-.22-.16-.47-.28z"/></svg>',
  pin: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
};

const CSS = `
.v{font-size:13px}
.v .avoid{break-inside:avoid;page-break-inside:avoid}
.v h2{break-after:avoid;display:flex;align-items:center;gap:8px;margin:24px 0 12px;font-size:16px}
.v h2:before{content:"";width:4px;height:18px;border-radius:2px;background:#049dc5;display:inline-block}
.hero{position:relative;height:200px;border-radius:16px;overflow:hidden;background:#036f8c center/cover no-repeat}
.hero:after{content:"";position:absolute;inset:0;background:linear-gradient(0deg,rgba(1,42,55,.86) 0%,rgba(1,42,55,.25) 58%,rgba(1,42,55,.05) 100%)}
.hero-txt{position:absolute;inset:auto 22px 34px 22px;z-index:2;color:#fff;display:flex;align-items:flex-end;gap:12px}
.hero-flag{width:52px;height:36px;object-fit:cover;border-radius:6px;border:2px solid #fff;flex:none}
.hero-kicker{font-size:12px;opacity:.9}
.hero-title{font-size:26px;font-weight:700;line-height:1.2}
.stamp{position:absolute;z-index:3;top:16px;inset-inline-end:20px;width:112px;height:112px;color:#fff;transform:rotate(-12deg);opacity:.93}
.strip{display:flex;margin-top:-22px;position:relative;z-index:3;margin-inline:16px;background:#fff;border:1px solid #e3eef2;border-radius:12px;box-shadow:0 6px 18px rgba(1,42,55,.10)}
.strip div{flex:1;padding:10px 8px;text-align:center;border-inline-start:1px solid #edf2f4}
.strip div:first-child{border-inline-start:0}
.strip span{display:block;font-size:10.5px;color:#7b8087}
.strip b{display:block;font-size:13px}
.geo{display:flex;gap:12px;align-items:stretch}
.map{width:100%;height:170px;display:block;border-radius:12px;border:1px solid #d9e9ef}
.geo .mapbox{flex:1.8;min-width:0}
.facts{flex:1;display:flex;flex-direction:column;gap:8px}
.fact{border:1px solid #ececed;border-radius:10px;padding:8px 12px}
.fact span{display:block;font-size:10.5px;color:#7b8087}
.fact b{font-size:14px}
.incx{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.incx .col{border-radius:12px;padding:10px 14px}
.incx .in{background:#eefaf3;border:1px solid #cdebd9}
.incx .ex{background:#fdf1f3;border:1px solid #f4d3da}
.incx .ch{font-weight:700;font-size:13.5px;margin-bottom:4px}
.incx .in .ch,.incx .in svg{color:#1a7f47}
.incx .ex .ch,.incx .ex svg{color:#c02643}
.incx .it{display:flex;align-items:center;gap:7px;padding:2px 0}
.incx .it svg{flex:none}
.docs2{display:grid;grid-template-columns:1fr 1fr;gap:6px 14px}
.doc{display:flex;align-items:center;gap:9px;border:1px solid #ececed;border-radius:10px;padding:8px 10px}
.box{width:16px;height:16px;border:2px solid #049dc5;border-radius:4px;flex:none}
.doc.opt .box{border-color:#b9c2c9;border-style:dashed}
.doc small{margin-inline-start:auto;font-size:10.5px;color:#7b8087;white-space:nowrap}
.steps{display:flex;gap:0;position:relative}
.step{flex:1;text-align:center;position:relative;padding:0 6px}
.step:before{content:"";position:absolute;top:17px;inset-inline-start:50%;width:100%;height:2px;background:#d4ebf2;z-index:0}
.step:last-child:before{display:none}
.step .n{position:relative;z-index:1;width:36px;height:36px;margin:0 auto 6px;border-radius:50%;background:#049dc5;color:#fff;display:grid;place-items:center;font-weight:700;font-family:"IBM Plex Sans",sans-serif}
.step:last-child .n{background:#1a7f47}
.step b{display:block;font-size:12.5px;line-height:1.4}
.step span{display:block;font-size:11px;color:#7b8087;line-height:1.45;margin-top:2px}
.price{border-radius:14px;background:#eaf8fd;border:1px solid #cfe9f2;padding:12px 18px}
.price .row{display:flex;justify-content:space-between;padding:3px 0;font-size:13px}
.price .row b{font-size:16px;color:#036f8c}
.cards{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.vc{border:1px solid #d9e9ef;border-radius:12px;overflow:hidden}
.vc .hd{background:#eaf8fd;padding:8px 12px;font-weight:700;color:#036f8c;display:flex;justify-content:space-between;gap:8px}
.vc .bd{padding:8px 12px;font-size:12px}
.vc .kv{display:flex;justify-content:space-between;padding:1px 0}
.vc .kv span{color:#7b8087}
.vc .pr{display:flex;justify-content:space-between;border-top:1px dashed #d9e9ef;margin-top:6px;padding-top:6px;font-weight:700;color:#036f8c}
.wa{display:flex;align-items:center;gap:16px;border-radius:14px;padding:14px 18px;background:linear-gradient(135deg,#0f8f4f,#25d366);color:#fff;margin-top:18px}
.wa img{width:92px;height:92px;background:#fff;border-radius:10px;padding:5px;flex:none}
.wa .t{font-size:16px;font-weight:700;display:flex;align-items:center;gap:8px}
.wa .num{font-size:19px;font-weight:700;font-family:"IBM Plex Sans",sans-serif;direction:ltr;unicode-bidi:embed}
.wa .s{font-size:12px;opacity:.92}
.notes{font-size:12.5px;color:#3d4650;border-inline-start:3px solid #f5b841;padding:4px 12px;background:#fffaf0;border-radius:6px}
.note{font-size:11px;color:#7b8087;margin-top:12px;line-height:1.6}
`;

const SERVICES = [
  ['needs_appointment', 'نحجز لك موعداً في السفارة', 'We book your embassy appointment'],
  ['prepares_papers', 'نجهّز الأوراق: الاستمارة والحجوزات والتأمين والترجمة', 'We prepare the paperwork: form, bookings, insurance, translation'],
  ['collects_passport', 'نستلم جوازك ونعيده لاحقاً', 'We collect your passport and return it'],
  ['delivers_visa_file', 'تستلم ملف التأشيرة للتحميل', 'You receive the visa file to download'],
  ['result_guaranteed', 'النتيجة مضمونة', 'Guaranteed result'],
];

function processSteps(card, en) {
  const days = Number(card.issuing_time_days) || 0;
  const s = [[en ? 'Contact us' : 'تواصل معنا', en ? 'On WhatsApp, send your documents' : 'على واتساب وأرسل المستمسكات']];
  if (card.prepares_papers) s.push([en ? 'We prepare your file' : 'نجهّز ملفك', en ? 'Form, bookings and translation' : 'الاستمارة والحجوزات والترجمة']);
  if (card.needs_appointment) s.push([en ? 'Embassy appointment' : 'موعد السفارة', en ? 'We book it and guide you' : 'نحجزه ونرشدك خطوة بخطوة']);
  s.push([en ? 'Submission' : 'تقديم الطلب', days ? (en ? 'About ' + days + ' working days' : 'حوالي ' + days + ' أيام عمل') : (en ? 'We follow up for you' : 'نتابع طلبك نيابةً عنك')]);
  s.push([en ? 'Visa ready' : 'التأشيرة جاهزة', card.delivers_visa_file ? (en ? 'We send you the visa file' : 'نرسل لك ملف التأشيرة') : card.collects_passport ? (en ? 'Passport returned with visa' : 'نعيد جوازك مع التأشيرة') : (en ? 'Ready to travel' : 'جاهز للسفر')]);
  return s;
}

async function qrDataUrl(text) {
  try {
    const QR = (await import('qrcode')).default;
    return await QR.toDataURL(text, { margin: 1, width: 260, errorCorrectionLevel: 'M', color: { dark: '#0b5d34', light: '#ffffff' } });
  } catch {
    return '';
  }
}

/**
 * Builds the visa PDF body.
 * @param {object[]} cards one card = single-visa PDF; several = the country's overview
 */
export async function buildVisaPdfHtml({ cards, lang = 'ar', fmtPrice, pageUrl }) {
  const en = lang === 'en';
  const nm = (ar, e) => (en && e ? e : ar || e || '');
  const first = cards[0];
  const single = cards.length === 1;
  const country = nm(first.country_name_ar, first.country_name_en);
  const typeName = (c) => nm(c.visa_type_name_ar, c.visa_type_name_en);

  let h = '<style>' + CSS + '</style><div class="v">';

  // Banner: country PDF banner → visa card image → country cover
  const banner = first.pdf_banner_url || (single && first.image_url) || first.card_image_url || '';
  const flag = /^(https?:|\/)/.test(first.flag_code || '') ? first.flag_code : (first.flag_code ? '/assets/flags/' + first.flag_code + '.png' : '');
  h += '<div class="hero avoid"' + (banner ? ' style="background-image:url(\'' + esc(banner) + '\')"' : '') + '>' +
    (single ? stampSvg(country, first.stay_duration || typeName(first), typeName(first)) : stampSvg(country, 'VISA', cards.length + (en ? ' options' : ' أنواع'))) +
    '<div class="hero-txt">' + (flag ? '<img class="hero-flag" src="' + esc(flag) + '" alt="" onerror="this.remove()" />' : '') +
    '<div><div class="hero-kicker">' + (en ? 'Visa' : 'تأشيرة') + (single ? '' : (en ? ' options' : ' — جميع الأنواع')) + '</div>' +
    '<div class="hero-title">' + esc(single ? typeName(first) + ' — ' + country : country) + '</div></div></div></div>';

  if (single) {
    const c = first;
    const cells = [
      [en ? 'Length of stay' : 'مدة الإقامة', c.stay_duration || '—'],
      [en ? 'Processing time' : 'مدة الإصدار', c.issuing_time_days ? c.issuing_time_days + (en ? ' working days' : ' أيام عمل') : '—'],
      [en ? 'Valid before travel' : 'صلاحية قبل السفر', c.validity_before_travel || '—'],
      [en ? 'Visa type' : 'نوع التأشيرة', typeName(c)],
    ];
    h += '<div class="strip avoid">' + cells.map((x) => '<div><span>' + esc(x[0]) + '</span><b>' + esc(x[1]) + '</b></div>').join('') + '</div>';
  } else {
    h += '<div class="strip avoid"><div><span>' + (en ? 'Destination' : 'الوجهة') + '</span><b>' + esc(country) + '</b></div><div><span>' + (en ? 'Visa options' : 'أنواع التأشيرات') + '</span><b>' + cards.length + '</b></div>' +
      '<div><span>' + (en ? 'Fastest processing' : 'أسرع إصدار') + '</span><b>' + (() => { const d = cards.map((c) => Number(c.issuing_time_days) || 0).filter(Boolean); return d.length ? Math.min(...d) + (en ? ' working days' : ' أيام عمل') : '—'; })() + '</b></div></div>';
  }

  // Route map + quick facts
  const iso = findCountryIso(first);
  const geo = iso && COUNTRY_GEO[iso];
  if (geo && iso !== 'iq') {
    const km = distanceKm(BAGHDAD, [geo[0], geo[1]]);
    const hours = km / 820 + 0.5;
    const hh = Math.floor(hours), mm = Math.round((hours - hh) * 60 / 5) * 5;
    const flight = en ? '≈ ' + hh + 'h' + (mm ? ' ' + mm + 'm' : '') : '≈ ' + hh + ' س' + (mm ? ' ' + mm + ' د' : '');
    h += '<div class="avoid"><h2>' + (en ? 'Your route' : 'وجهتك') + '</h2><div class="geo"><div class="mapbox">' +
      routeMapSvg([geo[0], geo[1]], country, en) + '</div><div class="facts">' +
      '<div class="fact"><span>' + (en ? 'Distance from Baghdad' : 'المسافة من بغداد') + '</span><b>' + Math.round(km / 10) * 10 + (en ? ' km' : ' كم') + '</b></div>' +
      '<div class="fact"><span>' + (en ? 'Approx. direct flight' : 'مدة الطيران المباشر تقريباً') + '</span><b>' + flight + '</b></div>' +
      (geo[2] ? '<div class="fact"><span>' + (en ? 'Local currency' : 'العملة المحلية') + '</span><b>' + esc(geo[2]) + '</b></div>' : '') +
      '</div></div></div>';
  }

  if (single) {
    const c = first;
    const inc = SERVICES.filter((s) => c[s[0]]).map((s) => (en ? s[2] : s[1]));
    const exc = SERVICES.filter((s) => !c[s[0]]).map((s) => (en ? s[2] : s[1]));
    h += '<div class="avoid"><h2>' + (en ? 'What we do for you' : 'ماذا نقدّم لك') + '</h2><div class="incx">' +
      '<div class="col in"><div class="ch">' + (en ? 'Included in our service' : 'تشمل خدمتنا') + '</div>' + (inc.length ? inc.map((x) => '<div class="it">' + ICON.check + esc(x) + '</div>').join('') : '<div class="it">' + ICON.check + (en ? 'Full follow-up of your application' : 'متابعة كاملة لطلبك') + '</div>') + '</div>' +
      (exc.length ? '<div class="col ex"><div class="ch">' + (en ? 'Not needed / not included' : 'غير مطلوبة / غير مشمولة') + '</div>' + exc.map((x) => '<div class="it">' + ICON.cross + esc(x) + '</div>').join('') + '</div>' : '') +
      '</div></div>';

    const steps = processSteps(c, en);
    h += '<div class="avoid"><h2>' + (en ? 'How it works' : 'كيف تتم العملية') + '</h2><div class="steps">' +
      steps.map((s, i) => '<div class="step"><div class="n">' + (i + 1) + '</div><b>' + esc(s[0]) + '</b><span>' + esc(s[1]) + '</span></div>').join('') + '</div></div>';
  } else {
    h += '<h2>' + (en ? 'Visa options' : 'أنواع التأشيرات المتاحة') + '</h2><div class="cards">' +
      cards.map((c) => '<div class="vc avoid"><div class="hd"><span>' + esc(typeName(c)) + '</span><span>' + esc(c.stay_duration || '') + '</span></div><div class="bd">' +
        '<div class="kv"><span>' + (en ? 'Processing' : 'مدة الإصدار') + '</span><b>' + esc(c.issuing_time_days ? c.issuing_time_days + (en ? ' working days' : ' أيام عمل') : '—') + '</b></div>' +
        '<div class="kv"><span>' + (en ? 'Valid before travel' : 'صلاحية قبل السفر') + '</span><b>' + esc(c.validity_before_travel || '—') + '</b></div>' +
        '<div class="pr"><span>' + (en ? 'Adult ' : 'البالغ ') + esc(fmtPrice(c.adult_price)) + '</span><span>' + (en ? 'Child ' : 'الطفل ') + esc(fmtPrice(c.child_price)) + '</span></div>' +
        '</div></div>').join('') + '</div>';
  }

  // Documents checklist (merged across cards for the overview)
  const seen = new Set(), docs = [];
  cards.forEach((c) => (c.documents || []).forEach((d) => {
    const label = nm(d.name_ar, d.name_en);
    if (!label || seen.has(label)) return;
    seen.add(label);
    docs.push({ label, required: d.required !== false });
  }));
  docs.sort((a, b) => Number(b.required) - Number(a.required));
  if (docs.length) {
    h += '<div class="avoid"><h2>' + (en ? 'Documents checklist' : 'قائمة المستمسكات المطلوبة') + '</h2><div class="docs2">' +
      docs.map((d) => '<div class="doc' + (d.required ? '' : ' opt') + '"><span class="box"></span><span>' + esc(d.label) + '</span>' + (d.required ? '' : '<small>' + (en ? 'optional' : 'اختياري') + '</small>') + '</div>').join('') +
      '</div></div>';
  }

  if (single) {
    h += '<div class="avoid" style="margin-top:18px"><div class="price">' +
      '<div class="row"><span>' + (en ? 'Price per adult' : 'السعر للبالغ') + '</span><b>' + esc(fmtPrice(first.adult_price)) + '</b></div>' +
      '<div class="row"><span>' + (en ? 'Price per child' : 'سعر الطفل') + '</span><b>' + esc(fmtPrice(first.child_price)) + '</b></div>' +
      '</div></div>';
    const notes = nm(first.booking_notes, first.booking_notes_en);
    if (notes) h += '<div class="avoid"><h2>' + (en ? 'Important notes' : 'ملاحظات مهمة') + '</h2><div class="notes">' + esc(notes) + '</div></div>';
  }

  // WhatsApp box with QR — scanning opens WhatsApp with this visa's message
  const msg = single
    ? (en ? 'Hello, I would like to apply for a visa: ' : 'مرحباً، أرغب بالتقديم على تأشيرة: ') + typeName(first) + ' — ' + country
    : (en ? 'Hello, I would like to ask about visas for ' : 'مرحباً، أرغب بالاستفسار عن تأشيرات ') + country;
  const qr = await qrDataUrl(waLink(msg));
  h += '<div class="wa avoid">' + (qr ? '<img src="' + qr + '" alt="" />' : '') + '<div>' +
    '<div class="t">' + ICON.wa + (en ? 'Apply on WhatsApp' : 'قدّم عبر واتساب') + '</div>' +
    '<div class="num">+' + WHATSAPP_NUMBER.replace(/^(\d{3})(\d{3})(\d{3})(\d{4})$/, '$1 $2 $3 $4') + '</div>' +
    '<div class="s">' + (en ? 'Scan the code — your visa details are written for you.' : 'امسح الرمز وستُكتب تفاصيل التأشيرة تلقائياً في الرسالة.') + '</div>' +
    '</div></div>';

  h += '<div class="note">' + (en
    ? 'Prices in Iraqi dinar. Visa approval is at the discretion of the embassy unless marked as guaranteed. Distance and flight time are approximate.'
    : 'الأسعار بالدينار العراقي. الموافقة على التأشيرة من صلاحية السفارة ما لم تكن مضمونة. المسافة ومدة الطيران تقريبية.') + '</div>';

  return h + '</div>';
}
