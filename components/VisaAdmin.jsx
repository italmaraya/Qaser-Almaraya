'use client';
import React, { useEffect, useState } from 'react';

const inputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid #ececed',
  fontSize: 15,
  fontFamily: 'inherit',
};
const labelStyle = { display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13.5, fontWeight: 600, color: '#3d4650' };
const cardStyle = {
  background: '#fff',
  border: '1px solid #ececed',
  borderRadius: 14,
  padding: 20,
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  boxShadow: '0 2px 8px rgba(29,39,51,.06)',
};
const btnStyle = (variant) => ({
  cursor: 'pointer',
  border: variant === 'ghost' ? '1px solid #ececed' : 'none',
  borderRadius: 999,
  padding: '10px 20px',
  fontSize: 14.5,
  fontWeight: 600,
  fontFamily: 'inherit',
  background: variant === 'primary' ? '#049dc5' : variant === 'danger' ? '#fdecef' : '#fff',
  color: variant === 'primary' ? '#fff' : variant === 'danger' ? '#d2324f' : '#3d4650',
});
const checkboxRow = { display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#3d4650' };

const VISA_SUBTABS = [
  { id: 'applications', label: 'الطلبات' },
  { id: 'countries', label: 'الدول' },
  { id: 'types', label: 'أنواع التأشيرات' },
  { id: 'providers', label: 'مزودو الخدمة' },
  { id: 'cards', label: 'بطاقات التأشيرة' },
  { id: 'statuses', label: 'الحالات' },
];

const DOC_KINDS = [
  { id: 'file', label: 'رفع ملف' },
  { id: 'photo', label: 'رفع صورة بمواصفات' },
  { id: 'text', label: 'سؤال بإجابة مكتوبة' },
  { id: 'choice', label: 'سؤال باختيارات' },
  { id: 'yesno', label: 'نعم / لا' },
  { id: 'number_date', label: 'رقم أو تاريخ' },
  { id: 'repeated', label: 'حقل متكرر' },
];

async function api(path, options) {
  const res = await fetch(path, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return res.json();
}

export default function VisaAdmin() {
  const [subTab, setSubTab] = useState('applications');
  const [applications, setApplications] = useState(null);
  const [countries, setCountries] = useState(null);
  const [types, setTypes] = useState(null);
  const [providers, setProviders] = useState(null);
  const [cards, setCards] = useState(null);
  const [statuses, setStatuses] = useState(null);
  const [error, setError] = useState('');

  function loadApplications() {
    api('/api/admin/visa/applications').then(setApplications).catch((e) => setError(e.message));
  }
  function loadCountries() {
    api('/api/admin/visa/countries').then(setCountries).catch((e) => setError(e.message));
  }
  function loadTypes() {
    api('/api/admin/visa/types').then(setTypes).catch((e) => setError(e.message));
  }
  function loadProviders() {
    api('/api/admin/visa/providers').then(setProviders).catch((e) => setError(e.message));
  }
  function loadCards() {
    api('/api/admin/visa/cards').then(setCards).catch((e) => setError(e.message));
  }
  function loadStatuses() {
    api('/api/admin/visa/statuses').then(setStatuses).catch((e) => setError(e.message));
  }

  useEffect(() => {
    if (subTab === 'applications' && applications == null) {
      loadApplications();
      if (statuses == null) loadStatuses();
    }
    if (subTab === 'countries' && countries == null) loadCountries();
    if (subTab === 'types' && types == null) loadTypes();
    if (subTab === 'providers' && providers == null) loadProviders();
    if (subTab === 'cards' && cards == null) {
      loadCards();
      if (countries == null) loadCountries();
      if (types == null) loadTypes();
      if (providers == null) loadProviders();
    }
    if (subTab === 'statuses' && statuses == null) loadStatuses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subTab]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {VISA_SUBTABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setSubTab(t.id)}
            style={{
              ...btnStyle(subTab === t.id ? 'primary' : 'ghost'),
              borderRadius: 10,
              fontSize: 13.5,
              padding: '8px 14px',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <p style={{ margin: 0, padding: 12, background: '#fdecef', border: '1px solid #f7c3cc', borderRadius: 10, color: '#d2324f', fontSize: 14 }}>
          {error}
        </p>
      )}

      {subTab === 'applications' && (
        <ApplicationsTab applications={applications} statuses={statuses} reload={loadApplications} setError={setError} />
      )}
      {subTab === 'countries' && <CountriesTab countries={countries} reload={loadCountries} setError={setError} />}
      {subTab === 'types' && <TypesTab types={types} reload={loadTypes} setError={setError} />}
      {subTab === 'providers' && <ProvidersTab providers={providers} reload={loadProviders} setError={setError} />}
      {subTab === 'cards' && (
        <CardsTab
          cards={cards}
          countries={countries || []}
          types={types || []}
          providers={providers || []}
          reload={loadCards}
          setError={setError}
        />
      )}
      {subTab === 'statuses' && <StatusesTab statuses={statuses} reload={loadStatuses} setError={setError} />}
    </div>
  );
}

const REGIONS = ['الشرق الأوسط وأفريقيا', 'تركيا والقوقاز', 'آسيا', 'الأمريكتان'];

function ApplicationsTab({ applications, statuses, reload, setError }) {
  const [expanded, setExpanded] = useState(null);
  const [detail, setDetail] = useState(null);

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

  async function changeStatus(id, statusId) {
    try {
      await api(`/api/admin/visa/applications/${id}/status`, {
        method: 'POST',
        body: JSON.stringify({ internal_status_id: statusId || null }),
      });
      reload();
      if (expanded === id) openDetail(id); // refresh detail + history too
    } catch (e) {
      setError(e.message);
    }
  }

  if (applications == null) return <p>...جارٍ التحميل</p>;
  const internalStatuses = (statuses && statuses.internal) || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {applications.length === 0 && <p style={{ color: '#7b8087' }}>لا توجد طلبات بعد.</p>}
      {applications.map((a) => (
        <div key={a.id} style={cardStyle}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontSize: 12.5,
                    fontWeight: 700,
                    color: '#036f8c',
                    background: '#eaf8fd',
                    borderRadius: 999,
                    padding: '2px 10px',
                    letterSpacing: '.02em',
                  }}
                >
                  QA-{String(a.id).padStart(6, '0')}
                </span>
                <span style={{ fontWeight: 700, fontSize: 15.5 }}>{a.customer_name}</span>
              </span>
              <span style={{ fontSize: 13.5, color: '#3d4650' }}>
                <a href={`tel:${a.customer_phone}`} dir="ltr" style={{ color: '#036f8c', fontWeight: 600, textDecoration: 'none' }}>
                  📞 {a.customer_phone}
                </a>
                {a.customer_email && (
                  <span style={{ marginInlineStart: 10, color: '#7b8087' }}>· {a.customer_email}</span>
                )}
              </span>
              <span style={{ fontSize: 13.5, color: '#3d4650', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                {a.country_name_ar} — {a.visa_type_name_ar} · {a.adult_count} بالغ / {a.child_count} طفل
                {a.provider_name && (
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#049dc5',
                      background: '#e6f7fb',
                      borderRadius: 999,
                      padding: '2px 10px',
                    }}
                  >
                    {a.provider_name}
                  </span>
                )}
              </span>
              <span style={{ fontSize: 12.5, color: '#7b8087' }}>
                {new Date(a.submitted_at).toLocaleString('ar')}
                {a.is_delayed && (
                  <span style={{ marginInlineStart: 8, color: '#d2324f', fontWeight: 700 }}>⚠ متأخر</span>
                )}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <select
                style={{ ...inputStyle, width: 'auto' }}
                value={a.status_id || ''}
                onChange={(e) => changeStatus(a.id, e.target.value)}
              >
                <option value="">— بدون حالة —</option>
                {internalStatuses.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name_ar}
                  </option>
                ))}
              </select>
              <button style={btnStyle('ghost')} onClick={() => openDetail(a.id)}>
                {expanded === a.id ? 'إخفاء' : 'التفاصيل'}
              </button>
            </div>
          </div>

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
                          <a href={ans.file_url} target="_blank" rel="noopener" style={{ color: '#049dc5' }}>
                            عرض الملف
                          </a>
                        ) : (
                          <span>{ans.value_text}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
              {detail.history && detail.history.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>سجل الحالات</span>
                  {detail.history.map((h) => (
                    <span key={h.id} style={{ fontSize: 12.5, color: '#7b8087' }}>
                      {new Date(h.changed_at).toLocaleString('ar')} — {h.status_name_ar || 'بدون حالة'}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function CountriesTab({ countries, reload, setError }) {
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [region, setRegion] = useState(REGIONS[0]);
  const [flagCode, setFlagCode] = useState('');

  async function add() {
    if (!nameAr || !nameEn) return;
    try {
      await api('/api/admin/visa/countries', {
        method: 'POST',
        body: JSON.stringify({ name_ar: nameAr, name_en: nameEn, region, flag_code: flagCode }),
      });
      setNameAr('');
      setNameEn('');
      setFlagCode('');
      reload();
    } catch (e) {
      setError(e.message);
    }
  }

  async function update(country) {
    try {
      await api(`/api/admin/visa/countries/${country.id}`, { method: 'PUT', body: JSON.stringify(country) });
      reload();
    } catch (e) {
      setError(e.message);
    }
  }

  async function remove(id) {
    try {
      await api(`/api/admin/visa/countries/${id}`, { method: 'DELETE' });
      reload();
    } catch (e) {
      setError(e.message);
    }
  }

  if (countries == null) return <p>...جارٍ التحميل</p>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={cardStyle}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <label style={{ ...labelStyle, flex: 1, minWidth: 160 }}>
            الاسم بالعربية
            <input style={inputStyle} value={nameAr} onChange={(e) => setNameAr(e.target.value)} />
          </label>
          <label style={{ ...labelStyle, flex: 1, minWidth: 160 }}>
            الاسم بالإنجليزية
            <input style={inputStyle} value={nameEn} onChange={(e) => setNameEn(e.target.value)} />
          </label>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <label style={{ ...labelStyle, flex: 1, minWidth: 160 }}>
            المنطقة (لتصنيف الدول في قسم البحث)
            <select style={inputStyle} value={region} onChange={(e) => setRegion(e.target.value)}>
              {REGIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
          <label style={{ ...labelStyle, flex: 1, minWidth: 160 }}>
            رمز العلم (مثل tr، jo، us — يجب أن تتوفر صورة العلم في public/assets/flags)
            <input style={inputStyle} placeholder="tr" value={flagCode} onChange={(e) => setFlagCode(e.target.value)} />
          </label>
        </div>
        <button style={{ ...btnStyle('primary'), alignSelf: 'flex-start' }} onClick={add}>
          + إضافة دولة
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {countries.map((c) => (
          <div key={c.id} style={cardStyle}>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <label style={{ ...labelStyle, flex: 1, minWidth: 140 }}>
                الاسم بالعربية
                <input style={inputStyle} value={c.name_ar} onChange={(e) => update({ ...c, name_ar: e.target.value })} />
              </label>
              <label style={{ ...labelStyle, flex: 1, minWidth: 140 }}>
                الاسم بالإنجليزية
                <input style={inputStyle} value={c.name_en} onChange={(e) => update({ ...c, name_en: e.target.value })} />
              </label>
              <label style={{ ...labelStyle, flex: 1, minWidth: 140 }}>
                المنطقة
                <select style={inputStyle} value={c.region || REGIONS[0]} onChange={(e) => update({ ...c, region: e.target.value })}>
                  {REGIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </label>
              <label style={{ ...labelStyle, flex: 1, minWidth: 100 }}>
                رمز العلم
                <input style={inputStyle} value={c.flag_code || ''} onChange={(e) => update({ ...c, flag_code: e.target.value })} />
              </label>
              <button style={btnStyle('danger')} onClick={() => remove(c.id)}>
                حذف
              </button>
            </div>
          </div>
        ))}
        {countries.length === 0 && <p style={{ color: '#7b8087' }}>لا توجد دول بعد.</p>}
      </div>
    </div>
  );
}

const TICKS = [
  { key: 'needs_appointment', label: 'نحتاج حجز موعد' },
  { key: 'delivers_visa_file', label: 'نسلّم ملف التأشيرة' },
  { key: 'collects_passport', label: 'نستلم جواز السفر' },
  { key: 'prepares_papers', label: 'نجهّز الأوراق' },
  { key: 'result_guaranteed', label: 'النتيجة مضمونة' },
];

function blankType() {
  return { name_ar: '', name_en: '', needs_appointment: false, delivers_visa_file: false, collects_passport: false, prepares_papers: false, result_guaranteed: false };
}

function TypesTab({ types, reload, setError }) {
  const [draft, setDraft] = useState(blankType());

  async function add() {
    if (!draft.name_ar || !draft.name_en) return;
    try {
      await api('/api/admin/visa/types', { method: 'POST', body: JSON.stringify(draft) });
      setDraft(blankType());
      reload();
    } catch (e) {
      setError(e.message);
    }
  }

  async function update(t) {
    try {
      await api(`/api/admin/visa/types/${t.id}`, { method: 'PUT', body: JSON.stringify(t) });
      reload();
    } catch (e) {
      setError(e.message);
    }
  }

  async function remove(id) {
    try {
      await api(`/api/admin/visa/types/${id}`, { method: 'DELETE' });
      reload();
    } catch (e) {
      setError(e.message);
    }
  }

  if (types == null) return <p>...جارٍ التحميل</p>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={cardStyle}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <label style={labelStyle}>
            الاسم بالعربية
            <input style={inputStyle} value={draft.name_ar} onChange={(e) => setDraft({ ...draft, name_ar: e.target.value })} />
          </label>
          <label style={labelStyle}>
            الاسم بالإنجليزية
            <input style={inputStyle} value={draft.name_en} onChange={(e) => setDraft({ ...draft, name_en: e.target.value })} />
          </label>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
          {TICKS.map((t) => (
            <label key={t.key} style={checkboxRow}>
              <input type="checkbox" checked={!!draft[t.key]} onChange={(e) => setDraft({ ...draft, [t.key]: e.target.checked })} />
              {t.label}
            </label>
          ))}
        </div>
        <button style={{ ...btnStyle('primary'), alignSelf: 'flex-start' }} onClick={add}>
          + إضافة نوع
        </button>
      </div>

      {types.map((t) => (
        <div key={t.id} style={cardStyle}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label style={labelStyle}>
              الاسم بالعربية
              <input style={inputStyle} value={t.name_ar} onChange={(e) => update({ ...t, name_ar: e.target.value })} />
            </label>
            <label style={labelStyle}>
              الاسم بالإنجليزية
              <input style={inputStyle} value={t.name_en} onChange={(e) => update({ ...t, name_en: e.target.value })} />
            </label>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
            {TICKS.map((tick) => (
              <label key={tick.key} style={checkboxRow}>
                <input type="checkbox" checked={!!t[tick.key]} onChange={(e) => update({ ...t, [tick.key]: e.target.checked })} />
                {tick.label}
              </label>
            ))}
          </div>
          <button style={{ ...btnStyle('danger'), alignSelf: 'flex-start' }} onClick={() => remove(t.id)}>
            حذف هذا النوع
          </button>
        </div>
      ))}
    </div>
  );
}

function ProvidersTab({ providers, reload, setError }) {
  const [name, setName] = useState('');

  async function add() {
    if (!name) return;
    try {
      await api('/api/admin/visa/providers', { method: 'POST', body: JSON.stringify({ name, emails: [] }) });
      setName('');
      reload();
    } catch (e) {
      setError(e.message);
    }
  }

  async function update(p) {
    try {
      await api(`/api/admin/visa/providers/${p.id}`, { method: 'PUT', body: JSON.stringify(p) });
      reload();
    } catch (e) {
      setError(e.message);
    }
  }

  async function remove(id) {
    try {
      await api(`/api/admin/visa/providers/${id}`, { method: 'DELETE' });
      reload();
    } catch (e) {
      setError(e.message);
    }
  }

  function addEmail(p) {
    const emails = [...(p.emails || []), { label: '', email: '' }];
    update({ ...p, emails });
  }
  function updateEmail(p, i, field, value) {
    const emails = [...(p.emails || [])];
    emails[i] = { ...emails[i], [field]: value };
    update({ ...p, emails });
  }
  function removeEmail(p, i) {
    const emails = [...(p.emails || [])];
    emails.splice(i, 1);
    update({ ...p, emails });
  }

  if (providers == null) return <p>...جارٍ التحميل</p>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ ...cardStyle, flexDirection: 'row', alignItems: 'flex-end' }}>
        <label style={{ ...labelStyle, flex: 1 }}>
          اسم مزود الخدمة
          <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <button style={btnStyle('primary')} onClick={add}>
          + إضافة مزود
        </button>
      </div>

      {providers.map((p) => (
        <div key={p.id} style={cardStyle}>
          <label style={labelStyle}>
            الاسم
            <input style={inputStyle} value={p.name} onChange={(e) => update({ ...p, name: e.target.value })} />
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontSize: 13.5, fontWeight: 600 }}>البريد الإلكتروني (يمكن إضافة أكثر من واحد)</span>
            {(p.emails || []).map((em, i) => (
              <div key={i} style={{ display: 'flex', gap: 8 }}>
                <input
                  style={{ ...inputStyle, flex: '0 0 140px' }}
                  placeholder="تسمية (مثل: تأشيرات)"
                  value={em.label}
                  onChange={(e) => updateEmail(p, i, 'label', e.target.value)}
                />
                <input
                  style={inputStyle}
                  placeholder="email@example.com"
                  value={em.email}
                  onChange={(e) => updateEmail(p, i, 'email', e.target.value)}
                />
                <button style={btnStyle('danger')} onClick={() => removeEmail(p, i)}>
                  حذف
                </button>
              </div>
            ))}
            <button style={{ ...btnStyle('ghost'), alignSelf: 'flex-start' }} onClick={() => addEmail(p)}>
              + إضافة بريد
            </button>
          </div>
          <button style={{ ...btnStyle('danger'), alignSelf: 'flex-start' }} onClick={() => remove(p.id)}>
            حذف هذا المزود
          </button>
        </div>
      ))}
    </div>
  );
}

