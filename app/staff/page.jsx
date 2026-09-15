'use client';
import React, { useEffect, useState } from 'react';

const inputStyle = {
  width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 8,
  border: '1px solid #ececed', fontSize: 15, fontFamily: 'inherit',
};
const labelStyle = { display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13.5, fontWeight: 600, color: '#3d4650' };
const cardStyle = {
  background: '#fff', border: '1px solid #ececed', borderRadius: 14, padding: 20,
  display: 'flex', flexDirection: 'column', gap: 12, boxShadow: '0 2px 8px rgba(29,39,51,.06)',
};
const btnStyle = (variant) => ({
  cursor: 'pointer', border: variant === 'ghost' ? '1px solid #ececed' : 'none', borderRadius: 999,
  padding: '10px 20px', fontSize: 14.5, fontWeight: 600, fontFamily: 'inherit',
  background: variant === 'primary' ? '#049dc5' : variant === 'danger' ? '#fdecef' : '#fff',
  color: variant === 'primary' ? '#fff' : variant === 'danger' ? '#d2324f' : '#3d4650',
});

async function api(path, options) {
  const res = await fetch(path, { ...options, headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) } });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return res.json();
}

const PKG_STATUS_OPTIONS = [
  { id: 'new', label: 'جديد' },
  { id: 'confirmed', label: 'مؤكد' },
  { id: 'in_progress', label: 'قيد التجهيز' },
  { id: 'completed', label: 'مكتمل' },
  { id: 'cancelled', label: 'ملغى' },
];
const PKG_PAYMENT_OPTIONS = [
  { id: 'awaiting_review', label: 'بانتظار مراجعة الدفع' },
  { id: 'approved', label: 'تم تأكيد الدفع' },
  { id: 'rejected', label: 'مرفوض' },
];

