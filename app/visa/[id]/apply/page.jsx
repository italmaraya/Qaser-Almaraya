'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import PaymentMethods from '../../../../components/PaymentMethods';
import SiteHeader from '../../../../components/SiteHeader';
import SiteFooter from '../../../../components/SiteFooter';
import MascotLoader from '../../../../components/MascotLoader';
import { useLangToggle } from '../../../../lib/i18n';
import { useCurrencyToggle, formatPrice } from '../../../../lib/currency';

const inputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid #ececed',
  fontSize: 15,
  fontFamily: 'inherit',
};

function sanitizeName(value) {
  // Strip Latin and Arabic-Indic digits, keep letters/spaces/hyphens only
  return value.replace(/[0-9\u0660-\u0669]/g, '');
}
const labelStyle = { display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14, fontWeight: 600, color: '#3d4650' };
const btnStyle = (variant) => ({
  cursor: 'pointer',
  border: variant === 'ghost' ? '1px solid #ececed' : 'none',
  borderRadius: 999,
  padding: '12px 26px',
  fontSize: 15,
  fontWeight: 700,
  fontFamily: 'inherit',
  background: variant === 'primary' ? '#049dc5' : '#fff',
  color: variant === 'primary' ? '#fff' : '#3d4650',
});

const STEPS = [
  { id: 1, label: 'اختيار التأشيرة' },
  { id: 2, label: 'المسافرون والمستندات' },
  { id: 3, label: 'الدفع' },
  { id: 4, label: 'المتابعة' },
];

function applicableDocs(documents, travelerType) {
  return documents.filter((d) => {
    const audience = d.audience || 'everyone';
    return audience === 'everyone' || (audience === 'adults' && travelerType === 'adult') || (audience === 'children' && travelerType === 'child');
  });
}

function isVisible(doc, answers) {
  if (!doc.condition_field_id) return true;
  const conditionAnswer = answers[doc.condition_field_id];
  return conditionAnswer === doc.condition_value;
}

