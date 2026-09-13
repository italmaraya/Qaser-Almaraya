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

  function load() {
    Promise.all([api('/api/admin/visa/applications'), api('/api/admin/visa/statuses')])
      .then(([a, s]) => { setApps(a); setStatuses(s.internal || []); })
      .catch((e) => setError(e.message));
  }
  useEffect(load, []);

  async function updateStatus(id, internal_status_id) {
    try {
      await api(`/api/admin/visa/applications/${id}/status`, { method: 'POST', body: JSON.stringify({ internal_status_id: internal_status_id ? Number(internal_status_id) : null }) });
      load();
    } catch (e) {
      setError(e.message);
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
              <div style={{ fontWeight: 700 }}>
                {a.customer_name} — {a.country_name_ar} · {a.visa_type_name_ar}
                {a.is_delayed && <span style={{ marginInlineStart: 8, fontSize: 12, color: '#d2324f' }}>متأخر</span>}
              </div>
              <div style={{ fontSize: 13, color: '#7b8087' }}>{new Date(a.submitted_at).toLocaleString('ar')}</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 10, fontSize: 13.5 }}>
            <div><b>الهاتف:</b> {a.customer_phone}</div>
            <div><b>البريد:</b> {a.customer_email || '—'}</div>
            <div><b>البالغون/الأطفال:</b> {a.adult_count} / {a.child_count}</div>
            <div><b>حالة الدفع:</b> {a.payment_status === 'approved' ? 'تم التأكيد' : a.payment_status === 'rejected' ? 'مرفوض' : 'بانتظار المراجعة'}</div>
          </div>
          <label style={{ ...labelStyle, maxWidth: 260 }}>
            حالة الطلب
            <select style={inputStyle} value={a.internal_status_id || ''} onChange={(e) => updateStatus(a.id, e.target.value)}>
              <option value="">— بدون حالة —</option>
              {(statuses || []).map((s) => <option key={s.id} value={s.id}>{s.name_ar}</option>)}
            </select>
          </label>
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
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 10, fontSize: 13.5 }}>
            <div><b>الهاتف:</b> {b.customer_phone}</div>
            <div><b>البالغون/الأطفال:</b> {b.adult_count} / {b.child_count}</div>
            <div><b>الفندق:</b> {b.hotel_choice || '—'}</div>
            <div><b>الرحلة:</b> {b.flight_choice || '—'}</div>
          </div>
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
