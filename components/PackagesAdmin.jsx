'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CATS, MEAL_PLANS } from '../lib/packagesData';
import { visibleHotels, hotelPrices, hotelHasEngine, packageUsesEngine, packageBasePrices, TRAVELLER_TYPES } from '../lib/packagePricing';
import GroupsImport from './GroupsImport';
import SupplierPicker from './SupplierPicker';
import ScanFill from './ScanFill';
import { mergeScan } from '../lib/scanMerge';
import { dateOnly, baghdadToday, packageUrgency } from '../lib/packageUrgency';

// Badge for the admin list: scheduled / expired / countdown.
function scheduleStatus(p) {
  const today = baghdadToday();
  const pub = dateOnly(p.publish_at), dep = dateOnly(p.departure_date);
  if (pub && pub > today) return { label: '⏳ مجدولة — تُنشر في ' + pub, style: { background: '#fff4dc', color: '#8a5a00' } };
  if (dep && dep < today) return { label: '⌛ انتهت — مخفية تلقائياً', style: { background: '#f1f3f5', color: '#7b8087' } };
  const u = packageUrgency(p, 'ar');
  if (u && u.label) return { label: '🔥 ' + u.label, style: { background: '#fdecef', color: '#c02643' } };
  return null;
}

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
  { id: 'countries', label: 'الدول السياحية' },
  { id: 'reviews', label: 'آراء العملاء' },
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
    adult_cost: 0, child_cost: 0, child_nobed_price: 0, infant_price: 0, child_nobed_cost: 0, infant_cost: 0, cost_currency: 'IQD', nights: '', day_count: '', available_dates: [], general_notes_ar: '', general_notes_en: '', price_currency: 'IQD', supplier_id: null, adult_commission: '', child_commission: '', child_nobed_commission: '', infant_commission: '',
    badge_ar: '', badge_en: '', prefs: [], includes_ar: [], includes_en: [],
    hotels: [], flights: [], days: [], image_url: '', pdf_banner_url: '', excludes_ar: [], excludes_en: [], active: true, sort_order: 0, rating: 4.8,
  };
}

