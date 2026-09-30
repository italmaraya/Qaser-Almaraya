'use client';
import { useMemo, useState } from 'react';
import { parseWorkbook } from '../lib/importGroups';

const btn = (k) => ({ padding: '9px 16px', borderRadius: 8, border: k === 'ghost' ? '1px solid #ececed' : 0, background: k === 'primary' ? '#049dc5' : k === 'ghost' ? '#fff' : '#f1f3f5', color: k === 'primary' ? '#fff' : '#1d2733', fontWeight: 700, fontSize: 13.5, cursor: 'pointer', fontFamily: 'inherit' });
const fmt = (n) => (Number(n) || 0).toLocaleString('en-US');

// Packages tab → import many groups from the Excel workbook.
export default function GroupsImport({ onDone }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState('');
  const [err, setErr] = useState('');
  const [drafts, setDrafts] = useState(null);
  const [preview, setPreview] = useState([]);
  const [picked, setPicked] = useState({});
  const [result, setResult] = useState(null);

  const byDest = useMemo(() => {
    const g = {};
    preview.forEach((p) => { (g[p.dest] = g[p.dest] || []).push(p); });
    return g;
  }, [preview]);

  async function upload(file) {
    setErr(''); setResult(null); setBusy('read');
    try {
      // Parse the Excel file in the browser (no server upload-size limit).
      const buf = await file.arrayBuffer();
      const list = parseWorkbook(new Uint8Array(buf));
      if (!list.length) throw new Error('لم نجد أي مجموعات في هذا الملف. تأكد أنه ملف كروبات قصر المرايا.');
      const prev = list.map((d, i) => ({
        i, dest: d.dest_ar, title: d.title_ar, nights: d.nights, days: d.day_count,
        date: d.available_dates[0] ? d.available_dates[0].date : '',
        hotels: d._hotelCount, price: d.price, flight: d.flights[0] ? d.flights[0].nameAr : '',
      }));
      setDrafts(list); setPreview(prev);
      setPicked(Object.fromEntries(prev.map((p) => [p.i, true])));
    } catch (e) { setErr(e.message || 'تعذّرت قراءة الملف'); } finally { setBusy(''); }
  }

  async function commit() {
    const chosen = drafts.filter((_, i) => picked[i]);
    if (!chosen.length) { setErr('اختر باقة واحدة على الأقل'); return; }
    setBusy('save'); setErr('');
    try {
      // Send in small batches so each request stays well under the size limit.
      const SIZE = 15;
      let inserted = 0;
      for (let i = 0; i < chosen.length; i += SIZE) {
        const batch = chosen.slice(i, i + SIZE);
        const r = await fetch('/api/admin/packages/import', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ drafts: batch }) });
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || 'تعذّر الحفظ');
        inserted += d.inserted || 0;
        setResult(inserted); // live progress
      }
      if (onDone) onDone();
    } catch (e) { setErr(e.message); } finally { setBusy(''); }
  }

  const chosenCount = Object.values(picked).filter(Boolean).length;
  const toggleDest = (dest, on) => setPicked((p) => { const n = { ...p }; byDest[dest].forEach((x) => { n[x.i] = on; }); return n; });

  if (!open) return (
    <button type="button" style={{ ...btn('ghost'), borderColor: '#cfe9f2', color: '#036f8c' }} onClick={() => setOpen(true)}>📥 استيراد المجموعات من Excel</button>
  );

  return (
    <div style={{ border: '1px solid #d9e9ef', background: '#f7fcfe', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <b style={{ fontSize: 15, color: '#036f8c' }}>📥 استيراد المجموعات من ملف Excel</b>
        <button type="button" style={{ ...btn('ghost'), marginInlineStart: 'auto' }} onClick={() => setOpen(false)}>إغلاق</button>
      </div>

      {result != null ? (
        <div style={{ background: '#eefaf3', border: '1px solid #cdebd9', borderRadius: 8, padding: 12, color: '#1a7f47', fontWeight: 700 }}>
          ✓ تم استيراد {result} باقة كمسودة مخفية. راجِعها في القائمة بالأسفل ثم أظهرها عندما تكون جاهزة.
        </div>
      ) : !drafts ? (
        <>
          <span style={{ fontSize: 13, color: '#3d4650', lineHeight: 1.8 }}>
            ارفع ملف «كروبات قصر المرايا» (بصيغة .xlsx). سيقرأ النظام كل تبويب مجموعة ويعرض لك قائمة البرامج لتختار ما تريد استيراده.
            تُستورد الباقات <b>مخفية</b> لمراجعتها قبل نشرها. يُتجاهَل تبويبا Visa وTemplate وما شابه.
          </span>
          <label style={{ ...btn('primary'), display: 'inline-block', width: 'fit-content' }}>
            {busy === 'read' ? 'جارٍ القراءة…' : 'اختيار ملف Excel'}
            <input type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files[0]; e.target.value = ''; if (f) upload(f); }} />
          </label>
        </>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13.5 }}>وجدنا <b>{preview.length}</b> برنامجاً. المختار: <b>{chosenCount}</b></span>
            <button type="button" style={btn('ghost')} onClick={() => setPicked(Object.fromEntries(preview.map((p) => [p.i, true])))}>تحديد الكل</button>
            <button type="button" style={btn('ghost')} onClick={() => setPicked({})}>إلغاء الكل</button>
            <button type="button" style={{ ...btn('primary'), marginInlineStart: 'auto' }} disabled={busy === 'save' || !chosenCount} onClick={commit}>{busy === 'save' ? 'جارٍ الاستيراد…' : `استيراد المختار (${chosenCount})`}</button>
          </div>
          <div style={{ maxHeight: 460, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {Object.entries(byDest).map(([dest, items]) => {
              const allOn = items.every((x) => picked[x.i]);
              return (
                <div key={dest} style={{ border: '1px solid #ececed', borderRadius: 10, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#eaf8fd', padding: '7px 12px' }}>
                    <input type="checkbox" checked={allOn} onChange={(e) => toggleDest(dest, e.target.checked)} />
                    <b style={{ fontSize: 13.5 }}>{dest}</b>
                    <span style={{ fontSize: 12, color: '#7b8087' }}>({items.length})</span>
                  </div>
                  {items.map((p) => (
                    <label key={p.i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 12px', borderTop: '1px solid #f1f3f5', fontSize: 13, cursor: 'pointer' }}>
                      <input type="checkbox" checked={!!picked[p.i]} onChange={(e) => setPicked((x) => ({ ...x, [p.i]: e.target.checked }))} />
                      <span style={{ flex: 1 }}>{p.title || '(بدون عنوان)'}</span>
                      <span style={{ color: '#7b8087', fontSize: 12 }}>
                        {p.nights ? p.nights + ' ليالٍ' : ''} {p.date ? '· ' + p.date : ''} · {p.hotels} فنادق · من {fmt(p.price)} د.ع
                      </span>
                    </label>
                  ))}
                </div>
              );
            })}
          </div>
        </>
      )}
      {err && <span style={{ color: '#c02643', fontSize: 13 }}>{err}</span>}
    </div>
  );
}
