'use client';
import Icon from './Icon';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useLangToggle } from '../lib/i18n';
import SeasonDecor from './SeasonDecor';

const NAV = [
  { href: '/', label: 'الرئيسية' },
  { href: '/flights', label: 'الطيران والفنادق' },
  { href: '/packages', label: 'المجموعات والباقات', labelEn: 'Groups & Packages' },
  { href: '/visa', label: 'التأشيرات' },
  { href: '/guide', label: 'دليل الوجهات', labelEn: 'Travel guides' },
  { href: '/jobs', label: 'الوظائف' },
  { href: '/faq', label: 'الأسئلة الشائعة' },
  { href: '/contact', label: 'تواصل معنا' },
];

export default function SiteHeader({ active = 'التأشيرات' }) {
  const { lang, toggle } = useLangToggle();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 40, background: '#fff', borderBottom: '1px solid var(--qs-line,#ececed)', boxShadow: 'var(--tw-card-shadow,0 1px 3px rgba(29,39,51,.06))' }}>
      <SeasonDecor />
      <div className="qa-head" style={{ maxWidth: 1240, margin: '0 auto', padding: '12px 32px', display: 'flex', alignItems: 'center', gap: 24 }}>
        <Link href="/" aria-label="قصر المرايا للسفر و السياحة" className="qa-logo" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', flex: 'none' }}>
          <img src="/assets/logo-mark-tight.webp" alt="" style={{ height: 38, width: 38, objectFit: 'contain', display: 'block', flex: 'none' }} />
          <span style={{ display: 'flex', flexDirection: 'column', gap: 1, lineHeight: 1.05 }}>
            <span style={{ fontSize: 19, fontWeight: 700, color: 'var(--qs-brand-deep,#22a9d4)', whiteSpace: 'nowrap' }}>قصر المرايا</span>
            <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--qs-ink-2,#5f666e)', whiteSpace: 'nowrap' }}>للسفر و السياحة</span>
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
                data-i18n-short={item.labelEn ? undefined : ''}
                data-no-i18n={item.labelEn ? '' : undefined}
                style={{ fontWeight: on ? 700 : 500, color: on ? 'var(--qs-brand-deep,#049dc5)' : 'var(--qs-body,#3d4650)', paddingBottom: 2, borderBottom: `2px solid ${on ? 'var(--qs-brand-deep,#049dc5)' : 'transparent'}` }}
              >
                {item.labelEn && lang === 'en' ? item.labelEn : item.label}
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
          style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', border: '1px solid var(--qs-line,#ececed)', borderRadius: 999, background: '#fff', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, letterSpacing: '.04em', color: 'var(--qs-brand-deep,#22a9d4)', cursor: 'pointer' }}
        >
          <Icon name="globe" size={17} strokeWidth={1.8} />
          <span>{lang === 'ar' ? 'EN' : 'ع'}</span>
        </button>
        <Link href="/contact" className="qa-btn qa-cyan qa-headcta" style={{ flex: 'none', padding: '8px 16px', fontSize: 14, textDecoration: 'none' }}>
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
            borderRadius: 'var(--tw-radius-sm,10px)',
            background: 'var(--qs-band,#049dc5)',
            color: '#fff',
            cursor: 'pointer',
            marginInlineStart: 'auto',
          }}
        >
          <Icon name="menu" size={22} strokeWidth={2.2} />
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
            background: 'var(--qs-band,#049dc5)',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '14px 16px' }}>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="إغلاق"
              style={{
                width: 42,
                height: 42,
                borderRadius: 'var(--tw-radius-sm,10px)',
                border: 0,
                background: 'rgba(255,255,255,.18)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <Icon name="x" size={20} strokeWidth={2.4} />
            </button>
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', padding: '4px 24px 20px' }}>
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
                    padding: '16px 4px',
                    borderBottom: '1px solid rgba(255,255,255,.18)',
                    textDecoration: 'none',
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div style={{ marginTop: 'auto', padding: '16px 24px 28px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              type="button"
              onClick={toggle}
              data-no-i18n=""
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
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
              <Icon name="globe" size={17} strokeWidth={1.8} />
              <span>{lang === 'ar' ? 'EN' : 'ع'}</span>
            </button>
            <Link
              href="/contact"
              onClick={() => setOpen(false)}
              style={{
                flex: 1,
                textAlign: 'center',
                padding: '12px 16px',
                borderRadius: 999,
                background: '#fff',
                color: 'var(--qs-brand-deep,#049dc5)',
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
