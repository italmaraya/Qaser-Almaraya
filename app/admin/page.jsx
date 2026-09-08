'use client';
import React, { useEffect, useState } from 'react';
import VisaAdmin from '../../components/VisaAdmin';

const TABS = [
  { id: 'jobs', label: 'الوظائف' },
  { id: 'faq', label: 'الأسئلة الشائعة' },
  { id: 'achievements', label: 'الإنجازات' },
  { id: 'contact', label: 'معلومات التواصل' },
  { id: 'visa', label: 'التأشيرات' },
];

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

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export default function AdminPage() {
  const [checkingSession, setCheckingSession] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [content, setContent] = useState(null);
  const [activeTab, setActiveTab] = useState('jobs');
  const [savingTab, setSavingTab] = useState(null);
  const [savedTab, setSavedTab] = useState(null);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    fetch('/api/admin/session')
      .then((r) => r.json())
      .then((d) => setAuthenticated(!!d.authenticated))
      .catch(() => setAuthenticated(false))
      .finally(() => setCheckingSession(false));
  }, []);

  useEffect(() => {
    if (authenticated) {
      fetch('/api/admin/content')
        .then((r) => r.json())
        .then(setContent)
        .catch(() => setSaveError('تعذّر تحميل المحتوى'));
    }
  }, [authenticated]);

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
    setContent(null);
    setPassword('');
  }

  async function saveSection(tabId) {
    setSavingTab(tabId);
    setSaveError('');
    try {
      const res = await fetch('/api/admin/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(content),
      });
      if (!res.ok) throw new Error('save failed');
      const saved = await res.json();
      setContent(saved);
      setSavedTab(tabId);
      setTimeout(() => setSavedTab((t) => (t === tabId ? null : t)), 2000);
    } catch {
      setSaveError('تعذّر الحفظ، حاول مرة أخرى');
    } finally {
      setSavingTab(null);
    }
  }

  function updateField(section, index, field, value) {
    setContent((c) => {
      const next = { ...c };
      const arr = [...next[section]];
      arr[index] = { ...arr[index], [field]: value };
      next[section] = arr;
      return next;
    });
  }

  function updateContactField(field, value) {
    setContent((c) => ({ ...c, contact: { ...c.contact, [field]: value } }));
  }

  function addItem(section, blank) {
    setContent((c) => ({ ...c, [section]: [...c[section], { id: uid(), ...blank }] }));
  }

  function removeItem(section, index) {
    setContent((c) => {
      const arr = [...c[section]];
      arr.splice(index, 1);
      return { ...c, [section]: arr };
    });
  }

  function updateListField(section, index, field, itemIndex, value) {
    setContent((c) => {
      const arr = [...c[section]];
      const list = [...(arr[index][field] || [])];
      list[itemIndex] = value;
      arr[index] = { ...arr[index], [field]: list };
      return { ...c, [section]: arr };
    });
  }

  function addListItem(section, index, field) {
    setContent((c) => {
      const arr = [...c[section]];
      arr[index] = { ...arr[index], [field]: [...(arr[index][field] || []), ''] };
      return { ...c, [section]: arr };
    });
  }

  function removeListItem(section, index, field, itemIndex) {
    setContent((c) => {
      const arr = [...c[section]];
      const list = [...(arr[index][field] || [])];
      list.splice(itemIndex, 1);
      arr[index] = { ...arr[index], [field]: list };
      return { ...c, [section]: arr };
    });
  }

  async function uploadAchievementPhoto(index, file) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/admin/upload', { method: 'POST', body: formData });
    if (!res.ok) {
      setSaveError('تعذّر رفع الصورة');
      return;
    }
    const { url } = await res.json();
    updateField('achievements', index, 'photo', url);
  }

  if (checkingSession) {
    return <div style={{ padding: 40, fontFamily: 'system-ui, sans-serif' }}>...جارٍ التحقق</div>;
  }

  if (!authenticated) {
    return (
      <div
        dir="rtl"
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f8f7f8',
          fontFamily: "'IBM Plex Sans Arabic', system-ui, sans-serif",
        }}
      >
        <form
          onSubmit={handleLogin}
          style={{ ...cardStyle, width: 340, gap: 16 }}
        >
          <h1 style={{ margin: 0, fontSize: 22, color: '#049dc5' }}>لوحة تحكم قصر المرايا</h1>
          <label style={labelStyle}>
            كلمة المرور
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
              autoFocus
            />
          </label>
          {loginError && <p style={{ margin: 0, color: '#d2324f', fontSize: 14 }}>{loginError}</p>}
          <button type="submit" style={btnStyle('primary')}>
            دخول
          </button>
        </form>
      </div>
    );
  }

  if (!content) {
    return <div style={{ padding: 40, fontFamily: 'system-ui, sans-serif' }}>...جارٍ التحميل</div>;
  }

  return (
    <div
      dir="rtl"
      style={{
        minHeight: '100vh',
        background: '#f8f7f8',
        fontFamily: "'IBM Plex Sans Arabic', system-ui, sans-serif",
        color: '#3d4650',
      }}
    >
      <div style={{ maxWidth: 980, margin: '0 auto', padding: '28px 20px 80px', display: 'flex', flexDirection: 'column', gap: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1 style={{ margin: 0, fontSize: 24, color: '#049dc5' }}>لوحة تحكم قصر المرايا</h1>
          <button onClick={handleLogout} style={btnStyle('ghost')}>
            تسجيل الخروج
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', borderBottom: '1px solid #ececed', paddingBottom: 12 }}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                ...btnStyle(activeTab === tab.id ? 'primary' : 'ghost'),
                borderRadius: 10,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {saveError && (
          <p style={{ margin: 0, padding: 12, background: '#fdecef', border: '1px solid #f7c3cc', borderRadius: 10, color: '#d2324f', fontSize: 14 }}>
            {saveError}
          </p>
        )}

        {/* JOBS TAB */}
        {activeTab === 'jobs' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {content.jobs.map((job, i) => (
              <div key={job.id || i} style={cardStyle}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <label style={labelStyle}>
                    المسمى الوظيفي
                    <input style={inputStyle} value={job.title} onChange={(e) => updateField('jobs', i, 'title', e.target.value)} />
                  </label>
                  <label style={labelStyle}>
                    الوسم (بالإنجليزية، مثل SALES)
                    <input style={inputStyle} value={job.tag} onChange={(e) => updateField('jobs', i, 'tag', e.target.value)} />
                  </label>
                </div>
                <label style={labelStyle}>
                  الموقع / نوع الدوام
                  <input style={inputStyle} value={job.location} onChange={(e) => updateField('jobs', i, 'location', e.target.value)} />
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 600 }}>المتطلبات</span>
                  {(job.bullets || []).map((b, bi) => (
                    <div key={bi} style={{ display: 'flex', gap: 8 }}>
                      <input
                        style={inputStyle}
                        value={b}
                        onChange={(e) => updateListField('jobs', i, 'bullets', bi, e.target.value)}
                      />
                      <button style={btnStyle('danger')} onClick={() => removeListItem('jobs', i, 'bullets', bi)}>
                        حذف
                      </button>
                    </div>
                  ))}
                  <button style={{ ...btnStyle('ghost'), alignSelf: 'flex-start' }} onClick={() => addListItem('jobs', i, 'bullets')}>
                    + إضافة متطلب
                  </button>
                </div>
                <button style={{ ...btnStyle('danger'), alignSelf: 'flex-start' }} onClick={() => removeItem('jobs', i)}>
                  حذف هذه الوظيفة
                </button>
              </div>
            ))}
            <button
              style={{ ...btnStyle('ghost'), alignSelf: 'flex-start' }}
              onClick={() => addItem('jobs', { tag: '', title: '', location: '', bullets: [''] })}
            >
              + إضافة وظيفة جديدة
            </button>
            <SaveBar saving={savingTab === 'jobs'} saved={savedTab === 'jobs'} onSave={() => saveSection('jobs')} />
          </div>
        )}

        {/* FAQ TAB */}
        {activeTab === 'faq' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {content.faq.map((item, i) => (
              <div key={item.id || i} style={cardStyle}>
                <label style={labelStyle}>
                  السؤال
                  <input style={inputStyle} value={item.q} onChange={(e) => updateField('faq', i, 'q', e.target.value)} />
                </label>
                <label style={labelStyle}>
                  الإجابة
                  <textarea
                    style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
                    value={item.a}
                    onChange={(e) => updateField('faq', i, 'a', e.target.value)}
                  />
                </label>
                <button style={{ ...btnStyle('danger'), alignSelf: 'flex-start' }} onClick={() => removeItem('faq', i)}>
                  حذف هذا السؤال
                </button>
              </div>
            ))}
            <button style={{ ...btnStyle('ghost'), alignSelf: 'flex-start' }} onClick={() => addItem('faq', { q: '', a: '' })}>
              + إضافة سؤال جديد
            </button>
            <SaveBar saving={savingTab === 'faq'} saved={savedTab === 'faq'} onSave={() => saveSection('faq')} />
          </div>
        )}

        {/* ACHIEVEMENTS TAB */}
        {activeTab === 'achievements' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {content.achievements.map((ach, i) => (
              <div key={ach.id || i} style={cardStyle}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <label style={labelStyle}>
                    العنوان
                    <input style={inputStyle} value={ach.title} onChange={(e) => updateField('achievements', i, 'title', e.target.value)} />
                  </label>
                  <label style={labelStyle}>
                    عنوان مختصر (يظهر في التبويب السفلي)
                    <input style={inputStyle} value={ach.short} onChange={(e) => updateField('achievements', i, 'short', e.target.value)} />
                  </label>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  <label style={labelStyle}>
                    السنة
                    <input style={inputStyle} value={ach.year} onChange={(e) => updateField('achievements', i, 'year', e.target.value)} />
                  </label>
                  <label style={labelStyle}>
                    النوع (تكريم / بغداد / ...)
                    <input style={inputStyle} value={ach.stamp} onChange={(e) => updateField('achievements', i, 'stamp', e.target.value)} />
                  </label>
                  <label style={labelStyle}>
                    الموقع
                    <input style={inputStyle} value={ach.place} onChange={(e) => updateField('achievements', i, 'place', e.target.value)} />
                  </label>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 600 }}>الفقرات</span>
                  {(ach.body || []).map((p, pi) => (
                    <div key={pi} style={{ display: 'flex', gap: 8 }}>
                      <textarea
                        style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }}
                        value={p}
                        onChange={(e) => updateListField('achievements', i, 'body', pi, e.target.value)}
                      />
                      <button style={btnStyle('danger')} onClick={() => removeListItem('achievements', i, 'body', pi)}>
                        حذف
                      </button>
                    </div>
                  ))}
                  <button style={{ ...btnStyle('ghost'), alignSelf: 'flex-start' }} onClick={() => addListItem('achievements', i, 'body')}>
                    + إضافة فقرة
                  </button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  {ach.photo && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={ach.photo.startsWith('http') ? ach.photo : '/assets/' + ach.photo}
                      alt=""
                      style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 8, border: '1px solid #ececed' }}
                    />
                  )}
                  <label style={{ ...btnStyle('ghost'), cursor: 'pointer' }}>
                    تغيير الصورة
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => e.target.files[0] && uploadAchievementPhoto(i, e.target.files[0])}
                    />
                  </label>
                </div>
                <button style={{ ...btnStyle('danger'), alignSelf: 'flex-start' }} onClick={() => removeItem('achievements', i)}>
                  حذف هذا الإنجاز
                </button>
              </div>
            ))}
            <button
              style={{ ...btnStyle('ghost'), alignSelf: 'flex-start' }}
              onClick={() => addItem('achievements', { title: '', short: '', year: '', stamp: '', place: '', photo: '', body: [''] })}
            >
              + إضافة إنجاز جديد
            </button>
            <SaveBar saving={savingTab === 'achievements'} saved={savedTab === 'achievements'} onSave={() => saveSection('achievements')} />
          </div>
        )}

        {/* CONTACT TAB */}
        {activeTab === 'contact' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={cardStyle}>
              <label style={labelStyle}>
                رقم الهاتف الأول
                <input style={inputStyle} value={content.contact.phone1} onChange={(e) => updateContactField('phone1', e.target.value)} />
              </label>
              <label style={labelStyle}>
                رقم الهاتف الثاني
                <input style={inputStyle} value={content.contact.phone2} onChange={(e) => updateContactField('phone2', e.target.value)} />
              </label>
              <label style={labelStyle}>
                البريد الإلكتروني
                <input style={inputStyle} value={content.contact.email} onChange={(e) => updateContactField('email', e.target.value)} />
              </label>
              <label style={labelStyle}>
                العنوان
                <input style={inputStyle} value={content.contact.address} onChange={(e) => updateContactField('address', e.target.value)} />
              </label>
              <label style={labelStyle}>
                الرقم المختصر
                <input style={inputStyle} value={content.contact.hotline} onChange={(e) => updateContactField('hotline', e.target.value)} />
              </label>
            </div>
            <SaveBar saving={savingTab === 'contact'} saved={savedTab === 'contact'} onSave={() => saveSection('contact')} />
          </div>
        )}

        {/* VISA MODULE TAB */}
        {activeTab === 'visa' && <VisaAdmin />}
      </div>
    </div>
  );
}

function SaveBar({ saving, saved, onSave }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', bottom: 16 }}>
      <button onClick={onSave} disabled={saving} style={btnStyle('primary')}>
        {saving ? '...جارٍ الحفظ' : 'حفظ التغييرات'}
      </button>
      {saved && <span style={{ color: '#049dc5', fontSize: 14, fontWeight: 600 }}>✓ تم الحفظ</span>}
    </div>
  );
}
