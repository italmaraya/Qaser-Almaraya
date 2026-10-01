'use client';
import { useEffect, useMemo, useState } from 'react';

const input = { width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 8, border: '1px solid #ececed', fontSize: 14, fontFamily: 'inherit' };

// Searchable supplier dropdown with quick-add. Internal only (never shown to customers).
export default function SupplierPicker({ value, onChange }) {
  const [list, setList] = useState([]);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = () => fetch('/api/admin/suppliers').then((r) => r.json()).then((d) => Array.isArray(d) && setList(d)).catch(() => {});
  useEffect(() => { load(); }, []);

  const current = list.find((s) => String(s.id) === String(value));
  const filtered = useMemo(() => list.filter((s) => s.name.toLowerCase().includes(q.trim().toLowerCase())), [list, q]);
  const canAdd = q.trim() && !list.some((s) => s.name.toLowerCase() === q.trim().toLowerCase());

  async function add() {
    setBusy(true);
    try {
      const r = await fetch('/api/admin/suppliers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: q.trim() }) });
      const d = await r.json();
      if (r.ok) { await load(); onChange(d.id); setQ(''); setOpen(false); }
    } finally { setBusy(false); }
  }

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', gap: 6 }}>
        <input style={input} placeholder={current ? current.name : 'ابحث عن مورد أو اكتب اسماً جديداً…'} value={open ? q : (current ? current.name : '')} onFocus={() => { setOpen(true); setQ(''); }} onChange={(e) => { setQ(e.target.value); setOpen(true); }} />
        {value && <button type="button" onClick={() => onChange(null)} title="إزالة المورد" style={{ border: '1px solid #ececed', background: '#fff', borderRadius: 8, padding: '0 12px', cursor: 'pointer', fontFamily: 'inherit' }}>×</button>}
      </div>
      {open && (
        <div style={{ position: 'absolute', zIndex: 20, top: '100%', insetInlineStart: 0, insetInlineEnd: 0, background: '#fff', border: '1px solid #ececed', borderRadius: 10, boxShadow: '0 10px 30px rgba(1,42,55,.12)', maxHeight: 220, overflow: 'auto', marginTop: 4 }}>
          {filtered.map((s) => (
            <button key={s.id} type="button" onMouseDown={() => { onChange(s.id); setOpen(false); setQ(''); }} style={{ display: 'block', width: '100%', textAlign: 'start', padding: '9px 12px', border: 0, background: String(s.id) === String(value) ? '#eaf8fd' : '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}>
              {s.name}
            </button>
          ))}
          {canAdd && (
            <button type="button" disabled={busy} onMouseDown={add} style={{ display: 'block', width: '100%', textAlign: 'start', padding: '9px 12px', border: 0, borderTop: '1px solid #ececed', background: '#fffaf0', color: '#8a5a00', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}>
              + إضافة مورد جديد: «{q.trim()}»
            </button>
          )}
          {!filtered.length && !canAdd && <div style={{ padding: 10, fontSize: 13, color: '#7b8087' }}>لا يوجد موردون بعد — اكتب اسماً لإضافته.</div>}
          <button type="button" onMouseDown={() => setOpen(false)} style={{ display: 'block', width: '100%', padding: 8, border: 0, borderTop: '1px solid #ececed', background: '#f6f7f8', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, color: '#7b8087' }}>إغلاق</button>
        </div>
      )}
    </div>
  );
}
