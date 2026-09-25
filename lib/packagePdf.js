// Builds the body HTML for the package / group voucher PDF.
// Rendered through printDoc() (letterhead header + footer are added there).
import { esc } from './printDoc';
import { MEAL_PLANS } from './packagesData';
import { waLink, WHATSAPP_NUMBER, packageMessage } from './whatsapp';

const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩';

function toLatinDigits(s) {
  return String(s || '').replace(/[٠-٩]/g, (d) => String(AR_DIGITS.indexOf(d)));
}

// "9 ليالٍ" / "٩ ليالٍ" / "9 nights" -> 9
export function parseNights(text) {
  const m = toLatinDigits(text).match(/\d+/);
  return m ? Number(m[0]) : null;
}

function addDays(date, n) {
  const d = new Date(date.getTime());
  d.setDate(d.getDate() + n);
  return d;
}

function fmtDate(date, lang, withWeekday) {
  if (!date) return '';
  const opts = { day: 'numeric', month: 'long', year: 'numeric' };
  if (withWeekday) opts.weekday = 'long';
  try {
    return date.toLocaleDateString(lang === 'en' ? 'en-GB' : 'ar-IQ', opts);
  } catch {
    return date.toDateString();
  }
}

// Titles are often typed as "اليوم 1 — الوصول..." — the voucher already shows
// the day number, so strip that prefix to avoid saying it twice.
function cleanDayTitle(title) {
  return String(title || '')
    .replace(/^\s*(اليوم|Day)\s*[\d٠-٩]+\s*[—\-–:|]*\s*/i, '')
    .trim();
}

// Correct Arabic plural for a number of days: يوم واحد / يومان / 3 أيام / 11 يوماً
function dayCount(n, en) {
  if (en) return n + (n === 1 ? ' day' : ' days');
  if (n === 1) return 'يوم واحد';
  if (n === 2) return 'يومان';
  if (n <= 10) return n + ' أيام';
  return n + ' يوماً';
}

function scoreLabel(score, en) {
  if (score >= 90) return en ? 'Exceptional' : 'استثنائي';
  if (score >= 80) return en ? 'Excellent' : 'ممتاز';
  if (score >= 70) return en ? 'Very good' : 'جيد جداً';
  return en ? 'Good' : 'جيد';
}

const lines = (arr) => (arr || []).map((s) => String(s || '').trim()).filter(Boolean);

// Plane glyph rotated to point in the reading direction (right in English,
// left in Arabic). Baked into the SVG because Chrome's PDF output drops CSS
// transforms on inline SVG roots.
function planeSvg(deg) {
  return '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M21 15.5v-1.7l-8-5V3.5a1.5 1.5 0 0 0-3 0v5.3l-8 5v1.7l8-2.5v5.2l-2 1.5V21l3.5-1 3.5 1v-1.3l-2-1.5V13z" transform="rotate(' + deg + ' 12 12)"/></svg>';
}

const ICON = {
  pin: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
  plane: planeSvg(90),
  cross: '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="3"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  check: '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  bed: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 18v-7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v7M3 14h18M7 9V6h4v3"/></svg>',
  eye: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="2.8"/></svg>',
  meal: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10M17 3c-2 1.5-3 4-3 7h3v11"/></svg>',
  shield: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3l7 3v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6z"/></svg>',
  bag: '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="7" width="14" height="13" rx="2"/><path d="M9 7V4h6v3"/></svg>',
  seat: '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 4v9h9l2 7M7 13l-1 7M10 4h0"/></svg>',
};

async function qrDataUrl(text, dark = '#0b5d34') {
  try {
    const QR = (await import('qrcode')).default;
    return await QR.toDataURL(text, { margin: 1, width: 240, errorCorrectionLevel: 'M', color: { dark, light: '#ffffff' } });
  } catch {
    return '';
  }
}

