'use client';
import { useEffect, useRef, useState } from 'react';
import NewsBody, { NEWS_BODY_CSS } from './NewsBody';

const CATS = [
  ['news', 'أخبار الشركة'], ['tips', 'نصائح السفر'], ['visas', 'تأشيرات'], ['offers', 'عروض ورحلات'], ['events', 'فعاليات ومعارض'],
];
const input = { width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 8, border: '1px solid #ececed', fontSize: 14, fontFamily: 'inherit' };
const label = { display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, fontWeight: 600, color: '#3d4650' };
const btn = (k) => ({ padding: '8px 14px', borderRadius: 8, border: k === 'ghost' ? '1px solid #ececed' : 0, background: k === 'danger' ? '#fdecef' : k === 'primary' ? '#049dc5' : '#fff', color: k === 'danger' ? '#c02643' : k === 'primary' ? '#fff' : '#1d2733', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' });
const blank = () => ({ id: null, title_ar: '', title_en: '', excerpt_ar: '', excerpt_en: '', body_ar: '', body_en: '', cover_url: '', category: 'news', published: false, featured: false, published_at: new Date().toISOString(), slug: '' });

async function uploadImage(file) {
  const fd = new FormData();
  fd.append('file', file);
  const r = await fetch('/api/admin/upload', { method: 'POST', body: fd });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || 'تعذّر رفع الصورة');
  return d.url;
}

function Editor({ post, onSaved, onCancel }) {
  const [f, setF] = useState(post);
  const [lang, setLang] = useState('ar');
  const [busy, setBusy] = useState('');
  const [err, setErr] = useState('');
  const bodyRef = useRef(null);
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const bodyKey = lang === 'ar' ? 'body_ar' : 'body_en';

  function insert(before, after = '', placeholder = '') {
    const el = bodyRef.current;
    const val = f[bodyKey] || '';
    const s = el ? el.selectionStart : val.length, e = el ? el.selectionEnd : val.length;
    const sel = val.slice(s, e) || placeholder;
    const next = val.slice(0, s) + before + sel + after + val.slice(e);
    set(bodyKey, next);
    setTimeout(() => { if (el) { el.focus(); el.selectionStart = s + before.length; el.selectionEnd = s + before.length + sel.length; } }, 0);
  }
  async function insertImage(file) {
    setBusy('img'); setErr('');
    try { const url = await uploadImage(file); insert('\n\n![', '](' + url + ')\n\n', 'وصف الصورة'); } catch (e) { setErr(e.message); } finally { setBusy(''); }
  }
  async function setCover(file) {
    setBusy('cover'); setErr('');
    try { set('cover_url', await uploadImage(file)); } catch (e) { setErr(e.message); } finally { setBusy(''); }
  }
  async function save(publish) {
    setBusy('save'); setErr('');
    const payload = { ...f, published: publish === undefined ? f.published : publish };
    try {
      const r = await fetch(f.id ? '/api/admin/news/' + f.id : '/api/admin/news', { method: f.id ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'تعذّر الحفظ');
      onSaved(d);
    } catch (e) { setErr(e.message); } finally { setBusy(''); }
  }

  const dateVal = (f.published_at || '').slice(0, 10);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <style>{NEWS_BODY_CSS}</style>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <button type="button" style={btn('ghost')} onClick={onCancel}>→ رجوع للقائمة</button>
        <b style={{ fontSize: 16 }}>{f.id ? 'تعديل المقال' : 'مقال جديد'}</b>
        <span style={{ marginInlineStart: 'auto', fontSize: 12.5, fontWeight: 700, borderRadius: 999, padding: '3px 10px', background: f.published ? '#eefaf3' : '#f1f3f5', color: f.published ? '#1a7f47' : '#7b8087' }}>{f.published ? '● منشور' : '○ مسودة'}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <label style={label}>العنوان (عربي) *<input style={input} value={f.title_ar} onChange={(e) => set('title_ar', e.target.value)} placeholder="مثال: تأشيرة جورجيا الإلكترونية أصبحت أسرع" /></label>
        <label style={label}>Title (English)<input style={{ ...input, direction: 'ltr' }} value={f.title_en} onChange={(e) => set('title_en', e.target.value)} placeholder="e.g. Georgia e-visa is now faster" /></label>
        <label style={label}>ملخص قصير (يظهر في البطاقة وفي Google)<textarea style={{ ...input, minHeight: 64 }} value={f.excerpt_ar} onChange={(e) => set('excerpt_ar', e.target.value)} /></label>
        <label style={label}>Short summary (English)<textarea style={{ ...input, minHeight: 64, direction: 'ltr' }} value={f.excerpt_en} onChange={(e) => set('excerpt_en', e.target.value)} /></label>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 10, alignItems: 'end' }}>
        <label style={label}>التصنيف
          <select style={input} value={f.category} onChange={(e) => set('category', e.target.value)}>{CATS.map(([id, t]) => <option key={id} value={id}>{t}</option>)}</select>
        </label>
        <label style={label}>تاريخ النشر
          <input type="date" style={input} value={dateVal} onChange={(e) => set('published_at', e.target.value ? new Date(e.target.value + 'T09:00:00').toISOString() : new Date().toISOString())} />
        </label>
        <label style={{ ...label, flexDirection: 'row', alignItems: 'center', gap: 8 }}><input type="checkbox" checked={!!f.featured} onChange={(e) => set('featured', e.target.checked)} /> ⭐ مقال مميّز (يظهر كبيراً في الأعلى)</label>
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ width: 200, aspectRatio: '16/9', borderRadius: 10, background: f.cover_url ? `url("${f.cover_url}") center/cover` : '#f1f3f5', border: '1px solid #ececed', display: 'grid', placeItems: 'center', fontSize: 12, color: '#7b8087' }}>{!f.cover_url && 'صورة الغلاف'}</div>
        <label style={{ ...btn('ghost'), display: 'inline-block' }}>{busy === 'cover' ? 'جارٍ الرفع…' : f.cover_url ? 'تغيير صورة الغلاف' : 'رفع صورة الغلاف'}<input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => e.target.files[0] && setCover(e.target.files[0])} /></label>
        {f.cover_url && <button type="button" style={btn('danger')} onClick={() => set('cover_url', '')}>إزالة</button>}
      </div>

      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
        <button type="button" style={{ ...btn(lang === 'ar' ? 'primary' : 'ghost') }} onClick={() => setLang('ar')}>نص المقال (عربي)</button>
        <button type="button" style={{ ...btn(lang === 'en' ? 'primary' : 'ghost') }} onClick={() => setLang('en')}>Article (English, optional)</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            <button type="button" style={btn('ghost')} onClick={() => insert('\n\n## ', '\n\n', 'عنوان فرعي')}>عنوان</button>
            <button type="button" style={btn('ghost')} onClick={() => insert('**', '**', 'نص عريض')}><b>B</b> عريض</button>
            <button type="button" style={btn('ghost')} onClick={() => insert('\n\n- ', '\n- \n\n', 'عنصر')}>• قائمة</button>
            <button type="button" style={btn('ghost')} onClick={() => insert('\n\n> ', '\n\n', 'ملاحظة مهمة')}>❝ ملاحظة</button>
            <button type="button" style={btn('ghost')} onClick={() => { const u = prompt('الصق الرابط (يبدأ بـ https://)'); if (u) insert('[', '](' + u + ')', 'نص الرابط'); }}>🔗 رابط</button>
            <label style={{ ...btn('ghost'), display: 'inline-block' }}>{busy === 'img' ? 'جارٍ الرفع…' : '🖼 صورة'}<input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => { const x = e.target.files[0]; e.target.value = ''; if (x) insertImage(x); }} /></label>
          </div>
          <textarea ref={bodyRef} style={{ ...input, minHeight: 420, lineHeight: 1.8, direction: lang === 'en' ? 'ltr' : 'rtl' }} value={f[bodyKey] || ''} onChange={(e) => set(bodyKey, e.target.value)} placeholder={'اكتب المقال هنا.\n\nسطر فارغ = فقرة جديدة\n## عنوان فرعي\n- عنصر في قائمة\n**نص عريض**'} />
        </div>
        <div style={{ border: '1px solid #ececed', borderRadius: 12, padding: 16, background: '#fff', maxHeight: 520, overflow: 'auto', direction: lang === 'en' ? 'ltr' : 'rtl' }}>
          <div style={{ fontSize: 11.5, color: '#7b8087', marginBottom: 8 }}>👁 معاينة مباشرة</div>
          <h1 style={{ fontSize: 24, margin: '0 0 10px' }}>{(lang === 'en' ? f.title_en : f.title_ar) || 'عنوان المقال'}</h1>
          <NewsBody text={f[bodyKey]} />
        </div>
      </div>

      {err && <span style={{ color: '#c02643', fontSize: 13 }}>{err}</span>}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', position: 'sticky', bottom: 0, background: '#fff', padding: '10px 0', borderTop: '1px solid #ececed' }}>
        <button type="button" style={btn('primary')} disabled={!!busy} onClick={() => save(true)}>{busy === 'save' ? 'جارٍ الحفظ…' : f.published ? 'حفظ التعديلات' : '🚀 نشر المقال'}</button>
        <button type="button" style={btn('ghost')} disabled={!!busy} onClick={() => save(false)}>{f.published ? 'إلغاء النشر (إخفاء)' : 'حفظ كمسودة'}</button>
        {f.published && f.slug && <a href={'/news/' + encodeURIComponent(f.slug)} target="_blank" rel="noopener" style={{ ...btn('ghost'), textDecoration: 'none' }}>فتح المقال ↗</a>}
      </div>
    </div>
  );
}

