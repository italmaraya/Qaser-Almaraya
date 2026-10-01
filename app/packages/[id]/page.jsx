'use client';
import { useEffect, useMemo, useState } from 'react';
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
import WhatsAppButton from '../../../components/WhatsAppButton';
import { APPLY_FLOW_ENABLED, packageMessage } from '../../../lib/whatsapp';
import { buildPackageVoucherHtml } from '../../../lib/packagePdf';
import { packageUrgency } from '../../../lib/packageUrgency';
import { TRAVELLER_TYPES, computeTotals, unitPrice, durationLabel } from '../../../lib/packagePricing';
import { useProviderReveal } from '../../../lib/useProviderReveal';
import WorldClocks, { destinationTz } from '../../../components/WorldClocks';
import { COUNTRY_GEO } from '../../../lib/geoData';

const optStyle = (on) => ({
  display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 14,
  border: `1.5px solid ${on ? '#049dc5' : '#ececed'}`, cursor: 'pointer', background: on ? '#eaf8fd' : '#fff',
});

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
  const [toast, setToast] = useState('');
  const [tripDate, setTripDate] = useState('');
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
      nm(pkg.title_ar, pkg.title_en) + ' — ' + nm(pkg.dest_ar, pkg.dest_en),
      (en ? 'Duration: ' : 'المدة: ') + nm(pkg.nights_ar, pkg.nights_en),
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
    printDoc(nm(pkg.title_ar, pkg.title_en) + ' — ' + nm(pkg.dest_ar, pkg.dest_en) + (staffMode && quote.customer.trim() ? ' — ' + quote.customer.trim() : ''), bodyHtml, lang);
  }

  if (error) {
    return (
      <div dir={lang === 'en' ? 'ltr' : 'rtl'} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <SiteHeader active="المجموعات والباقات" />
        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
            <p style={{ color: '#d2324f', background: '#fdecef', border: '1px solid #f7c3cc', borderRadius: 10, padding: '14px 20px' }}>{error}</p>
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
            <Link href="/packages" style={{ fontSize: 13.5, fontWeight: 600, color: '#036f8c', textDecoration: 'none' }}>{t.back_to_results}</Link>
          </div>

          <section className="qa-sec qa-2col" style={{ display: 'grid', gridTemplateColumns: 'minmax(240px,340px) 1fr', gap: 28, alignItems: 'flex-start' }}>
            {/* Sticky price summary */}
            <div className="qa-card" style={{ position: 'sticky', top: 90, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <h3 style={{ margin: 0, fontSize: 18 }}>{t.price_title}</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#7b8087' }}>{t.detail_base}</span><span>{formatPrice(Number(pkg.price) || 0, 'IQD', lang)}</span></div>
                {upgrade !== 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#7b8087' }}>{t.detail_upgrade}</span><span>{formatSignedPrice(upgrade, 'IQD', lang)}</span></div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}><span>{t.detail_total_pp}</span><span style={{ color: '#049dc5' }}>{formatPrice(totalPerAdult, 'IQD', lang)}</span></div>
              </div>

              {availableDates.length > 0 && (
                <div style={{ borderTop: '1px solid #ececed', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 700 }}>{lang === 'en' ? 'Choose a departure date' : 'اختر تاريخ الانطلاق'}</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {availableDates.map((d, i) => (
                      <button key={d.date} type="button" onClick={() => setDateIdx(i)}
                        style={{ borderRadius: 10, padding: '8px 12px', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 700, border: i === dateIdx ? '2px solid #049dc5' : '1px solid #ececed', background: i === dateIdx ? '#eaf8fd' : '#fff', color: '#1d2733' }}>
                        <span dir="ltr">{new Date(d.date).toLocaleDateString(lang === 'en' ? 'en-GB' : 'ar-IQ', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        {d.adjust ? <span style={{ display: 'block', fontSize: 11, color: d.adjust > 0 ? '#c27a00' : '#1a7f47' }}>{formatSignedPrice(d.adjust, 'IQD', lang)}</span> : null}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ borderTop: '1px solid #ececed', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <span style={{ fontSize: 14, fontWeight: 700 }}>{lang === 'en' ? 'Travellers' : 'المسافرون'}</span>
                {TRAVELLER_TYPES.map((tt) => {
                  const min = tt.key === 'adult' ? 1 : 0;
                  const label = lang === 'en' ? tt.en : tt.ar;
                  const hint = lang === 'en' ? tt.hintEn : tt.hintAr;
                  const unit = totals.units ? totals.units[tt.key] : unitPrice(pkg, tt, upgrade);
                  return (
                    <div key={tt.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <span style={{ fontSize: 14, color: unit == null ? '#b0b6bb' : '#1d2733' }}>{label}{hint ? <span style={{ fontSize: 11.5, color: '#7b8087' }}> ({hint})</span> : null}
                        {unit == null ? <span style={{ display: 'block', fontSize: 11.5, color: '#b0b6bb' }}>{lang === 'en' ? 'Not available for this hotel' : 'غير متاح لهذا الفندق'}</span>
                          : counts[tt.key] > 0 && <span style={{ display: 'block', fontSize: 11.5, color: '#7b8087' }}>{formatPrice(unit, 'IQD', lang)}</span>}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <button type="button" onClick={() => setCounts((c) => ({ ...c, [tt.key]: Math.max(min, c[tt.key] - 1) }))} style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid #cacbcc', background: '#fff', cursor: 'pointer' }}>−</button>
                        <span style={{ minWidth: 18, textAlign: 'center' }}>{counts[tt.key]}</span>
                        <button type="button" disabled={unit == null} onClick={() => setCounts((c) => ({ ...c, [tt.key]: c[tt.key] + 1 }))} style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid #cacbcc', background: '#fff', cursor: unit == null ? 'not-allowed' : 'pointer', opacity: unit == null ? 0.4 : 1 }}>+</button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ borderTop: '1px solid #ececed', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {totals.lines.map((l) => (
                  <div key={l.type.key} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#5b646d' }}>
                    <span>{l.count} {lang === 'en' ? l.type.en : l.type.ar} × {formatPrice(l.unit, 'IQD', lang)}</span>
                    <span>{formatPrice(l.subtotal, 'IQD', lang)}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 17, fontWeight: 700, marginTop: 4 }}>
                  <span>{t.detail_total}</span>
                  <span style={{ color: '#049dc5' }}>{formatPrice(grandTotal, 'IQD', lang)}</span>
                </div>
              </div>

              {(() => {
                const u = packageUrgency(pkg, lang);
                if (!u || !u.label) return null;
                return (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderRadius: 12, padding: '10px 14px', background: u.soldOut ? '#1d2733' : u.hot ? '#fdecef' : '#fff4dc', color: u.soldOut ? '#fff' : u.hot ? '#c02643' : '#8a5a00', fontWeight: 700, fontSize: 14 }}>
                    <span style={{ fontSize: 20 }}>{u.soldOut ? '⛔' : '⏳'}</span>
                    <span>{u.label}{u.soldOut ? (lang === 'en' ? ' — message us to join the waiting list' : ' — راسلنا للانضمام لقائمة الانتظار') : ''}</span>
                  </div>
                );
              })()}
              {staffMode && (
                <div style={{ border: '2px dashed #faab18', background: '#fffaf0', borderRadius: 14, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <b style={{ fontSize: 13.5, color: '#8a5a00' }}>🧾 عرض سعر مخصص (وضع الموظفين)</b>
                  <input style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #ececed', fontFamily: 'inherit' }} placeholder="اسم العميل — مثال: أحمد علي" value={quote.customer} onChange={(e) => setQuote({ ...quote, customer: e.target.value })} />
                  <div style={{ display: 'flex', gap: 6 }}>
                    <select style={{ padding: '8px', borderRadius: 8, border: '1px solid #ececed', fontFamily: 'inherit' }} value={quote.discountType} onChange={(e) => setQuote({ ...quote, discountType: e.target.value })}>
                      <option value="amount">خصم بالدينار</option>
                      <option value="percent">خصم بالنسبة %</option>
                    </select>
                    <input type="number" min="0" style={{ flex: 1, minWidth: 0, padding: '8px 10px', borderRadius: 8, border: '1px solid #ececed', fontFamily: 'inherit' }} placeholder={quote.discountType === 'percent' ? 'مثال 10' : 'مثال 100000'} value={quote.discount} onChange={(e) => setQuote({ ...quote, discount: e.target.value })} />
                  </div>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: '#7b8087' }}>العرض صالح حتى (اختياري)
                    <input type="date" style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #ececed', fontFamily: 'inherit' }} value={quote.validUntil} onChange={(e) => setQuote({ ...quote, validUntil: e.target.value })} />
                  </label>
                  <textarea style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #ececed', fontFamily: 'inherit', minHeight: 56 }} placeholder="ملاحظة خاصة للعميل (اختياري)" value={quote.note} onChange={(e) => setQuote({ ...quote, note: e.target.value })} />
                  {quoteDiscount() > 0 && (
                    <span style={{ fontSize: 13 }}>الإجمالي بعد الخصم: <b data-no-i18n="">{formatPrice(grandTotal - quoteDiscount(), 'IQD', lang)}</b> <s data-no-i18n="" style={{ color: '#7b8087' }}>{formatPrice(grandTotal, 'IQD', lang)}</s></span>
                  )}
                  <span style={{ fontSize: 11.5, color: '#7b8087' }}>يظهر اسم العميل والخصم في ملف PDF فقط — لا يراه أحد غيرك على الموقع.</span>
                </div>
              )}
              {APPLY_FLOW_ENABLED ? (
                <button type="button" onClick={goBook} className="qa-btn qa-cyan" style={{ textAlign: 'center' }}>{t.detail_cta}</button>
              ) : (
                <WhatsAppButton
                  label={lang === 'en' ? 'Contact us on WhatsApp to book' : 'تواصل معنا على واتساب للحجز'}
                  getMessage={() => {
                    const h = hotels[hotelIdx];
                    const f = flights[flightIdx];
                    const en = lang === 'en';
                    return packageMessage({
                      title: nm(pkg.title_ar, pkg.title_en),
                      dest: nm(pkg.dest_ar, pkg.dest_en),
                      nights: nm(pkg.nights_ar, pkg.nights_en),
                      hotel: h ? nm(h.nameAr, h.nameEn) + ((h.notesAr || h.notesEn) ? ' (' + nm(h.notesAr, h.notesEn) + ')' : '') : '',
                      flight: f ? nm(f.nameAr, f.nameEn) : '',
                      travellers: travellerSummary(en),
                      date: tripDate,
                      url: window.location.href,
                    }, lang);
                  }}
                />
              )}

              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12.5, fontWeight: 700, color: '#3d4650' }}>
                {lang === 'en' ? 'Travel date (optional — adds dates to the PDF)' : 'تاريخ السفر (اختياري — يضيف التواريخ إلى ملف PDF)'}
                <input
                  type="date"
                  value={tripDate}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setTripDate(e.target.value)}
                  style={{ padding: '9px 12px', borderRadius: 10, border: '1px solid #ececed', fontFamily: 'inherit', fontSize: 14 }}
                />
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  style={{ flex: 1, cursor: 'pointer', border: '1px solid #ececed', borderRadius: 999, padding: '10px 14px', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', background: '#fff', color: '#036f8c', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                >
                  <Icon name="file-text" size={15} />
                  {t.pdf_btn}
                </button>
                <button
                  type="button"
                  onClick={handleCopy}
                  style={{ flex: 1, cursor: 'pointer', border: '1px solid #bfe9f6', borderRadius: 999, padding: '10px 14px', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', background: '#eaf8fd', color: '#036f8c', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                >
                  <Icon name="copy" size={15} />
                  {t.copy_btn}
                </button>
              </div>
              {toast && (
                <span style={{ fontSize: 12.5, fontWeight: 700, color: '#036f8c', background: '#eaf8fd', border: '1px solid #bfe9f6', borderRadius: 8, padding: '6px 10px', textAlign: 'center' }}>{toast}</span>
              )}

              <span style={{ fontSize: 12, color: '#7b8087', textAlign: 'center' }}>{t.detail_note}</span>
              {(() => {
                const cs = Array.isArray(pkg.countries) ? pkg.countries : [];
                const iso = cs[0] ? String(cs[0]).toLowerCase() : null;
                const tz = destinationTz(iso, cs.length === 1 ? nm(pkg.dest_ar, pkg.dest_en) + ' ' + (hotels[hotelIdx]?.location || '') : '');
                if (!tz || iso === 'iq') return null;
                const g = COUNTRY_GEO[iso];
                const place = cs.length === 1 ? nm(pkg.dest_ar, pkg.dest_en) : g ? (lang === 'en' ? g[4] : g[3]) : nm(pkg.dest_ar, pkg.dest_en);
                const f = flights[flightIdx];
                return <WorldClocks tz={tz} place={place} lang={lang} compact flight={f ? { arrive: f.outArriveTime, depart: f.retDepartTime } : null} />;
              })()}
            </div>

            {/* Main content */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ position: 'relative', minHeight: 200, borderRadius: 20, overflow: 'hidden', background: pkg.image_url ? `url(${pkg.image_url}) center/cover` : 'linear-gradient(135deg,#34bbe1,#049dc5)', display: 'flex', alignItems: 'flex-end', padding: 24 }}>
                {pkg.image_url && <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(1,42,55,.6), transparent 60%)' }} />}
                {(pkg.badge_ar || pkg.badge_en) && (
                  <span style={{ position: 'absolute', top: 20, insetInlineStart: 20, padding: '4px 14px', borderRadius: 999, background: '#faab18', color: '#012a37', fontSize: 12.5, fontWeight: 700, zIndex: 2 }}>
                    {nm(pkg.badge_ar, pkg.badge_en)}
                  </span>
                )}
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: '.06em', color: 'rgba(255,255,255,.85)' }}>{catLabel(pkg.cat, lang).toUpperCase()}</span>
                  <h1 style={{ margin: '4px 0 0', fontSize: 28, color: '#fff' }}>{nm(pkg.title_ar, pkg.title_en)}</h1>
                  <span style={{ fontSize: 14.5, color: 'rgba(255,255,255,.9)' }}>{nm(pkg.dest_ar, pkg.dest_en)} · {nm(pkg.nights_ar, pkg.nights_en)}</span>
                </div>
              </div>

              <div className="qa-card">
                <h4 style={{ margin: '0 0 14px' }}>{t.overview_title}</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12 }}>
                  {[
                    [lang === 'en' ? 'Destination' : 'الوجهة', nm(pkg.dest_ar, pkg.dest_en)],
                    [lang === 'en' ? 'Duration' : 'المدة', durationLabel(pkg, lang) || nm(pkg.nights_ar, pkg.nights_en)],
                    [lang === 'en' ? 'Departures' : 'المغادرة', nm(pkg.departs_ar, pkg.departs_en)],
                    [t.detail_base, formatPrice(Number(pkg.price) || 0, 'IQD', lang)],
                  ].map(([label, value]) => (
                    <div key={label} style={{ border: '1px solid #ececed', borderRadius: 10, padding: '12px 14px' }}>
                      <div style={{ fontSize: 12, color: '#7b8087' }}>{label}</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#1d2733' }}>{value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {generalNotes.length > 0 && (
                <div className="qa-card" style={{ borderInlineStart: '4px solid #faab18', background: '#fffaf0' }}>
                  <h4 style={{ margin: '0 0 10px' }}>📝 {lang === 'en' ? 'Important notes' : 'ملاحظات مهمة'}</h4>
                  <ul style={{ margin: 0, paddingInlineStart: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {generalNotes.map((l, i) => <li key={i} style={{ fontSize: 14.5, color: '#3d4650', lineHeight: 1.7 }}>{l}</li>)}
                  </ul>
                </div>
              )}

              {(includes.length > 0 || excludes.length > 0) && (
                <div className="qa-card">
                  <h4 style={{ margin: '0 0 14px' }}>{lang === 'en' ? 'What the price covers' : 'ماذا يشمل السعر'}</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 14 }}>
                    {includes.length > 0 && (
                      <div style={{ background: '#eefaf3', border: '1px solid #cdebd9', borderRadius: 12, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <span style={{ fontWeight: 700, color: '#1a7f47' }}>{lang === 'en' ? 'Price includes' : 'السعر يشمل'}</span>
                        {includes.map((i, idx) => (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Icon name="check" size={16} style={{ color: '#1a7f47', flex: 'none' }} />
                            <span style={{ fontSize: 14.5, color: '#1d2733' }}>{i}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {excludes.length > 0 && (
                      <div style={{ background: '#fdf1f3', border: '1px solid #f4d3da', borderRadius: 12, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <span style={{ fontWeight: 700, color: '#c02643' }}>{lang === 'en' ? 'Not included' : 'السعر لا يشمل'}</span>
                        {excludes.map((i, idx) => (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ color: '#c02643', fontWeight: 700, width: 16, textAlign: 'center', flex: 'none' }}>✕</span>
                            <span style={{ fontSize: 14.5, color: '#1d2733' }}>{i}</span>
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
                      <div key={idx} style={{ borderInlineStart: '3px solid #049dc5', paddingInlineStart: 14 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: '#1d2733' }}>{nm(d.titleAr, d.titleEn)}</div>
                        <div style={{ fontSize: 13.5, color: '#7b8087', lineHeight: 1.6, marginTop: 2 }}>{nm(d.descAr, d.descEn)}</div>
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
                      <div key={idx} style={optStyle(hotelIdx === idx)} onClick={() => setHotelIdx(idx)}>
                        <input type="radio" checked={hotelIdx === idx} onChange={() => setHotelIdx(idx)} style={{ flex: 'none' }} />
                        {h.imageUrl ? (
                          <img src={h.imageUrl} alt="" style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', flex: 'none' }} />
                        ) : null}
                        <span style={{ flex: 1, fontSize: 14.5, color: '#1d2733' }}>
                          {nm(h.nameAr, h.nameEn)}
                          {(h.notesAr || h.notesEn) && <span style={{ display: 'block', fontSize: 12.5, color: '#1a7f47', fontWeight: 600, marginTop: 2 }}>🍽 {nm(h.notesAr, h.notesEn)}</span>}
                        </span>
                        <span style={{ fontSize: 13.5, fontWeight: 700, color: (h.extras?.adult ?? h.diff) ? '#049dc5' : '#7b8087' }}>{(h.extras?.adult ?? h.diff) ? formatSignedPrice(h.extras?.adult ?? h.diff, 'IQD', lang) : (lang === 'en' ? 'Included' : 'مشمول')}</span>
                      </div>
                    ))}
                  </div>

                  {hotels[hotelIdx]?.locationUrl ? (
                    <a href={hotels[hotelIdx].locationUrl} target="_blank" rel="noopener noreferrer" style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13.5, fontWeight: 700, color: '#049dc5', textDecoration: 'none' }}>
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
                          style={{ width: 130, height: 96, borderRadius: 12, objectFit: 'cover', flex: 'none', border: '1px solid #ececed' }}
                        />
                      ))}
                    </div>
                  ) : null}

                  {selectedHotelCoords ? (
                    <div style={{ marginTop: 16, borderRadius: 16, overflow: 'hidden', border: '1px solid #ececed' }}>
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
                        <span style={{ fontSize: 12.5, color: '#7b8087', display: 'flex', alignItems: 'center', gap: 5 }}>
                          <Icon name="map-pin" size={13} style={{ color: '#049dc5' }} />
                          {nm(hotels[hotelIdx]?.nameAr, hotels[hotelIdx]?.nameEn)}
                        </span>
                        <a
                          href={`https://www.openstreetmap.org/?mlat=${selectedHotelCoords.lat}&mlon=${selectedHotelCoords.lng}#map=16/${selectedHotelCoords.lat}/${selectedHotelCoords.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ fontSize: 12.5, fontWeight: 700, color: '#036f8c', textDecoration: 'none' }}
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
                        <span style={{ flex: 1, fontSize: 14.5, color: '#1d2733' }}>{nm(f.nameAr, f.nameEn)}</span>
                        <span style={{ fontSize: 13.5, fontWeight: 700, color: f.diff ? '#049dc5' : '#7b8087' }}>{f.diff ? formatSignedPrice(f.diff, 'IQD', lang) : (lang === 'en' ? 'Included' : 'مشمول')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