// Pick the specific dates this group runs. Each date can carry its own price
// change (+/- IQD), e.g. Eid dates cost more. Stored as form.available_dates.
function GroupDatesPicker({ dates, onChange }) {
  const [month, setMonth] = React.useState(() => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() }; });
  const list = Array.isArray(dates) ? dates : [];
  const byDate = Object.fromEntries(list.map((d) => [d.date, d]));
  const iso = (y, m, day) => `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const toggle = (ds) => {
    if (byDate[ds]) onChange(list.filter((d) => d.date !== ds));
    else onChange([...list, { date: ds, adjust: 0 }].sort((a, b) => a.date.localeCompare(b.date)));
  };
  const setAdjust = (ds, v) => onChange(list.map((d) => (d.date === ds ? { ...d, adjust: Number(v) || 0 } : d)));
  const first = new Date(month.y, month.m, 1);
  const daysInMonth = new Date(month.y, month.m + 1, 0).getDate();
  const pad = first.getDay();
  const monthName = first.toLocaleDateString('ar-IQ', { month: 'long', year: 'numeric' });
  const shift = (n) => { let m = month.m + n, y = month.y; if (m < 0) { m = 11; y--; } if (m > 11) { m = 0; y++; } setMonth({ y, m }); };
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 16, alignItems: 'start', flexWrap: 'wrap' }}>
      <div style={{ border: '1px solid #ececed', borderRadius: 12, padding: 12, minWidth: 300 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <button type="button" style={btnStyle('ghost')} onClick={() => shift(-1)}>‹</button>
          <b style={{ fontSize: 14 }}>{monthName}</b>
          <button type="button" style={btnStyle('ghost')} onClick={() => shift(1)}>›</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, fontSize: 11, color: '#7b8087', textAlign: 'center', marginBottom: 4 }}>
          {['أحد', 'اثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت'].map((d) => <span key={d}>{d}</span>)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
          {Array.from({ length: pad }).map((_, i) => <span key={'p' + i} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1; const ds = iso(month.y, month.m, day);
            const on = !!byDate[ds]; const past = new Date(ds) < today;
            return (
              <button key={ds} type="button" disabled={past} onClick={() => toggle(ds)}
                style={{ aspectRatio: '1', borderRadius: 8, border: on ? '2px solid #049dc5' : '1px solid #ececed', background: on ? '#049dc5' : past ? '#f6f7f8' : '#fff', color: on ? '#fff' : past ? '#c9ced3' : '#1d2733', fontWeight: on ? 700 : 500, cursor: past ? 'default' : 'pointer', fontFamily: 'inherit', fontSize: 13 }}>
                {day}
              </button>
            );
          })}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 260 }}>
        <span style={{ fontSize: 12.5, color: '#7b8087' }}>اضغط على أي يوم لإضافته أو إزالته. يمكنك تعديل السعر لكل تاريخ (مثلاً +50000 لأيام العيد).</span>
        {list.length === 0 && <span style={{ fontSize: 13, color: '#c02643' }}>لم تُحدَّد أي تواريخ — لن تظهر هذه المجموعة للعملاء حتى تُضاف تواريخ.</span>}
        {list.map((d) => (
          <div key={d.date} style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #ececed', borderRadius: 8, padding: '6px 10px' }}>
            <b style={{ fontSize: 13, minWidth: 96 }} dir="ltr">{new Date(d.date).toLocaleDateString('ar-IQ', { day: 'numeric', month: 'short', year: 'numeric' })}</b>
            <span style={{ fontSize: 12, color: '#7b8087' }}>تعديل السعر:</span>
            <input type="number" value={d.adjust} onChange={(e) => setAdjust(d.date, e.target.value)} style={{ ...inputStyle, width: 110, padding: '6px 8px' }} placeholder="0" />
            <button type="button" style={btnStyle('danger')} onClick={() => toggle(d.date)}>حذف</button>
          </div>
        ))}
      </div>
    </div>
  );
}

const fmtN = (v) => (v == null || v === '' ? '—' : Number(v).toLocaleString('en-US'));

// Per-hotel pricing: the admin enters SELL + SETTLEMENT only; commission,
// customer prices and differences are computed live. Inputs only are saved.
function HotelPricingEditor({ form, h, idx, rate, primaryIdx, onChange, onCurrency }) {
  const isPrimary = primaryIdx === idx;
  const primary = primaryIdx >= 0 ? form.hotels[primaryIdx] : null;
  const calc = hotelPrices(form, h, rate);
  const primCalc = primary ? hotelPrices(form, primary, rate) : null;
  const diffOf = (k) => (!primCalc || calc.prices[k] == null || primCalc.prices[k] == null ? null : calc.prices[k] - primCalc.prices[k]);
  const engine = hotelHasEngine(h);
  const lower = primary && !isPrimary && engine && hotelHasEngine(primary) && Number(h.sellAdult) < Number(primary.sellAdult);
  const cur = form.price_currency === 'USD' ? '$' : 'د.ع';
  const field = (key, label, hint) => (
    <label key={key} style={{ ...labelStyle, fontSize: 12 }}>{label}{hint ? <span style={{ fontWeight: 400, color: '#7b8087' }}> {hint}</span> : null}
      <input type="number" min="0" style={inputStyle} placeholder="0" value={h[key] ?? ''} onChange={(e) => onChange(key, e.target.value === '' ? '' : Number(e.target.value))} />
    </label>
  );
  return (
    <div style={{ border: '1px dashed #cfe9f2', borderRadius: 10, padding: 10, display: 'flex', flexDirection: 'column', gap: 10, background: '#fbfeff' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: '#036f8c' }}>💰 الأسعار (بالـ{cur}) — أدخل البيع والتسديد فقط، والعمولة وأسعار العميل تُحسب تلقائياً</span>
        <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center', fontSize: 12 }}>
          عملة أسعار الفنادق:
          {['IQD', 'USD'].map((c) => (
            <button key={c} type="button" onClick={() => onCurrency && onCurrency(c)} style={{ cursor: 'pointer', padding: '4px 12px', borderRadius: 999, border: '1px solid ' + ((form.price_currency || 'IQD') === c ? '#049dc5' : '#ececed'), background: (form.price_currency || 'IQD') === c ? '#049dc5' : '#fff', color: (form.price_currency || 'IQD') === c ? '#fff' : '#3d4650', fontFamily: 'inherit', fontSize: 12, fontWeight: 700 }}>{c === 'USD' ? 'دولار $' : 'دينار'}</button>
          ))}
        </span>
      </div>
      {form.price_currency === 'USD' && <span style={{ fontSize: 11.5, color: '#7b8087' }}>تُحوَّل إلى الدينار تلقائياً بسعر الصرف ({fmtN(rate)} د.ع) وتُقرَّب إلى أقرب 1,000.</span>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 8 }}>
        {field('sellAdult', 'سعر البيع للبالغ')}
        {field('settleAdult', 'التسديد للبالغ', '(للشركة)')}
        {field('settleChildBed', 'التسديد — طفل بسرير', '(فارغ = غير متاح)')}
        {field('settleChildNoBed', 'التسديد — طفل بدون سرير', '(فارغ = غير متاح)')}
        {field('settleInfant', 'التسديد — رضيع', '(فارغ = غير متاح)')}
      </div>
      {lower && (
        <div style={{ background: '#fff4dc', border: '1px solid #f5dfa8', color: '#8a5a00', borderRadius: 8, padding: '8px 12px', fontSize: 12.5 }}>
          ⚠ سعر بيع هذا الفندق ({fmtN(h.sellAdult)}) أقل من الفندق الأساسي ({fmtN(primary.sellAdult)}). عادةً الفندق الأساسي هو الأرخص — أعد ترتيب الفنادق أو راجع السعر.
        </div>
      )}
      {engine ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 12, alignItems: 'start' }}>
          <div style={{ background: '#eefaf3', border: '1px solid #cdebd9', borderRadius: 8, padding: '8px 12px', fontSize: 12.5, minWidth: 150 }}>
            <div style={{ color: '#7b8087' }}>العمولة (داخلي — لا تظهر للعميل)</div>
            <b style={{ color: '#1a7f47', fontSize: 15 }}>{fmtN(calc.commission)} د.ع</b>
          </div>
          <div style={{ border: '1px solid #ececed', borderRadius: 8, overflow: 'hidden', fontSize: 12.5 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', background: '#f6f7f8', padding: '5px 10px', fontWeight: 700 }}><span>ما يراه العميل</span><span>السعر</span><span>{isPrimary ? 'الفندق الأساسي' : 'الفرق عن الأساسي'}</span></div>
            {TRAVELLER_TYPES.map((t) => {
              const v = calc.prices[t.key]; const d = diffOf(t.key);
              return (
                <div key={t.key} style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', padding: '4px 10px', borderTop: '1px solid #f1f3f5', color: v == null ? '#b0b6bb' : '#1d2733' }}>
                  <span>{t.ar}</span>
                  <span>{v == null ? 'غير متاح' : fmtN(v) + ' د.ع'}</span>
                  <span style={{ fontWeight: 700, color: d == null ? '#b0b6bb' : d > 0 ? '#049dc5' : d < 0 ? '#c02643' : '#7b8087' }}>
                    {isPrimary ? '—' : d == null ? '—' : d === 0 ? 'مشمول' : (d > 0 ? '+ ' : '− ') + fmtN(Math.abs(d))}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div style={{ fontSize: 12.5, color: '#7b8087', background: '#f6f7f8', borderRadius: 8, padding: '8px 12px' }}>
          هذا الفندق لا يزال بالطريقة القديمة (سعر الباقة + فرق). أدخل «سعر البيع للبالغ» و«التسديد» أعلاه ليتحوّل تلقائياً إلى التسعير الجديد.
          {(h.diff || h.diffChildBed || h.diffChildNoBed || h.diffInfant) ? ` (الفروق الحالية: بالغ +${fmtN(h.diff || 0)})` : ''}
        </div>
      )}
    </div>
  );
}

const CC_ROWS = [
  { key: 'adult', label: 'بالغ', cost: 'adult_cost', comm: 'adult_commission', price: 'price' },
  { key: 'childBed', label: 'طفل بسرير', cost: 'child_cost', comm: 'child_commission', price: 'child_price' },
  { key: 'childNoBed', label: 'طفل بدون سرير', cost: 'child_nobed_cost', comm: 'child_nobed_commission', price: 'child_nobed_price' },
  { key: 'infant', label: 'رضيع', cost: 'infant_cost', comm: 'infant_commission', price: 'infant_price' },
];
const hasNum = (v) => v !== undefined && v !== null && v !== '' && !Number.isNaN(Number(v));

// Package base price = internal cost + commission, per category. The admin enters
// the cost and the adult commission; the selling price is computed automatically.
function CostCommissionSection({ form, set, rate }) {
  const base = packageBasePrices(form, rate);
  const usd = form.cost_currency === 'USD';
  const sym = usd ? '$' : 'د.ع';
  const adultOn = hasNum(form.adult_commission);
  const input = (key, placeholder) => (
    <input type="number" style={inputStyle} placeholder={placeholder} value={form[key] ?? ''} onChange={(e) => set(key, e.target.value === '' ? '' : Number(e.target.value))} />
  );
  return (
    <div style={{ borderTop: '1px solid #ececed', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <span style={{ fontSize: 13.5, fontWeight: 700 }}>💰 التكلفة الداخلية والعمولة — سعر البيع يُحسب تلقائياً</span>
      <span style={{ fontSize: 12.5, color: '#7b8087', lineHeight: 1.8 }}>
        أدخل التكلفة الداخلية لكل فئة وعمولة البالغ. عمولة الطفل والرضيع تساوي عمولة البالغ تلقائياً (اتركها فارغة)، ويمكنك تغييرها لأي فئة.
        سعر البيع للعميل = التكلفة + العمولة، ويُقرَّب إلى أقرب 1,000. هذه البيانات داخلية ولا تظهر للعميل.
      </span>
      <label style={{ ...labelStyle, maxWidth: 420 }}>عملة التكلفة والعمولة
        <CostCurrencyPicker value={form.cost_currency || 'IQD'} onChange={(v) => set('cost_currency', v)} />
        {usd && <span style={{ fontSize: 11.5, color: '#7b8087', fontWeight: 400 }}>سعر البيع = (التكلفة + العمولة) × {fmtN(rate)} د.ع (سعر الصرف من الإعدادات).</span>}
      </label>
      <div style={{ border: '1px solid #ececed', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(96px,.7fr) 1fr 1fr 1fr', gap: 8, background: '#f6f7f8', padding: '8px 12px', fontSize: 12, fontWeight: 700, color: '#3d4650' }}>
          <span>الفئة</span><span>التكلفة الداخلية ({sym})</span><span>العمولة ({sym})</span><span>سعر البيع للعميل (د.ع)</span>
        </div>
        {CC_ROWS.map((r) => {
          const own = hasNum(form[r.comm]);
          const neg = own && Number(form[r.comm]) < 0;
          return (
            <div key={r.key} style={{ display: 'grid', gridTemplateColumns: 'minmax(96px,.7fr) 1fr 1fr 1fr', gap: 8, padding: '8px 12px', borderTop: '1px solid #f1f3f5', alignItems: 'center' }}>
              <b style={{ fontSize: 13.5 }}>{r.label}</b>
              {input(r.cost, '0')}
              <div>
                {input(r.comm, r.key === 'adult' ? '0' : adultOn ? String(form.adult_commission) : 'مثل البالغ')}
                {r.key !== 'adult' && !own && adultOn && <span style={{ fontSize: 11, color: '#1a7f47' }}>= عمولة البالغ تلقائياً</span>}
                {neg && <span style={{ fontSize: 11, color: '#c02643' }}>⚠ عمولة سالبة</span>}
              </div>
              <div style={{ fontWeight: 700, fontSize: 14, color: base ? '#049dc5' : '#7b8087' }}>
                {base ? fmtN(base[r.key]) + ' د.ع' : fmtN(form[r.price] || 0) + ' د.ع'}
                {!base && <span style={{ display: 'block', fontSize: 11, fontWeight: 400 }}>سعر قديم محفوظ</span>}
              </div>
            </div>
          );
        })}
      </div>
      {!adultOn && (
        <div style={{ background: '#fff4dc', border: '1px solid #f5dfa8', color: '#8a5a00', borderRadius: 8, padding: '8px 12px', fontSize: 12.5 }}>
          ما زال السعر القديم المحفوظ هو المعمول به. أدخل التكلفة وعمولة البالغ ليُحتسب سعر البيع تلقائياً بدلاً منه.
        </div>
      )}
    </div>
  );
}

function linesToArr(text) {
  return text.split('\n').map((s) => s.trim()).filter(Boolean);
}

// Text box that edits a list (one item per line, or comma separated).
// It keeps exactly what was typed — spaces and new lines included — and only
// hands the parent a cleaned-up array, so typing is never "eaten" mid-word.
function ListField({ value, onChange, separator = 'line', placeholder, multiline = true, minHeight = 80 }) {
  const join = (arr) => (arr || []).join(separator === 'line' ? '\n' : separator === 'ar-comma' ? '، ' : ', ');
  const [text, setText] = useState(() => join(value));
  const lastSent = React.useRef(value);
  React.useEffect(() => {
    // Only resync when the list was changed from outside (e.g. another package opened).
    if (value !== lastSent.current) {
      setText(join(value));
      lastSent.current = value;
    }
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps
  function handle(v) {
    setText(v);
    const parts = separator === 'line' ? v.split('\n') : v.split(/[,،]/);
    const arr = parts.map((s) => s.trim()).filter(Boolean);
    lastSent.current = arr;
    onChange(arr);
  }
  return multiline
    ? <textarea style={{ ...inputStyle, minHeight }} placeholder={placeholder} value={text} onChange={(e) => handle(e.target.value)} />
    : <input style={inputStyle} placeholder={placeholder} value={text} onChange={(e) => handle(e.target.value)} />;
}

function PackageForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initial);
  const [rate, setRate] = useState(1310);
  const formRef = useRef(form);
  formRef.current = form;
  // Scanned values go only into boxes that are still empty.
  function applyScan(fields) {
    const { next, count } = mergeScan(formRef.current, fields);
    if (count) setForm(next);
    return count;
  }
  useEffect(() => { fetch('/api/admin/settings').then((r) => r.json()).then((d) => d.usd_iqd_rate && setRate(Number(d.usd_iqd_rate))).catch(() => {}); }, []);
  const primaryIdx = (() => { const v = visibleHotels(form); return v.length ? (form.hotels || []).indexOf(v[0]) : -1; })();
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
      <ScanFill onResult={applyScan} />
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
        <label style={labelStyle}>عدد الليالي<input type="number" min="0" style={inputStyle} value={form.nights ?? ''} placeholder="مثال: 4" onChange={(e) => set('nights', e.target.value === '' ? '' : Number(e.target.value))} /></label>
        <label style={labelStyle}>عدد الأيام<input type="number" min="0" style={inputStyle} value={form.day_count ?? ''} placeholder="مثال: 5" onChange={(e) => set('day_count', e.target.value === '' ? '' : Number(e.target.value))} /></label>
        <label style={labelStyle}>مواعيد المغادرة (عربي)<input style={inputStyle} value={form.departs_ar} onChange={(e) => set('departs_ar', e.target.value)} /></label>
        <label style={labelStyle}>Departures (English)<input style={inputStyle} value={form.departs_en} onChange={(e) => set('departs_en', e.target.value)} /></label>
        {packageUsesEngine(form) && (
          <div style={{ gridColumn: '1 / -1', background: '#eefaf3', border: '1px solid #cdebd9', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#1a7f47' }}>
            ✓ أسعار هذه الباقة تُحسب تلقائياً من <b>الفندق الأساسي</b> (أول فندق ظاهر): سعر البيع الذي تدخله للفندق هو ما يراه العميل، والعمولة = البيع − التسديد تُضاف تلقائياً إلى باقي الفئات.
          </div>
        )}
        <label style={labelStyle}>🏢 المورد (داخلي — لا يظهر للعميل)
          <SupplierPicker value={form.supplier_id || null} onChange={(id) => set('supplier_id', id)} />
          <span style={{ fontSize: 11.5, color: '#7b8087', fontWeight: 400 }}>للتمييز بين الكروبات المتشابهة في الاسم والتابعة لموردين مختلفين.</span>
        </label>
        <label style={labelStyle}>شارة (عربي، اختياري)<input style={inputStyle} value={form.badge_ar} onChange={(e) => set('badge_ar', e.target.value)} placeholder="مثال: الأكثر طلباً" /></label>
        <label style={labelStyle}>Badge (English, optional)<input style={inputStyle} value={form.badge_en} onChange={(e) => set('badge_en', e.target.value)} /></label>
        <label style={labelStyle}>التقييم (من ٥)<input type="number" step="0.1" min="0" max="5" style={inputStyle} value={form.rating ?? 4.8} onChange={(e) => set('rating', Number(e.target.value))} /></label>
      </div>

      <div style={{ borderTop: '1px solid #ececed', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span style={{ fontSize: 13.5, fontWeight: 700 }}>📝 ملاحظات عامة للمجموعة</span>
        <span style={{ fontSize: 12.5, color: '#7b8087' }}>اختياري — مثل: «الإفطار مشمول»، «يُدفع 40% مقدماً عند الحجز»، سياسة الإلغاء، تأكيد الحجز. تظهر للعميل في صفحة الباقة وفي القسيمة فقط إذا كُتب فيها شيء.</span>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <textarea style={{ ...inputStyle, minHeight: 110, lineHeight: 1.7 }} placeholder={'سطر لكل ملاحظة (عربي)\nالإفطار مشمول\nيُدفع 40% مقدماً عند الحجز'} value={form.general_notes_ar || ''} onChange={(e) => set('general_notes_ar', e.target.value)} />
          <textarea style={{ ...inputStyle, minHeight: 110, lineHeight: 1.7, direction: 'ltr' }} placeholder={'One note per line (English)\nBreakfast included\n40% advance payment required'} value={form.general_notes_en || ''} onChange={(e) => set('general_notes_en', e.target.value)} />
        </div>
      </div>

      <div style={{ borderTop: '1px solid #ececed', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <span style={{ fontSize: 13.5, fontWeight: 700 }}>🗓 تواريخ توفّر المجموعة</span>
        <span style={{ fontSize: 12.5, color: '#7b8087' }}>حدّد الأيام التي تنطلق فيها هذه المجموعة. يختار العميل من هذه التواريخ فقط، ويظهر التاريخ في القسيمة (الفاوتشر). اترك الحقل فارغاً للباقات المتاحة يومياً.</span>
        <GroupDatesPicker dates={form.available_dates || []} onChange={(v) => set('available_dates', v)} />
      </div>

      {!packageUsesEngine(form) && <CostCommissionSection form={form} set={set} rate={rate} />}

      <div style={{ border: '1px solid #d9e9ef', background: '#f7fcfe', borderRadius: 12, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#036f8c' }}>🗓 النشر المجدول والعدّ التنازلي</span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 10 }}>
          <label style={labelStyle}>تاريخ النشر (تظهر الباقة من هذا اليوم)
            <input type="date" style={inputStyle} value={dateOnly(form.publish_at)} onChange={(e) => set('publish_at', e.target.value)} />
          </label>
          <label style={labelStyle}>تاريخ الانطلاق (تختفي الباقة تلقائياً بعده)
            <input type="date" style={inputStyle} value={dateOnly(form.departure_date)} onChange={(e) => set('departure_date', e.target.value)} />
          </label>
          <label style={labelStyle}>المقاعد المتبقية (اختياري)
            <input type="number" min="0" style={inputStyle} placeholder="مثال 8" value={form.seats_left ?? ''} onChange={(e) => set('seats_left', e.target.value)} />
          </label>
        </div>
        <span style={{ fontSize: 12, color: '#7b8087' }}>اترك الحقول فارغة إذا لا تحتاجها. عند إدخال تاريخ الانطلاق يظهر للعملاء "باقي 12 يوماً"، وعند إدخال المقاعد يظهر "8 مقاعد متبقية" — مناسب لباقات الحفلات والرياضة.</span>
      </div>
      <ImageUploadField label="صورة الغلاف" value={form.image_url} onChange={(url) => set('image_url', url)} />
      <ImageUploadField label="بانر ملف PDF (صورة عريضة للدولة/الوجهة — إذا تُركت فارغة تُستخدم صورة الغلاف)" value={form.pdf_banner_url || ''} onChange={(url) => set('pdf_banner_url', url)} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <label style={labelStyle}>✅ السعر يشمل — سطر لكل بند (عربي)
          <ListField value={form.includes_ar} onChange={(v) => set('includes_ar', v)} placeholder={'الفندق\nالطيران ذهاب وعودة\nالإفطار\nالتنقلات من وإلى المطار'} />
        </label>
        <label style={labelStyle}>✅ Price includes — one per line (English)
          <ListField value={form.includes_en} onChange={(v) => set('includes_en', v)} placeholder={'Hotel\nReturn flights\nBreakfast\nAirport transfers'} />
        </label>
        <label style={labelStyle}>❌ السعر لا يشمل — سطر لكل بند (عربي)
          <ListField value={form.excludes_ar} onChange={(v) => set('excludes_ar', v)} placeholder={'رسوم التأشيرة\nوجبات الغداء والعشاء\nالمصاريف الشخصية'} />
        </label>
        <label style={labelStyle}>❌ Price does not include — one per line (English)
          <ListField value={form.excludes_en} onChange={(v) => set('excludes_en', v)} placeholder={'Visa fees\nLunch and dinner\nPersonal expenses'} />
        </label>
      </div>

      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 13.5, fontWeight: 700 }}>خيارات الفنادق</span>
          <button type="button" style={btnStyle('ghost')} onClick={() => addRow('hotels', { nameAr: '', nameEn: '', notesAr: '', notesEn: '', hidden: false, sellAdult: '', settleAdult: '', settleChildBed: '', settleChildNoBed: '', settleInfant: '', singleDiff: 0, diff: 0, diffChildBed: 0, diffChildNoBed: 0, diffInfant: 0, imageUrl: '', extraImages: [], locationUrl: '', location: '', amenitiesAr: [], amenitiesEn: [], lat: '', lng: '' })}>+ إضافة فندق</button>
        </div>
        {(form.hotels || []).map((h, idx) => (
          <div key={idx} style={{ border: '1px solid #ececed', borderRadius: 10, padding: 10, marginBottom: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: h.hidden ? '#7b8087' : '#036f8c', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                {primaryIdx === idx ? '🏨 الفندق الأساسي (المرجع للأسعار)' : `🏨 الفندق رقم ${idx + 1}`}
                {h.hidden && <span style={{ fontSize: 11.5, fontWeight: 700, background: '#f1f3f5', color: '#7b8087', borderRadius: 999, padding: '2px 9px' }}>🚫 مخفي عن العملاء</span>}
              </span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button type="button" style={{ ...btnStyle('ghost'), color: h.hidden ? '#1a7f47' : '#8a5a00' }} onClick={() => updateRow('hotels', idx, 'hidden', !h.hidden)}>{h.hidden ? '👁 إظهار للعملاء' : '🚫 إخفاء عن العملاء'}</button>
                <button type="button" style={btnStyle('danger')} onClick={() => removeRow('hotels', idx)}>حذف الفندق</button>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <input style={inputStyle} placeholder="اسم الفندق (عربي)" value={h.nameAr} onChange={(e) => updateRow('hotels', idx, 'nameAr', e.target.value)} />
              <input style={inputStyle} placeholder="Hotel name (English)" value={h.nameEn} onChange={(e) => updateRow('hotels', idx, 'nameEn', e.target.value)} />
            </div>
            <label style={{ ...labelStyle, fontSize: 12.5 }}>🛏 فرق السنكل (الغرفة المفردة) — يُضاف فوق سعر البالغ في هذا الفندق
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="number" min="0" style={{ ...inputStyle, maxWidth: 220 }} placeholder="مثال: 295000" value={h.singleDiff ?? ''} onChange={(e) => updateRow('hotels', idx, 'singleDiff', e.target.value === '' ? '' : Math.max(0, Number(e.target.value) || 0))} />
                <span style={{ fontSize: 12.5, color: '#7b8087' }}>
                  {Number(h.singleDiff) > 0 ? `سعر السنكل للعميل = سعر البالغ في هذا الفندق + ${Number(h.singleDiff).toLocaleString('en-US')}` : 'اتركه فارغاً أو 0 إذا لا يوجد فرق'}
                </span>
              </div>
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <input style={inputStyle} placeholder="ملاحظة خاصة بالفندق (اختياري)، مثال: مع الإفطار / يُضاف 40000 للإفطار" value={h.notesAr || ''} onChange={(e) => updateRow('hotels', idx, 'notesAr', e.target.value)} />
              <input style={{ ...inputStyle, direction: 'ltr' }} placeholder="Hotel note (optional), e.g. Breakfast included" value={h.notesEn || ''} onChange={(e) => updateRow('hotels', idx, 'notesEn', e.target.value)} />
            </div>
            <HotelPricingEditor form={form} h={h} idx={idx} rate={rate} primaryIdx={primaryIdx} onChange={(field, v) => updateRow('hotels', idx, field, v)} onCurrency={(v) => set('price_currency', v)} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
              <input style={inputStyle} placeholder="الموقع، مثال: لندن، المملكة المتحدة" value={h.location || ''} onChange={(e) => updateRow('hotels', idx, 'location', e.target.value)} />
              <input style={inputStyle} dir="ltr" placeholder="رابط موقع الفندق (Booking / خرائط Google)، مثال: https://maps.app.goo.gl/…" value={h.locationUrl || ''} onChange={(e) => updateRow('hotels', idx, 'locationUrl', e.target.value)} />
              <ListField multiline={false} separator="ar-comma" placeholder="المرافق (عربي) — مفصولة بفاصلة، مثال: إفطار، واي فاي مجاني، مرشد سياحي" value={h.amenitiesAr} onChange={(v) => updateRow('hotels', idx, 'amenitiesAr', v)} />
              <ListField multiline={false} separator="comma" placeholder="Amenities (English), comma separated: Breakfast, Free WiFi, Gym" value={h.amenitiesEn} onChange={(v) => updateRow('hotels', idx, 'amenitiesEn', v)} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <input type="number" step="any" style={inputStyle} placeholder="خط العرض Latitude، مثال: 33.3152" value={h.lat || ''} onChange={(e) => updateRow('hotels', idx, 'lat', e.target.value)} />
              <input type="number" step="any" style={inputStyle} placeholder="خط الطول Longitude، مثال: 44.3661" value={h.lng || ''} onChange={(e) => updateRow('hotels', idx, 'lng', e.target.value)} />
            </div>
            <span style={{ fontSize: 11.5, color: '#7b8087' }}>
              أدخلوا الإحداثيات لعرض موقع الفندق على الخريطة في صفحة الباقة. يمكن نسخها من خرائط جوجل: افتحوا موقع الفندق في خرائط جوجل، ثم انسخوا الرقمين من شريط العنوان أو من "مشاركة" ← "نسخ الإحداثيات".
            </span>
            <div style={{ borderTop: '1px dashed #ececed', paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: '#036f8c' }}>تفاصيل الفندق في ملف PDF</span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 8 }}>
                <label style={labelStyle}>عدد النجوم
                  <select style={inputStyle} value={h.stars || ''} onChange={(e) => updateRow('hotels', idx, 'stars', e.target.value ? Number(e.target.value) : '')}>
                    <option value="">—</option>{[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{'★'.repeat(n)}</option>)}
                  </select>
                </label>
                <label style={labelStyle}>تقييم الفندق من 100
                  <input type="number" min="0" max="100" style={inputStyle} placeholder="مثال 88" value={h.reviewScore || ''} onChange={(e) => updateRow('hotels', idx, 'reviewScore', e.target.value)} />
                </label>
                <label style={labelStyle}>نظام الوجبات
                  <select style={inputStyle} value={h.meal || ''} onChange={(e) => updateRow('hotels', idx, 'meal', e.target.value)}>
                    <option value="">—</option>
                    {Object.entries(MEAL_PLANS).map(([k, v]) => <option key={k} value={k}>{v.ar}</option>)}
                  </select>
                </label>
                <label style={labelStyle}>سياسة الإلغاء
                  <select style={inputStyle} value={h.refundable || ''} onChange={(e) => updateRow('hotels', idx, 'refundable', e.target.value)}>
                    <option value="">—</option><option value="yes">قابل للاسترداد</option><option value="no">غير قابل للاسترداد</option>
                  </select>
                </label>
              </div>
              <input style={inputStyle} placeholder="العنوان الكامل للفندق" value={h.address || ''} onChange={(e) => updateRow('hotels', idx, 'address', e.target.value)} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <input style={inputStyle} placeholder="نوع الغرفة (عربي)، مثال: غرفة قياسية" value={h.roomAr || ''} onChange={(e) => updateRow('hotels', idx, 'roomAr', e.target.value)} />
                <input style={inputStyle} placeholder="Room type (English), e.g. Standard Room" value={h.roomEn || ''} onChange={(e) => updateRow('hotels', idx, 'roomEn', e.target.value)} />
                <input style={inputStyle} placeholder="السرير (عربي)، مثال: سرير كينغ" value={h.bedAr || ''} onChange={(e) => updateRow('hotels', idx, 'bedAr', e.target.value)} />
                <input style={inputStyle} placeholder="Bed (English), e.g. 1 King Bed" value={h.bedEn || ''} onChange={(e) => updateRow('hotels', idx, 'bedEn', e.target.value)} />
                <input style={inputStyle} placeholder="الإطلالة (عربي)، مثال: إطلالة على المدينة" value={h.viewAr || ''} onChange={(e) => updateRow('hotels', idx, 'viewAr', e.target.value)} />
                <input style={inputStyle} placeholder="View (English), e.g. City view" value={h.viewEn || ''} onChange={(e) => updateRow('hotels', idx, 'viewEn', e.target.value)} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <textarea style={{ ...inputStyle, minHeight: 70 }} placeholder="نبذة عن الفندق (عربي)" value={h.overviewAr || ''} onChange={(e) => updateRow('hotels', idx, 'overviewAr', e.target.value)} />
                <textarea style={{ ...inputStyle, minHeight: 70 }} placeholder="Hotel overview (English)" value={h.overviewEn || ''} onChange={(e) => updateRow('hotels', idx, 'overviewEn', e.target.value)} />
                <textarea style={{ ...inputStyle, minHeight: 70 }} placeholder="أماكن قريبة — سطر لكل مكان (عربي)" value={(h.nearbyAr || []).join('\n')} onChange={(e) => updateRow('hotels', idx, 'nearbyAr', e.target.value.split('\n'))} />
                <textarea style={{ ...inputStyle, minHeight: 70 }} placeholder="Nearby places — one per line (English)" value={(h.nearbyEn || []).join('\n')} onChange={(e) => updateRow('hotels', idx, 'nearbyEn', e.target.value.split('\n'))} />
                <textarea style={{ ...inputStyle, minHeight: 70 }} placeholder="سياسات وتعليمات الدخول — سطر لكل بند (عربي)" value={(h.policiesAr || []).join('\n')} onChange={(e) => updateRow('hotels', idx, 'policiesAr', e.target.value.split('\n'))} />
                <textarea style={{ ...inputStyle, minHeight: 70 }} placeholder="Policies & check-in — one per line (English)" value={(h.policiesEn || []).join('\n')} onChange={(e) => updateRow('hotels', idx, 'policiesEn', e.target.value.split('\n'))} />
              </div>
            </div>
            <ImageUploadField label="الصورة الرئيسية للفندق" value={h.imageUrl || ''} onChange={(url) => updateRow('hotels', idx, 'imageUrl', url)} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, borderTop: '1px dashed #ececed', paddingTop: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: '#036f8c' }}>صور إضافية للفندق ({(h.extraImages || []).length})</span>
                <button
                  type="button"
                  style={btnStyle('ghost')}
                  onClick={() => updateRow('hotels', idx, 'extraImages', [...(h.extraImages || []), ''])}
                >
                  + إضافة صورة
                </button>
              </div>
              {(h.extraImages || []).map((imgUrl, imgIdx) => (
                <div key={imgIdx} style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <ImageUploadField
                      label={`صورة إضافية ${imgIdx + 1}`}
                      value={imgUrl}
                      onChange={(url) => {
                        const next = [...(h.extraImages || [])];
                        next[imgIdx] = url;
                        updateRow('hotels', idx, 'extraImages', next);
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    style={btnStyle('danger')}
                    onClick={() => {
                      const next = [...(h.extraImages || [])];
                      next.splice(imgIdx, 1);
                      updateRow('hotels', idx, 'extraImages', next);
                    }}
                  >
                    حذف
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 13.5, fontWeight: 700 }}>خيارات الرحلات</span>
          <button type="button" style={btnStyle('ghost')} onClick={() => addRow('flights', {
            nameAr: '', nameEn: '', diff: 0, diffChildBed: 0, diffChildNoBed: 0, diffInfant: 0,
            outFlightNo: '', outFromCity: '', outToCity: '', outDepartTime: '', outArriveTime: '', outDuration: '',
            retFlightNo: '', retFromCity: '', retToCity: '', retDepartTime: '', retArriveTime: '', retDuration: '',
          })}>+ إضافة رحلة</button>
        </div>
        {(form.flights || []).map((f, idx) => (
          <div key={idx} style={{ border: '1px solid #ececed', borderRadius: 10, padding: 10, marginBottom: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#036f8c' }}>{idx === 0 ? '✈ الرحلة الأولى (الخيار الافتراضي)' : `✈ رحلة الطيران رقم ${idx + 1}`}</span>
              <button type="button" style={btnStyle('danger')} onClick={() => removeRow('flights', idx)}>حذف الرحلة</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <input style={inputStyle} placeholder="اسم شركة الطيران (عربي)" value={f.nameAr} onChange={(e) => updateRow('flights', idx, 'nameAr', e.target.value)} />
              <input style={inputStyle} placeholder="Airline (English)" value={f.nameEn} onChange={(e) => updateRow('flights', idx, 'nameEn', e.target.value)} />
            </div>
            {idx === 0 ? (
              <div style={{ ...inputStyle, background: '#eefaf3', color: '#1a7f47', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>✓ الخيار الأول مشمول بسعر الباقة (+0) لجميع الأنواع</div>
            ) : (
              <div>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: '#036f8c' }}>السعر الإضافي لكل نوع (يُضاف فوق سعر الباقة إذا اختار العميل هذه الرحلة)</span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 8, marginTop: 6 }}>
                  {[['diff','بالغ'],['diffChildBed','طفل بسرير'],['diffChildNoBed','طفل بدون سرير'],['diffInfant','رضيع']].map(([field,label]) => (
                    <label key={field} style={{ ...labelStyle, fontSize: 12 }}>+ {label}
                      <input type="number" min="0" style={inputStyle} placeholder="0" value={f[field] ?? (field === 'diff' ? f.diff : 0) ?? 0} onChange={(e) => updateRow('flights', idx, field, Math.max(0, Number(e.target.value) || 0))} />
                    </label>
                  ))}
                </div>
              </div>
            )}
            <ImageUploadField label="شعار شركة الطيران (يظهر على بطاقة الرحلة في PDF)" value={f.logoUrl || ''} onChange={(url) => updateRow('flights', idx, 'logoUrl', url)} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 8 }}>
              <input style={inputStyle} placeholder="الدرجة (عربي)، مثال: سياحية" value={f.cabinAr || ''} onChange={(e) => updateRow('flights', idx, 'cabinAr', e.target.value)} />
              <input style={inputStyle} placeholder="Cabin (English), e.g. Economy" value={f.cabinEn || ''} onChange={(e) => updateRow('flights', idx, 'cabinEn', e.target.value)} />
              <input style={inputStyle} placeholder="الأمتعة، مثال: 30 كغ" value={f.baggage || ''} onChange={(e) => updateRow('flights', idx, 'baggage', e.target.value)} />
            </div>
            <div style={{ borderTop: '1px dashed #ececed', paddingTop: 8 }}>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: '#036f8c' }}>✈ رحلة الذهاب</span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(110px,1fr))', gap: 8, marginTop: 6 }}>
                <input style={inputStyle} placeholder="رقم الرحلة" value={f.outFlightNo || ''} onChange={(e) => updateRow('flights', idx, 'outFlightNo', e.target.value)} />
                <input style={inputStyle} placeholder="مدينة الانطلاق" value={f.outFromCity || ''} onChange={(e) => updateRow('flights', idx, 'outFromCity', e.target.value)} />
                <input style={inputStyle} placeholder="مدينة الوصول" value={f.outToCity || ''} onChange={(e) => updateRow('flights', idx, 'outToCity', e.target.value)} />
                <input style={inputStyle} placeholder="وقت المغادرة، مثال 15:00" value={f.outDepartTime || ''} onChange={(e) => updateRow('flights', idx, 'outDepartTime', e.target.value)} />
                <input style={inputStyle} placeholder="وقت الوصول، مثال 17:05" value={f.outArriveTime || ''} onChange={(e) => updateRow('flights', idx, 'outArriveTime', e.target.value)} />
                <input style={inputStyle} placeholder="المدة، مثال 2h 05m" value={f.outDuration || ''} onChange={(e) => updateRow('flights', idx, 'outDuration', e.target.value)} />
              </div>
            </div>
            <div style={{ borderTop: '1px dashed #ececed', paddingTop: 8 }}>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: '#036f8c' }}>✈ رحلة العودة</span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(110px,1fr))', gap: 8, marginTop: 6 }}>
                <input style={inputStyle} placeholder="رقم الرحلة" value={f.retFlightNo || ''} onChange={(e) => updateRow('flights', idx, 'retFlightNo', e.target.value)} />
                <input style={inputStyle} placeholder="مدينة الانطلاق" value={f.retFromCity || ''} onChange={(e) => updateRow('flights', idx, 'retFromCity', e.target.value)} />
                <input style={inputStyle} placeholder="مدينة الوصول" value={f.retToCity || ''} onChange={(e) => updateRow('flights', idx, 'retToCity', e.target.value)} />
                <input style={inputStyle} placeholder="وقت المغادرة، مثال 15:00" value={f.retDepartTime || ''} onChange={(e) => updateRow('flights', idx, 'retDepartTime', e.target.value)} />
                <input style={inputStyle} placeholder="وقت الوصول، مثال 17:05" value={f.retArriveTime || ''} onChange={(e) => updateRow('flights', idx, 'retArriveTime', e.target.value)} />
                <input style={inputStyle} placeholder="المدة، مثال 2h 05m" value={f.retDuration || ''} onChange={(e) => updateRow('flights', idx, 'retDuration', e.target.value)} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 13.5, fontWeight: 700 }}>برنامج الرحلة يوماً بيوم</span>
          <button type="button" style={btnStyle('ghost')} onClick={() => addRow('days', { titleAr: '', descAr: '', titleEn: '', descEn: '', imageUrl: '' })}>+ إضافة يوم</button>
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
            <ImageUploadField label={`صورة اليوم ${idx + 1} (تظهر في ملف PDF)`} value={d.imageUrl || ''} onChange={(url) => updateRow('days', idx, 'imageUrl', url)} />
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
  const [supplierFilter, setSupplierFilter] = useState('');
  const [editing, setEditing] = useState(null); // package object or 'new' or null
  const [saving, setSaving] = useState(false);
  const [duplicating, setDuplicating] = useState(null);
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

  // Duplicate a group: copies everything (hotels, flights, dates, prices...)
  // as a NEW hidden package so it never goes live by accident.
  async function handleDuplicate(p) {
    setError('');
    setDuplicating(p.id);
    try {
      const { id, supplier_name, created_at, updated_at, ...rest } = p;
      const copy = {
        ...rest,
        day_count: p.day_count ?? '',
        title_ar: `${p.title_ar || ''} (نسخة)`,
        title_en: p.title_en ? `${p.title_en} (Copy)` : '',
        active: false,
      };
      const created = await api('/api/admin/packages', { method: 'POST', body: JSON.stringify(copy) });
      // Put the copy right after the original in the saved order.
      const ids = (packages || []).map((x) => x.id);
      const at = ids.indexOf(p.id);
      ids.splice(at >= 0 ? at + 1 : ids.length, 0, created.id);
      await api('/api/admin/packages/reorder', { method: 'POST', body: JSON.stringify({ ids }) });
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setDuplicating(null);
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
      <GroupsImport onDone={load} />
      {Array.isArray(packages) && (() => {
        const names = [...new Set(packages.map((p) => p.supplier_name).filter(Boolean))].sort();
        if (!names.length) return null;
        return (
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: '#3d4650' }}>
            تصفية حسب المورد:
            <select value={supplierFilter} onChange={(e) => setSupplierFilter(e.target.value)} style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #ececed', fontFamily: 'inherit', minWidth: 200 }}>
              <option value="">— كل الموردين ({packages.length}) —</option>
              {names.map((n) => <option key={n} value={n}>{n} ({packages.filter((p) => p.supplier_name === n).length})</option>)}
              <option value="__none__">بدون مورد ({packages.filter((p) => !p.supplier_name).length})</option>
            </select>
          </label>
        );
      })()}
      <div>
        <button type="button" style={btnStyle('primary')} onClick={() => setEditing('new')}>+ إضافة باقة جديدة</button>
      </div>
      {!packages ? (
        <p>جارٍ التحميل...</p>
      ) : packages.length === 0 ? (
        <p style={{ color: '#7b8087' }}>لا توجد باقات بعد.</p>
      ) : (
        packages.filter((p) => !supplierFilter || (supplierFilter === '__none__' ? !p.supplier_name : p.supplier_name === supplierFilter)).map((p) => (
          <div key={p.id} style={{ ...cardStyle, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: 700 }}>{p.title_ar} {!p.active && <span style={{ color: '#d2324f', fontSize: 12 }}>(مخفية)</span>}
                {p.supplier_name && <span style={{ marginInlineStart: 6, fontSize: 11.5, fontWeight: 700, borderRadius: 999, padding: '1px 9px', background: '#f3f0ff', color: '#5b3fb5', border: '1px solid #e2daf8' }}>🏢 {p.supplier_name}</span>}
                {p.active && scheduleStatus(p) && <span style={{ marginInlineStart: 6, fontSize: 12, fontWeight: 700, borderRadius: 999, padding: '1px 9px', ...scheduleStatus(p).style }}>{scheduleStatus(p).label}</span>}
              </div>
              <div style={{ fontSize: 13, color: '#7b8087' }}>{p.dest_ar} · {p.nights_ar} · {Number(p.price).toLocaleString()} IQD</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" style={btnStyle('ghost')} onClick={() => setEditing(p)}>تعديل</button>
              <button type="button" style={btnStyle('ghost')} disabled={duplicating === p.id} onClick={() => handleDuplicate(p)}>{duplicating === p.id ? '...' : '⧉ نسخ'}</button>
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

function blankCountry() {
  return { name_ar: '', name_en: '', flag_code: '', region_ar: '', region_en: '', sort_order: 0, lat: '', lng: '' };
}

function CountryRow({ item, onSave, onDelete }) {
  const [form, setForm] = useState(item);
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const dirty = JSON.stringify(form) !== JSON.stringify(item);

  async function save() {
    setSaving(true);
    try {
      await onSave(form);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ border: '1px solid #ececed', borderRadius: 10, padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 8 }}>
        <input style={inputStyle} placeholder="اسم الدولة (عربي)" value={form.name_ar} onChange={(e) => set('name_ar', e.target.value)} />
        <input style={inputStyle} placeholder="Country name (English)" value={form.name_en} onChange={(e) => set('name_en', e.target.value)} />
        <input style={inputStyle} placeholder="المنطقة (عربي)، مثال: دول الشرق الأوسط" value={form.region_ar} onChange={(e) => set('region_ar', e.target.value)} />
        <input style={inputStyle} placeholder="Region (English), e.g. Middle east countries" value={form.region_en} onChange={(e) => set('region_en', e.target.value)} />
        <input type="number" style={inputStyle} placeholder="الترتيب" value={form.sort_order} onChange={(e) => set('sort_order', Number(e.target.value))} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 8 }}>
        <input type="number" step="any" style={inputStyle} placeholder="خط العرض Latitude (للكرة الأرضية)، مثال: 25.276987" value={form.lat ?? ''} onChange={(e) => set('lat', e.target.value)} />
        <input type="number" step="any" style={inputStyle} placeholder="خط الطول Longitude، مثال: 55.296249" value={form.lng ?? ''} onChange={(e) => set('lng', e.target.value)} />
      </div>
      <span style={{ fontSize: 11.5, color: '#7b8087' }}>
        الإحداثيات اختيارية — إن وُجدت، تظهر الدولة كنقطة قابلة للضغط على الكرة الأرضية ثلاثية الأبعاد بصفحة الباقات.
      </span>
      <ImageUploadField label="علم الدولة" value={form.flag_code} onChange={(url) => set('flag_code', url)} />
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button type="button" style={btnStyle(dirty ? 'primary' : 'ghost')} disabled={!dirty || saving} onClick={save}>{saving ? '...' : 'حفظ'}</button>
        <button type="button" style={btnStyle('danger')} onClick={() => onDelete(item.id)}>حذف</button>
      </div>
    </div>
  );
}

function blankRegionBanner() {
  return { region_ar: '', region_en: '', image_url: '', deal_text_ar: '', deal_text_en: '', sort_order: 0 };
}

function RegionBannerRow({ item, onSave, onDelete }) {
  const [form, setForm] = useState(item);
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const dirty = JSON.stringify(form) !== JSON.stringify(item);

  async function save() {
    setSaving(true);
    try {
      await onSave(form);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ border: '1px solid #ececed', borderRadius: 10, padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 8 }}>
        <input style={inputStyle} placeholder="اسم المنطقة (عربي) — طابقوه مع حقل المنطقة في الدول أدناه" value={form.region_ar} onChange={(e) => set('region_ar', e.target.value)} />
        <input style={inputStyle} placeholder="Region name (English)" value={form.region_en} onChange={(e) => set('region_en', e.target.value)} />
        <input style={inputStyle} placeholder="شارة الخصم (عربي)، مثال: خصومات حتى ٥٣٪" value={form.deal_text_ar} onChange={(e) => set('deal_text_ar', e.target.value)} />
        <input style={inputStyle} placeholder="Deal badge (English), e.g. Deals up to 53%" value={form.deal_text_en} onChange={(e) => set('deal_text_en', e.target.value)} />
        <input type="number" style={inputStyle} placeholder="الترتيب" value={form.sort_order} onChange={(e) => set('sort_order', Number(e.target.value))} />
      </div>
      <ImageUploadField label="صورة غلاف المنطقة" value={form.image_url} onChange={(url) => set('image_url', url)} />
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button type="button" style={btnStyle(dirty ? 'primary' : 'ghost')} disabled={!dirty || saving} onClick={save}>{saving ? '...' : 'حفظ'}</button>
        <button type="button" style={btnStyle('danger')} onClick={() => onDelete(item.id)}>حذف</button>
      </div>
    </div>
  );
}

function RegionBannersEditor({ countries }) {
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');

  function load() {
    api('/api/admin/regions').then(setItems).catch((e) => setError(e.message));
  }
  useEffect(load, []);

  const usedRegions = useMemo(() => {
    const map = new Map();
    (countries || []).forEach((c) => {
      if (c.region_ar && !map.has(c.region_ar)) map.set(c.region_ar, c.region_en || '');
    });
    return Array.from(map.entries());
  }, [countries]);

  const coveredSet = new Set((items || []).map((it) => it.region_ar));
  const missing = usedRegions.filter(([ar]) => !coveredSet.has(ar));

  async function handleAddFor(regionAr, regionEn) {
    try {
      const created = await api('/api/admin/regions', { method: 'POST', body: JSON.stringify({ ...blankRegionBanner(), region_ar: regionAr, region_en: regionEn }) });
      setItems((list) => [...(list || []), created]);
    } catch (e) {
      setError(e.message);
    }
  }
  async function handleAdd() {
    try {
      const created = await api('/api/admin/regions', { method: 'POST', body: JSON.stringify(blankRegionBanner()) });
      setItems((list) => [...(list || []), created]);
    } catch (e) {
      setError(e.message);
    }
  }
  async function handleSave(form) {
    try {
      const updated = await api(`/api/admin/regions/${form.id}`, { method: 'PUT', body: JSON.stringify(form) });
      setItems((list) => list.map((it) => (it.id === updated.id ? updated : it)));
    } catch (e) {
      setError(e.message);
    }
  }
  async function handleDelete(id) {
    if (!confirm('حذف صورة غلاف هذه المنطقة؟')) return;
    try {
      await api(`/api/admin/regions/${id}`, { method: 'DELETE' });
      setItems((list) => list.filter((it) => it.id !== id));
    } catch (e) {
      setError(e.message);
    }
  }

  if (error) return <p style={{ color: '#d2324f' }}>{error}</p>;
  if (!items) return <p>جارٍ التحميل...</p>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <p style={{ margin: 0, fontSize: 13, color: '#7b8087' }}>
        صورة غلاف وشارة خصم تظهر أعلى قائمة كل منطقة في قسم "كل دول الرحلات".
      </p>

      {missing.length > 0 && (
        <div style={{ background: '#eaf8fd', border: '1px solid #bfe9f6', borderRadius: 12, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#036f8c' }}>مناطق بلا صورة غلاف بعد — اضغطوا للإضافة مباشرة:</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {missing.map(([ar, en]) => (
              <button key={ar} type="button" style={btnStyle('primary')} onClick={() => handleAddFor(ar, en)}>
                + صورة لـ «{ar}»
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button type="button" style={btnStyle('ghost')} onClick={handleAdd}>+ إضافة غلاف منطقة يدوياً</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.length === 0 && <p style={{ color: '#7b8087' }}>لا توجد أغلفة مناطق بعد.</p>}
        {items.map((it) => (
          <RegionBannerRow key={it.id} item={it} onSave={handleSave} onDelete={handleDelete} />
        ))}
      </div>
    </div>
  );
}

function CountriesTab() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');

  function load() {
    api('/api/admin/countries').then(setItems).catch((e) => setError(e.message));
  }
  useEffect(load, []);

  async function handleAdd() {
    try {
      const created = await api('/api/admin/countries', { method: 'POST', body: JSON.stringify(blankCountry()) });
      setItems((list) => [...(list || []), created]);
    } catch (e) {
      setError(e.message);
    }
  }
  async function handleSave(form) {
    try {
      const updated = await api(`/api/admin/countries/${form.id}`, { method: 'PUT', body: JSON.stringify(form) });
      setItems((list) => list.map((it) => (it.id === updated.id ? updated : it)));
    } catch (e) {
      setError(e.message);
    }
  }
  async function handleDelete(id) {
    if (!confirm('حذف هذه الدولة؟')) return;
    try {
      await api(`/api/admin/countries/${id}`, { method: 'DELETE' });
      setItems((list) => list.filter((it) => it.id !== id));
    } catch (e) {
      setError(e.message);
    }
  }

  if (error) return <p style={{ color: '#d2324f' }}>{error}</p>;
  if (!items) return <p>جارٍ التحميل...</p>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <p style={{ margin: 0, fontSize: 13.5, color: '#7b8087' }}>
        هذه الدول تظهر في قسم "كل دول الرحلات" بصفحة الباقات، مجمّعة حسب المنطقة التي تكتبونها لكل دولة.
      </p>
      <div style={{ background: '#f8f7f8', border: '1px solid #ececed', borderRadius: 14, padding: 16 }}>
        <h4 style={{ margin: '0 0 10px', fontSize: 14 }}>أغلفة المناطق وشارات الخصم</h4>
        <RegionBannersEditor countries={items} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button type="button" style={btnStyle('primary')} onClick={handleAdd}>+ إضافة دولة</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.length === 0 && <p style={{ color: '#7b8087' }}>لا توجد دول بعد.</p>}
        {items.map((it) => (
          <CountryRow key={it.id} item={it} onSave={handleSave} onDelete={handleDelete} />
        ))}
      </div>
    </div>
  );
}

function blankReview() {
  return { name_ar: '', name_en: '', text_ar: '', text_en: '', image_url: '', photo_url: '', rating: 5, sort_order: 0, active: true };
}

function ReviewRow({ item, onSave, onDelete }) {
  const [form, setForm] = useState(item);
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const dirty = JSON.stringify(form) !== JSON.stringify(item);

  async function save() {
    setSaving(true);
    try {
      await onSave(form);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ border: '1px solid #ececed', borderRadius: 10, padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 8 }}>
        <input style={inputStyle} placeholder="اسم العميل (عربي)" value={form.name_ar} onChange={(e) => set('name_ar', e.target.value)} />
        <input style={inputStyle} placeholder="Customer name (English)" value={form.name_en} onChange={(e) => set('name_en', e.target.value)} />
        <label style={labelStyle}>التقييم (١-٥)
          <input type="number" min="1" max="5" style={inputStyle} value={form.rating} onChange={(e) => set('rating', Math.min(5, Math.max(1, Number(e.target.value))))} />
        </label>
        <label style={labelStyle}>الترتيب
          <input type="number" style={inputStyle} value={form.sort_order} onChange={(e) => set('sort_order', Number(e.target.value))} />
        </label>
        <label style={labelStyle}>نشطة
          <select style={inputStyle} value={form.active ? '1' : '0'} onChange={(e) => set('active', e.target.value === '1')}>
            <option value="1">نعم — تظهر على الموقع</option>
            <option value="0">لا — مخفية</option>
          </select>
        </label>
      </div>
      <label style={labelStyle}>نص الرأي (عربي)
        <textarea style={{ ...inputStyle, minHeight: 70 }} value={form.text_ar} onChange={(e) => set('text_ar', e.target.value)} />
      </label>
      <label style={labelStyle}>Review text (English)
        <textarea style={{ ...inputStyle, minHeight: 70 }} value={form.text_en} onChange={(e) => set('text_en', e.target.value)} />
      </label>
      <ImageUploadField label="صورة العميل (اختياري، أفاتار صغير)" value={form.image_url} onChange={(url) => set('image_url', url)} />
      <ImageUploadField label="صورة الرحلة (اختياري) — صورة توضح المسافرين الذين سافروا معنا، تظهر بجانب الرأي" value={form.photo_url} onChange={(url) => set('photo_url', url)} />
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button type="button" style={btnStyle(dirty ? 'primary' : 'ghost')} disabled={!dirty || saving} onClick={save}>{saving ? '...' : 'حفظ'}</button>
        <button type="button" style={btnStyle('danger')} onClick={() => onDelete(item.id)}>حذف</button>
      </div>
    </div>
  );
}

function ReviewsTab() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');

  function load() {
    api('/api/admin/reviews').then(setItems).catch((e) => setError(e.message));
  }
  useEffect(load, []);

  async function handleAdd() {
    try {
      const created = await api('/api/admin/reviews', { method: 'POST', body: JSON.stringify(blankReview()) });
      setItems((list) => [...(list || []), created]);
    } catch (e) {
      setError(e.message);
    }
  }
  async function handleSave(form) {
    try {
      const updated = await api(`/api/admin/reviews/${form.id}`, { method: 'PUT', body: JSON.stringify(form) });
      setItems((list) => list.map((it) => (it.id === updated.id ? updated : it)));
    } catch (e) {
      setError(e.message);
    }
  }
  async function handleDelete(id) {
    if (!confirm('حذف هذا الرأي؟')) return;
    try {
      await api(`/api/admin/reviews/${id}`, { method: 'DELETE' });
      setItems((list) => list.filter((it) => it.id !== id));
    } catch (e) {
      setError(e.message);
    }
  }

  if (error) return <p style={{ color: '#d2324f' }}>{error}</p>;
  if (!items) return <p>جارٍ التحميل...</p>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <p style={{ margin: 0, fontSize: 13.5, color: '#7b8087' }}>
        هذه الآراء تظهر في قسم "آراء عملائنا" بصفحة الباقات — اكتبوا النص وأضيفوا صورة العميل (اختياري).
      </p>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button type="button" style={btnStyle('primary')} onClick={handleAdd}>+ إضافة رأي</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.length === 0 && <p style={{ color: '#7b8087' }}>لا توجد آراء بعد.</p>}
        {items.map((it) => (
          <ReviewRow key={it.id} item={it} onSave={handleSave} onDelete={handleDelete} />
        ))}
      </div>
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
      {tab === 'packages' ? <PackagesTab />
        : tab === 'bookings' ? <BookingsTab />
        : tab === 'destinations' ? <DestinationsTab />
        : tab === 'countries' ? <CountriesTab />
        : <ReviewsTab />}
    </div>
  );
}
