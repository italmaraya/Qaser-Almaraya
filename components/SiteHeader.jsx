'use client';
import Link from 'next/link';

const NAV = [
  { href: '/', label: 'الرئيسية' },
  { href: '/flights', label: 'الطيران والفنادق' },
  { href: '/visa', label: 'التأشيرات' },
  { href: '/jobs', label: 'الوظائف' },
  { href: '/faq', label: 'الأسئلة الشائعة' },
  { href: '/contact', label: 'تواصل معنا' },
];

export default function SiteHeader({ active = 'التأشيرات' }) {
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
        <nav className="qa-navrow" style={{ display: 'flex', alignItems: 'center', gap: 20, flex: 1, flexWrap: 'wrap', fontSize: 16 }}>
          {NAV.map((item) => {
            const on = item.label === active;
            return (
              <Link
                key={item.label}
                href={item.href}
                className="qa-nav"
                style={{ fontWeight: on ? 700 : 500, color: on ? '#049dc5' : '#3d4650', paddingBottom: 2, borderBottom: `2px solid ${on ? '#049dc5' : 'transparent'}` }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <Link href="/#contact" className="qa-btn qa-cyan" style={{ flex: 'none', padding: '9px 18px', fontSize: 14, textDecoration: 'none' }}>
          تواصل معنا
        </Link>
      </div>
    </header>
  );
}
