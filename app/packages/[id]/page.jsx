'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import SiteHeader from '../../../components/SiteHeader';
import SiteFooter from '../../../components/SiteFooter';
import MascotLoader from '../../../components/MascotLoader';
import Icon from '../../../components/Icon';
import { useLangToggle } from '../../../lib/i18n';
import { T, catLabel } from '../../../lib/packagesData';
import { formatPrice, formatSignedPrice } from '../../../lib/currency';
import { printDoc, copyText } from '../../../lib/printDoc';
import WhatsAppButton, { WA_ICON } from '../../../components/WhatsAppButton';
import { APPLY_FLOW_ENABLED, packageMessage } from '../../../lib/whatsapp';
import { buildPackageVoucherHtml, stripFlags } from '../../../lib/packagePdf';
import UrgencyPanel from '../../../components/UrgencyPanel';
import { TRAVELLER_TYPES, computeTotals, unitPrice, durationLabel, tripDays, returnDate } from '../../../lib/packagePricing';
import { useProviderReveal } from '../../../lib/useProviderReveal';
import WorldClocks, { destinationTz } from '../../../components/WorldClocks';
import { COUNTRY_GEO } from '../../../lib/geoData';
import { nightsLabel, destinationLabel, packageCountries } from '../../../lib/destinations';
import { GuideCompact } from '../../../components/DestinationGuide';
import { nextDeparture } from '../../../lib/packageUrgency';

const optStyle = (on) => ({
  display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 'var(--tw-radius-sm,10px)',
  border: `1.5px solid ${on ? '#049dc5' : '#ececed'}`, cursor: 'pointer', background: on ? '#eaf8fd' : '#fff',
});