const CSS = `
.v{font-size:13px}
.v .avoid{break-inside:avoid;page-break-inside:avoid}
.v h2{break-after:avoid;page-break-after:avoid;display:flex;align-items:center;gap:8px;margin:26px 0 12px;font-size:16px}
.v h2:before{content:"";width:4px;height:18px;border-radius:2px;background:#049dc5;display:inline-block}
.hero{position:relative;height:210px;border-radius:16px;overflow:hidden;background:#036f8c center/cover no-repeat}
.hero:after{content:"";position:absolute;inset:0;background:linear-gradient(0deg,rgba(1,42,55,.86) 0%,rgba(1,42,55,.25) 55%,rgba(1,42,55,.05) 100%)}
.hero-txt{position:absolute;inset:auto 22px 34px 22px;z-index:2;color:#fff}
.hero-badge{display:inline-block;background:#f5b841;color:#1d2733;font-size:11px;font-weight:700;border-radius:999px;padding:2px 11px;margin-bottom:6px}
.hero-title{font-size:27px;font-weight:700;line-height:1.25}
.hero-dest{display:flex;align-items:center;gap:5px;font-size:14px;opacity:.92;margin-top:2px}
.strip{display:flex;margin-top:-22px;position:relative;z-index:3;margin-inline:16px;background:#fff;border:1px solid #e3eef2;border-radius:12px;box-shadow:0 6px 18px rgba(1,42,55,.10)}
.strip div{flex:1;padding:10px 8px;text-align:center;border-inline-start:1px solid #edf2f4}
.strip div:first-child{border-inline-start:0}
.strip span{display:block;font-size:10.5px;color:#7b8087}
.strip b{display:block;font-size:13px;color:#1d2733}
.ticket{display:flex;border:1px solid #d9e9ef;border-radius:14px;overflow:hidden;margin-bottom:10px;background:#fff}
.t-main{flex:1;padding:12px 16px}
.t-top{display:flex;align-items:center;gap:10px;margin-bottom:8px}
.t-logo{height:30px;max-width:92px;object-fit:contain}
.t-logo-ph{width:30px;height:30px;border-radius:8px;background:#eaf8fd;color:#049dc5;display:grid;place-items:center}
.t-air{font-weight:700;font-size:13.5px}
.t-leg{margin-inline-start:auto;font-size:11px;font-weight:700;border-radius:999px;padding:2px 11px;background:#eaf8fd;color:#036f8c}
.t-leg.ret{background:#fff4dc;color:#8a5a00}
.t-route{display:flex;align-items:center;gap:12px}
.t-pt{text-align:center;min-width:74px}
.t-time{font-size:21px;font-weight:700;line-height:1.1;font-family:"IBM Plex Sans",sans-serif}
.t-code{font-size:13px;font-weight:700;color:#036f8c;letter-spacing:.5px}
.t-path{flex:1;text-align:center;color:#049dc5}
.t-dur{font-size:11px;color:#7b8087;font-family:"IBM Plex Sans",sans-serif}
.t-line{display:flex;align-items:center;gap:6px}
.t-line i{flex:1;border-top:2px dashed #b8dbe6}
.t-line svg{flex:none}
.t-date{font-size:11px;color:#7b8087}
.t-stub{width:132px;flex:none;background:#f3fafc;border-inline-start:2px dashed #cfe5ec;padding:12px;display:flex;flex-direction:column;justify-content:center;gap:6px;position:relative}
.t-stub:before,.t-stub:after{content:"";position:absolute;inset-inline-start:-9px;width:16px;height:16px;border-radius:50%;background:#fff;border:1px solid #d9e9ef}
.t-stub:before{top:-9px}.t-stub:after{bottom:-9px}
.t-stub span{display:block;font-size:10px;color:#7b8087}
.t-stub b{font-size:13px;font-family:"IBM Plex Sans",sans-serif}
.t-stub .kv{display:flex;align-items:center;gap:5px;font-size:11.5px;color:#3d4650}
.hotel-head{display:flex;align-items:flex-start;gap:12px;margin-bottom:10px}
.h-name{font-size:17px;font-weight:700}
.h-stars{color:#f5b841;font-size:14px;letter-spacing:1px;margin-inline-start:6px}
.h-addr{display:flex;align-items:center;gap:4px;font-size:12px;color:#7b8087}
.score{margin-inline-start:auto;display:flex;align-items:center;gap:7px;flex:none}
.score b{border:1.5px solid #1f9d55;color:#1f9d55;border-radius:7px;padding:1px 7px;font-family:"IBM Plex Sans",sans-serif}
.score span{font-size:12px;color:#3d4650}
.gallery{display:grid;grid-template-columns:repeat(4,1fr);grid-auto-rows:86px;gap:6px}
.gallery img{width:100%;height:100%;object-fit:cover;border-radius:8px;display:block}
.gallery img:first-child{grid-column:span 2;grid-row:span 2}
.gallery.one{grid-auto-rows:220px}.gallery.one img{grid-column:span 4;grid-row:span 1}
.gallery.row{grid-auto-rows:150px}.gallery.row img:first-child{grid-column:auto;grid-row:auto}
.room{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px;padding:10px 12px;border:1px solid #ececed;border-radius:10px}
.room .rt{width:100%;font-weight:700;font-size:13.5px}
.chip{display:inline-flex;align-items:center;gap:5px;font-size:11.5px;border-radius:999px;padding:3px 10px;background:#f3f5f7;color:#3d4650}
.chip.ok{background:#e8f6ee;color:#1a7f47}.chip.no{background:#fdecef;color:#c02643}
.htext p{margin:8px 0}
.htext ul{margin:4px 0 8px;padding-inline-start:18px}
.amen{columns:3;column-gap:16px;margin-top:4px}
.amen div{display:flex;align-items:center;gap:6px;break-inside:avoid;font-size:12px;padding:2px 0}
.amen svg{color:#049dc5;flex:none}
.days{position:relative}
.day{display:flex;gap:12px;margin-bottom:10px}
.day-rail{flex:none;width:34px;display:flex;flex-direction:column;align-items:center}
.day-no{width:34px;height:34px;border-radius:50%;background:#049dc5;color:#fff;display:grid;place-items:center;font-weight:700;font-family:"IBM Plex Sans",sans-serif}
.day-rail i{flex:1;width:2px;background:#d4ebf2;margin-top:4px}
.day-card{flex:1;display:flex;gap:12px;border:1px solid #ececed;border-radius:12px;overflow:hidden;background:#fff}
.day-img{width:150px;min-height:104px;object-fit:cover;flex:none;display:block}
.day-body{padding:10px 12px 10px 0;flex:1}
[dir=ltr] .day-body{padding:10px 12px 10px 0}
[dir=rtl] .day-body{padding:10px 0 10px 12px}
.day-card.noimg .day-body{padding:10px 14px}
.day-date{font-size:11px;color:#049dc5;font-weight:600}
.day-title{font-size:14px;font-weight:700;margin:1px 0 3px}
.day-desc{font-size:12.5px;color:#3d4650}
.incx{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.incx .col{border-radius:12px;padding:10px 14px}
.incx .in{background:#eefaf3;border:1px solid #cdebd9}
.incx .ex{background:#fdf1f3;border:1px solid #f4d3da}
.incx .ch{font-weight:700;font-size:13.5px;margin-bottom:4px}
.incx .in .ch,.incx .in svg{color:#1a7f47}
.incx .ex .ch,.incx .ex svg{color:#c02643}
.incx .it{display:flex;align-items:center;gap:7px;padding:2px 0}
.incx .it svg{flex:none}
.price{margin-top:22px;border-radius:14px;background:#eaf8fd;border:1px solid #cfe9f2;padding:14px 18px}
.price .row{display:flex;justify-content:space-between;padding:4px 0;font-size:13px}
.price .tot{border-top:1px dashed #9fd3e3;margin-top:6px;padding-top:9px;font-size:16px;font-weight:700;color:#036f8c}
.quote{margin:14px 16px 0;border:2px dashed #f5b841;background:#fffaf0;border-radius:12px;padding:10px 16px;display:flex;flex-wrap:wrap;gap:6px 26px}
.quote span{display:block;font-size:10.5px;color:#8a5a00}.quote b{font-size:15px}
.quote p{width:100%;margin:2px 0 0;font-size:12.5px;color:#3d4650}
.price .disc b{color:#1a7f47}.price s{color:#7b8087;font-weight:600}
.qrs{display:flex;gap:12px;margin-top:18px}
.qrs .wa,.qrs .web{display:flex;align-items:center;gap:14px;border-radius:14px;padding:12px 16px}
.qrs .wa{flex:1.4;background:linear-gradient(135deg,#0f8f4f,#25d366);color:#fff}
.qrs .web{flex:1;background:#eaf8fd;border:1px solid #cfe9f2;color:#036f8c}
.qrs img{width:84px;height:84px;background:#fff;border-radius:10px;padding:4px;flex:none}
.qrs .t{font-size:15px;font-weight:700}
.qrs .num{font-size:17px;font-weight:700;font-family:"IBM Plex Sans",sans-serif;direction:ltr;unicode-bidi:embed}
.qrs .s{font-size:11.5px;opacity:.92}
.note{font-size:11px;color:#7b8087;margin-top:12px;line-height:1.6}
`;

