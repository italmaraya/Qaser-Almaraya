'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useLangToggle } from '../lib/i18n';
import { useCurrencyToggle } from '../lib/currency';

const NAV = [
  { href: '/', label: 'الرئيسية' },
  { href: '/flights', label: 'الطيران والفنادق' },
  { href: '/visa', label: 'التأشيرات' },
  { href: '/jobs', label: 'الوظائف' },
  { href: '/faq', label: 'الأسئلة الشائعة' },
  { href: '/contact', label: 'تواصل معنا' },
];

export default function SiteHeader({ active = 'التأشيرات' }) {
  const { lang, toggle } = useLangToggle();
  const { currency, toggle: toggleCurrency } = useCurrencyToggle();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 40, background: '#fff', borderBottom: '1px solid #ececed', boxShadow: '0 1px 2px rgba(29,39,51,.06)' }}>
      <div className="qa-head" style={{ maxWidth: 1240, margin: '0 auto', padding: '12px 32px', display: 'flex', alignItems: 'center', gap: 24 }}>
        <Link href="/" aria-label="قصر المرايا للسفر و السياحة" className="qa-logo" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none', flex: 'none' }}>
          <img src="/assets/logo-mark-tight.png" alt="" style={{ height: 38, width: 38, objectFit: 'contain', display: 'block', flex: 'none' }} />
          <span style={{ display: 'flex', flexDirection: 'column', gap: 1, lineHeight: 1.05 }}>
            <span style={{ fontSize: 19, fontWeight: 700, color: '#22a9d4', whiteSpace: 'nowrap' }}>قصر المرايا</span>
            <span style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '.02em', color: '#7b8087', whiteSpace: 'nowrap' }}>للسفر و السياحة</span>
          </span>
        </Link>

        {/* Desktop nav row — hidden on mobile via CSS */}
        <nav className="qa-navrow" style={{ display: 'flex', alignItems: 'center', gap: 20, flex: 1, flexWrap: 'wrap', fontSize: 16 }}>
          {NAV.map((item) => {
            const on = item.label === active;
            return (
              <Link
                key={item.label}
                href={item.href}
                className="qa-nav"
                data-i18n-short=""
                style={{ fontWeight: on ? 700 : 500, color: on ? '#049dc5' : '#3d4650', paddingBottom: 2, borderBottom: `2px solid ${on ? '#049dc5' : 'transparent'}` }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Desktop-only controls — hidden on mobile via CSS */}
        <button
          type="button"
          onClick={toggle}
          aria-label="Language"
          title="Language"
          data-no-i18n=""
          className="qa-langbtn"
          style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 7, padding: '8px 14px', border: '1px solid #ececed', borderRadius: 999, background: '#fff', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, letterSpacing: '.04em', color: '#22a9d4', cursor: 'pointer' }}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3c2.5 2.6 2.5 15.4 0 18M12 3c-2.5 2.6-2.5 15.4 0 18" /></svg>
          <span>{lang === 'ar' ? 'EN' : 'ع'}</span>
        </button>
        <button
          type="button"
          onClick={toggleCurrency}
          aria-label="Currency"
          title="Currency"
          data-no-i18n=""
          className="qa-langbtn"
          style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 7, padding: '8px 14px', border: '1px solid #ececed', borderRadius: 999, background: '#fff', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, letterSpacing: '.04em', color: '#22a9d4', cursor: 'pointer' }}
        >
          <span>{currency === 'IQD' ? 'USD' : 'IQD'}</span>
        </button>
        <Link href="/contact" className="qa-btn qa-cyan qa-headcta" style={{ flex: 'none', padding: '9px 18px', fontSize: 14, textDecoration: 'none' }}>
          تواصل معنا
        </Link>

        {/* Mobile-only hamburger — hidden on desktop via CSS */}
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="القائمة"
          aria-expanded={open}
          className="qa-burger"
          style={{
            display: 'none',
            flex: 'none',
            alignItems: 'center',
            justifyContent: 'center',
            width: 42,
            height: 42,
            border: 0,
            borderRadius: 10,
            background: '#049dc5',
            color: '#fff',
            cursor: 'pointer',
            marginInlineStart: 'auto',
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M3 6h18" />
            <path d="M3 12h18" />
            <path d="M3 18h18" />
          </svg>
        </button>
      </div>

      {/* Mobile menu overlay */}
      {open && (
        <div
          className="qa-mobilemenu"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            background: '#049dc5',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '14px 18px' }}>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="إغلاق"
              style={{
                width: 42,
                height: 42,
                borderRadius: 10,
                border: 0,
                background: 'rgba(255,255,255,.18)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                <path d="M6 6l12 12" />
                <path d="M18 6L6 18" />
              </svg>
            </button>
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', padding: '4px 26px 20px' }}>
            {NAV.map((item) => {
              const on = item.label === active;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  data-i18n-short=""
                  style={{
                    color: '#fff',
                    fontSize: 20,
                    fontWeight: on ? 800 : 600,
                    padding: '15px 4px',
                    borderBottom: '1px solid rgba(255,255,255,.18)',
                    textDecoration: 'none',
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div style={{ marginTop: 'auto', padding: '18px 26px 30px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              type="button"
              onClick={toggle}
              data-no-i18n=""
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                padding: '10px 16px',
                border: '1px solid rgba(255,255,255,.35)',
                borderRadius: 999,
                background: 'transparent',
                fontFamily: 'inherit',
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: '.04em',
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3c2.5 2.6 2.5 15.4 0 18M12 3c-2.5 2.6-2.5 15.4 0 18" /></svg>
              <span>{lang === 'ar' ? 'EN' : 'ع'}</span>
            </button>
            <button
              type="button"
              onClick={toggleCurrency}
              data-no-i18n=""
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                padding: '10px 16px',
                border: '1px solid rgba(255,255,255,.35)',
                borderRadius: 999,
                background: 'transparent',
                fontFamily: 'inherit',
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: '.04em',
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              <span>{currency === 'IQD' ? 'USD' : 'IQD'}</span>
            </button>
            <Link
              href="/contact"
              onClick={() => setOpen(false)}
              style={{
                flex: 1,
                textAlign: 'center',
                padding: '12px 18px',
                borderRadius: 999,
                background: '#fff',
                color: '#049dc5',
                fontWeight: 700,
                fontSize: 15,
                textDecoration: 'none',
              }}
            >
              تواصل معنا
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
