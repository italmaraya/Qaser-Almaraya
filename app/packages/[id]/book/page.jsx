'use client';
import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import SiteHeader from '../../../../components/SiteHeader';
import SiteFooter from '../../../../components/SiteFooter';
import MascotLoader from '../../../../components/MascotLoader';
import PaymentMethods from '../../../../components/PaymentMethods';
import { useLangToggle } from '../../../../lib/i18n';
import { T, money, NATIONALITIES } from '../../../../lib/packagesData';

const inputStyle = {
  width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 8,
  border: '1px solid #ececed', fontSize: 15, fontFamily: 'inherit',
};
const labelStyle = { display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14, fontWeight: 600, color: '#3d4650' };

function sanitizeName(value) {
  return value.replace(/[0-9\u0660-\u0669]/g, '');
}

export default function PackageBookingPage() {
  const { id } = useParams();
  const router = useRouter();
  const search = useSearchParams();
  const { lang } = useLangToggle();
  const t = T[lang] || T.ar;
  const nm = (ar, en) => (lang === 'en' && en ? en : ar);

  const hotelIdx = Number(search.get('hotel') || 0);
  const flightIdx = Number(search.get('flight') || 0);
  const adultCount = Math.max(1, Number(search.get('adults') || 1));
  const childCount = Math.max(0, Number(search.get('children') || 0));

  const [pkg, setPkg] = useState(null);
  const [error, setError] = useState('');
  const [travelers, setTravelers] = useState([]);
  const [nationality, setNationality] = useState('iq');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [orderNo, setOrderNo] = useState('');
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    fetch(`/api/packages/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError('تعذّر تحميل بيانات الباقة');
        else setPkg(data);
      })
      .catch(() => setError('تعذّر تحميل بيانات الباقة'));
  }, [id]);

  useEffect(() => {
    const initial = [];
    for (let i = 0; i < adultCount; i++) initial.push({ traveler_type: 'adult', full_name: '', passport_number: '' });
    for (let i = 0; i < childCount; i++) initial.push({ traveler_type: 'child', full_name: '', passport_number: '' });
    setTravelers(initial);
  }, [adultCount, childCount]);

  function updateTraveler(idx, field, value) {
    setTravelers((list) => {
      const next = [...list];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  }

  const hotel = pkg?.hotels?.[hotelIdx];
  const flight = pkg?.flights?.[flightIdx];
  const upgrade = (hotel?.diff || 0) + (flight?.diff || 0);
  const basePrice = Number(pkg?.price) || 0;
  const baseChildPrice = Number(pkg?.child_price) || 0;
  const grandTotal = useMemo(
    () => adultCount * (basePrice + upgrade) + childCount * (baseChildPrice + upgrade),
    [adultCount, childCount, basePrice, baseChildPrice, upgrade]
  );

  const travelersValid = travelers.length > 0 && travelers.every((tr) => tr.full_name.trim().length > 1);
  const contactValid = phone.trim().length >= 7;
  const canSubmit = travelersValid && contactValid;

  async function handleConfirm({ method, receipt_url }) {
    setSubmitting(true);
    setSubmitError('');
    try {
      const res = await fetch('/api/packages/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          package_id: id,
          hotel_choice: hotel ? nm(hotel.nameAr, hotel.nameEn) : '',
          hotel_diff: hotel?.diff || 0,
          flight_choice: flight ? nm(flight.nameAr, flight.nameEn) : '',
          flight_diff: flight?.diff || 0,
          nationality,
          customer_phone: phone,
          customer_email: email,
          payment_method: method,
          payment_proof_url: receipt_url,
          travelers,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'تعذّر إرسال الحجز');
      setOrderNo('QP-' + String(data.booking_id).padStart(6, '0'));
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err.message || 'تعذّر إرسال الحجز — حاول مرة أخرى');
    } finally {
      setSubmitting(false);
    }
  }

  if (error) {
    return (
      <div dir="rtl" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
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
      <div dir="rtl" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <SiteHeader active="المجموعات والباقات" />
        <main style={{ flex: 1 }} />
        <SiteFooter />
        <MascotLoader assetBase="/assets" />
      </div>
    );
  }

  return (
    <div dir="rtl" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <SiteHeader active="المجموعات والباقات" />
      <main style={{ flex: 1 }}>
        <div className="qa-page">
          <div className="qa-sec" style={{ paddingBottom: 0 }}>
            <Link href={`/packages/${id}`} style={{ fontSize: 13.5, fontWeight: 600, color: '#036f8c', textDecoration: 'none' }}>{t.back_to_detail}</Link>
          </div>

          <section className="qa-sec qa-2col" style={{ display: 'grid', gridTemplateColumns: 'minmax(240px,320px) 1fr', gap: 28, alignItems: 'flex-start' }}>
            <div className="qa-card" style={{ position: 'sticky', top: 90, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <h3 style={{ margin: 0, fontSize: 17 }}>{nm(pkg.title_ar, pkg.title_en)}</h3>
              <span style={{ fontSize: 13, color: '#7b8087' }}>{nm(pkg.dest_ar, pkg.dest_en)} · {nm(pkg.nights_ar, pkg.nights_en)}</span>
              {hotel && <div style={{ fontSize: 13.5, borderTop: '1px solid #ececed', paddingTop: 10 }}><b>{t.hotel_title}:</b> {nm(hotel.nameAr, hotel.nameEn)}</div>}
              {flight && <div style={{ fontSize: 13.5 }}><b>{t.flight_title}:</b> {nm(flight.nameAr, flight.nameEn)}</div>}
              <div style={{ fontSize: 13.5 }}>{t.detail_adults}: {adultCount} · {t.detail_children}: {childCount}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #ececed', paddingTop: 10, fontSize: 16, fontWeight: 700 }}>
                <span>{t.detail_total}</span>
                <span style={{ color: '#049dc5' }}>{money(grandTotal, lang)}</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {!submitted ? (
                <>
                  <div className="qa-card">
                    <h4 style={{ margin: '0 0 14px' }}>{t.booking_title}</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {travelers.map((tr, idx) => (
                        <div key={idx} style={{ border: '1px solid #ececed', borderRadius: 12, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#036f8c' }}>{tr.traveler_type === 'adult' ? t.pax_adult : t.pax_child} {idx + 1}</span>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 10 }}>
                            <label style={labelStyle}>
                              {t.pax_name}
                              <input
                                style={inputStyle}
                                value={tr.full_name}
                                onChange={(e) => updateTraveler(idx, 'full_name', sanitizeName(e.target.value))}
                              />
                            </label>
                            <label style={labelStyle}>
                              {t.pax_passport}
                              <input
                                style={inputStyle}
                                value={tr.passport_number}
                                onChange={(e) => updateTraveler(idx, 'passport_number', e.target.value)}
                              />
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="qa-card">
                    <h4 style={{ margin: '0 0 14px' }}>{lang === 'en' ? 'Contact details' : 'بيانات التواصل'}</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12 }}>
                      <label style={labelStyle}>
                        {t.filter_nationality_label}
                        <select style={inputStyle} value={nationality} onChange={(e) => setNationality(e.target.value)}>
                          {NATIONALITIES.map((n) => (
                            <option key={n.id} value={n.id}>{nm(n.ar, n.en)}</option>
                          ))}
                        </select>
                      </label>
                      <label style={labelStyle}>
                        {t.pax_phone}
                        <input style={inputStyle} value={phone} onChange={(e) => setPhone(e.target.value)} />
                      </label>
                      <label style={labelStyle}>
                        {t.pax_email}
                        <input style={inputStyle} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                      </label>
                    </div>
                  </div>

                  {submitError && <p style={{ color: '#d2324f', background: '#fdecef', border: '1px solid #f7c3cc', borderRadius: 10, padding: '12px 16px' }}>{submitError}</p>}

                  {canSubmit ? (
                    <PaymentMethods
                      title={t.payment_title}
                      onConfirm={handleConfirm}
                      submitting={submitting}
                      submitted={submitted}
                      orderNo={orderNo}
                      assetBase="/assets"
                    />
                  ) : (
                    <p style={{ fontSize: 13.5, color: '#7b8087' }}>
                      {lang === 'en' ? 'Fill in every traveller’s name and a phone number to continue to payment.' : 'أكملوا اسم كل مسافر ورقم الهاتف للمتابعة إلى الدفع.'}
                    </p>
                  )}
                </>
              ) : (
                <div className="qa-card" style={{ alignItems: 'center', textAlign: 'center', gap: 14 }}>
                  <h3 style={{ margin: 0, color: '#049dc5' }}>{t.booking_done_title}</h3>
                  <p style={{ margin: 0, color: '#3d4650' }}>{t.booking_done_body}</p>
                  <p style={{ margin: 0, fontWeight: 700 }}>{t.booking_order_no}: {orderNo}</p>
                  <Link href="/packages" className="qa-btn qa-cyan" style={{ textDecoration: 'none' }}>{t.back_to_results}</Link>
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
