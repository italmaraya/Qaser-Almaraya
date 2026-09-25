'use client';
import { useState } from 'react';
import { upload } from '@vercel/blob/client';

const input = { width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 8, border: '1px solid #ececed', fontSize: 14, fontFamily: 'inherit' };
const label = { display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, fontWeight: 600, color: '#3d4650' };
const card = { background: '#fff', border: '1px solid #ececed', borderRadius: 12, padding: 14 };
const btn = (k) => ({ padding: '8px 14px', borderRadius: 8, border: k === 'ghost' ? '1px solid #ececed' : 0, background: k === 'danger' ? '#fdecef' : k === 'primary' ? '#049dc5' : '#fff', color: k === 'danger' ? '#c02643' : k === 'primary' ? '#fff' : '#1d2733', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' });

// Dashboard tab for the homepage cinematic hero (slides + texts).
export default function HeroAdmin({ hero, onChange, onSave, saving, saved }) {
  const h = hero || { slides: [] };
  const slides = h.slides || [];
  const [busy, setBusy] = useState('');
  const [err, setErr] = useState('');
  const [urlText, setUrlText] = useState('');

  const set = (patch) => onChange({ ...h, ...patch });
  const setSlide = (i, patch) => set({ slides: slides.map((s, j) => (j === i ? { ...s, ...patch } : s)) });
  const move = (i, d) => {
    const n = [...slides]; const t = n[i + d]; if (!t) return;
    n[i + d] = n[i]; n[i] = t; set({ slides: n });
  };

  async function uploadFile(file, forPosterOf = null) {
    setErr('');
    setBusy(file.name);
    try {
      const safe = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '-');
      const blob = await upload('hero/' + safe, file, { access: 'public', handleUploadUrl: '/api/admin/upload-media' });
      if (forPosterOf !== null) setSlide(forPosterOf, { poster: blob.url });
      else set({ slides: [...slides, { type: file.type.startsWith('video') ? 'video' : 'image', url: blob.url, poster: '', captionAr: '', captionEn: '' }] });
    } catch (e) {
      setErr('تعذّر رفع الملف: ' + (e.message || ''));
    } finally {
      setBusy('');
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ ...card, background: '#f3fafc', borderColor: '#d9e9ef', fontSize: 13, lineHeight: 1.8, color: '#3d4650' }}>
        🎬 <b>الواجهة السينمائية للصفحة الرئيسية.</b> ارفع فيديوهات قصيرة (10–20 ثانية، بدون صوت، MP4) أو صوراً عريضة للوجهات. تتبدّل تلقائياً كل 7 ثوانٍ بتلاشٍ ناعم.
        إذا لم تُضف أي شريحة، تُبنى الواجهة تلقائياً من صور الباقات والدول.
        <br />💡 نصيحة: فيديو بدقة 1920×1080 وحجم أقل من 15 ميغابايت يعمل بسرعة على الهاتف.
      </div>

      {slides.map((s, i) => (
        <div key={i} style={{ ...card, display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div style={{ width: 220, aspectRatio: '16/9', borderRadius: 10, overflow: 'hidden', background: '#04161f', flex: 'none', position: 'relative' }}>
            {s.type === 'video'
              ? <video src={s.url} poster={s.poster || undefined} muted loop playsInline autoPlay style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              // eslint-disable-next-line @next/next/no-img-element
              : <img src={s.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
            <span style={{ position: 'absolute', top: 6, insetInlineStart: 6, background: 'rgba(0,0,0,.6)', color: '#fff', fontSize: 11, borderRadius: 6, padding: '1px 7px' }}>{i + 1} · {s.type === 'video' ? 'فيديو' : 'صورة'}</span>
          </div>
          <div style={{ flex: 1, minWidth: 240, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <label style={label}>اسم الوجهة (عربي)<input style={input} placeholder="مثال: إسطنبول، تركيا" value={s.captionAr || ''} onChange={(e) => setSlide(i, { captionAr: e.target.value })} /></label>
              <label style={label}>Destination (English)<input style={input} placeholder="e.g. Istanbul, Turkey" value={s.captionEn || ''} onChange={(e) => setSlide(i, { captionEn: e.target.value })} /></label>
            </div>
            {s.type === 'video' && (
              <label style={label}>صورة تظهر قبل تحميل الفيديو (اختياري)
                <input type="file" accept="image/*" onChange={(e) => e.target.files[0] && uploadFile(e.target.files[0], i)} />
              </label>
            )}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button type="button" style={btn('ghost')} disabled={i === 0} onClick={() => move(i, -1)}>▲ للأعلى</button>
              <button type="button" style={btn('ghost')} disabled={i === slides.length - 1} onClick={() => move(i, 1)}>▼ للأسفل</button>
              <button type="button" style={btn('danger')} onClick={() => set({ slides: slides.filter((_, j) => j !== i) })}>حذف</button>
            </div>
          </div>
        </div>
      ))}

      <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: 10, borderStyle: 'dashed' }}>
        <b style={{ fontSize: 14 }}>+ إضافة شريحة</b>
        <label style={label}>ارفع فيديو أو صورة من جهازك
          <input type="file" accept="video/mp4,video/webm,video/quicktime,image/*" disabled={!!busy} onChange={(e) => { const f = e.target.files[0]; e.target.value = ''; if (f) uploadFile(f); }} />
        </label>
        {busy && <span style={{ fontSize: 13, color: '#036f8c' }}>⏳ جارٍ رفع {busy}… قد يستغرق الفيديو دقيقة.</span>}
        <div style={{ display: 'flex', gap: 8 }}>
          <input style={input} placeholder="أو الصق رابطاً مباشراً لفيديو MP4 أو صورة" value={urlText} onChange={(e) => setUrlText(e.target.value)} />
          <button type="button" style={btn('ghost')} onClick={() => {
            const u = urlText.trim(); if (!u) return;
            set({ slides: [...slides, { type: /\.(mp4|webm|mov)(\?|$)/i.test(u) ? 'video' : 'image', url: u, poster: '', captionAr: '', captionEn: '' }] });
            setUrlText('');
          }}>إضافة</button>
        </div>
        {err && <span style={{ fontSize: 13, color: '#c02643' }}>{err}</span>}
      </div>

      <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <b style={{ fontSize: 14 }}>النصوص (اتركها فارغة لاستخدام النص الافتراضي)</b>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <label style={label}>السطر الصغير (عربي)<input style={input} placeholder="شريكك الموثوق في السفر" value={h.kickerAr || ''} onChange={(e) => set({ kickerAr: e.target.value })} /></label>
          <label style={label}>Small line (English)<input style={input} placeholder="Your trusted travel partner" value={h.kickerEn || ''} onChange={(e) => set({ kickerEn: e.target.value })} /></label>
          <label style={label}>العنوان الكبير (عربي)<input style={input} placeholder="رحلتك تبدأ معنا" value={h.titleAr || ''} onChange={(e) => set({ titleAr: e.target.value })} /></label>
          <label style={label}>Big title (English)<input style={input} placeholder="Your journey starts with us" value={h.titleEn || ''} onChange={(e) => set({ titleEn: e.target.value })} /></label>
          <label style={label}>الوصف (عربي)<textarea style={{ ...input, minHeight: 60 }} placeholder="تأشيرات ورحلات وطيران… نخطط لك كل شيء من بغداد إلى العالم." value={h.subtitleAr || ''} onChange={(e) => set({ subtitleAr: e.target.value })} /></label>
          <label style={label}>Description (English)<textarea style={{ ...input, minHeight: 60 }} placeholder="Visas, holidays and flights, planned for you from Baghdad to the world." value={h.subtitleEn || ''} onChange={(e) => set({ subtitleEn: e.target.value })} /></label>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button type="button" style={btn('primary')} disabled={saving || !!busy} onClick={onSave}>{saving ? 'جارٍ الحفظ…' : 'حفظ الواجهة'}</button>
        {saved && <span style={{ color: '#1a7f47', fontSize: 13, fontWeight: 700 }}>✓ تم الحفظ — افتح الصفحة الرئيسية لرؤية التغيير</span>}
      </div>
    </div>
  );
}
