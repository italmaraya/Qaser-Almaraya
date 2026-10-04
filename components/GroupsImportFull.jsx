'use client';
import { useState } from 'react';
import { parseTemplate } from '../lib/importTemplate';

const btn = (k) => ({ padding: '9px 16px', borderRadius: 8, border: k === 'ghost' ? '1px solid #ececed' : 0, background: k === 'primary' ? '#049dc5' : k === 'ghost' ? '#fff' : '#f1f3f5', color: k === 'primary' ? '#fff' : '#1d2733', fontWeight: 700, fontSize: 13.5, cursor: 'pointer', fontFamily: 'inherit' });

// Packages tab → import full packages (hotels, prices, details, daily program)
// from the structured template workbook. Packages are saved hidden for review.
export default function GroupsImportFull({ onDone }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState('');
  const [err, setErr] = useState('');
  const [items, setItems] = useState(null);
  const [picked, setPicked] = useState({});
  const [result, setResult] = useState(null);

  async function upload(file) {
    setErr(''); setResult(null); setBusy('read');
    try {
      const buf = await file.arrayBuffer();
      const list = parseTemplate(new Uint8Array(buf));
      setItems(list);
      setPicked(Object.fromEntries(list.map((_, i) => [i, true])));
    } catch (e) { setErr(e.message || 'تعذّرت قراءة الملف'); } finally { setBusy(''); }
  }

  async function commit() {
    const chosen = items.filter((_, i) => picked[i]);
    if (!chosen.length) { setErr('اختاري باقة واحدة على الأقل'); return; }
    setBusy('save'); setErr('');
    let ok = 0;
    const failed = [];
    for (const it of chosen) {
      try {
        const r = await fetch('/api/admin/packages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(it.draft) });
        if (!r.ok) {
          const d = await r.json().catch(() => ({}));
          throw new Error(d.error || 'تعذّر الحفظ');
        }
        ok += 1;
      } catch (e) { failed.push((it.draft.title_ar || '(بدون عنوان)') + ': ' + e.message); }
    }
    setResult({ ok, failed });
    setBusy('');
    if (ok && onDone) onDone();
  }

  const chosenCount = Object.values(picked).filter(Boolean).length;

  if (!open) return (
    <button type="button" style={{ ...btn('ghost'), borderColor: '#cfe9f2', color: '#036f8c' }} onClick={() => setOpen(true)}>📥 استيراد من القالب الكامل</button>
  );

  return (
    <div style={{ border: '1px solid #d9e9ef', background: '#f7fcfe', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <b style={{ fontSize: 15, color: '#036f8c' }}>📥 استيراد من القالب الكامل (الباقات + الفنادق + البرنامج اليومي)</b>
        <button type="button" style={{ ...btn('ghost'), marginInlineStart: 'auto' }} onClick={() => setOpen(false)}>إغلاق</button>
      </div>

      {result ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {result.ok > 0 && (
            <div style={{ background: '#eefaf3', border: '1px solid #cdebd9', borderRadius: 8, padding: 12, color: '#1a7f47', fontWeight: 700 }}>
              ✓ تم استيراد {result.ok} باقة كمسودة مخفية. راجعيها في القائمة بالأسفل ثم أظهريها لما تكون جاهزة.
            </div>
          )}
          {result.failed.map((f, i) => (
            <div key={i} style={{ background: '#fdecef', border: '1px solid #f5c6d0', borderRadius: 8, padding: 10, color: '#c02643', fontSize: 13 }}>✗ {f}</div>
          ))}
        </div>
      ) : !items ? (
        <>
          <span style={{ fontSize: 13, color: '#3d4650', lineHeight: 1.8 }}>
            ارفعي ملف القالب الكامل (.xlsx) اللي فيه الشيتات: الباقات، الفنادق، البرنامج اليومي.
            كل باقة بتتحفظ <b>مخفية</b> عشان تراجعيها قبل النشر. الصور بتتضاف بعد كده من الباقة نفسها.
          </span>
          <label style={{ ...btn('primary'), display: 'inline-block', width: 'fit-content' }}>
            {busy === 'read' ? 'جارٍ القراءة…' : 'اختيار ملف القالب'}
            <input type="file" accept=".xlsx" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files[0]; e.target.value = ''; if (f) upload(f); }} />
          </label>
        </>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13.5 }}>لقينا <b>{items.length}</b> باقة. المختار: <b>{chosenCount}</b></span>
            <button type="button" style={{ ...btn('primary'), marginInlineStart: 'auto' }} disabled={busy === 'save' || !chosenCount} onClick={commit}>
              {busy === 'save' ? 'جارٍ الحفظ…' : `حفظ المختار كمسودات (${chosenCount})`}
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {items.map((it, i) => (
              <label key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4, border: '1px solid #ececed', borderRadius: 10, padding: '8px 12px', background: '#fff', cursor: 'pointer' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5 }}>
                  <input type="checkbox" checked={!!picked[i]} onChange={(e) => setPicked((p) => ({ ...p, [i]: e.target.checked }))} />
                  <b>{it.draft.title_ar || '(بدون عنوان)'}</b>
                  <span style={{ color: '#7b8087', fontSize: 12 }}>
                    {it.draft.hotels.length} فنادق · {it.draft.days.length} أيام · {it.draft.available_dates.length} تواريخ
                  </span>
                </span>
                {it.warnings.map((w, j) => (
                  <span key={j} style={{ fontSize: 12, color: '#8a5a00', background: '#fff4dc', borderRadius: 6, padding: '2px 8px', width: 'fit-content' }}>⚠ {w}</span>
                ))}
              </label>
            ))}
          </div>
        </>
      )}
      {err && <span style={{ color: '#c02643', fontSize: 13 }}>{err}</span>}
    </div>
  );
}