const SEND_METHODS = [
  { id: 'provider', label: 'إرسال إلى المزود' },
  { id: 'team', label: 'إرسال إلى فريقنا' },
  { id: 'both', label: 'إرسال إلى الاثنين' },
  { id: 'none', label: 'لا يُرسل تلقائيًا' },
];

function blankCard() {
  return {
    country_id: '',
    visa_type_id: '',
    stay_duration: '',
    issuing_time_days: '',
    validity_before_travel: '',
    adult_price: '',
    child_price: '',
    adult_cost: '',
    child_cost: '',
    booking_notes: '',
    provider_id: '',
    provider_email: '',
    send_method: 'provider',
  };
}

function CardsTab({ cards, countries, types, providers, reload, setError }) {
  const [draft, setDraft] = useState(blankCard());
  const [expanded, setExpanded] = useState(null);

  async function add() {
    if (!draft.country_id || !draft.visa_type_id) {
      setError('اختر الدولة ونوع التأشيرة أولاً');
      return;
    }
    try {
      await api('/api/admin/visa/cards', { method: 'POST', body: JSON.stringify(draft) });
      setDraft(blankCard());
      reload();
    } catch (e) {
      setError(e.message);
    }
  }

  async function update(card) {
    try {
      await api(`/api/admin/visa/cards/${card.id}`, { method: 'PUT', body: JSON.stringify(card) });
      reload();
    } catch (e) {
      setError(e.message);
    }
  }

  async function remove(id) {
    try {
      await api(`/api/admin/visa/cards/${id}`, { method: 'DELETE' });
      reload();
    } catch (e) {
      setError(e.message);
    }
  }

  if (cards == null) return <p>...جارٍ التحميل</p>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={cardStyle}>
        <h4 style={{ margin: 0 }}>إضافة بطاقة تأشيرة جديدة</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <label style={labelStyle}>
            الدولة
            <select style={inputStyle} value={draft.country_id} onChange={(e) => setDraft({ ...draft, country_id: e.target.value })}>
              <option value="">اختر دولة</option>
              {countries.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name_ar}
                </option>
              ))}
            </select>
          </label>
          <label style={labelStyle}>
            نوع التأشيرة
            <select style={inputStyle} value={draft.visa_type_id} onChange={(e) => setDraft({ ...draft, visa_type_id: e.target.value })}>
              <option value="">اختر نوعًا</option>
              {types.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name_ar}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <label style={labelStyle}>
            مدة الإقامة
            <input style={inputStyle} value={draft.stay_duration} onChange={(e) => setDraft({ ...draft, stay_duration: e.target.value })} />
          </label>
          <label style={labelStyle}>
            مدة الإصدار (أيام)
            <input type="number" style={inputStyle} value={draft.issuing_time_days} onChange={(e) => setDraft({ ...draft, issuing_time_days: e.target.value })} />
          </label>
          <label style={labelStyle}>
            صلاحية قبل السفر
            <input style={inputStyle} value={draft.validity_before_travel} onChange={(e) => setDraft({ ...draft, validity_before_travel: e.target.value })} />
          </label>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}>
          <label style={labelStyle}>
            سعر البالغ (IQD)
            <input type="number" style={inputStyle} value={draft.adult_price} onChange={(e) => setDraft({ ...draft, adult_price: e.target.value })} />
          </label>
          <label style={labelStyle}>
            سعر الطفل (IQD)
            <input type="number" style={inputStyle} value={draft.child_price} onChange={(e) => setDraft({ ...draft, child_price: e.target.value })} />
          </label>
          <label style={labelStyle}>
            تكلفة البالغ (داخلي)
            <input type="number" style={inputStyle} value={draft.adult_cost} onChange={(e) => setDraft({ ...draft, adult_cost: e.target.value })} />
          </label>
          <label style={labelStyle}>
            تكلفة الطفل (داخلي)
            <input type="number" style={inputStyle} value={draft.child_cost} onChange={(e) => setDraft({ ...draft, child_cost: e.target.value })} />
          </label>
        </div>
        <label style={labelStyle}>
          ملاحظات الحجز
          <textarea style={{ ...inputStyle, minHeight: 60 }} value={draft.booking_notes} onChange={(e) => setDraft({ ...draft, booking_notes: e.target.value })} />
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <label style={labelStyle}>
            مزود الخدمة
            <select style={inputStyle} value={draft.provider_id} onChange={(e) => setDraft({ ...draft, provider_id: e.target.value })}>
              <option value="">بدون</option>
              {providers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label style={labelStyle}>
            طريقة الإرسال
            <select style={inputStyle} value={draft.send_method} onChange={(e) => setDraft({ ...draft, send_method: e.target.value })}>
              {SEND_METHODS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <button style={{ ...btnStyle('primary'), alignSelf: 'flex-start' }} onClick={add}>
          + إضافة بطاقة
        </button>
      </div>

      {cards.map((c) => (
        <div key={c.id} style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ margin: 0 }}>
              {c.country_name_ar} — {c.visa_type_name_ar}
            </h4>
            <button style={btnStyle('ghost')} onClick={() => setExpanded(expanded === c.id ? null : c.id)}>
              {expanded === c.id ? 'إخفاء المستمسكات' : 'إدارة المستمسكات المطلوبة'}
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10, fontSize: 14 }}>
            <span>سعر البالغ: {c.adult_price} د.ع</span>
            <span>سعر الطفل: {c.child_price} د.ع</span>
            <span>المزود: {c.provider_name || '—'}</span>
            <span>مدة الإصدار: {c.issuing_time_days || '—'} يوم</span>
          </div>
          {expanded === c.id && <DocumentsBuilder card={c} reload={reload} setError={setError} />}
          <button style={{ ...btnStyle('danger'), alignSelf: 'flex-start' }} onClick={() => remove(c.id)}>
            حذف هذه البطاقة
          </button>
        </div>
      ))}
    </div>
  );
}

