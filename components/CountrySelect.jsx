'use client';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { flagSrc } from '../lib/flags';

/**
 * A modern, searchable dropdown used in place of a native <select>.
 * options: [{ value, label, flagCode? }]
 *
 * The panel is positioned with real pixel coordinates (position: fixed),
 * measured from the trigger button and clamped to stay fully inside the
 * viewport. This is deliberate: anchoring it with CSS alone (insetInlineStart
 * etc.) broke in a few real layouts — it could get clipped by a parent's
 * overflow, or overflow past the edge of the page when the trigger's own
 * column was narrower than the panel. Measuring in JS sidesteps all of that.
 */
export default function CountrySelect({ value, onChange, options, placeholder = 'اختر', searchPlaceholder = 'ابحث…', emptyLabel = 'لا توجد نتائج' }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlight, setHighlight] = useState(0);
  const [coords, setCoords] = useState(null); // { top, left, width }
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const selected = options.find((o) => String(o.value) === String(value));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  function reposition() {
    const btn = triggerRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const margin = 10;
    const panelWidth = Math.min(Math.max(rect.width, 260), window.innerWidth - margin * 2);
    // Align the panel's right edge with the trigger's right edge (natural
    // reading direction for this RTL site), then clamp both edges so it
    // never spills past the viewport regardless of where the field sits.
    let left = rect.right - panelWidth;
    left = Math.max(margin, Math.min(left, window.innerWidth - panelWidth - margin));
    let top = rect.bottom + 8;
    top = Math.min(top, window.innerHeight - margin); // keep the panel starting on-screen
    setCoords({ top, left, width: panelWidth });
  }

  useLayoutEffect(() => {
    if (open) reposition();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onReflow() {
      reposition();
    }
    function onScroll() {
      // Closing on scroll avoids a stale fixed-position panel drifting away
      // from its trigger as the page moves underneath it.
      setOpen(false);
      setQuery('');
    }
    window.addEventListener('resize', onReflow);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      window.removeEventListener('resize', onReflow);
      window.removeEventListener('scroll', onScroll, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    function onDocClick(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  useEffect(() => {
    if (open) {
      setHighlight(0);
      setTimeout(() => inputRef.current && inputRef.current.focus(), 30);
    }
  }, [open]);

  function pick(opt) {
    onChange(String(opt.value));
    setOpen(false);
    setQuery('');
  }

  function onKeyDown(e) {
    if (e.key === 'Escape') { setOpen(false); setQuery(''); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlight((h) => Math.min(h + 1, filtered.length - 1)); return; }
    if (e.key === 'ArrowUp') { e.preventDefault(); setHighlight((h) => Math.max(h - 1, 0)); return; }
    if (e.key === 'Enter') { e.preventDefault(); if (filtered[highlight]) pick(filtered[highlight]); }
  }

  return (
    <div ref={rootRef} style={{ position: 'relative' }}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          padding: '2px 0',
          border: 0,
          background: 'transparent',
          fontFamily: 'inherit',
          fontSize: 16,
          fontWeight: 700,
          color: selected ? '#1d2733' : '#7b8087',
          cursor: 'pointer',
          textAlign: 'right',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, overflow: 'hidden' }}>
          {selected && selected.flagCode && (
            <img src={flagSrc(selected.flagCode)} alt="" style={{ width: 20, height: 20, borderRadius: '50%', objectFit: 'cover', flex: 'none' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          )}
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selected ? selected.label : placeholder}</span>
        </span>
        <span style={{ color: '#049dc5', fontSize: 12, flex: 'none', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s ease' }}>▾</span>
      </button>

      {open && coords && (
        <div
          role="listbox"
          data-country-select-panel=""
          style={{
            position: 'fixed',
            top: coords.top,
            left: coords.left,
            width: coords.width,
            zIndex: 200,
            background: '#fff',
            borderRadius: 16,
            border: '1px solid #ececed',
            boxShadow: '0 20px 46px rgba(1,42,55,.22)',
            overflow: 'hidden',
            animation: 'qa-dropdown-in 160ms cubic-bezier(.16,1,.3,1) both',
            transformOrigin: 'top center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderBottom: '1px solid #f2f2f3' }}>
            <span style={{ color: '#7b8087', fontSize: 15 }}>⌕</span>
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={searchPlaceholder}
              style={{ flex: 1, border: 0, outline: 'none', fontFamily: 'inherit', fontSize: 14.5, background: 'transparent', color: '#1d2733' }}
            />
          </div>
          <div ref={listRef} className="qa-dropdown-scroll" style={{ maxHeight: 264, overflowY: 'auto', padding: 6 }}>
            {filtered.length === 0 && (
              <div style={{ padding: '18px 12px', textAlign: 'center', color: '#7b8087', fontSize: 13.5 }}>
                {options.length === 0 ? '...جارٍ التحميل' : emptyLabel}
              </div>
            )}
            {filtered.map((o, i) => {
              const isSelected = String(o.value) === String(value);
              const isHighlighted = i === highlight;
              return (
                <button
                  type="button"
                  key={o.value}
                  onMouseEnter={() => setHighlight(i)}
                  onClick={() => pick(o)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 10px',
                    borderRadius: 10,
                    border: 0,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontSize: 14.5,
                    fontWeight: isSelected ? 700 : 500,
                    color: isSelected ? '#036f8c' : '#1d2733',
                    background: isSelected ? '#eaf8fd' : isHighlighted ? '#f8fdfe' : 'transparent',
                    textAlign: 'right',
                    transition: 'background .12s ease',
                  }}
                >
                  {o.flagCode ? (
                    <img src={flagSrc(o.flagCode)} alt="" style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover', flex: 'none', border: '1px solid #ececed' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                  ) : (
                    <span style={{ width: 26, height: 26, borderRadius: '50%', background: '#f2f2f3', flex: 'none' }} />
                  )}
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.label}</span>
                  {isSelected && <span style={{ color: '#049dc5', fontSize: 15, flex: 'none' }}>✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
