'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import PaymentMethods from '../../../components/PaymentMethods';
import SiteHeader from '../../../components/SiteHeader';
import SiteFooter from '../../../components/SiteFooter';
import MascotLoader from '../../../components/MascotLoader';

const inputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid #ececed',
  fontSize: 15,
  fontFamily: 'inherit',
};
const labelStyle = { display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14, fontWeight: 600, color: '#3d4650' };
const cardStyle = {
  background: '#fff',
  border: '1px solid #ececed',
  borderRadius: 14,
  padding: 20,
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
  boxShadow: '0 2px 8px rgba(29,39,51,.06)',
};
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

function applicableDocs(documents, travelerType) {
  return documents.filter((d) => d.audience === 'everyone' || (d.audience === 'adults' && travelerType === 'adult') || (d.audience === 'children' && travelerType === 'child'));
}

function isVisible(doc, answers) {
  if (!doc.condition_field_id) return true;
  const conditionAnswer = answers[doc.condition_field_id];
  return conditionAnswer === doc.condition_value;
}

function TravelerForm({ index, travelerType, documents, onChange }) {
  const [fullName, setFullName] = useState('');
  const [answers, setAnswers] = useState({}); // doc.id -> value_text (or 'yes'/'no', or choice)
  const [files, setFiles] = useState({}); // doc.id -> uploaded URL
  const [repeated, setRepeated] = useState({}); // doc.id -> array of strings
  const [uploading, setUploading] = useState({});

  useEffect(() => {
    onChange(index, buildPayload());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullName, answers, files, repeated]);

  function buildPayload() {
    const docs = applicableDocs(documents, travelerType);
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

  const docs = applicableDocs(documents, travelerType);

  return (
    <div style={cardStyle}>
      <h4 style={{ margin: 0, color: '#1d2733' }}>{travelerType === 'adult' ? `بالغ ${index + 1}` : `طفل ${index + 1}`}</h4>
      <label style={labelStyle}>
        الاسم الكامل
        <input style={inputStyle} value={fullName} onChange={(e) => setFullName(e.target.value)} />
      </label>

      {docs.map((d) => {
        if (!isVisible(d, answers)) return null;
        return (
          <div key={d.id} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#3d4650' }}>
              {d.name_ar} {d.required && <span style={{ color: '#d2324f' }}>*</span>}
            </span>

            {(d.kind === 'file' || d.kind === 'photo') && (
              <div>
                <input type="file" accept={d.kind === 'photo' ? 'image/*' : undefined} onChange={(e) => handleFile(d, e.target.files[0])} />
                {uploading[d.id] && <span style={{ fontSize: 13, color: '#7b8087' }}> ...جارٍ الرفع</span>}
                {files[d.id] && <span style={{ fontSize: 13, color: '#049dc5' }}> ✓ تم الرفع</span>}
              </div>
            )}

            {d.kind === 'text' && <input style={inputStyle} value={answers[d.id] || ''} onChange={(e) => setAnswers({ ...answers, [d.id]: e.target.value })} />}

            {d.kind === 'number_date' && (
              <input style={inputStyle} type="text" placeholder="رقم أو تاريخ" value={answers[d.id] || ''} onChange={(e) => setAnswers({ ...answers, [d.id]: e.target.value })} />
            )}

            {d.kind === 'yesno' && (
              <select style={inputStyle} value={answers[d.id] || ''} onChange={(e) => setAnswers({ ...answers, [d.id]: e.target.value })}>
                <option value="">اختر</option>
                <option value="yes">نعم</option>
                <option value="no">لا</option>
              </select>
            )}

            {d.kind === 'choice' && (
              <select style={inputStyle} value={answers[d.id] || ''} onChange={(e) => setAnswers({ ...answers, [d.id]: e.target.value })}>
                <option value="">اختر</option>
                {(d.choices || []).map((c, i) => (
                  <option key={i} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            )}

            {d.kind === 'repeated' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {(repeated[d.id] || ['']).map((val, i) => (
                  <div key={i} style={{ display: 'flex', gap: 6 }}>
                    <input
                      style={inputStyle}
                      value={val}
                      onChange={(e) => {
                        const list = [...(repeated[d.id] || [''])];
                        list[i] = e.target.value;
                        setRepeated({ ...repeated, [d.id]: list });
                      }}
                    />
                  </div>
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

  function goToPayment() {
    setError('');
    if (!customerName || !customerPhone) {
      setError('يرجى إدخال الاسم ورقم الهاتف');
      return;
    }
    if (adultCount + childCount < 1) {
      setError('يجب إضافة مسافر واحد على الأقل');
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
          customer_phone: customerPhone,
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
      throw e; // re-throw so PaymentMethods knows not to show the success screen
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

  return (
    <div dir="rtl" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <SiteHeader active="التأشيرات" />
      <main style={{ flex: 1 }}>
        <div className="qa-page" style={{ maxWidth: 760, margin: '0 auto', padding: '40px 20px 60px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#faab18' }}>{card.visa_type_name_ar}</span>
            <h1 style={{ margin: '4px 0 0', fontSize: 'clamp(24px,2.6vw,32px)' }}>
              التقديم على تأشيرة {card.country_name_ar}
            </h1>
          </div>

        <div style={cardStyle}>
          <h4 style={{ margin: 0 }}>بيانات التواصل</h4>
          <label style={labelStyle}>
            الاسم الكامل
            <input style={inputStyle} value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
          </label>
          <label style={labelStyle}>
            رقم الهاتف
            <input style={inputStyle} dir="ltr" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
          </label>
          <label style={labelStyle}>
            البريد الإلكتروني (اختياري)
            <input style={inputStyle} dir="ltr" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} />
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
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

        {step === 'form' && (
          <>
            {travelerList.map((t) => (
              <TravelerForm key={t.key} index={t.index} travelerType={t.type} documents={card.documents} onChange={(i, payload) => updateTraveler(t.key, payload)} />
            ))}

            {error && (
              <p style={{ margin: 0, padding: 12, background: '#fdecef', border: '1px solid #f7c3cc', borderRadius: 10, color: '#d2324f', fontSize: 14 }}>{error}</p>
            )}

            <button style={btnStyle('primary')} onClick={goToPayment}>
              متابعة إلى الدفع
            </button>
          </>
        )}

        {step === 'payment' && (
          <div style={cardStyle}>
            {submitting && <p style={{ margin: 0, color: '#7b8087', fontSize: 14 }}>...جارٍ إرسال طلبك في الخلفية</p>}
            {error && (
              <p style={{ margin: 0, padding: 12, background: '#fdecef', border: '1px solid #f7c3cc', borderRadius: 10, color: '#d2324f', fontSize: 14 }}>{error}</p>
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
            <button style={{ ...btnStyle('ghost'), alignSelf: 'flex-start' }} onClick={() => setStep('form')}>
              ← الرجوع لتعديل الطلب
            </button>
          </div>
        )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