function blankDoc() {
  return { name_ar: '', name_en: '', kind: 'file', required: true, audience: 'everyone', choices: [] };
}

function DocumentsBuilder({ card, reload, setError }) {
  const [draft, setDraft] = useState(blankDoc());

  async function add() {
    if (!draft.name_ar) return;
    try {
      await api(`/api/admin/visa/cards/${card.id}/documents`, { method: 'POST', body: JSON.stringify(draft) });
      setDraft(blankDoc());
      reload();
    } catch (e) {
      setError(e.message);
    }
  }

  async function update(doc) {
    try {
      await api(`/api/admin/visa/documents/${doc.id}`, { method: 'PUT', body: JSON.stringify(doc) });
      reload();
    } catch (e) {
      setError(e.message);
    }
  }

  async function remove(id) {
    try {
      await api(`/api/admin/visa/documents/${id}`, { method: 'DELETE' });
      reload();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, borderTop: '1px dashed #ececed', paddingTop: 14 }}>
      <span style={{ fontSize: 13.5, fontWeight: 700 }}>المستمسكات المطلوبة لهذه البطاقة</span>

      {(card.documents || []).map((d) => (
        <div key={d.id} style={{ display: 'flex', flexDirection: 'column', gap: 8, border: '1px solid #ececed', borderRadius: 10, padding: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <input style={inputStyle} value={d.name_ar} onChange={(e) => update({ ...d, name_ar: e.target.value })} placeholder="الاسم بالعربية" />
            <input style={inputStyle} value={d.name_en} onChange={(e) => update({ ...d, name_en: e.target.value })} placeholder="Name in English" />
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <select style={{ ...inputStyle, width: 'auto' }} value={d.kind} onChange={(e) => update({ ...d, kind: e.target.value })}>
              {DOC_KINDS.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.label}
                </option>
              ))}
            </select>
            <label style={checkboxRow}>
              <input type="checkbox" checked={!!d.required} onChange={(e) => update({ ...d, required: e.target.checked })} />
              مطلوب
            </label>
            <select style={{ ...inputStyle, width: 'auto' }} value={d.audience} onChange={(e) => update({ ...d, audience: e.target.value })}>
              <option value="everyone">الجميع</option>
              <option value="adults">البالغين فقط</option>
              <option value="children">الأطفال فقط</option>
            </select>
            <button style={btnStyle('danger')} onClick={() => remove(d.id)}>
              حذف
            </button>
          </div>
        </div>
      ))}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, border: '1px dashed #ececed', borderRadius: 10, padding: 12 }}>
        <span style={{ fontSize: 12.5, color: '#7b8087' }}>
          {(card.documents || []).length > 0
            ? `تمت إضافة ${(card.documents || []).length} مستمسك حتى الآن — أضف مستمسكًا آخر أدناه`
            : 'أضف أول مستمسك مطلوب لهذه البطاقة'}
        </span>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <input style={inputStyle} placeholder="الاسم بالعربية" value={draft.name_ar} onChange={(e) => setDraft({ ...draft, name_ar: e.target.value })} />
          <input style={inputStyle} placeholder="Name in English" value={draft.name_en} onChange={(e) => setDraft({ ...draft, name_en: e.target.value })} />
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <select style={{ ...inputStyle, width: 'auto' }} value={draft.kind} onChange={(e) => setDraft({ ...draft, kind: e.target.value })}>
            {DOC_KINDS.map((k) => (
              <option key={k.id} value={k.id}>
                {k.label}
              </option>
            ))}
          </select>
          <button style={btnStyle('primary')} onClick={add}>
            + إضافة مستمسك (يمكنك التكرار لإضافة عدة مستمسكات)
          </button>
        </div>
      </div>
    </div>
  );
}

