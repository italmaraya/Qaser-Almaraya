'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getStoredLang } from '../lib/i18n';
import { waLink } from '../lib/whatsapp';

const HIDE_ON = ['/admin', '/staff', '/login'];

const ICONS = {
  home: <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
  visa: <><rect x="5" y="3" width="14" height="18" rx="2" /><circle cx="12" cy="10" r="3" /><path d="M9 16h6" /></>,
  pkg: <><path d="M3 7h18v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></>,
  flight: <path d="M21 15.5v-1.7l-8-5V3.5a1.5 1.5 0 0 0-3 0v5.3l-8 5v1.7l8-2.5v5.2l-2 1.5V21l3.5-1 3.5 1v-1.3l-2-1.5V13z" />,
};

// Phone-only bottom navigation with a raised WhatsApp button in the middle.
export default function MobileBottomBar() {
  const path = usePathname() || '/';
  const [lang, setLang] = useState('ar');
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    setLang(getStoredLang());
    const on = (e) => (e?.detail === 'ar' || e?.detail === 'en') && setLang(e.detail);
    window.addEventListener('qa-lang-change', on);
    // Hide while the on-screen keyboard is up (typing in a form)
    const focusIn = (e) => { if (e.target.matches('input,textarea,select')) setHidden(true); };
    const focusOut = () => setHidden(false);
    document.addEventListener('focusin', focusIn);
    document.addEventListener('focusout', focusOut);
    return () => {
      window.removeEventListener('qa-lang-change', on);
      document.removeEventListener('focusin', focusIn);
      document.removeEventListener('focusout', focusOut);
    };
  }, []);

  if (HIDE_ON.some((p) => path.startsWith(p))) return null;
  const en = lang === 'en';
  const items = [
    { href: '/', key: 'home', label: en ? 'Home' : 'الرئيسية', active: path === '/' },
    { href: '/visa', key: 'visa', label: en ? 'Visas' : 'التأشيرات', active: path.startsWith('/visa') },
    null,
    { href: '/packages', key: 'pkg', label: en ? 'Packages' : 'الباقات', active: path.startsWith('/packages') },
    { href: '/flights', key: 'flight', label: en ? 'Flights' : 'الطيران', active: path.startsWith('/flights') },
  ];
  const waText = en ? 'Hello Qaser Almaraya, I would like some help planning my trip.' : 'مرحباً قصر المرايا، أرغب بالمساعدة في التخطيط لرحلتي.';

  return (
    <nav className={'qa-mbar' + (hidden ? ' hide' : '')} data-no-i18n="" dir={en ? 'ltr' : 'rtl'} aria-label={en ? 'Main' : 'التنقل'}>
      {items.map((it, i) =>
        it ? (
          <Link key={it.key} href={it.href} className={'qa-mbar-i' + (it.active ? ' on' : '')}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill={it.key === 'flight' ? 'currentColor' : 'none'} stroke={it.key === 'flight' ? 'none' : 'currentColor'} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{ICONS[it.key]}</svg>
            <span>{it.label}</span>
          </Link>
        ) : (
          <a key="wa" href={waLink(waText)} target="_blank" rel="noopener" className="qa-mbar-wa" aria-label="WhatsApp">
            <span className="qa-mbar-wab">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.04 2a9.9 9.9 0 0 0-8.5 14.98L2 22l5.16-1.5A9.93 9.93 0 1 0 12.04 2zm4.5 11.96c-.25-.12-1.46-.72-1.69-.8-.23-.09-.39-.13-.56.12-.16.25-.64.8-.79.97-.14.16-.29.19-.54.06a6.7 6.7 0 0 1-3.34-2.92c-.25-.43.25-.4.72-1.34.08-.16.04-.3-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.41-.56-.42h-.48a.92.92 0 0 0-.66.31 2.78 2.78 0 0 0-.87 2.07 4.83 4.83 0 0 0 1.01 2.56 11.05 11.05 0 0 0 4.23 3.74c1.58.68 2.2.74 2.99.62.48-.07 1.46-.6 1.67-1.18.2-.58.2-1.07.14-1.18-.06-.1-.22-.16-.47-.28z" /></svg>
            </span>
            <span>{en ? 'WhatsApp' : 'واتساب'}</span>
          </a>
        )
      )}
    </nav>
  );
}