function VisaApplications() {
  const [apps, setApps] = useState(null);
  const [statuses, setStatuses] = useState(null);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [detail, setDetail] = useState(null);
  const [noteDrafts, setNoteDrafts] = useState({});
  const [fileUploading, setFileUploading] = useState({});
  const [paymentBusy, setPaymentBusy] = useState({});
  const [emailInfo, setEmailInfo] = useState({});

  function load() {
    Promise.all([api('/api/admin/visa/applications'), api('/api/admin/visa/statuses')])
      .then(([a, s]) => { setApps(a); setStatuses(s.internal || []); })
      .catch((e) => setError(e.message));
  }
  useEffect(load, []);

  async function openDetail(id) {
    if (expanded === id) {
      setExpanded(null);
      setDetail(null);
      return;
    }
    setExpanded(id);
    try {
      const data = await api(`/api/admin/visa/applications/${id}`);
      setDetail(data);
    } catch (e) {
      setError(e.message);
    }
  }

  async function changeStatus(id, statusId, note, resultFileUrl) {
    try {
      await api(`/api/admin/visa/applications/${id}/status`, {
        method: 'POST',
        body: JSON.stringify({ internal_status_id: statusId ? Number(statusId) : null, note: note || '', result_file_url: resultFileUrl ?? null }),
      });
      load();
      if (expanded === id) openDetail(id);
    } catch (e) {
      setError(e.message);
    }
  }

  async function uploadResultFile(id, statusId, file) {
    if (!file) return;
    setFileUploading((u) => ({ ...u, [id]: true }));
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/visa/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (res.ok) {
        await changeStatus(id, statusId, undefined, data.url);
      } else {
        setError(data.error || 'تعذّر رفع الملف');
      }
    } finally {
      setFileUploading((u) => ({ ...u, [id]: false }));
    }
  }

  async function decidePayment(id, action) {
    if (action === 'reject' && !window.confirm('سيتم حذف هذا الطلب نهائيًا لأن الدفع غير مؤكد. متابعة؟')) return;
    setPaymentBusy((b) => ({ ...b, [id]: true }));
    try {
      const data = await api(`/api/admin/visa/applications/${id}/payment`, { method: 'POST', body: JSON.stringify({ action }) });
      if (data?.email) setEmailInfo((m) => ({ ...m, [id]: data.email }));
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setPaymentBusy((b) => ({ ...b, [id]: false }));
    }
  }

  if (error) return <p style={{ color: '#d2324f' }}>{error}</p>;
  if (!apps) return <p>جارٍ التحميل...</p>;
  if (apps.length === 0) return <p style={{ color: '#7b8087' }}>لا توجد طلبات تأشيرة بعد.</p>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {apps.map((a) => (
        <div key={a.id} style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <div>
              <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                {a.customer_name} — {a.country_name_ar} · {a.visa_type_name_ar}
                {a.is_delayed && <span style={{ fontSize: 12, color: '#d2324f' }}>متأخر</span>}
                {a.provider_email_missing && (
                  <span
                    style={{ fontSize: 12, fontWeight: 700, color: '#d2324f', background: '#fdecef', borderRadius: 999, padding: '2px 10px' }}
                    title="طريقة الإرسال لهذه البطاقة تتطلب مزوّدًا، لكن لا يوجد بريد إلكتروني مسجّل"
                  >
                    ⚠ لا يوجد بريد للمزوّد
                  </span>
                )}
              </div>
              <div style={{ fontSize: 13, color: '#7b8087' }}>{new Date(a.submitted_at).toLocaleString('ar')}</div>
            </div>
            <button style={btnStyle('ghost')} onClick={() => openDetail(a.id)}>
              {expanded === a.id ? 'إخفاء' : 'التفاصيل'}
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 10, fontSize: 13.5 }}>
            <div><b>الهاتف:</b> {a.customer_phone}</div>
            <div><b>البريد:</b> {a.customer_email || '—'}</div>
            <div><b>البالغون/الأطفال:</b> {a.adult_count} / {a.child_count}</div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <label style={{ ...labelStyle, maxWidth: 260, flex: 1 }}>
              حالة الطلب
              <select style={inputStyle} value={a.internal_status_id || ''} onChange={(e) => changeStatus(a.id, e.target.value, noteDrafts[a.id])}>
                <option value="">— بدون حالة —</option>
                {(statuses || []).map((s) => <option key={s.id} value={s.id}>{s.name_ar}</option>)}
              </select>
            </label>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input
              style={{ ...inputStyle, width: 220, fontSize: 12.5, padding: '6px 10px' }}
              placeholder="ملاحظة للعميل (تظهر له عند التتبع)"
              value={noteDrafts[a.id] ?? ''}
              onChange={(e) => setNoteDrafts({ ...noteDrafts, [a.id]: e.target.value })}
            />
            <button
              style={{ ...btnStyle('ghost'), padding: '6px 12px', fontSize: 12.5 }}
              onClick={() => changeStatus(a.id, a.internal_status_id, noteDrafts[a.id])}
            >
              حفظ الملاحظة
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <label style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 999, border: '1px solid #036f8c', color: '#036f8c', fontSize: 12.5, fontWeight: 600 }}>
              {a.result_file_url ? '📎 استبدال ملف التأشيرة' : '📎 رفع ملف التأشيرة الجاهز'}
              <input
                type="file"
                style={{ display: 'none' }}
                onChange={(e) => uploadResultFile(a.id, a.internal_status_id, e.target.files[0])}
              />
            </label>
            {fileUploading[a.id] && <span style={{ fontSize: 12, color: '#7b8087' }}>...جارٍ الرفع</span>}
            {a.result_file_url && !fileUploading[a.id] && (
              <a href={a.result_file_url} target="_blank" rel="noopener" style={{ fontSize: 12, color: '#049dc5', fontWeight: 600 }}>✓ عرض الملف المرفوع</a>
            )}
          </div>

          {a.latest_note && (
            <div style={{ fontSize: 12.5, color: '#a06a00', background: '#fef3dc', border: '1px solid #fdd27c', borderRadius: 8, padding: '6px 10px' }}>
              آخر ملاحظة للعميل: {a.latest_note}
            </div>
          )}

          {a.customer_upload_url && (
            <div style={{ fontSize: 12.5, color: '#1e7d46', background: '#eafaf1', border: '1px solid #b7e4c7', borderRadius: 8, padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span>📎 رفع العميل ملفاً بتاريخ {new Date(a.customer_upload_at).toLocaleString('ar')}:</span>
              <a href={a.customer_upload_url} target="_blank" rel="noopener" style={{ color: '#036f8c', fontWeight: 700 }}>عرض الملف</a>
            </div>
          )}

          <div
            style={{
              display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10,
              padding: '10px 12px', borderRadius: 10,
              background: a.payment_status === 'approved' ? '#eafaf1' : '#fef3dc',
              border: '1px solid ' + (a.payment_status === 'approved' ? '#b7e4c7' : '#fdd27c'),
            }}
          >
            <span style={{ fontSize: 12.5, fontWeight: 700, color: a.payment_status === 'approved' ? '#1e7d46' : '#a06a00' }}>
              {a.payment_status === 'approved' ? '✓ تمت الموافقة على الدفع — أُرسل إلى المزود' : '⏳ بانتظار مراجعة الدفع — لم يُرسَل إلى المزود بعد'}
            </span>
            <span style={{ fontSize: 12.5, color: '#3d4650' }}>
              {a.payment_method === 'office' ? 'طريقة الدفع: الدفع في المكتب' : a.payment_method ? `طريقة الدفع: ${a.payment_method}` : ''}
            </span>
            {a.payment_proof_url ? (
              <a href={a.payment_proof_url} target="_blank" rel="noopener" style={{ fontSize: 12.5, fontWeight: 700, color: '#036f8c' }}>
                📎 عرض إشعار الدفع
              </a>
            ) : a.payment_method !== 'office' ? (
              <span style={{ fontSize: 12.5, fontWeight: 700, color: '#d2324f' }}>⚠ لم يُرفَق إشعار دفع</span>
            ) : null}
            {a.payment_status !== 'approved' && (
              <div style={{ display: 'flex', gap: 8, marginInlineStart: 'auto' }}>
                <button
                  disabled={!!paymentBusy[a.id]}
                  style={{ ...btnStyle('primary'), padding: '6px 14px', fontSize: 12.5, opacity: paymentBusy[a.id] ? 0.6 : 1 }}
                  onClick={() => decidePayment(a.id, 'approve')}
                >
                  ✓ قبول الدفع وإرسال للمزود
                </button>
                <button
                  disabled={!!paymentBusy[a.id]}
                  style={{ ...btnStyle('danger'), padding: '6px 14px', fontSize: 12.5, opacity: paymentBusy[a.id] ? 0.6 : 1 }}
                  onClick={() => decidePayment(a.id, 'reject')}
                >
                  ✕ رفض وحذف
                </button>
              </div>
            )}
            {a.payment_status === 'approved' && (
              <button
                disabled={!!paymentBusy[a.id]}
                style={{ ...btnStyle('ghost'), padding: '6px 14px', fontSize: 12.5, opacity: paymentBusy[a.id] ? 0.6 : 1, marginInlineStart: 'auto' }}
                onClick={() => decidePayment(a.id, 'resend')}
                title="أعد إرسال البريد بإعدادات المزوّد الحالية — مفيد بعد تصحيح بريد المزوّد"
              >
                🔁 إعادة إرسال البريد
              </button>
            )}
          </div>

          {a.provider_email_missing && (
            <div style={{ fontSize: 12.5, color: '#d2324f', background: '#fdecef', border: '1px solid #f6c3cf', borderRadius: 8, padding: '8px 10px' }}>
              ⚠ طريقة الإرسال المحددة لهذه البطاقة تتطلب مزوّدًا، لكن لا يوجد بريد إلكتروني مسجّل له — يرجى إبلاغ الإدارة لإضافة بريد المزوّد، ثم اضغط "إعادة إرسال البريد" إن كان الطلب قد تمت الموافقة عليه بالفعل.
            </div>
          )}

          {emailInfo[a.id] && (
            <div
              style={{
                fontSize: 12.5,
                borderRadius: 8,
                padding: '8px 10px',
                background: emailInfo[a.id].providerReached ? '#eafaf1' : '#fdecef',
                border: '1px solid ' + (emailInfo[a.id].providerReached ? '#b7e4c7' : '#f6c3cf'),
                color: emailInfo[a.id].providerReached ? '#1e7d46' : '#d2324f',
              }}
            >
              {emailInfo[a.id].error
                ? '⚠ تعذّر إرسال البريد الإلكتروني.'
                : emailInfo[a.id].providerReached
                ? `✓ أُرسل البريد إلى: ${(emailInfo[a.id].recipients || []).join('، ')}`
                : `⚠ لم يصل البريد إلى مزود الخدمة — أُرسل فقط إلى: ${(emailInfo[a.id].recipients || []).join('، ') || '—'}`}
            </div>
          )}

          {expanded === a.id && detail && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, borderTop: '1px dashed #ececed', paddingTop: 14 }}>
              {detail.travelers.map((t) => (
                <div key={t.id} style={{ border: '1px solid #ececed', borderRadius: 10, padding: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>
                    {t.traveler_type === 'adult' ? 'بالغ' : 'طفل'} — {t.full_name || '—'}
                  </span>
                  {t.answers.length === 0 && <span style={{ fontSize: 13, color: '#7b8087' }}>لا توجد إجابات</span>}
                  {t.answers.map((ans) => {
                    const doc = detail.documents.find((d) => d.id === ans.visa_document_id);
                    return (
                      <div key={ans.id} style={{ fontSize: 13.5, display: 'flex', gap: 6 }}>
                        <span style={{ color: '#7b8087', minWidth: 160 }}>{doc ? doc.name_ar : 'مستند'}:</span>
                        {ans.file_url ? (
                          <a href={ans.file_url} target="_blank" rel="noopener" style={{ color: '#049dc5' }}>عرض الملف</a>
                        ) : (
                          <span>{ans.value_text || '—'}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function PackageBookings() {
  const [bookings, setBookings] = useState(null);
  const [error, setError] = useState('');

  function load() {
    api('/api/admin/packages/bookings').then(setBookings).catch((e) => setError(e.message));
  }
  useEffect(load, []);

  async function updateStatus(id, field, value) {
    try {
      await api(`/api/admin/packages/bookings/${id}/status`, { method: 'PATCH', body: JSON.stringify({ [field]: value }) });
      load();
    } catch (e) {
      setError(e.message);
    }
  }

  if (error) return <p style={{ color: '#d2324f' }}>{error}</p>;
  if (!bookings) return <p>جارٍ التحميل...</p>;
  if (bookings.length === 0) return <p style={{ color: '#7b8087' }}>لا توجد حجوزات باقات بعد.</p>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {bookings.map((b) => (
        <div key={b.id} style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <div>
              <div style={{ fontWeight: 700 }}>QP-{String(b.id).padStart(6, '0')} — {b.package_title_ar || 'باقة محذوفة'}</div>
              <div style={{ fontSize: 13, color: '#7b8087' }}>{b.package_dest_ar} · {new Date(b.submitted_at).toLocaleString('ar')}</div>
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#049dc5' }}>{Number(b.total_price).toLocaleString()} IQD</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 10, fontSize: 13.5 }}>
            <div><b>الهاتف:</b> {b.customer_phone}</div>
            <div><b>البريد:</b> {b.customer_email || '—'}</div>
            <div><b>الجنسية:</b> {b.nationality || '—'}</div>
            <div><b>البالغون/الأطفال:</b> {b.adult_count} / {b.child_count}</div>
            <div><b>الفندق:</b> {b.hotel_choice || '—'}</div>
            <div><b>الرحلة:</b> {b.flight_choice || '—'}</div>
            <div><b>طريقة الدفع:</b> {b.payment_method || '—'}</div>
            {b.payment_proof_url && (
              <div><a href={b.payment_proof_url} target="_blank" rel="noreferrer" style={{ color: '#036f8c' }}>إشعار الدفع ↗</a></div>
            )}
          </div>
          {b.travelers?.length > 0 && (
            <div style={{ fontSize: 13.5, borderTop: '1px solid #ececed', paddingTop: 10 }}>
              <b>المسافرون:</b> {b.travelers.map((t) => `${t.full_name} (${t.traveler_type === 'adult' ? 'بالغ' : 'طفل'}${t.passport_number ? ' — ' + t.passport_number : ''})`).join('، ')}
            </div>
          )}
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <label style={labelStyle}>حالة الدفع
              <select style={inputStyle} value={b.payment_status} onChange={(e) => updateStatus(b.id, 'payment_status', e.target.value)}>
                {PKG_PAYMENT_OPTIONS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
              </select>
            </label>
            <label style={labelStyle}>حالة الحجز
              <select style={inputStyle} value={b.internal_status} onChange={(e) => updateStatus(b.id, 'internal_status', e.target.value)}>
                {PKG_STATUS_OPTIONS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
              </select>
            </label>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function StaffPage() {
  const [checkingSession, setCheckingSession] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [tab, setTab] = useState('visa');

  useEffect(() => {
    fetch('/api/admin/session')
      .then((r) => r.json())
      .then((d) => setAuthenticated(!!d.authenticated))
      .catch(() => setAuthenticated(false))
      .finally(() => setCheckingSession(false));
  }, []);

  async function handleLogin(e) {
    e.preventDefault();
    setLoginError('');
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      setAuthenticated(true);
    } else {
      const data = await res.json().catch(() => ({}));
      setLoginError(data.error || 'حدث خطأ غير متوقع');
    }
  }

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    setAuthenticated(false);
    setPassword('');
  }

  if (checkingSession) {
    return <div style={{ padding: 40, fontFamily: 'system-ui, sans-serif' }}>...جارٍ التحقق</div>;
  }

  if (!authenticated) {
    return (
      <div dir="rtl" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f7f8', fontFamily: "'IBM Plex Sans Arabic', system-ui, sans-serif" }}>
        <form onSubmit={handleLogin} style={{ ...cardStyle, width: 340, gap: 16 }}>
          <h1 style={{ margin: 0, fontSize: 22, color: '#049dc5' }}>متابعة الطلبات — قصر المرايا</h1>
          <label style={labelStyle}>
            كلمة المرور
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} autoFocus />
          </label>
          {loginError && <p style={{ margin: 0, color: '#d2324f', fontSize: 14 }}>{loginError}</p>}
          <button type="submit" style={btnStyle('primary')}>دخول</button>
        </form>
      </div>
    );
  }

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: '#f8f7f8', fontFamily: "'IBM Plex Sans Arabic', system-ui, sans-serif", color: '#3d4650' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '28px 20px 80px', display: 'flex', flexDirection: 'column', gap: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1 style={{ margin: 0, fontSize: 22, color: '#049dc5' }}>متابعة حالة الطلبات</h1>
          <button onClick={handleLogout} style={btnStyle('ghost')}>تسجيل الخروج</button>
        </div>

        <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid #ececed', paddingBottom: 12 }}>
          <button type="button" style={btnStyle(tab === 'visa' ? 'primary' : 'ghost')} onClick={() => setTab('visa')}>طلبات التأشيرات</button>
          <button type="button" style={btnStyle(tab === 'packages' ? 'primary' : 'ghost')} onClick={() => setTab('packages')}>حجوزات الباقات</button>
        </div>

        {tab === 'visa' ? <VisaApplications /> : <PackageBookings />}
      </div>
    </div>
  );
}