// Dashboard tab: المدونة
export default function NewsAdmin() {
  const [posts, setPosts] = useState(null);
  const [editing, setEditing] = useState(null);
  const [err, setErr] = useState('');

  async function load() {
    try { const r = await fetch('/api/admin/news'); const d = await r.json(); if (!r.ok) throw new Error(d.error); setPosts(d); } catch (e) { setErr(e.message || 'تعذّر التحميل'); setPosts([]); }
  }
  useEffect(() => { load(); }, []);

  async function del(p) {
    if (!confirm(`حذف المقال "${p.title_ar}" نهائياً؟`)) return;
    await fetch('/api/admin/news/' + p.id, { method: 'DELETE' });
    load();
  }

  if (editing) return <Editor post={editing} onCancel={() => setEditing(null)} onSaved={(d) => { setEditing(null); load(); }} />;

  const catName = Object.fromEntries(CATS);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <b style={{ fontSize: 16 }}>📰 المدونة والأخبار</b>
        <span style={{ fontSize: 13, color: '#7b8087' }}>تظهر المقالات المنشورة في صفحة <a href="/news" target="_blank" rel="noopener" style={{ color: '#049dc5' }}>/news</a> خلال دقيقة.</span>
        <button type="button" style={{ ...btn('primary'), marginInlineStart: 'auto' }} onClick={() => setEditing(blank())}>+ مقال جديد</button>
      </div>
      {err && <span style={{ color: '#c02643', fontSize: 13 }}>{err}</span>}
      {posts === null && <span style={{ color: '#7b8087' }}>جارٍ التحميل…</span>}
      {posts && !posts.length && <div style={{ padding: 30, textAlign: 'center', color: '#7b8087', border: '1px dashed #d9e9ef', borderRadius: 12 }}>لا توجد مقالات بعد. اضغط «+ مقال جديد» لكتابة أول مقال.</div>}
      {(posts || []).map((p) => (
        <div key={p.id} style={{ display: 'flex', gap: 12, alignItems: 'center', border: '1px solid #ececed', borderRadius: 12, padding: 10, background: '#fff', flexWrap: 'wrap' }}>
          <div style={{ width: 110, aspectRatio: '16/9', borderRadius: 8, background: p.cover_url ? `url("${p.cover_url}") center/cover` : '#eaf8fd', flex: 'none' }} />
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontWeight: 700 }}>{p.featured && '⭐ '}{p.title_ar}</div>
            <div style={{ fontSize: 12.5, color: '#7b8087' }}>{catName[p.category] || p.category} · {new Date(p.published_at).toLocaleDateString('ar-IQ')}</div>
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, borderRadius: 999, padding: '3px 10px', background: p.published ? '#eefaf3' : '#f1f3f5', color: p.published ? '#1a7f47' : '#7b8087' }}>{p.published ? 'منشور' : 'مسودة'}</span>
          <button type="button" style={btn('ghost')} onClick={() => setEditing(p)}>تعديل</button>
          <button type="button" style={btn('danger')} onClick={() => del(p)}>حذف</button>
        </div>
      ))}
    </div>
  );
}