function StatusesTab({ statuses, reload, setError }) {
  const [internalName, setInternalName] = useState({ ar: '', en: '' });
  const [customerName, setCustomerName] = useState({ ar: '', en: '' });

  async function addInternal() {
    if (!internalName.ar) return;
    try {
      await api('/api/admin/visa/statuses', { method: 'POST', body: JSON.stringify({ action: 'add_internal', name_ar: internalName.ar, name_en: internalName.en }) });
      setInternalName({ ar: '', en: '' });
      reload();
    } catch (e) {
      setError(e.message);
    }
  }
  async function addCustomer() {
    if (!customerName.ar) return;
    try {
      await api('/api/admin/visa/statuses', { method: 'POST', body: JSON.stringify({ action: 'add_customer', name_ar: customerName.ar, name_en: customerName.en }) });
      setCustomerName({ ar: '', en: '' });
      reload();
    } catch (e) {
      setError(e.message);
    }
  }
  async function setMapping(internalId, customerStatusId) {
    try {
      await api('/api/admin/visa/statuses', { method: 'POST', body: JSON.stringify({ action: 'set_mapping', internal_id: internalId, customer_status_id: customerStatusId || null }) });
      reload();
    } catch (e) {
      setError(e.message);
    }
  }
  async function removeInternal(id) {
    try {
      await api('/api/admin/visa/statuses', { method: 'POST', body: JSON.stringify({ action: 'delete_internal', id }) });
      reload();
    } catch (e) {
      setError(e.message);
    }
  }
  async function removeCustomer(id) {
    try {
      await api('/api/admin/visa/statuses', { method: 'POST', body: JSON.stringify({ action: 'delete_customer', id }) });
      reload();
    } catch (e) {
      setError(e.message);
    }
  }

  if (statuses == null) return <p>...جارٍ التحميل</p>;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <h4 style={{ margin: 0 }}>الحالات الداخلية (لفريقنا فقط)</h4>
        {statuses.internal.map((s) => (
          <div key={s.id} style={{ ...cardStyle, padding: 14 }}>
            <span style={{ fontWeight: 700 }}>{s.name_ar}</span>
            <label style={labelStyle}>
              تظهر للعميل كـ:
              <select style={inputStyle} value={s.customer_status_id || ''} onChange={(e) => setMapping(s.id, e.target.value)}>
                <option value="">— بدون ربط —</option>
                {statuses.customer.map((cs) => (
                  <option key={cs.id} value={cs.id}>
                    {cs.name_ar}
                  </option>
                ))}
              </select>
            </label>
            <button style={{ ...btnStyle('danger'), alignSelf: 'flex-start' }} onClick={() => removeInternal(s.id)}>
              حذف
            </button>
          </div>
        ))}
        <div style={{ ...cardStyle, flexDirection: 'row', alignItems: 'flex-end' }}>
          <input style={inputStyle} placeholder="اسم الحالة" value={internalName.ar} onChange={(e) => setInternalName({ ...internalName, ar: e.target.value })} />
          <button style={btnStyle('primary')} onClick={addInternal}>
            + إضافة
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <h4 style={{ margin: 0 }}>حالات العميل (ما يظهر له)</h4>
        {statuses.customer.map((s) => (
          <div key={s.id} style={{ ...cardStyle, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 700 }}>{s.name_ar}</span>
            <button style={btnStyle('danger')} onClick={() => removeCustomer(s.id)}>
              حذف
            </button>
          </div>
        ))}
        <div style={{ ...cardStyle, flexDirection: 'row', alignItems: 'flex-end' }}>
          <input style={inputStyle} placeholder="اسم الحالة" value={customerName.ar} onChange={(e) => setCustomerName({ ...customerName, ar: e.target.value })} />
          <button style={btnStyle('primary')} onClick={addCustomer}>
            + إضافة
          </button>
        </div>
      </div>
    </div>
  );
}
