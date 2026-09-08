'use client';
import React from 'react';
import Icon from './Icon';

export const QA_PAYMENT_METHODS = [
  { id: 'card', icon: 'credit-card', label: 'ماستر كارد / فيزا', hint: 'تحويل إلى حساب الشركة',
    rows: [['اسم الحساب', 'قصر المرايا للسفر و السياحة'], ['رقم الحساب', '0012 4478 9903 6621'], ['المصرف', 'مصرف بغداد — فرع الكرادة'], ['العملة', 'دينار عراقي / دولار أمريكي']],
    body: 'حوّل المبلغ إلى الحساب أعلاه ثم أرسل صورة الإشعار على واتساب لتأكيد الطلب.' },
  { id: 'zaincash', icon: 'smartphone', label: 'زين كاش', hint: 'محفظة إلكترونية',
    rows: [['اسم المحفظة', 'قصر المرايا للسفر و السياحة'], ['رقم المحفظة', '+964 784 999 9600'], ['الرقم المختصر', '6393']],
    body: 'أرسل المبلغ عبر تطبيق زين كاش إلى الرقم أعلاه، واحتفظ برمز العملية لإرساله إلى موظف الحجز.' },
  { id: 'office', icon: 'building-2', label: 'الدفع في المكتب', hint: 'نقداً — خلال يوم واحد', warn: true,
    rows: [['العنوان', 'بغداد — الكرادة، مقابل حديقة الأمة'], ['أوقات العمل', 'السبت – الخميس · ٩:٠٠ – ١٨:٠٠']],
    body: 'إذا اخترت هذه الطريقة يجب دفع المبلغ خلال يوم واحد من تاريخ الطلب، وإلا سيُرفض طلبك تلقائياً.' }
];