/**
 * @param {object} o
 * @param {object} o.pkg  package row from the DB
 * @param {object} o.hotel selected hotel option
 * @param {object} o.flight selected flight option
 * @param {string} o.startDate optional YYYY-MM-DD travel date
 */
export async function buildPackageVoucherHtml(o) {
  const { pkg, hotel, flight, days = [], includes = [], excludes = [], adults = 1, children = 0, perAdult, perChild, grandTotal, fmtPrice, lang = 'ar', startDate, pageUrl = '', quote = null } = o;
  const en = lang === 'en';
  const nm = (ar, e) => (en && e ? e : ar || e || '');

  const start = startDate ? new Date(startDate + 'T12:00:00') : null;
  const nights = parseNights(nm(pkg.nights_ar, pkg.nights_en));
  const tripLen = nights != null ? nights : Math.max(days.length - 1, 0);
  const end = start ? addDays(start, tripLen) : null;

  let h = '<style>' + CSS + '</style><div class="v">';

  // ── Hero banner (per-package PDF banner, falls back to the cover photo)
  const banner = pkg.pdf_banner_url || pkg.image_url || '';
  h += '<div class="hero avoid"' + (banner ? ' style="background-image:url(\'' + esc(banner) + '\')"' : '') + '>' +
    '<div class="hero-txt">' +
    (nm(pkg.badge_ar, pkg.badge_en) ? '<span class="hero-badge">' + esc(nm(pkg.badge_ar, pkg.badge_en)) + '</span>' : '') +
    '<div class="hero-title">' + esc(nm(pkg.title_ar, pkg.title_en)) + '</div>' +
    '<div class="hero-dest">' + ICON.pin + esc(nm(pkg.dest_ar, pkg.dest_en)) + '</div>' +
    '</div></div>';

  // ── Trip summary strip
  const travellers = adults + (en ? ' Adult' + (adults > 1 ? 's' : '') : ' بالغ') + (children ? (en ? ', ' + children + ' Child' + (children > 1 ? 'ren' : '') : '، ' + children + ' طفل') : '');
  const cells = [];
  if (start) {
    cells.push([en ? 'Trip starts' : 'بداية الرحلة', fmtDate(start, lang)]);
    cells.push([en ? 'Trip ends' : 'نهاية الرحلة', fmtDate(end, lang)]);
  } else if (nm(pkg.departs_ar, pkg.departs_en)) {
    cells.push([en ? 'Departures' : 'الانطلاق', nm(pkg.departs_ar, pkg.departs_en)]);
  }
  if (nm(pkg.nights_ar, pkg.nights_en)) cells.push([en ? 'Duration' : 'المدة', nm(pkg.nights_ar, pkg.nights_en)]);
  if (days.length) cells.push([en ? 'Programme' : 'البرنامج', dayCount(days.length, en)]);
  cells.push([en ? 'Travellers' : 'المسافرون', travellers]);
  h += '<div class="strip avoid">' + cells.map((c) => '<div><span>' + esc(c[0]) + '</span><b>' + esc(c[1]) + '</b></div>').join('') + '</div>';
  if (quote && (quote.customer || quote.note || quote.validUntil)) {
    h += '<div class="quote avoid">' +
      (quote.customer ? '<div><span>' + (en ? 'Prepared for' : 'عرض خاص مُعدّ لـ') + '</span><b>' + esc(quote.customer) + '</b></div>' : '') +
      (quote.validUntil ? '<div><span>' + (en ? 'Offer valid until' : 'العرض صالح حتى') + '</span><b>' + esc(fmtDate(new Date(quote.validUntil + 'T12:00:00'), lang)) + '</b></div>' : '') +
      (quote.note ? '<p>' + esc(quote.note) + '</p>' : '') +
      '</div>';
  }

  // ── Flights as boarding-pass cards
  if (flight) {
    const airline = nm(flight.nameAr, flight.nameEn);
    const cabin = nm(flight.cabinAr, flight.cabinEn);
    const legs = [];
    if (flight.outFromCity || flight.outToCity || flight.outDepartTime) {
      legs.push({ ret: false, no: flight.outFlightNo, from: flight.outFromCity, to: flight.outToCity, dep: flight.outDepartTime, arr: flight.outArriveTime, dur: flight.outDuration, date: start });
    }
    if (flight.retFromCity || flight.retToCity || flight.retDepartTime) {
      legs.push({ ret: true, no: flight.retFlightNo, from: flight.retFromCity, to: flight.retToCity, dep: flight.retDepartTime, arr: flight.retArriveTime, dur: flight.retDuration, date: end });
    }
    if (legs.length || airline) {
      h += '<h2>' + (en ? 'Flights' : 'الرحلات الجوية') + '</h2>';
      if (!legs.length) legs.push({ ret: false });
      legs.forEach((l) => {
        h += '<div class="ticket avoid"><div class="t-main">' +
          '<div class="t-top">' +
          (flight.logoUrl ? '<img class="t-logo" src="' + esc(flight.logoUrl) + '" alt="" />' : '<div class="t-logo-ph">' + ICON.plane + '</div>') +
          '<div><div class="t-air">' + esc(airline || '—') + '</div>' +
          (l.date ? '<div class="t-date">' + esc(fmtDate(l.date, lang, true)) + '</div>' : '') + '</div>' +
          '<span class="t-leg' + (l.ret ? ' ret' : '') + '">' + (l.ret ? (en ? 'Return' : 'العودة') : (en ? 'Departure' : 'الذهاب')) + '</span>' +
          '</div>' +
          '<div class="t-route">' +
          '<div class="t-pt"><div class="t-time">' + esc(l.dep || '--:--') + '</div><div class="t-code">' + esc(l.from || '—') + '</div></div>' +
          '<div class="t-path"><div class="t-dur">' + esc(l.dur || '') + '</div><div class="t-line"><i></i>' + planeSvg(en ? 90 : -90) + '<i></i></div></div>' +
          '<div class="t-pt"><div class="t-time">' + esc(l.arr || '--:--') + '</div><div class="t-code">' + esc(l.to || '—') + '</div></div>' +
          '</div></div>' +
          '<div class="t-stub"><div><span>' + (en ? 'Flight no.' : 'رقم الرحلة') + '</span><b>' + esc(l.no || '—') + '</b></div>' +
          (cabin ? '<div class="kv">' + ICON.seat + esc(cabin) + '</div>' : '') +
          (flight.baggage ? '<div class="kv">' + ICON.bag + esc(flight.baggage) + '</div>' : '') +
          '</div></div>';
      });
    }
  }

  // ── Hotel
  if (hotel) {
    const stars = Number(hotel.stars) || 0;
    const score = Number(hotel.reviewScore) || 0;
    // Big photo + 4 or 8 small ones fills the 4-column grid exactly; with only
    // 2–4 photos they sit side by side in a single even row instead.
    const allPhotos = [hotel.imageUrl, ...(hotel.extraImages || [])].filter(Boolean);
    const photos = allPhotos.length >= 9 ? allPhotos.slice(0, 9) : allPhotos.length >= 5 ? allPhotos.slice(0, 5) : allPhotos;
    const addr = hotel.address || hotel.location || '';
    h += '<div class="avoid"><h2>' + (en ? 'Your hotel' : 'الفندق') + '</h2><div class="hotel-head"><div>' +
      '<div class="h-name">' + esc(nm(hotel.nameAr, hotel.nameEn)) + (stars ? '<span class="h-stars">' + '★'.repeat(stars) + '</span>' : '') + '</div>' +
      (addr ? '<div class="h-addr">' + ICON.pin + esc(addr) + '</div>' : '') +
      '</div>' +
      (score ? '<div class="score"><b>' + score + '/100</b><span>' + scoreLabel(score, en) + '</span></div>' : '') +
      '</div>';
    if (photos.length) {
      const gcls = photos.length === 1 ? ' one' : photos.length <= 4 ? ' row' : '';
      h += '<div class="gallery' + gcls + '"' + (photos.length > 1 && photos.length <= 4 ? ' style="grid-template-columns:repeat(' + photos.length + ',1fr)"' : '') + '>' + photos.map((p) => '<img src="' + esc(p) + '" alt="" />').join('') + '</div>';
    }
    const room = nm(hotel.roomAr, hotel.roomEn);
    const bed = nm(hotel.bedAr, hotel.bedEn);
    const view = nm(hotel.viewAr, hotel.viewEn);
    const meal = MEAL_PLANS[hotel.meal];
    if (room || bed || view || meal || hotel.refundable) {
      h += '<div class="room">' +
        (room ? '<div class="rt">' + esc(room) + '</div>' : '') +
        (meal ? '<span class="chip">' + ICON.meal + esc(en ? meal.en : meal.ar) + '</span>' : '') +
        (bed ? '<span class="chip">' + ICON.bed + esc(bed) + '</span>' : '') +
        (view ? '<span class="chip">' + ICON.eye + esc(view) + '</span>' : '') +
        (hotel.refundable === 'yes' ? '<span class="chip ok">' + ICON.shield + (en ? 'Refundable' : 'قابل للاسترداد') + '</span>' : '') +
        (hotel.refundable === 'no' ? '<span class="chip no">' + ICON.shield + (en ? 'Non-refundable' : 'غير قابل للاسترداد') + '</span>' : '') +
        '</div>';
    }
    h += '</div>';

    const overview = nm(hotel.overviewAr, hotel.overviewEn);
    const nearby = lines(en && lines(hotel.nearbyEn).length ? hotel.nearbyEn : hotel.nearbyAr);
    const policies = lines(en && lines(hotel.policiesEn).length ? hotel.policiesEn : hotel.policiesAr);
    if (overview || nearby.length || policies.length) {
      h += '<div class="htext">' +
        (overview ? '<p><b>' + (en ? 'About the hotel: ' : 'نبذة عن الفندق: ') + '</b>' + esc(overview) + '</p>' : '') +
        (nearby.length ? '<b>' + (en ? 'Nearby' : 'أماكن قريبة') + '</b><ul>' + nearby.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul>' : '') +
        (policies.length ? '<b>' + (en ? 'Policies & check-in' : 'السياسات وتعليمات الدخول') + '</b><ul>' + policies.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul>' : '') +
        '</div>';
    }
    const amenities = lines(en && hotel.amenitiesEn?.length ? hotel.amenitiesEn : hotel.amenitiesAr);
    if (amenities.length) {
      h += '<div class="avoid"><b>' + (en ? 'Amenities' : 'المرافق') + '</b><div class="amen">' +
        amenities.map((a) => '<div>' + ICON.check + esc(a) + '</div>').join('') + '</div></div>';
    }
  }

  // ── Day-by-day programme, first day to last
  if (days.length) {
    h += '<div class="days">';
    const coversWholeTrip = nights == null || days.length >= tripLen + 1;
    days.forEach((d, i) => {
      const title = cleanDayTitle(nm(d.titleAr, d.titleEn)) || (en ? 'Day ' + (i + 1) : 'اليوم ' + (i + 1));
      const date = start ? addDays(start, i) : null;
      const label = (en ? 'Day ' : 'اليوم ') + (i + 1) + (i === 0 ? (en ? ' · Arrival' : ' · الوصول') : i === days.length - 1 && days.length > 1 && coversWholeTrip ? (en ? ' · Last day' : ' · اليوم الأخير') : '') + (date ? ' — ' + fmtDate(date, lang, true) : '');
      h += '<div class="avoid">' + (i === 0 ? '<h2>' + (en ? 'Day-by-day programme' : 'برنامج الرحلة يوماً بيوم') + '</h2>' : '') + '<div class="day"><div class="day-rail"><div class="day-no">' + (i + 1) + '</div>' + (i < days.length - 1 ? '<i></i>' : '') + '</div>' +
        '<div class="day-card' + (d.imageUrl ? '' : ' noimg') + '">' +
        (d.imageUrl ? '<img class="day-img" src="' + esc(d.imageUrl) + '" alt="" />' : '') +
        '<div class="day-body"><div class="day-date">' + esc(label) + '</div>' +
        '<div class="day-title">' + esc(title) + '</div>' +
        (nm(d.descAr, d.descEn) ? '<div class="day-desc">' + esc(nm(d.descAr, d.descEn)) + '</div>' : '') +
        '</div></div></div></div>';
    });
    h += '</div>';
  }

  // ── What the price includes / does not include
  if (includes.length || excludes.length) {
    h += '<div class="avoid"><h2>' + (en ? 'What the price covers' : 'ماذا يشمل السعر') + '</h2><div class="incx">' +
      (includes.length ? '<div class="col in"><div class="ch">' + (en ? 'Price includes' : 'السعر يشمل') + '</div>' +
        includes.map((x) => '<div class="it">' + ICON.check + esc(x) + '</div>').join('') + '</div>' : '') +
      (excludes.length ? '<div class="col ex"><div class="ch">' + (en ? 'Not included' : 'السعر لا يشمل') + '</div>' +
        excludes.map((x) => '<div class="it">' + ICON.cross + esc(x) + '</div>').join('') + '</div>' : '') +
      '</div></div>';
  }

  // ── Price summary
  h += '<div class="price avoid">' +
    '<div class="row"><span>' + (en ? 'Price per adult' : 'السعر للبالغ') + ' × ' + adults + '</span><b>' + esc(fmtPrice(perAdult)) + '</b></div>' +
    (children ? '<div class="row"><span>' + (en ? 'Price per child' : 'سعر الطفل') + ' × ' + children + '</span><b>' + esc(fmtPrice(perChild)) + '</b></div>' : '') +
    (quote && quote.discount > 0
      ? '<div class="row"><span>' + (en ? 'Total before discount' : 'الإجمالي قبل الخصم') + '</span><b><s>' + esc(fmtPrice(grandTotal)) + '</s></b></div>' +
        '<div class="row disc"><span>' + (en ? 'Special discount' : 'خصم خاص') + (quote.discountLabel ? ' (' + esc(quote.discountLabel) + ')' : '') + '</span><b>− ' + esc(fmtPrice(quote.discount)) + '</b></div>' +
        '<div class="row tot"><span>' + (en ? 'Your price' : 'السعر النهائي لك') + '</span><span>' + esc(fmtPrice(grandTotal - quote.discount)) + '</span></div>'
      : '<div class="row tot"><span>' + (en ? 'Grand total' : 'الإجمالي الكلي') + '</span><span>' + esc(fmtPrice(grandTotal)) + '</span></div>') +
    '</div>';

  const hotelName = hotel ? nm(hotel.nameAr, hotel.nameEn) : '';
  const waText = packageMessage({ title: nm(pkg.title_ar, pkg.title_en), dest: nm(pkg.dest_ar, pkg.dest_en), hotel: hotelName }, lang);
  const qrWa = await qrDataUrl(waLink(waText));
  const qrWeb = pageUrl ? await qrDataUrl(pageUrl, '#036f8c') : '';
  h += '<div class="qrs avoid">' +
    '<div class="wa">' + (qrWa ? '<img src="' + qrWa + '" alt="" />' : '') + '<div><div class="t">' + (en ? 'Book on WhatsApp' : 'احجز عبر واتساب') + '</div>' +
    '<div class="num">+' + WHATSAPP_NUMBER.replace(/^(\d{3})(\d{3})(\d{3})(\d{4})$/, '$1 $2 $3 $4') + '</div>' +
    '<div class="s">' + (en ? 'Scan — the package details are written for you.' : 'امسح الرمز وستُكتب تفاصيل الباقة تلقائياً.') + '</div></div></div>' +
    (qrWeb ? '<div class="web"><img src="' + qrWeb + '" alt="" /><div><div class="t">' + (en ? 'Open on our website' : 'افتح الباقة على موقعنا') + '</div><div class="s">' + (en ? 'Photos, hotels and the full programme.' : 'الصور والفنادق والبرنامج الكامل.') + '</div></div></div>' : '') +
    '</div>';

  h += '<div class="note">' + (en
    ? 'This document is a quotation for guidance only. Prices are per person, and availability and rates are not guaranteed until the booking is confirmed.'
    : 'هذا المستند عرض سعر للاسترشاد فقط. الأسعار للفرد، والتوفر والأسعار غير مضمونة حتى تأكيد الحجز.') + '</div>';

  h += '</div>';
  return h;
}