// "12 Dec 2026" / "12 كانون الأول 2026" for the departure–return line.
function fmtTripDate(iso, lang) {
  if (!iso) return '';
  return new Date(iso + 'T00:00:00').toLocaleDateString(lang === 'en' ? 'en-GB' : 'ar-IQ-u-nu-latn', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function PackageDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { lang } = useLangToggle();
  const t = T[lang] || T.ar;
  const nm = (ar, en) => (lang === 'en' && en ? en : ar);

  const [pkg, setPkg] = useState(null);
  const [error, setError] = useState('');
  const [hotelIdx, setHotelIdx] = useState(0);
  const [flightIdx, setFlightIdx] = useState(0);
  const [counts, setCounts] = useState({ adult: 2, single: 0, childBed: 0, childNoBed: 0, infant: 0 });
  const [dateIdx, setDateIdx] = useState(0);
  const adults = counts.adult + counts.single; // kept for the WhatsApp/booking params below
  const children = counts.childBed + counts.childNoBed + counts.infant;
  // Every room type may be taken down to 0, but a booking still needs an adult.
  const noAdults = adults <= 0;
  const noAdultsMsg = lang === 'en'
    ? 'Add at least one adult to continue — children and infants cannot travel on their own.'
    : 'أضف بالغاً واحداً على الأقل لإكمال الحجز — لا يمكن حجز الأطفال والرضّع بدون بالغ.';
  const [toast, setToast] = useState('');
  const [tripDate, setTripDate] = useState('');
  // Phone-only booking bar: shown while the price card's WhatsApp button is off screen.
  const ctaRef = useRef(null);
  const [showBar, setShowBar] = useState(false);
  useEffect(() => {
    const el = ctaRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver(([e]) => setShowBar(!e.isIntersecting), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, [pkg]);
  // Staff quote builder (only after Alt + Q with a logged-in staff session)
  const { revealed: staffMode } = useProviderReveal();
  const [quote, setQuote] = useState({ customer: '', discountType: 'amount', discount: '', validUntil: '', note: '' });

  useEffect(() => {
    fetch(`/api/packages/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError('تعذّر تحميل بيانات الباقة');
        else setPkg(data);
      })
      .catch(() => setError('تعذّر تحميل بيانات الباقة'));
  }, [id]);

  const hotels = pkg?.hotels || [];
  const flights = pkg?.flights || [];
  const days = pkg?.days || [];
  const includes = (lang === 'en' && pkg?.includes_en?.length ? pkg.includes_en : pkg?.includes_ar) || [];
  const excludes = (lang === 'en' && pkg?.excludes_en?.length ? pkg.excludes_en : pkg?.excludes_ar) || [];
  const generalNotes = String((lang === 'en' && pkg?.general_notes_en) ? pkg.general_notes_en : (pkg?.general_notes_ar || pkg?.general_notes_en || '')).split('\n').map((l) => l.trim()).filter(Boolean);

  const selectedHotelCoords = useMemo(() => {
    const h = hotels[hotelIdx];
    if (!h || h.lat === undefined || h.lat === '' || h.lng === undefined || h.lng === '') return null;
    const lat = Number(h.lat);
    const lng = Number(h.lng);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
    return { lat, lng };
  }, [hotels, hotelIdx]);
  const availableDates = Array.isArray(pkg?.available_dates) ? pkg.available_dates : [];
  const selectedDate = availableDates[dateIdx] || null;
  const totals = useMemo(
    () => computeTotals(pkg || {}, counts, hotels[hotelIdx], flights[flightIdx], selectedDate),
    [pkg, counts, hotels, hotelIdx, flights, flightIdx, selectedDate]
  );
  const upgrade = totals.extra;
  const grandTotal = totals.total;
  const totalPerAdult = unitPrice(pkg || {}, TRAVELLER_TYPES[0], upgrade);

  function goBook() {
    if (noAdults) { flashToast(noAdultsMsg); return; }
    const params = new URLSearchParams({
      hotel: String(hotelIdx),
      flight: String(flightIdx),
      adults: String(adults),
      children: String(children),
    });
    router.push(`/packages/${id}/book?${params.toString()}`);
  }

  function flashToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 2400);
  }

  function packageSummaryLines() {
    const en = lang === 'en';
    const lines = [
      nm(pkg.title_ar, pkg.title_en) + ' — ' + destinationLabel(pkg, lang),
      (en ? 'Duration: ' : 'المدة: ') + nightsLabel(pkg, lang),
      (en ? 'Departures: ' : 'الانطلاق: ') + nm(pkg.departs_ar, pkg.departs_en),
    ];
    if (hotels[hotelIdx]) lines.push((en ? 'Hotel: ' : 'الفندق: ') + nm(hotels[hotelIdx].nameAr, hotels[hotelIdx].nameEn));
    if (flights[flightIdx]) lines.push((en ? 'Flight: ' : 'الرحلة: ') + nm(flights[flightIdx].nameAr, flights[flightIdx].nameEn));
    totals.lines.forEach((l) => lines.push('• ' + l.count + ' ' + (en ? l.type.en : l.type.ar) + ' × ' + formatPrice(l.unit, 'IQD', lang)));
    if (selectedDate) lines.push((en ? 'Date: ' : 'التاريخ: ') + selectedDate.date);
    lines.push((en ? 'Travellers: ' : 'عدد المسافرين: ') + travellerSummary(en));
    lines.push((en ? 'Grand total: ' : 'الإجمالي الكلي: ') + formatPrice(grandTotal, 'IQD', lang));
    if (includes.length) {
      lines.push('');
      lines.push(en ? "What's included:" : 'تشمل الباقة:');
      includes.forEach((i) => lines.push('• ' + i));
    }
    if (excludes.length) {
      lines.push('');
      lines.push(en ? 'Not included:' : 'السعر لا يشمل:');
      excludes.forEach((i) => lines.push('✗ ' + i));
    }
    lines.push('');
    lines.push('قصر المرايا للسفر والسياحة');
    return lines;
  }

  // Share the package with family and friends: the phone's own share sheet
  // when it has one, otherwise WhatsApp (any contact, not the company line).
  async function handleShare() {
    const en = lang === 'en';
    const url = window.location.origin + '/packages/' + pkg.id;
    const title = nm(pkg.title_ar, pkg.title_en);
    const text = [
      '✈️ ' + title + (destinationLabel(pkg, lang) ? ' — ' + destinationLabel(pkg, lang) : ''),
      nightsLabel(pkg, lang),
      Number(pkg.price) > 0 ? (en ? 'From ' : 'يبدأ من ') + formatPrice(pkg.price, 'IQD', lang) + (en ? ' per person' : ' للشخص') : '',
      en ? 'Qaser Almaraya Travel & Tourism' : 'قصر المرايا للسفر والسياحة',
    ].filter(Boolean).join('\n');
    if (navigator.share) {
      try { await navigator.share({ title, text, url }); return; } catch (e) { if (e && e.name === 'AbortError') return; }
    }
    const wa = 'https://wa.me/?text=' + encodeURIComponent(text + '\n' + url);
    const w = window.open(wa, '_blank', 'noopener');
    if (!w) window.location.href = wa;
  }

  function handleCopy() {
    copyText(packageSummaryLines().join('\n'), () => flashToast(t.copied_msg));
  }

  function travellerSummary(en) {
    return TRAVELLER_TYPES.map((t) => (counts[t.key] > 0 ? counts[t.key] + ' ' + (en ? t.en : t.ar) : null)).filter(Boolean).join(en ? ', ' : '، ');
  }

  function quoteDiscount() {
    const v = Number(quote.discount) || 0;
    if (!staffMode || v <= 0) return 0;
    const d = quote.discountType === 'percent' ? Math.round((grandTotal * Math.min(v, 100)) / 100) : v;
    return Math.min(d, grandTotal);
  }

  function handleDownloadPdf() {
    const discount = quoteDiscount();
    const bodyHtml = buildPackageVoucherHtml({
      pkg,
      hotel: hotels[hotelIdx],
      flight: flights[flightIdx],
      days,
      includes,
      excludes,
      adults,
      children,
      lines: totals.lines,
      grandTotal,
      travellerSummary: travellerSummary(lang === 'en'),
      selectedDate,
      fmtPrice: (n) => formatPrice(n, 'IQD', lang),
      lang,
      startDate: tripDate,
      pageUrl: window.location.href,
      quote: staffMode ? { customer: quote.customer.trim(), discount, discountLabel: quote.discountType === 'percent' && Number(quote.discount) > 0 ? Math.min(Number(quote.discount), 100) + '%' : '', validUntil: quote.validUntil, note: quote.note.trim() } : null,
    });
    printDoc(nm(pkg.title_ar, pkg.title_en) + ' — ' + destinationLabel(pkg, lang) + (staffMode && quote.customer.trim() ? ' — ' + quote.customer.trim() : ''), bodyHtml, lang);
  }

  // WhatsApp booking text, shared by the price card button and the phone bar.
  const waMessage = () => {
    const h = hotels[hotelIdx];
    const f = flights[flightIdx];
    const en = lang === 'en';
    return packageMessage({
      title: nm(pkg.title_ar, pkg.title_en),
      dest: destinationLabel(pkg, lang),
      nights: nightsLabel(pkg, lang),
      hotel: h ? nm(h.nameAr, h.nameEn) + ((h.notesAr || h.notesEn) ? ' (' + nm(h.notesAr, h.notesEn) + ')' : '') : '',
      flight: f ? nm(f.nameAr, f.nameEn) : '',
      travellers: travellerSummary(en),
      date: tripDate,
      url: window.location.href,
    }, lang);
  };

  if (error) {
    return (
      <div dir={lang === 'en' ? 'ltr' : 'rtl'} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <SiteHeader active="المجموعات والباقات" />
        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
            <p style={{ color: '#d2324f', background: '#fdecef', border: '1px solid #f7c3cc', borderRadius: 'var(--tw-radius-sm,10px)', padding: '14px 20px' }}>{error}</p>
            <Link href="/packages" className="qa-btn qa-cyan" style={{ textDecoration: 'none' }}>{t.back_to_results}</Link>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }
  if (!pkg) {
    return (
      <div dir={lang === 'en' ? 'ltr' : 'rtl'} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <SiteHeader active="المجموعات والباقات" />
        <main style={{ flex: 1 }} />
        <SiteFooter />
        <MascotLoader assetBase="/assets" />
      </div>
    );
  }

  return (
    <div dir={lang === 'en' ? 'ltr' : 'rtl'} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <SiteHeader active="المجموعات والباقات" />
      <main style={{ flex: 1 }}>
        <div className="qa-page">
          <div className="qa-sec" style={{ paddingBottom: 0 }}>
            <Link href="/packages" style={{ fontSize: 14, fontWeight: 600, color: 'var(--qs-brand-deep,#036f8c)', textDecoration: 'none' }}>{t.back_to_results}</Link>
          </div>

          <section className="qa-sec qa-2col qa-detail" style={{ display: 'grid', gridTemplateColumns: 'minmax(240px,340px) 1fr', gap: 28, alignItems: 'flex-start' }}>
            {/* Sticky price summary */}
            <div className="qa-card" style={{ position: 'sticky', top: 90, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <h3 style={{ margin: 0, fontSize: 18 }}>{t.price_title}</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--qs-ink-2,#5f666e)' }}>{t.detail_base}</span><span>{formatPrice(Number(pkg.price) || 0, 'IQD', lang)}</span></div>
                {upgrade !== 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--qs-ink-2,#5f666e)' }}>{t.detail_upgrade}</span><span>{formatSignedPrice(upgrade, 'IQD', lang)}</span></div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}><span>{t.detail_total_pp}</span><span style={{ color: 'var(--qs-brand-deep,#049dc5)' }}>{formatPrice(totalPerAdult, 'IQD', lang)}</span></div>
              </div>

              {availableDates.length > 0 && (
                <div style={{ borderTop: '1px solid var(--qs-line,#ececed)', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 700 }}>{lang === 'en' ? 'Choose a departure date' : 'اختر تاريخ الانطلاق'}</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {availableDates.map((d, i) => (
                      <button key={d.date} type="button" onClick={() => setDateIdx(i)}
                        style={{ borderRadius: 'var(--tw-radius-sm,10px)', padding: '8px 12px', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 700, border: i === dateIdx ? '2px solid var(--qs-brand-deep,#049dc5)' : '1px solid var(--qs-line,#ececed)', background: i === dateIdx ? 'var(--qs-brand-soft,#eaf8fd)' : '#fff', color: 'var(--qs-ink,#1d2733)' }}>
                        <span dir="ltr">{new Date(d.date).toLocaleDateString(lang === 'en' ? 'en-GB' : 'ar-IQ-u-nu-latn', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        {d.adjust ? <span style={{ display: 'block', fontSize: 11, color: d.adjust > 0 ? '#c27a00' : '#1a7f47' }}>{formatSignedPrice(d.adjust, 'IQD', lang)}</span> : null}
                      </button>
                    ))}
                  </div>
                  {selectedDate && returnDate(pkg, selectedDate.date) && (
                    <div data-no-i18n="" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 14, background: '#f3fafc', border: '1px solid #d9e9ef', borderRadius: 'var(--tw-radius-sm,10px)', padding: '8px 12px' }}>
                      <Icon name="calendar-days" size={16} style={{ color: 'var(--qs-brand-deep,#036f8c)', flex: 'none' }} />
                      <span>{lang === 'en' ? 'Departure' : 'الانطلاق'} <b dir="ltr">{fmtTripDate(selectedDate.date, lang)}</b></span>
                      <span style={{ color: '#b0b6bb' }}>·</span>
                      <span>{lang === 'en' ? 'Return' : 'العودة'} <b dir="ltr">{fmtTripDate(returnDate(pkg, selectedDate.date), lang)}</b></span>
                      <span style={{ color: 'var(--qs-ink-2,#5f666e)' }}>({tripDays(pkg)} {lang === 'en' ? 'days' : 'أيام'})</span>
                    </div>
                  )}
                </div>
              )}

              <div style={{ borderTop: '1px solid var(--qs-line,#ececed)', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <span style={{ fontSize: 14, fontWeight: 700 }}>{lang === 'en' ? 'Travellers' : 'المسافرون'}</span>
                {TRAVELLER_TYPES.map((tt) => {
                  const label = lang === 'en' ? tt.en : tt.ar;
                  const hint = lang === 'en' ? tt.hintEn : tt.hintAr;
                  const unit = totals.units ? totals.units[tt.key] : unitPrice(pkg, tt, upgrade);
                  return (
                    <div key={tt.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <span style={{ fontSize: 14, color: unit == null ? '#b0b6bb' : 'var(--qs-ink,#1d2733)' }}>{label}{hint ? <span style={{ fontSize: 12, color: 'var(--qs-ink-2,#5f666e)' }}> ({hint})</span> : null}
                        {unit == null ? <span style={{ display: 'block', fontSize: 12, color: '#b0b6bb' }}>{lang === 'en' ? 'Not available for this hotel' : 'غير متاح لهذا الفندق'}</span>
                          : counts[tt.key] > 0 && <span style={{ display: 'block', fontSize: 12, color: 'var(--qs-ink-2,#5f666e)' }}>{formatPrice(unit, 'IQD', lang)}</span>}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <button type="button" disabled={counts[tt.key] <= 0} onClick={() => setCounts((c) => ({ ...c, [tt.key]: Math.max(0, c[tt.key] - 1) }))} style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid var(--qs-line-2,#cacbcc)', background: '#fff', cursor: counts[tt.key] <= 0 ? 'not-allowed' : 'pointer', opacity: counts[tt.key] <= 0 ? 0.4 : 1 }}>−</button>
                        <span style={{ minWidth: 18, textAlign: 'center' }}>{counts[tt.key]}</span>
                        <button type="button" disabled={unit == null} onClick={() => setCounts((c) => ({ ...c, [tt.key]: c[tt.key] + 1 }))} style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid var(--qs-line-2,#cacbcc)', background: '#fff', cursor: unit == null ? 'not-allowed' : 'pointer', opacity: unit == null ? 0.4 : 1 }}>+</button>
                      </div>
                    </div>
                  );
                })}
                {noAdults && (
                  <span role="alert" style={{ fontSize: 13, fontWeight: 500, color: '#d2324f', background: '#fdecef', border: '1px solid #f7c3cc', borderRadius: 'var(--tw-radius-xs,8px)', padding: '8px 10px' }}>{noAdultsMsg}</span>
                )}
              </div>

              <div style={{ borderTop: '1px solid var(--qs-line,#ececed)', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {totals.lines.map((l) => (
                  <div key={l.type.key} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#5b646d' }}>
                    <span>{l.count} {lang === 'en' ? l.type.en : l.type.ar} × {formatPrice(l.unit, 'IQD', lang)}</span>
                    <span>{formatPrice(l.subtotal, 'IQD', lang)}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 17, fontWeight: 700, marginTop: 4 }}>
                  <span>{t.detail_total}</span>
                  <span style={{ color: 'var(--qs-brand-deep,#049dc5)' }}>{formatPrice(grandTotal, 'IQD', lang)}</span>
                </div>
              </div>

              <UrgencyPanel pkg={pkg} lang={lang} />
              {staffMode && (
                <div style={{ border: '2px dashed #faab18', background: '#fffaf0', borderRadius: 'var(--tw-radius-sm,10px)', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <b style={{ fontSize: 14, color: '#8a5a00' }}>عرض سعر مخصص (وضع الموظفين)</b>
                  <input style={{ padding: '8px 10px', borderRadius: 'var(--tw-radius-xs,8px)', border: '1px solid var(--qs-line,#ececed)', fontFamily: 'inherit' }} placeholder="اسم العميل — مثال: أحمد علي" value={quote.customer} onChange={(e) => setQuote({ ...quote, customer: e.target.value })} />
                  <div style={{ display: 'flex', gap: 6 }}>
                    <select style={{ padding: '8px', borderRadius: 'var(--tw-radius-xs,8px)', border: '1px solid var(--qs-line,#ececed)', fontFamily: 'inherit' }} value={quote.discountType} onChange={(e) => setQuote({ ...quote, discountType: e.target.value })}>
                      <option value="amount">خصم بالدينار</option>
                      <option value="percent">خصم بالنسبة %</option>
                    </select>
                    <input type="number" min="0" style={{ flex: 1, minWidth: 0, padding: '8px 10px', borderRadius: 'var(--tw-radius-xs,8px)', border: '1px solid var(--qs-line,#ececed)', fontFamily: 'inherit' }} placeholder={quote.discountType === 'percent' ? 'مثال 10' : 'مثال 100000'} value={quote.discount} onChange={(e) => setQuote({ ...quote, discount: e.target.value })} />
                  </div>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: 'var(--qs-ink-2,#5f666e)' }}>العرض صالح حتى (اختياري)
                    <input type="date" style={{ padding: '8px 10px', borderRadius: 'var(--tw-radius-xs,8px)', border: '1px solid var(--qs-line,#ececed)', fontFamily: 'inherit' }} value={quote.validUntil} onChange={(e) => setQuote({ ...quote, validUntil: e.target.value })} />
                  </label>
                  <textarea style={{ padding: '8px 10px', borderRadius: 'var(--tw-radius-xs,8px)', border: '1px solid var(--qs-line,#ececed)', fontFamily: 'inherit', minHeight: 56 }} placeholder="ملاحظة خاصة للعميل (اختياري)" value={quote.note} onChange={(e) => setQuote({ ...quote, note: e.target.value })} />
                  {quoteDiscount() > 0 && (
                    <span style={{ fontSize: 13 }}>الإجمالي بعد الخصم: <b data-no-i18n="">{formatPrice(grandTotal - quoteDiscount(), 'IQD', lang)}</b> <s data-no-i18n="" style={{ color: 'var(--qs-ink-2,#5f666e)' }}>{formatPrice(grandTotal, 'IQD', lang)}</s></span>
                  )}
                  <span style={{ fontSize: 12, color: 'var(--qs-ink-2,#5f666e)' }}>يظهر اسم العميل والخصم في ملف PDF فقط — لا يراه أحد غيرك على الموقع.</span>
                </div>
              )}
              {APPLY_FLOW_ENABLED ? (
                <button type="button" onClick={goBook} disabled={noAdults} className="qa-btn qa-cyan" style={{ textAlign: 'center', opacity: noAdults ? 0.5 : 1, cursor: noAdults ? 'not-allowed' : 'pointer' }}>{t.detail_cta}</button>
              ) : (
                <div ref={ctaRef} style={{ display: 'flex', flexDirection: 'column' }}>
                {noAdults ? (
                  <button type="button" disabled className="qa-btn" style={{ width: '100%', boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, background: '#25d366', color: '#fff', border: 0, fontWeight: 700, opacity: 0.5, cursor: 'not-allowed' }}>
                    {WA_ICON}
                    <span>{lang === 'en' ? 'Contact us on WhatsApp to book' : 'تواصل معنا على واتساب للحجز'}</span>
                  </button>
                ) : (
                <WhatsAppButton
                  label={lang === 'en' ? 'Contact us on WhatsApp to book' : 'تواصل معنا على واتساب للحجز'}
                  getMessage={waMessage}
                  style={{ width: '100%', boxSizing: 'border-box' }}
                />
                )}
                </div>
              )}

              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, fontWeight: 500, color: 'var(--qs-body,#3d4650)' }}>
                {lang === 'en' ? 'Travel date (optional — adds dates to the PDF)' : 'تاريخ السفر (اختياري — يضيف التواريخ إلى ملف PDF)'}
                <input
                  type="date"
                  value={tripDate}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setTripDate(e.target.value)}
                  style={{ padding: '8px 12px', borderRadius: 'var(--tw-radius-sm,10px)', border: '1px solid var(--qs-line,#ececed)', fontFamily: 'inherit', fontSize: 14 }}
                />
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  style={{ flex: 1, cursor: 'pointer', border: '1px solid var(--qs-line,#ececed)', borderRadius: 999, padding: '10px 14px', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', background: '#fff', color: 'var(--qs-brand-deep,#036f8c)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                >
                  <Icon name="file-text" size={15} />
                  {t.pdf_btn}
                </button>
                <button
                  type="button"
                  onClick={handleCopy}
                  style={{ flex: 1, cursor: 'pointer', border: '1px solid var(--qs-line-2,#bfe9f6)', borderRadius: 999, padding: '10px 14px', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', background: 'var(--qs-brand-soft,#eaf8fd)', color: 'var(--qs-brand-deep,#036f8c)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                >
                  <Icon name="copy" size={15} />
                  {t.copy_btn}
                </button>
              </div>
              <button
                type="button"
                onClick={handleShare}
                className="qa-share-btn"
                style={{ cursor: 'pointer', border: '1px solid #b9eccd', borderRadius: 999, padding: '10px 14px', fontSize: 14, fontWeight: 700, fontFamily: 'inherit', background: '#eafaf0', color: '#11804a', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" /></svg>
                {lang === 'en' ? 'Share this package with family & friends' : 'شارك الباقة مع أهلك وأصدقائك'}
              </button>
              {toast && (
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--qs-brand-deep,#036f8c)', background: 'var(--qs-brand-soft,#eaf8fd)', border: '1px solid var(--qs-line-2,#bfe9f6)', borderRadius: 'var(--tw-radius-xs,8px)', padding: '6px 10px', textAlign: 'center' }}>{toast}</span>
              )}

              <span style={{ fontSize: 12, color: 'var(--qs-ink-2,#5f666e)', textAlign: 'center' }}>{t.detail_note}</span>
              {(() => {
                const cs = Array.isArray(pkg.countries) ? pkg.countries : [];
                const iso = cs[0] ? String(cs[0]).toLowerCase() : null;
                const tz = destinationTz(iso, cs.length === 1 ? destinationLabel(pkg, lang) + ' ' + (hotels[hotelIdx]?.location || '') : '');
                if (!tz || iso === 'iq') return null;
                const g = COUNTRY_GEO[iso];
                const place = cs.length === 1 ? destinationLabel(pkg, lang) : g ? (lang === 'en' ? g[4] : g[3]) : destinationLabel(pkg, lang);
                const f = flights[flightIdx];
                return <WorldClocks tz={tz} place={place} lang={lang} compact flight={f ? { arrive: f.outArriveTime, depart: f.retDepartTime } : null} />;
              })()}
              {(() => {
                const iso = packageCountries(pkg)[0];
                const d = tripDate || (selectedDate && String(selectedDate.date || '')) || nextDeparture(pkg);
                const m = /^\d{4}-\d{2}/.test(d || '') ? Number(d.slice(5, 7)) - 1 : null;
                return iso ? <GuideCompact iso={iso} lang={lang} month={m} /> : null;
              })()}
            </div>

            {/* Main content */}
            <div className="qa-detail-main" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="qa-detail-hero" style={{ position: 'relative', minHeight: 200, borderRadius: 'var(--tw-radius,16px)', overflow: 'hidden', background: pkg.image_url ? `url(${pkg.image_url}) center/cover` : 'var(--tw-band-deep,#049dc5)', display: 'flex', alignItems: 'flex-end', padding: 24 }}>
                {pkg.image_url && <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(1,42,55,.6), transparent 60%)' }} />}
                {(pkg.badge_ar || pkg.badge_en) && (
                  <span style={{ position: 'absolute', top: 20, insetInlineStart: 20, padding: '4px 14px', borderRadius: 999, background: '#faab18', color: '#fff', fontSize: 13, fontWeight: 500, zIndex: 2 }}>
                    {nm(pkg.badge_ar, pkg.badge_en)}
                  </span>
                )}
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, letterSpacing: '.06em', color: 'rgba(255,255,255,.85)' }}>{catLabel(pkg.cat, lang).toUpperCase()}</span>
                  <h1 style={{ margin: '4px 0 0', fontSize: 28, color: '#fff' }}>{nm(pkg.title_ar, pkg.title_en)}</h1>
                  <span style={{ fontSize: 14, color: 'rgba(255,255,255,.9)' }}>{destinationLabel(pkg, lang)} · {nightsLabel(pkg, lang)}</span>
                </div>
              </div>

              <div className="qa-card">
                <h4 style={{ margin: '0 0 14px' }}>{t.overview_title}</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12 }}>
                  {[
                    [lang === 'en' ? 'Destination' : 'الوجهة', destinationLabel(pkg, lang)],
                    [lang === 'en' ? 'Duration' : 'المدة', durationLabel(pkg, lang) || nightsLabel(pkg, lang)],
                    [lang === 'en' ? 'Departures' : 'المغادرة', nm(pkg.departs_ar, pkg.departs_en)],
                    [t.detail_base, formatPrice(Number(pkg.price) || 0, 'IQD', lang)],
                  ].map(([label, value]) => (
                    <div key={label} style={{ border: '1px solid var(--qs-line,#ececed)', borderRadius: 'var(--tw-radius-sm,10px)', padding: '12px 14px' }}>
                      <div style={{ fontSize: 12, color: 'var(--qs-ink-2,#5f666e)' }}>{label}</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--qs-ink,#1d2733)' }}>{value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {generalNotes.length > 0 && (
                <div className="qa-card" style={{ borderInlineStart: '4px solid #faab18', background: '#fffaf0' }}>
                  <h4 style={{ margin: '0 0 10px' }}>{lang === 'en' ? 'Important notes' : 'ملاحظات مهمة'}</h4>
                  <ul style={{ margin: 0, paddingInlineStart: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {generalNotes.map((l, i) => <li key={i} style={{ fontSize: 14, color: 'var(--qs-body,#3d4650)', lineHeight: 1.7 }}>{l}</li>)}
                  </ul>
                </div>
              )}

              {(includes.length > 0 || excludes.length > 0) && (
                <div className="qa-card">
                  <h4 style={{ margin: '0 0 14px' }}>{lang === 'en' ? 'What the price covers' : 'ماذا يشمل السعر'}</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 14 }}>
                    {includes.length > 0 && (
                      <div style={{ background: '#eefaf3', border: '1px solid #cdebd9', borderRadius: 'var(--tw-radius-sm,10px)', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <span style={{ fontWeight: 700, color: '#1a7f47' }}>{lang === 'en' ? 'Price includes' : 'السعر يشمل'}</span>
                        {includes.map((i, idx) => (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Icon name="check" size={16} style={{ color: '#1a7f47', flex: 'none' }} />
                            <span style={{ fontSize: 14, color: 'var(--qs-ink,#1d2733)' }}>{i}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {excludes.length > 0 && (
                      <div style={{ background: '#fdf1f3', border: '1px solid #f4d3da', borderRadius: 'var(--tw-radius-sm,10px)', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <span style={{ fontWeight: 700, color: '#c02643' }}>{lang === 'en' ? 'Not included' : 'السعر لا يشمل'}</span>
                        {excludes.map((i, idx) => (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Icon name="x" size={15} style={{ color: '#c02643', flex: 'none' }} />
                            <span style={{ fontSize: 14, color: 'var(--qs-ink,#1d2733)' }}>{i}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {days.length > 0 && (
                <div className="qa-card">
                  <h4 style={{ margin: '0 0 14px' }}>{t.calendar_title}</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {days.map((d, idx) => (
                      <div key={idx} style={{ borderInlineStart: '3px solid var(--qs-brand-deep,#049dc5)', paddingInlineStart: 14 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--qs-ink,#1d2733)' }}>{stripFlags(nm(d.titleAr, d.titleEn))}</div>
                        <div style={{ fontSize: 14, color: 'var(--qs-ink-2,#5f666e)', lineHeight: 1.6, marginTop: 2 }}>{stripFlags(nm(d.descAr, d.descEn))}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {hotels.length > 0 && (
                <div className="qa-card">
                  <h4 style={{ margin: '0 0 14px' }}>{t.hotel_title}</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {hotels.map((h, idx) => (
                      <div key={idx} className="qa-opt-hotel" style={optStyle(hotelIdx === idx)} onClick={() => setHotelIdx(idx)}>
                        <input type="radio" checked={hotelIdx === idx} onChange={() => setHotelIdx(idx)} style={{ flex: 'none' }} />
                        {h.imageUrl ? (
                          <img src={h.imageUrl} alt="" style={{ width: 44, height: 44, borderRadius: 'var(--tw-radius-xs,8px)', objectFit: 'cover', flex: 'none' }} />
                        ) : null}
                        <span className="qa-opt-name" style={{ flex: 1, fontSize: 14, color: 'var(--qs-ink,#1d2733)' }}>
                          {nm(h.nameAr, h.nameEn)}
                          {(h.notesAr || h.notesEn) && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#1a7f47', fontWeight: 600, marginTop: 2 }}><Icon name="utensils" size={12} style={{ flex: 'none' }} />{nm(h.notesAr, h.notesEn)}</span>}
                        </span>
                        <span className="qa-opt-price" style={{ fontSize: 14, fontWeight: 700, color: (h.extras?.adult ?? h.diff) ? 'var(--qs-brand-deep,#049dc5)' : 'var(--qs-ink-2,#5f666e)' }}>{(h.extras?.adult ?? h.diff) ? formatSignedPrice(h.extras?.adult ?? h.diff, 'IQD', lang) : (lang === 'en' ? 'Included' : 'مشمول')}</span>
                      </div>
                    ))}
                  </div>

                  {hotels[hotelIdx]?.locationUrl ? (
                    <a href={hotels[hotelIdx].locationUrl} target="_blank" rel="noopener noreferrer" style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 700, color: 'var(--qs-brand-deep,#049dc5)', textDecoration: 'none' }}>
                      <Icon name="map-pin" size={16} /> {lang === 'en' ? 'View hotel location' : 'موقع الفندق على الخريطة'}
                    </a>
                  ) : null}

                  {hotels[hotelIdx] && ((hotels[hotelIdx].extraImages || []).length > 0 || hotels[hotelIdx].imageUrl) ? (
                    <div style={{ marginTop: 16, display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
                      {[hotels[hotelIdx].imageUrl, ...(hotels[hotelIdx].extraImages || [])].filter(Boolean).map((src, i) => (
                        <img
                          key={i}
                          src={src}
                          alt=""
                          style={{ width: 130, height: 96, borderRadius: 'var(--tw-radius-sm,10px)', objectFit: 'cover', flex: 'none', border: '1px solid var(--qs-line,#ececed)' }}
                        />
                      ))}
                    </div>
                  ) : null}

                  {selectedHotelCoords ? (
                    <div style={{ marginTop: 16, borderRadius: 'var(--tw-radius,16px)', overflow: 'hidden', border: '1px solid var(--qs-line,#ececed)' }}>
                      <iframe
                        key={`${selectedHotelCoords.lat},${selectedHotelCoords.lng}`}
                        title={lang === 'en' ? 'Hotel location' : 'موقع الفندق'}
                        width="100%"
                        height="260"
                        style={{ border: 0, display: 'block' }}
                        loading="lazy"
                        src={`https://www.openstreetmap.org/export/embed.html?bbox=${selectedHotelCoords.lng - 0.01}%2C${selectedHotelCoords.lat - 0.01}%2C${selectedHotelCoords.lng + 0.01}%2C${selectedHotelCoords.lat + 0.01}&layer=mapnik&marker=${selectedHotelCoords.lat}%2C${selectedHotelCoords.lng}`}
                      />
                      <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, background: '#f8fbfc' }}>
                        <span style={{ fontSize: 13, color: 'var(--qs-ink-2,#5f666e)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Icon name="map-pin" size={13} style={{ color: 'var(--qs-brand-deep,#049dc5)' }} />
                          {nm(hotels[hotelIdx]?.nameAr, hotels[hotelIdx]?.nameEn)}
                        </span>
                        <a
                          href={`https://www.openstreetmap.org/?mlat=${selectedHotelCoords.lat}&mlon=${selectedHotelCoords.lng}#map=16/${selectedHotelCoords.lat}/${selectedHotelCoords.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ fontSize: 13, fontWeight: 500, color: 'var(--qs-brand-deep,#036f8c)', textDecoration: 'none' }}
                        >
                          {lang === 'en' ? 'Get directions ↗' : 'الاتجاهات ↗'}
                        </a>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}

              {flights.length > 0 && (
                <div className="qa-card">
                  <h4 style={{ margin: '0 0 14px' }}>{t.flight_title}</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {flights.map((f, idx) => (
                      <div key={idx} style={optStyle(flightIdx === idx)} onClick={() => setFlightIdx(idx)}>
                        <input type="radio" checked={flightIdx === idx} onChange={() => setFlightIdx(idx)} style={{ flex: 'none' }} />
                        <span style={{ flex: 1, fontSize: 14, color: 'var(--qs-ink,#1d2733)' }}>{nm(f.nameAr, f.nameEn)}</span>
                        <span style={{ fontSize: 14, fontWeight: 700, color: f.diff ? 'var(--qs-brand-deep,#049dc5)' : 'var(--qs-ink-2,#5f666e)' }}>{f.diff ? formatSignedPrice(f.diff, 'IQD', lang) : (lang === 'en' ? 'Included' : 'مشمول')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
        {!APPLY_FLOW_ENABLED && (
          <div className={'qa-pkg-mbar' + (showBar ? ' on' : '')} data-no-i18n="" aria-hidden={!showBar}>
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, lineHeight: 1.25 }}>
              <span style={{ fontSize: 12, color: 'var(--qs-ink-2,#5f666e)' }}>{grandTotal > 0 ? (lang === 'en' ? 'Total' : 'المجموع') + ' · ' + travellerSummary(lang === 'en') : t.detail_total_pp}</span>
              <b style={{ fontSize: 16, color: 'var(--qs-brand-deep,#036f8c)', whiteSpace: 'nowrap' }}>{formatPrice(grandTotal > 0 ? grandTotal : totalPerAdult, 'IQD', lang)}</b>
            </div>
            {noAdults ? (
              <button type="button" disabled className="qa-btn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#25d366', color: '#fff', border: 0, fontWeight: 700, padding: '10px 16px', fontSize: 14, minHeight: 0, whiteSpace: 'nowrap', flexShrink: 0, opacity: 0.5, cursor: 'not-allowed' }}>
                {WA_ICON}
                <span>{lang === 'en' ? 'Book on WhatsApp' : 'احجز عبر واتساب'}</span>
              </button>
            ) : (
            <WhatsAppButton label={lang === 'en' ? 'Book on WhatsApp' : 'احجز عبر واتساب'} getMessage={waMessage} style={{ padding: '10px 16px', fontSize: 14, minHeight: 0, whiteSpace: 'nowrap', flexShrink: 0 }} />
            )}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