export default function PaymentMethods({ title, note, methods, defaultOpen = 'card', assetBase = '/assets', thankYouSrc, onConfirm, style }) {
  const list = methods && methods.length ? methods : QA_PAYMENT_METHODS;
  const [open, setOpen] = React.useState(defaultOpen);
  const [receipt, setReceipt] = React.useState('');
  const [done, setDone] = React.useState(false);
  const chosen = list.find((m) => m.id === open);
  const atOffice = !!chosen && chosen.id === 'office';
  const ready = atOffice || !!receipt;
  const uploadId = React.useId();
  const [orderNo] = React.useState(() => 'QA-' + String(Math.floor(100000 + Math.random() * 899999)));

  if (done) {
    return (
      <div dir="rtl" style={{ display: 'grid', gridTemplateColumns: 'clamp(180px,34%,300px) minmax(240px,1fr)', alignItems: 'stretch', borderRadius: 24, overflow: 'hidden', background: '#eaf8fd', border: '1px solid #bfe9f6', ...style }}>
        <img src={thankYouSrc || assetBase + '/mascot-skylo-thankyou.webp'} alt="سكايلو يشكرك" style={{ width: '100%', height: '100%', minHeight: 300, display: 'block', objectFit: 'cover' }} />
        <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'start', justifyContent: 'center', gap: 10, padding: 26 }}>
          <span style={{ fontSize: 24, fontWeight: 700, color: '#036f8c' }}>شكراً لك!</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '8px 16px', borderRadius: 999, background: '#fff', border: '1px solid #bfe9f6' }}>
            <span style={{ fontSize: 13, color: '#7b8087' }}>رقم الطلب</span>
            <span dir="ltr" style={{ fontSize: 15, fontWeight: 700, letterSpacing: '.06em', color: '#036f8c' }}>{orderNo}</span>
          </span>
          <span style={{ fontSize: 15, lineHeight: 1.7, color: '#036f8c' }}>
            استلمنا إشعار الدفع{receipt ? ' («' + receipt + '»)' : ''}. يتحقق فريقنا منه ويعود إليك على واتساب خلال ٢٤ ساعة بتأكيد الطلب.
          </span>
          <span style={{ fontSize: 13, color: '#3d4650' }}>الرقم المختصر 6393 · sales@almarayagroup.com</span>
          <button onClick={() => { setDone(false); setReceipt(''); }} style={{ cursor: 'pointer', border: 0, background: 'none', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, color: '#036f8c' }}>إرفاق إشعار آخر</button>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" style={{ display: 'flex', flexDirection: 'column', gap: 16, ...style }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: 18, fontWeight: 700, color: '#1d2733' }}>{title || 'طرق الدفع'}</span>
        <span style={{ fontSize: 13, color: '#3d4650' }}>{note || 'اختر طريقة الدفع المناسبة لك — اضغط على الطريقة لعرض تفاصيلها.'}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {list.map((m, i) => {
          const on = open === m.id;
          const accent = m.warn ? '#c07f00' : '#036f8c';
          return (
            <div key={m.id} style={{ border: '1px solid ' + (on ? accent : '#ececed'), borderRadius: 14, overflow: 'hidden', background: '#fff' }}>
              <button onClick={() => setOpen(on ? '' : m.id)} style={{ width: '100%', boxSizing: 'border-box', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', border: 0, background: on ? (m.warn ? '#fef3dc' : '#eaf8fd') : '#f8f7f8', fontFamily: 'inherit', textAlign: 'start' }}>
                <span style={{ display: 'grid', placeItems: 'center', width: 34, height: 34, flex: 'none', borderRadius: '50%', background: '#fff', border: '1px solid #ececed', color: accent }}>
                  <Icon name={m.icon} size={18} />
                </span>
                <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: '#1d2733' }}>الطريقة {i + 1} — {m.label}</span>
                  <span style={{ fontSize: 11, color: '#7b8087' }}>{m.hint}</span>
                </span>
                <Icon name={on ? 'chevron-up' : 'chevron-down'} size={18} style={{ color: '#7b8087' }} />
              </button>
              {on ? (
                <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12, borderTop: '1px solid #ececed' }}>
                  {(m.rows || []).map((r) => (
                    <div key={r[0]} style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                      <span style={{ minWidth: 110, fontSize: 12, color: '#7b8087' }}>{r[0]}</span>
                      <span dir={/[0-9+]/.test(r[1][0]) ? 'ltr' : 'rtl'} style={{ fontSize: 13.5, fontWeight: 600, color: '#1d2733', letterSpacing: /[0-9+]/.test(r[1][0]) ? '.04em' : 'normal' }}>{r[1]}</span>
                    </div>
                  ))}
                  <p style={{ display: 'flex', gap: 8, margin: 0, padding: '12px 14px', borderRadius: 10, background: m.warn ? '#fef3dc' : '#f8f7f8', border: '1px solid ' + (m.warn ? '#fdd27c' : '#ececed'), fontSize: 13, lineHeight: 1.6, color: m.warn ? '#a06a00' : '#3d4650' }}>
                    <Icon name={m.warn ? 'alert-triangle' : 'info'} size={17} style={{ marginTop: 2, flex: 'none' }} />
                    <span>{m.body}</span>
                  </p>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
      {chosen ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 18, borderRadius: 14, border: '1.5px dashed #049dc5', background: '#eaf8fd' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: '#1d2733' }}>{atOffice ? 'تأكيد الدفع في المكتب' : 'أرفق إشعار الدفع — ' + chosen.label}</span>
            <span style={{ fontSize: 12, color: '#3d4650' }}>{atOffice ? 'أكِّد اختيارك، وادفع المبلغ في المكتب خلال يوم واحد — لا حاجة لإرفاق أي ملف.' : 'صورة أو PDF لإشعار التحويل — حتى ٥ ميغابايت.'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            {atOffice ? null : (
              <label htmlFor={uploadId} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 999, background: '#fff', border: '1px solid #036f8c', color: '#036f8c', fontSize: 13.5, fontWeight: 600 }}>
                <Icon name={receipt ? 'check' : 'upload'} size={17} />{receipt ? 'تغيير الملف' : 'اختر الملف'}
              </label>
            )}
            {atOffice ? null : <input id={uploadId} type="file" style={{ display: 'none' }} onChange={(e) => setReceipt(e.target.files && e.target.files[0] ? e.target.files[0].name : '')} />}
            {atOffice ? null : <span style={{ flex: 1, minWidth: 120, fontSize: 12, color: receipt ? '#1d2733' : '#7b8087', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{receipt || 'لم يتم اختيار ملف بعد'}</span>}
            <button disabled={!ready} onClick={() => { setDone(true); if (onConfirm) onConfirm({ method: chosen.id, receipt: atOffice ? '' : receipt }); }}
              style={{ cursor: ready ? 'pointer' : 'not-allowed', opacity: ready ? 1 : 0.45, border: 0, borderRadius: 999, padding: '12px 26px', background: '#049dc5', color: '#fff', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 600 }}>
              تأكيد الدفع
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
