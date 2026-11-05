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
              <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
            </span>
            <span>{en ? 'WhatsApp' : 'واتساب'}</span>
          </a>
        )
      )}
    </nav>
  );
}
