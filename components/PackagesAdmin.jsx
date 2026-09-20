'use client';
import React, { useEffect, useState } from 'react';
import { CATS } from '../lib/packagesData';

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

const SUBTABS = [
  { id: 'packages', label: 'الباقات' },
  { id: 'bookings', label: 'الحجوزات' },
  { id: 'destinations', label: 'المدن الشائعة' },
];

async function api(path, options) {
  const res = await fetch(path, { ...options, headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) } });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return res.json();
}

async function uploadImage(file) {
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'تعذّر رفع الصورة');
  return data.url;
}

function CostCurrencyPicker({ value, onChange }) {
  const cur = value || 'IQD';
  const opt = (id, label) => (
    <button
      key={id}
      type="button"
      onClick={() => onChange(id)}
      style={{
        cursor: 'pointer', padding: '8px 18px', borderRadius: 999,
        border: '1px solid ' + (cur === id ? '#049dc5' : '#ececed'),
        background: cur === id ? '#049dc5' : '#fff', color: cur === id ? '#fff' : '#3d4650',
        fontFamily: 'inherit', fontSize: 13.5, fontWeight: 700,
      }}
    >
      {label}
    </button>
  );
  return <div style={{ display: 'flex', gap: 8 }}>{opt('IQD', 'دينار عراقي')}{opt('USD', 'دولار أمريكي')}</div>;
}

function ImageUploadField({ label, value, onChange }) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const inputId = React.useId();

  async function handleFile(file) {
    if (!file) return;
    setUploading(true);
    setUploadError('');
    try {
      const url = await uploadImage(file);
      onChange(url);
    } catch (e) {
      setUploadError(e.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && <span style={{ fontSize: 13.5, fontWeight: 600, color: '#3d4650' }}>{label}</span>}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {value ? (
          <img src={value} alt="" style={{ width: 64, height: 64, borderRadius: 10, objectFit: 'cover', border: '1px solid #ececed' }} />
        ) : (
          <div style={{ width: 64, height: 64, borderRadius: 10, background: '#f4f4f4', display: 'grid', placeItems: 'center', fontSize: 11, color: '#7b8087' }}>لا صورة</div>
        )}
        <label htmlFor={inputId} style={{ ...btnStyle('ghost'), cursor: 'pointer' }}>
          {uploading ? 'جارٍ الرفع...' : value ? 'تغيير الصورة' : 'رفع صورة'}
        </label>
        <input
          id={inputId}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        {value && (
          <button type="button" style={btnStyle('danger')} onClick={() => onChange('')}>إزالة</button>
        )}
      </div>
      {uploadError && <span style={{ fontSize: 12, color: '#d2324f' }}>{uploadError}</span>}
    </div>
  );
}

function blankPackage() {
  return {
    cat: 'family', countries: [], dest_ar: '', dest_en: '', title_ar: '', title_en: '',
    nights_ar: '', nights_en: '', departs_ar: '', departs_en: '', price: 0, child_price: 0,
    adult_cost: 0, child_cost: 0, cost_currency: 'IQD',
    badge_ar: '', badge_en: '', prefs: [], includes_ar: [], includes_en: [],
    hotels: [], flights: [], days: [], image_url: '', active: true, sort_order: 0,
  };
}

function linesToArr(text) {
  return text.split('\n').map((s) => s.trim()).filter(Boolean);
}

function PackageForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initial);
  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  function updateRow(field, idx, key, value) {
    setForm((f) => {
      const arr = [...(f[field] || [])];
      arr[idx] = { ...arr[idx], [key]: value };
      return { ...f, [field]: arr };
    });
  }
  function addRow(field, blank) {
    setForm((f) => ({ ...f, [field]: [...(f[field] || []), blank] }));
  }
  function removeRow(field, idx) {
    setForm((f) => {
      const arr = [...(f[field] || [])];
      arr.splice(idx, 1);
      return { ...f, [field]: arr };
    });
  }

  return (
    <div style={cardStyle}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12 }}>
        <label style={labelStyle}>التصنيف
          <select style={inputStyle} value={form.cat} onChange={(e) => set('cat', e.target.value)}>
            {CATS.map((c) => <option key={c.id} value={c.id}>{c.ar}</option>)}
          </select>
        </label>
        <label style={labelStyle}>نشطة
          <select style={inputStyle} value={form.active ? '1' : '0'} onChange={(e) => set('active', e.target.value === '1')}>
            <option value="1">نعم — تظهر على الموقع</option>
            <option value="0">لا — مخفية</option>
          </select>
        </label>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12 }}>
        <label style={labelStyle}>الوجهة (عربي)<input style={inputStyle} value={form.dest_ar} onChange={(e) => set('dest_ar', e.target.value)} /></label>
        <label style={labelStyle}>Destination (English)<input style={inputStyle} value={form.dest_en} onChange={(e) => set('dest_en', e.target.value)} /></label>
        <label style={labelStyle}>عنوان الباقة (عربي)<input style={inputStyle} value={form.title_ar} onChange={(e) => set('title_ar', e.target.value)} /></label>
        <label style={labelStyle}>Package title (English)<input style={inputStyle} value={form.title_en} onChange={(e) => set('title_en', e.target.value)} /></label>
        <label style={labelStyle}>المدة (عربي)<input style={inputStyle} value={form.nights_ar} onChange={(e) => set('nights_ar', e.target.value)} placeholder="مثال: 7 ليالٍ" /></label>
        <label style={labelStyle}>Duration (English)<input style={inputStyle} value={form.nights_en} onChange={(e) => set('nights_en', e.target.value)} placeholder="e.g. 7 nights" /></label>
        <label style={labelStyle}>مواعيد المغادرة (عربي)<input style={inputStyle} value={form.departs_ar} onChange={(e) => set('departs_ar', e.target.value)} /></label>
        <label style={labelStyle}>Departures (English)<input style={inputStyle} value={form.departs_en} onChange={(e) => set('departs_en', e.target.value)} /></label>
        <label style={labelStyle}>سعر البالغ (IQD)<input type="number" style={inputStyle} value={form.price} onChange={(e) => set('price', Number(e.target.value))} /></label>
        <label style={labelStyle}>سعر الطفل (IQD)<input type="number" style={inputStyle} value={form.child_price} onChange={(e) => set('child_price', Number(e.target.value))} /></label>
        <label style={labelStyle}>شارة (عربي، اختياري)<input style={inputStyle} value={form.badge_ar} onChange={(e) => set('badge_ar', e.target.value)} placeholder="مثال: الأكثر طلباً" /></label>
        <label style={labelStyle}>Badge (English, optional)<input style={inputStyle} value={form.badge_en} onChange={(e) => set('badge_en', e.target.value)} /></label>
      </div>

      <div style={{ borderTop: '1px solid #ececed', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <span style={{ fontSize: 13.5, fontWeight: 700 }}>التكلفة الداخلية (للاستخدام الداخلي فقط — لا تظهر للعميل)</span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12 }}>
          <label style={labelStyle}>تكلفة البالغ<input type="number" style={inputStyle} value={form.adult_cost} onChange={(e) => set('adult_cost', Number(e.target.value))} /></label>
          <label style={labelStyle}>تكلفة الطفل<input type="number" style={inputStyle} value={form.child_cost} onChange={(e) => set('child_cost', Number(e.target.value))} /></label>
          <label style={labelStyle}>عملة التكلفة
            <CostCurrencyPicker value={form.cost_currency} onChange={(v) => set('cost_currency', v)} />
          </label>
        </div>
      </div>

      <ImageUploadField label="صورة الغلاف" value={form.image_url} onChange={(url) => set('image_url', url)} />

      <label style={labelStyle}>ما تشمله الباقة — سطر لكل بند (عربي)
        <textarea style={{ ...inputStyle, minHeight: 80 }} value={(form.includes_ar || []).join('\n')} onChange={(e) => set('includes_ar', linesToArr(e.target.value))} />
      </label>
      <label style={labelStyle}>What's included — one per line (English)
        <textarea style={{ ...inputStyle, minHeight: 80 }} value={(form.includes_en || []).join('\n')} onChange={(e) => set('includes_en', linesToArr(e.target.value))} />
      </label>

      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 13.5, fontWeight: 700 }}>خيارات الفنادق</span>
          <button type="button" style={btnStyle('ghost')} onClick={() => addRow('hotels', { nameAr: '', nameEn: '', diff: 0, imageUrl: '', location: '', amenitiesAr: [], amenitiesEn: [] })}>+ إضافة فندق</button>
        </div>
        {(form.hotels || []).map((h, idx) => (
          <div key={idx} style={{ border: '1px solid #ececed', borderRadius: 10, padding: 10, marginBottom: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 140px auto', gap: 8 }}>
              <input style={inputStyle} placeholder="اسم الفندق (عربي)" value={h.nameAr} onChange={(e) => updateRow('hotels', idx, 'nameAr', e.target.value)} />
              <input style={inputStyle} placeholder="Hotel name (English)" value={h.nameEn} onChange={(e) => updateRow('hotels', idx, 'nameEn', e.target.value)} />
              <input type="number" style={inputStyle} placeholder="فرق السعر (IQD)" value={h.diff} onChange={(e) => updateRow('hotels', idx, 'diff', Number(e.target.value))} />
              <button type="button" style={btnStyle('danger')} onClick={() => removeRow('hotels', idx)}>حذف</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
              <input style={inputStyle} placeholder="الموقع، مثال: لندن، المملكة المتحدة" value={h.location || ''} onChange={(e) => updateRow('hotels', idx, 'location', e.target.value)} />
              <input style={inputStyle} placeholder="المرافق (عربي) — مفصولة بفاصلة، مثال: إفطار، واي فاي مجاني، مرشد سياحي" value={(h.amenitiesAr || []).join('، ')} onChange={(e) => updateRow('hotels', idx, 'amenitiesAr', e.target.value.split(/[,،]/).map((s) => s.trim()).filter(Boolean))} />
              <input style={inputStyle} placeholder="Amenities (English), comma separated: Breakfast, Free WiFi, Gym" value={(h.amenitiesEn || []).join(', ')} onChange={(e) => updateRow('hotels', idx, 'amenitiesEn', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))} />
            </div>
            <ImageUploadField label="صورة الفندق" value={h.imageUrl || ''} onChange={(url) => updateRow('hotels', idx, 'imageUrl', url)} />
          </div>
        ))}
      </div>

      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 13.5, fontWeight: 700 }}>خيارات الرحلات</span>
          <button type="button" style={btnStyle('ghost')} onClick={() => addRow('flights', { nameAr: '', nameEn: '', diff: 0, flightNo: '', fromCity: '', toCity: '', departTime: '', arriveTime: '', duration: '', tripLabelAr: '', tripLabelEn: '' })}>+ إضافة رحلة</button>
        </div>
        {(form.flights || []).map((f, idx) => (
          <div key={idx} style={{ border: '1px solid #ececed', borderRadius: 10, padding: 10, marginBottom: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 120px auto', gap: 8 }}>
              <input style={inputStyle} placeholder="اسم شركة الطيران (عربي)" value={f.nameAr} onChange={(e) => updateRow('flights', idx, 'nameAr', e.target.value)} />
              <input style={inputStyle} placeholder="Airline (English)" value={f.nameEn} onChange={(e) => updateRow('flights', idx, 'nameEn', e.target.value)} />
              <input type="number" style={inputStyle} placeholder="فرق السعر (IQD)" value={f.diff} onChange={(e) => updateRow('flights', idx, 'diff', Number(e.target.value))} />
              <button type="button" style={btnStyle('danger')} onClick={() => removeRow('flights', idx)}>حذف</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: 8 }}>
              <input style={inputStyle} placeholder="رقم الرحلة" value={f.flightNo || ''} onChange={(e) => updateRow('flights', idx, 'flightNo', e.target.value)} />
              <input style={inputStyle} placeholder="مدينة الانطلاق" value={f.fromCity || ''} onChange={(e) => updateRow('flights', idx, 'fromCity', e.target.value)} />
              <input style={inputStyle} placeholder="مدينة الوصول" value={f.toCity || ''} onChange={(e) => updateRow('flights', idx, 'toCity', e.target.value)} />
              <input style={inputStyle} placeholder="وقت المغادرة، مثال 15:00" value={f.departTime || ''} onChange={(e) => updateRow('flights', idx, 'departTime', e.target.value)} />
              <input style={inputStyle} placeholder="وقت الوصول، مثال 17:05" value={f.arriveTime || ''} onChange={(e) => updateRow('flights', idx, 'arriveTime', e.target.value)} />
              <input style={inputStyle} placeholder="المدة، مثال 2h 05m" value={f.duration || ''} onChange={(e) => updateRow('flights', idx, 'duration', e.target.value)} />
              <input style={inputStyle} placeholder="نوع الرحلة (عربي)، مثال: رحلة ذهاب" value={f.tripLabelAr || ''} onChange={(e) => updateRow('flights', idx, 'tripLabelAr', e.target.value)} />
              <input style={inputStyle} placeholder="Trip label (English), e.g. Return Flight" value={f.tripLabelEn || ''} onChange={(e) => updateRow('flights', idx, 'tripLabelEn', e.target.value)} />
            </div>
          </div>
        ))}
      </div>

      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 13.5, fontWeight: 700 }}>برنامج الرحلة يوماً بيوم</span>
          <button type="button" style={btnStyle('ghost')} onClick={() => addRow('days', { titleAr: '', descAr: '', titleEn: '', descEn: '' })}>+ إضافة يوم</button>
        </div>
        {(form.days || []).map((d, idx) => (
          <div key={idx} style={{ border: '1px solid #ececed', borderRadius: 10, padding: 10, marginBottom: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <input style={inputStyle} placeholder="عنوان اليوم (عربي)" value={d.titleAr} onChange={(e) => updateRow('days', idx, 'titleAr', e.target.value)} />
              <input style={inputStyle} placeholder="Day title (English)" value={d.titleEn} onChange={(e) => updateRow('days', idx, 'titleEn', e.target.value)} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <input style={inputStyle} placeholder="وصف اليوم (عربي)" value={d.descAr} onChange={(e) => updateRow('days', idx, 'descAr', e.target.value)} />
              <input style={inputStyle} placeholder="Day description (English)" value={d.descEn} onChange={(e) => updateRow('days', idx, 'descEn', e.target.value)} />
            </div>
            <button type="button" style={{ ...btnStyle('danger'), alignSelf: 'flex-start' }} onClick={() => removeRow('days', idx)}>حذف اليوم</button>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', borderTop: '1px solid #ececed', paddingTop: 14 }}>
        <button type="button" style={btnStyle('ghost')} onClick={onCancel}>إلغاء</button>
        <button type="button" style={btnStyle('primary')} disabled={saving} onClick={() => onSave(form)}>{saving ? 'جارٍ الحفظ...' : 'حفظ'}</button>
      </div>
    </div>
  );
}

function PackagesTab() {
  const [packages, setPackages] = useState(null);
  const [editing, setEditing] = useState(null); // package object or 'new' or null
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function load() {
    api('/api/admin/packages').then(setPackages).catch((e) => setError(e.message));
  }
  useEffect(load, []);

  async function handleSave(form) {
    setSaving(true);
    setError('');
    try {
      if (form.id) {
        await api(`/api/admin/packages/${form.id}`, { method: 'PUT', body: JSON.stringify(form) });
      } else {
        await api('/api/admin/packages', { method: 'POST', body: JSON.stringify(form) });
      }
      setEditing(null);
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('حذف هذه الباقة نهائياً؟')) return;
    try {
      await api(`/api/admin/packages/${id}`, { method: 'DELETE' });
      load();
    } catch (e) {
      setError(e.message);
    }
  }

  if (editing) {
    return (
      <PackageForm
        initial={editing === 'new' ? blankPackage() : editing}
        onSave={handleSave}
        onCancel={() => setEditing(null)}
        saving={saving}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {error && <p style={{ color: '#d2324f' }}>{error}</p>}
      <div>
        <button type="button" style={btnStyle('primary')} onClick={() => setEditing('new')}>+ إضافة باقة جديدة</button>
      </div>
      {!packages ? (
        <p>جارٍ التحميل...</p>
      ) : packages.length === 0 ? (
        <p style={{ color: '#7b8087' }}>لا توجد باقات بعد.</p>
      ) : (
        packages.map((p) => (
          <div key={p.id} style={{ ...cardStyle, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: 700 }}>{p.title_ar} {!p.active && <span style={{ color: '#d2324f', fontSize: 12 }}>(مخفية)</span>}</div>
              <div style={{ fontSize: 13, color: '#7b8087' }}>{p.dest_ar} · {p.nights_ar} · {Number(p.price).toLocaleString()} IQD</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" style={btnStyle('ghost')} onClick={() => setEditing(p)}>تعديل</button>
              <button type="button" style={btnStyle('danger')} onClick={() => handleDelete(p.id)}>حذف</button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

const STATUS_OPTIONS = [
  { id: 'new', label: 'جديد' },
  { id: 'confirmed', label: 'مؤكد' },
  { id: 'in_progress', label: 'قيد التجهيز' },
  { id: 'completed', label: 'مكتمل' },
  { id: 'cancelled', label: 'ملغى' },
];
const PAYMENT_STATUS_OPTIONS = [
  { id: 'awaiting_review', label: 'بانتظار مراجعة الدفع' },
  { id: 'approved', label: 'تم تأكيد الدفع' },
  { id: 'rejected', label: 'مرفوض' },
];

function BookingsTab() {
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {error && <p style={{ color: '#d2324f' }}>{error}</p>}
      {!bookings ? (
        <p>جارٍ التحميل...</p>
      ) : bookings.length === 0 ? (
        <p style={{ color: '#7b8087' }}>لا توجد حجوزات بعد.</p>
      ) : (
        bookings.map((b) => (
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
              <div><b>الفندق:</b> {b.hotel_choice || '—'}</div>
              <div><b>الرحلة:</b> {b.flight_choice || '—'}</div>
              <div><b>البالغون/الأطفال:</b> {b.adult_count} / {b.child_count}</div>
              <div><b>طريقة الدفع:</b> {b.payment_method || '—'}</div>
              {b.payment_proof_url && <div><a href={b.payment_proof_url} target="_blank" rel="noreferrer" style={{ color: '#036f8c' }}>إشعار الدفع ↗</a></div>}
            </div>

            {b.travelers?.length > 0 && (
              <div style={{ fontSize: 13.5, borderTop: '1px solid #ececed', paddingTop: 10 }}>
                <b>المسافرون:</b> {b.travelers.map((t) => `${t.full_name} (${t.traveler_type === 'adult' ? 'بالغ' : 'طفل'}${t.passport_number ? ' — ' + t.passport_number : ''})`).join('، ')}
              </div>
            )}

            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', borderTop: '1px solid #ececed', paddingTop: 12 }}>
              <label style={labelStyle}>حالة الدفع
                <select style={inputStyle} value={b.payment_status} onChange={(e) => updateStatus(b.id, 'payment_status', e.target.value)}>
                  {PAYMENT_STATUS_OPTIONS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                </select>
              </label>
              <label style={labelStyle}>حالة الحجز
                <select style={inputStyle} value={b.internal_status} onChange={(e) => updateStatus(b.id, 'internal_status', e.target.value)}>
                  {STATUS_OPTIONS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                </select>
              </label>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function blankDestination(kind) {
  return { name_ar: '', name_en: '', kind, sort_order: 0 };
}

function DestinationRow({ item, onSave, onDelete }) {
  const [form, setForm] = useState(item);
  const [saving, setSaving] = useState(false);
  const dirty = form.name_ar !== item.name_ar || form.name_en !== item.name_en || form.sort_order !== item.sort_order;

  async function save() {
    setSaving(true);
    try {
      await onSave(form);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 90px auto auto', gap: 8, alignItems: 'center' }}>
      <input style={inputStyle} placeholder="اسم المدينة (عربي)" value={form.name_ar} onChange={(e) => setForm((f) => ({ ...f, name_ar: e.target.value }))} />
      <input style={inputStyle} placeholder="City name (English)" value={form.name_en} onChange={(e) => setForm((f) => ({ ...f, name_en: e.target.value }))} />
      <input type="number" style={inputStyle} placeholder="الترتيب" value={form.sort_order} onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))} />
      <button type="button" style={btnStyle(dirty ? 'primary' : 'ghost')} disabled={!dirty || saving} onClick={save}>{saving ? '...' : 'حفظ'}</button>
      <button type="button" style={btnStyle('danger')} onClick={() => onDelete(item.id)}>حذف</button>
    </div>
  );
}

function DestinationsGroup({ title, kind, items, onAdd, onSave, onDelete }) {
  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h4 style={{ margin: 0, fontSize: 15 }}>{title}</h4>
        <button type="button" style={btnStyle('ghost')} onClick={() => onAdd(kind)}>+ إضافة مدينة</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.length === 0 && <span style={{ fontSize: 13, color: '#7b8087' }}>لا توجد مدن مضافة بعد.</span>}
        {items.map((it) => (
          <DestinationRow key={it.id} item={it} onSave={onSave} onDelete={onDelete} />
        ))}
      </div>
    </div>
  );
}

function DestinationsTab() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');

  function load() {
    api('/api/admin/destinations').then(setItems).catch((e) => setError(e.message));
  }
  useEffect(load, []);

  async function handleAdd(kind) {
    try {
      const created = await api('/api/admin/destinations', { method: 'POST', body: JSON.stringify(blankDestination(kind)) });
      setItems((list) => [...(list || []), created]);
    } catch (e) {
      setError(e.message);
    }
  }
  async function handleSave(form) {
    try {
      const updated = await api(`/api/admin/destinations/${form.id}`, { method: 'PUT', body: JSON.stringify(form) });
      setItems((list) => list.map((it) => (it.id === updated.id ? updated : it)));
    } catch (e) {
      setError(e.message);
    }
  }
  async function handleDelete(id) {
    if (!confirm('حذف هذه المدينة؟')) return;
    try {
      await api(`/api/admin/destinations/${id}`, { method: 'DELETE' });
      setItems((list) => list.filter((it) => it.id !== id));
    } catch (e) {
      setError(e.message);
    }
  }

  if (error) return <p style={{ color: '#d2324f' }}>{error}</p>;
  if (!items) return <p>جارٍ التحميل...</p>;

  const mostSearched = items.filter((it) => it.kind === 'most_searched');
  const popular = items.filter((it) => it.kind !== 'most_searched');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <p style={{ margin: 0, fontSize: 13.5, color: '#7b8087' }}>
        هذه المدن تظهر كاقتراحات عند الضغط على مربع البحث عن الوجهة في صفحة الباقات — "الأكثر بحثاً" تظهر كأزرار، و"مدن شائعة" تظهر كقائمة.
      </p>
      <DestinationsGroup title="الأكثر بحثاً" kind="most_searched" items={mostSearched} onAdd={handleAdd} onSave={handleSave} onDelete={handleDelete} />
      <DestinationsGroup title="مدن شائعة" kind="popular" items={popular} onAdd={handleAdd} onSave={handleSave} onDelete={handleDelete} />
    </div>
  );
}

export default function PackagesAdmin() {
  const [tab, setTab] = useState('packages');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {SUBTABS.map((s) => (
          <button key={s.id} type="button" style={btnStyle(tab === s.id ? 'primary' : 'ghost')} onClick={() => setTab(s.id)}>{s.label}</button>
        ))}
      </div>
      {tab === 'packages' ? <PackagesTab /> : tab === 'bookings' ? <BookingsTab /> : <DestinationsTab />}
    </div>
  );
}
