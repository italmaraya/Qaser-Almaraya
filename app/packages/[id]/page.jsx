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
import { buildPackageVoucherHtml } from '../../../lib/packagePdf';

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
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [toast, setToast] = useState('');
  const [tripDate, setTripDate] = useState('');

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

  const hotelDiff = hotels[hotelIdx]?.diff || 0;
  const flightDiff = flights[flightIdx]?.diff || 0;
  const selectedHotelCoords = useMemo(() => {
    const h = hotels[hotelIdx];
    if (!h || h.lat === undefined || h.lat === '' || h.lng === undefined || h.lng === '') return null;
    const lat = Number(h.lat);
    const lng = Number(h.lng);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
    return { lat, lng };
  }, [hotels, hotelIdx]);
  const upgrade = hotelDiff + flightDiff;
  const basePrice = Number(pkg?.price) || 0;
  const baseChildPrice = Number(pkg?.child_price) || 0;
  const totalPerAdult = basePrice + upgrade;
  const totalPerChild = baseChildPrice + upgrade;
  const grandTotal = useMemo(() => adults * totalPerAdult + children * totalPerChild, [adults, children, totalPerAdult, totalPerChild]);

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
    lines.push((en ? 'Price per adult: ' : 'السعر للبالغ: ') + formatPrice(totalPerAdult, 'IQD', lang));
    if (children > 0) lines.push((en ? 'Price per child: ' : 'سعر الطفل: ') + formatPrice(totalPerChild, 'IQD', lang));
    lines.push((en ? 'Travellers: ' : 'عدد المسافرين: ') + adults + (en ? ' adult(s)' : ' بالغ') + (children ? ', ' + children + (en ? ' child(ren)' : ' طفل') : ''));
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

  function handleDownloadPdf() {
    const bodyHtml = buildPackageVoucherHtml({
      pkg,
      hotel: hotels[hotelIdx],
      flight: flights[flightIdx],
      days,
      includes,
      excludes,
      adults,
      children,
      perAdult: totalPerAdult,
      perChild: totalPerChild,
      grandTotal,
      fmtPrice: (n) => formatPrice(n, 'IQD', lang),
      lang,
      startDate: tripDate,
    });
    printDoc(nm(pkg.title_ar, pkg.title_en) + ' — ' + nm(pkg.dest_ar, pkg.dest_en), bodyHtml, lang);
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
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#7b8087' }}>{t.detail_base}</span><span>{formatPrice(basePrice, 'IQD', lang)}</span></div>
                {upgrade !== 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#7b8087' }}>{t.detail_upgrade}</span><span>{formatSignedPrice(upgrade, 'IQD', lang)}</span></div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}><span>{t.detail_total_pp}</span><span style={{ color: '#049dc5' }}>{formatPrice(totalPerAdult, 'IQD', lang)}</span></div>
              </div>

              <div style={{ borderTop: '1px solid #ececed', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 14 }}>{t.detail_adults}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <button type="button" onClick={() => setAdults((a) => Math.max(1, a - 1))} style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid #cacbcc', background: '#fff', cursor: 'pointer' }}>−</button>
                    <span style={{ minWidth: 18, textAlign: 'center' }}>{adults}</span>
                    <button type="button" onClick={() => setAdults((a) => a + 1)} style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid #cacbcc', background: '#fff', cursor: 'pointer' }}>+</button>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 14 }}>{t.detail_children}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <button type="button" onClick={() => setChildren((c) => Math.max(0, c - 1))} style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid #cacbcc', background: '#fff', cursor: 'pointer' }}>−</button>
                    <span style={{ minWidth: 18, textAlign: 'center' }}>{children}</span>
                    <button type="button" onClick={() => setChildren((c) => c + 1)} style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid #cacbcc', background: '#fff', cursor: 'pointer' }}>+</button>
                  </div>
                </div>
                {children > 0 && <div style={{ fontSize: 12.5, color: '#7b8087' }}>{t.detail_child_price}: {formatPrice(totalPerChild, 'IQD', lang)}</div>}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #ececed', paddingTop: 14, fontSize: 17, fontWeight: 700 }}>
                <span>{t.detail_total}</span>
                <span style={{ color: '#049dc5' }}>{formatPrice(grandTotal, 'IQD', lang)}</span>
              </div>

              <button type="button" onClick={goBook} className="qa-btn qa-cyan" style={{ textAlign: 'center' }}>{t.detail_cta}</button>

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
                    [lang === 'en' ? 'Duration' : 'المدة', nm(pkg.nights_ar, pkg.nights_en)],
                    [lang === 'en' ? 'Departures' : 'المغادرة', nm(pkg.departs_ar, pkg.departs_en)],
                    [t.detail_base, formatPrice(basePrice, 'IQD', lang)],
                  ].map(([label, value]) => (
                    <div key={label} style={{ border: '1px solid #ececed', borderRadius: 10, padding: '12px 14px' }}>
                      <div style={{ fontSize: 12, color: '#7b8087' }}>{label}</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#1d2733' }}>{value}</div>
                    </div>
                  ))}
                </div>
              </div>

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
                        <span style={{ flex: 1, fontSize: 14.5, color: '#1d2733' }}>{nm(h.nameAr, h.nameEn)}</span>
                        <span style={{ fontSize: 13.5, fontWeight: 700, color: h.diff ? '#049dc5' : '#7b8087' }}>{h.diff ? formatSignedPrice(h.diff, 'IQD', lang) : (lang === 'en' ? 'Included' : 'مشمول')}</span>
                      </div>
                    ))}
                  </div>

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