function TravelerForm({ index, travelerType, documents, onChange, onProgress }) {
  const [fullName, setFullName] = useState('');
  const [answers, setAnswers] = useState({});
  const [files, setFiles] = useState({});
  const [repeated, setRepeated] = useState({});
  const [uploading, setUploading] = useState({});

  const docs = applicableDocs(documents, travelerType);
  const visibleDocs = docs.filter((d) => isVisible(d, answers));
  const requiredDocs = visibleDocs.filter((d) => d.required);
  const completedCount = requiredDocs.filter((d) => {
    if (d.kind === 'file' || d.kind === 'photo') return !!files[d.id];
    if (d.kind === 'repeated') return (repeated[d.id] || []).some((v) => v);
    return !!answers[d.id];
  }).length;
  const totalRequired = requiredDocs.length + 1; // +1 for full name
  const doneRequired = completedCount + (fullName.trim() ? 1 : 0);

  useEffect(() => {
    onChange(index, buildPayload());
    if (onProgress) onProgress(index, doneRequired, totalRequired);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullName, answers, files, repeated]);

  function buildPayload() {
    const out = [];
    for (const d of docs) {
      if (!isVisible(d, answers)) continue;
      if (d.kind === 'file' || d.kind === 'photo') {
        if (files[d.id]) out.push({ visa_document_id: d.id, file_url: files[d.id] });
      } else if (d.kind === 'repeated') {
        (repeated[d.id] || []).forEach((val, i) => {
          if (val) out.push({ visa_document_id: d.id, value_text: val, repeat_index: i });
        });
      } else if (answers[d.id]) {
        out.push({ visa_document_id: d.id, value_text: answers[d.id] });
      }
    }
    return { traveler_type: travelerType, full_name: fullName, answers: out };
  }

  async function handleFile(doc, file) {
    if (!file) return;
    setUploading((u) => ({ ...u, [doc.id]: true }));
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/visa/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (res.ok) setFiles((f) => ({ ...f, [doc.id]: data.url }));
    } finally {
      setUploading((u) => ({ ...u, [doc.id]: false }));
    }
  }

  return (
    <div className="qa-card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#036f8c', background: '#eaf8fd', borderRadius: 999, padding: '3px 12px' }}>
            {travelerType === 'adult' ? 'بالغ' : 'طفل'}
          </span>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#1d2733' }}>مسافر {index + 1}</span>
        </span>
        <span style={{ fontSize: 13, color: '#7b8087' }}>{doneRequired}/{totalRequired} مكتمل</span>
      </div>
      <label style={labelStyle}>
        الاسم الكامل كما في الجواز *
        <input style={inputStyle} value={fullName} onChange={(e) => setFullName(sanitizeName(e.target.value))} />
      </label>

      {docs.map((d) => {
        if (!isVisible(d, answers)) return null;
        return (
          <div key={d.id} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#3d4650' }}>{d.name_ar}</span>
              {d.required && (
                <span style={{ fontSize: 11, fontWeight: 700, color: '#a06a00', background: '#fef3dc', borderRadius: 999, padding: '2px 10px' }}>مطلوب</span>
              )}
            </div>

            {(d.kind === 'file' || d.kind === 'photo') && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <label style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 999, border: '1px solid #036f8c', color: '#036f8c', fontSize: 13.5, fontWeight: 600 }}>
                  رفع
                  <input type="file" accept={d.kind === 'photo' ? 'image/*' : undefined} onChange={(e) => handleFile(d, e.target.files[0])} style={{ display: 'none' }} />
                </label>
                {uploading[d.id] && <span style={{ fontSize: 13, color: '#7b8087' }}>...جارٍ الرفع</span>}
                {files[d.id] && <span style={{ fontSize: 13, color: '#049dc5' }}>✓ تم الرفع</span>}
              </div>
            )}

            {d.kind === 'text' && <input style={inputStyle} value={answers[d.id] || ''} onChange={(e) => setAnswers({ ...answers, [d.id]: e.target.value })} />}

            {d.kind === 'number_date' && (
              <input style={inputStyle} type="text" placeholder="رقم أو تاريخ" value={answers[d.id] || ''} onChange={(e) => setAnswers({ ...answers, [d.id]: e.target.value })} />
            )}

            {d.kind === 'yesno' && (
              <div style={{ display: 'flex', gap: 8 }}>
                {['no', 'yes'].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAnswers({ ...answers, [d.id]: val })}
                    style={{
                      cursor: 'pointer',
                      flex: 1,
                      padding: '10px 0',
                      borderRadius: 8,
                      border: '1px solid ' + (answers[d.id] === val ? '#049dc5' : '#ececed'),
                      background: answers[d.id] === val ? '#049dc5' : '#fff',
                      color: answers[d.id] === val ? '#fff' : '#3d4650',
                      fontFamily: 'inherit',
                      fontWeight: 600,
                    }}
                  >
                    {val === 'yes' ? 'نعم' : 'لا'}
                  </button>
                ))}
              </div>
            )}

            {d.kind === 'choice' && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {(d.choices || []).map((c, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setAnswers({ ...answers, [d.id]: c })}
                    style={{
                      cursor: 'pointer',
                      padding: '10px 18px',
                      borderRadius: 999,
                      border: '1px solid ' + (answers[d.id] === c ? '#049dc5' : '#ececed'),
                      background: answers[d.id] === c ? '#049dc5' : '#fff',
                      color: answers[d.id] === c ? '#fff' : '#3d4650',
                      fontFamily: 'inherit',
                      fontSize: 14,
                      fontWeight: 600,
                    }}
                  >
                    {c}
                  </button>
                ))}
                {(!d.choices || d.choices.length === 0) && (
                  <span style={{ fontSize: 12.5, color: '#7b8087' }}>لم يحدد الخيارات بعد</span>
                )}
              </div>
            )}

            {d.kind === 'repeated' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {(repeated[d.id] || ['']).map((val, i) => (
                  <input
                    key={i}
                    style={inputStyle}
                    value={val}
                    onChange={(e) => {
                      const list = [...(repeated[d.id] || [''])];
                      list[i] = e.target.value;
                      setRepeated({ ...repeated, [d.id]: list });
                    }}
                  />
                ))}
                <button
                  type="button"
                  style={{ ...btnStyle('ghost'), padding: '6px 14px', fontSize: 13, alignSelf: 'flex-start' }}
                  onClick={() => setRepeated({ ...repeated, [d.id]: [...(repeated[d.id] || ['']), ''] })}
                >
                  + إضافة
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function VisaApplyPage() {
  const { lang } = useLangToggle();
  const { currency } = useCurrencyToggle();
  const nm = (ar, en) => (lang === 'en' && en ? en : ar);
  const { id } = useParams();
  const [card, setCard] = useState(null);
  const [error, setError] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [adultCount, setAdultCount] = useState(1);
  const [childCount, setChildCount] = useState(0);
  const [travelerPayloads, setTravelerPayloads] = useState({});
  const [travelerProgress, setTravelerProgress] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [applicationId, setApplicationId] = useState(null);
  const [step, setStep] = useState('form'); // 'form' | 'payment'

  useEffect(() => {
    fetch(`/api/visa/cards/${id}`)
      .then((r) => r.json())
      .then(setCard)
      .catch(() => setError('تعذّر تحميل بيانات التأشيرة'));
  }, [id]);

  function updateTraveler(key, payload) {
    setTravelerPayloads((prev) => ({ ...prev, [key]: payload }));
  }
  function updateProgress(key, done, total) {
    setTravelerProgress((prev) => ({ ...prev, [key]: { done, total } }));
  }

  function goToPayment() {
    setError('');
    if (!customerName || !customerPhone) {
      setError('يرجى إدخال الاسم ورقم الهاتف');
      return;
    }
    if (customerPhone.length < 7) {
      setError('يرجى إدخال رقم هاتف صحيح');
      return;
    }
    if (customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
      setError('يرجى إدخال بريد إلكتروني صحيح');
      return;
    }
    if (adultCount + childCount < 1) {
      setError('يجب إضافة مسافر واحد على الأقل');
      return;
    }
    const incompleteTraveler = Object.values(travelerProgress).some((p) => p.done < p.total);
    const progressCount = Object.keys(travelerProgress).length;
    if (incompleteTraveler || progressCount < travelerList.length) {
      setError('يرجى إكمال جميع بيانات ومستندات المسافرين المطلوبة قبل المتابعة إلى الدفع');
      return;
    }
    setStep('payment');
  }

  async function submit(paymentInfo) {
    setError('');
    const travelers = Object.values(travelerPayloads);
    setSubmitting(true);
    try {
      const res = await fetch('/api/visa/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visa_card_id: card.id,
          customer_name: customerName,
          customer_phone: '+964' + customerPhone,
          customer_email: customerEmail,
          payment_method: paymentInfo?.method || paymentMethod,
          travelers,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'حدث خطأ أثناء إرسال الطلب — يرجى المحاولة مرة أخرى أو التواصل معنا على الرقم 6393');
      }
      const data = await res.json();
      setApplicationId(data.application_id);
      setSubmitted(true);
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setSubmitting(false);
    }
  }

  if (error && !card) {
    return (
      <div dir="rtl" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <SiteHeader active="التأشيرات" />
        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
          <p style={{ color: '#d2324f', background: '#fdecef', border: '1px solid #f7c3cc', borderRadius: 10, padding: '14px 20px' }}>{error}</p>
        </main>
        <SiteFooter />
      </div>
    );
  }
  if (!card) {
    return (
      <div dir="rtl" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <SiteHeader active="التأشيرات" />
        <main style={{ flex: 1 }} />
        <SiteFooter />
        <MascotLoader assetBase="/assets" />
      </div>
    );
  }

  const travelerList = [
    ...Array.from({ length: adultCount }, (_, i) => ({ key: `adult-${i}`, type: 'adult', index: i })),
    ...Array.from({ length: childCount }, (_, i) => ({ key: `child-${i}`, type: 'child', index: i })),
  ];

  const totalDone = Object.values(travelerProgress).reduce((s, p) => s + p.done, 0);
  const totalNeeded = Object.values(travelerProgress).reduce((s, p) => s + p.total, 0) || travelerList.length;
  const allTravelersComplete = travelerList.length > 0 && travelerList.every((t) => {
    const p = travelerProgress[t.key];
    return p && p.done >= p.total;
  });
  const canProceedToPayment = !!customerName && customerPhone.length >= 7 && allTravelersComplete;
  const activeStep = submitted ? 4 : step === 'payment' ? 3 : 2;
  const estimatedTotal = Number(card.adult_price) * adultCount + Number(card.child_price) * childCount;

  return (
    <div dir="rtl" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <SiteHeader active="التأشيرات" />
      <main style={{ flex: 1 }}>
        <div className="qa-page">
          <section style={{ background: 'linear-gradient(135deg,#34bbe1,#049dc5)', color: '#fff' }}>
            <div className="qa-sec" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Link href={`/visa/${id}`} style={{ fontSize: 13.5, color: 'rgba(255,255,255,.85)', textDecoration: 'none', alignSelf: 'flex-start' }}>← رجوع إلى التأشيرات</Link>
              <div>
                <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.04em', color: 'rgba(255,255,255,.85)' }}>VISA APPLICATION</span>
                <h1 style={{ margin: '4px 0 0', fontSize: 'clamp(24px,2.6vw,32px)', color: '#fff' }}>طلب تأشيرة — {nm(card.country_name_ar, card.country_name_en)}</h1>
                <p style={{ margin: '4px 0 0', fontSize: 14.5, color: 'rgba(255,255,255,.9)' }}>{nm(card.visa_type_name_ar, card.visa_type_name_en)} · إقامة {card.stay_duration || '—'} · الإصدار {card.issuing_time_days || '—'} أيام عمل</p>
              </div>
              <div className="qa-steps-row" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {STEPS.map((s) => (
                  <span
                    key={s.id}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      background: s.id === activeStep ? '#fff' : 'rgba(255,255,255,.16)',
                      color: s.id === activeStep ? '#049dc5' : '#fff',
                      borderRadius: 999,
                      padding: '8px 16px',
                      fontSize: 13.5,
                      fontWeight: 700,
                    }}
                  >
                    <span style={{ width: 20, height: 20, borderRadius: '50%', background: s.id === activeStep ? '#049dc5' : 'rgba(255,255,255,.3)', color: '#fff', fontSize: 11, display: 'grid', placeItems: 'center' }}>{s.id}</span>
                    {s.label}
                  </span>
                ))}
              </div>
            </div>
          </section>

          <section className="qa-sec qa-2col" style={{ display: 'grid', gridTemplateColumns: 'minmax(240px,320px) 1fr', gap: 28, alignItems: 'flex-start' }}>
            <div className="qa-card qa-visa-side" style={{ position: 'sticky', top: 90, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <h4 style={{ margin: 0 }}>ملخص الطلب</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14 }}>
                {adultCount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#7b8087' }}>{adultCount} × بالغ</span>
                    <span>{formatPrice(Number(card.adult_price) * adultCount, currency, lang)}</span>
                  </div>
                )}
                {childCount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#7b8087' }}>{childCount} × طفل</span>
                    <span>{formatPrice(Number(card.child_price) * childCount, currency, lang)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #ececed', paddingTop: 8, fontWeight: 700 }}>
                  <span>الإجمالي</span>
                  <span style={{ color: '#049dc5' }}>{formatPrice(estimatedTotal, currency, lang)}</span>
                </div>
              </div>
              {step === 'form' && (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#7b8087' }}>
                      <span>المستندات المطلوبة</span>
                      <span>{totalDone}/{totalNeeded} مكتمل</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 999, background: '#ececed', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: totalNeeded ? `${Math.min(100, (totalDone / totalNeeded) * 100)}%` : '0%', background: '#049dc5' }} />
                    </div>
                  </div>
                  <button
                    className="qa-btn qa-cyan"
                    onClick={goToPayment}
                    disabled={!canProceedToPayment}
                    style={{ opacity: canProceedToPayment ? 1 : 0.55, cursor: canProceedToPayment ? 'pointer' : 'not-allowed' }}
                  >
                    متابعة إلى الدفع
                  </button>
                </>
              )}
              {step === 'payment' && !submitted && (
                <button style={{ ...btnStyle('ghost'), width: '100%', justifyContent: 'center', display: 'flex' }} onClick={() => setStep('form')}>← الرجوع لتعديل الطلب</button>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {step === 'form' && (
                <>
                  <div className="qa-card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <h4 style={{ margin: 0 }}>بيانات التواصل</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                      <label style={labelStyle}>
                        رقم الهاتف *
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, ...inputStyle, padding: '0 12px' }}>
                          <span dir="ltr" style={{ color: '#7b8087', fontWeight: 700, flex: 'none' }}>+964</span>
                          <input
                            style={{ border: 0, outline: 'none', fontFamily: 'inherit', fontSize: 15, flex: 1, padding: '10px 0', minWidth: 0 }}
                            dir="ltr"
                            inputMode="numeric"
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                            placeholder="7xx xxx xxxx"
                          />
                        </div>
                      </label>
                      <label style={labelStyle}>
                        البريد الإلكتروني (اختياري)
                        <input style={inputStyle} type="email" dir="ltr" pattern="[^\s@]+@[^\s@]+\.[^\s@]+" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="name@example.com" />
                      </label>
                    </div>
                    <label style={labelStyle}>
                      الاسم الكامل *
                      <input style={inputStyle} value={customerName} onChange={(e) => setCustomerName(sanitizeName(e.target.value))} />
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                      <label style={labelStyle}>
                        عدد البالغين
                        <input type="number" min="0" style={inputStyle} value={adultCount} onChange={(e) => setAdultCount(Math.max(0, Number(e.target.value)))} />
                      </label>
                      <label style={labelStyle}>
                        عدد الأطفال
                        <input type="number" min="0" style={inputStyle} value={childCount} onChange={(e) => setChildCount(Math.max(0, Number(e.target.value)))} />
                      </label>
                    </div>
                  </div>

                  {travelerList.map((t) => (
                    <TravelerForm
                      key={t.key}
                      index={t.index}
                      travelerType={t.type}
                      documents={card.documents}
                      onChange={(i, payload) => updateTraveler(t.key, payload)}
                      onProgress={(i, done, total) => updateProgress(t.key, done, total)}
                    />
                  ))}

                  {error && (
                    <p style={{ margin: 0, padding: 12, background: '#fdecef', border: '1px solid #f7c3cc', borderRadius: 10, color: '#d2324f', fontSize: 14 }}>{error}</p>
                  )}
                </>
              )}

              {step === 'payment' && (
                <div className="qa-card">
                  {submitting && <p style={{ margin: 0, color: '#7b8087', fontSize: 14 }}>...جارٍ إرسال طلبك في الخلفية</p>}
                  {error && (
                    <p style={{ margin: '0 0 14px', padding: 12, background: '#fdecef', border: '1px solid #f7c3cc', borderRadius: 10, color: '#d2324f', fontSize: 14 }}>{error}</p>
                  )}
                  <PaymentMethods
                    submitting={submitting}
                    submitted={submitted}
                    orderNo={applicationId ? 'QA-' + String(applicationId).padStart(6, '0') : ''}
                    onConfirm={(info) => {
                      setPaymentMethod(info.method);
                      return submit(info);
                    }}
                  />
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
