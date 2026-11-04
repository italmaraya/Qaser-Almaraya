'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { getStoredLang } from '../lib/i18n';

// Zoho SalesIQ live chat (brand "Qaser Al-Maraya", portal qaseralmaraya).
// Chats arrive in Zoho SalesIQ / Desk and become tickets in the Desk
// "Customer Care" department. The widget code is public by design: it is
// the same value Zoho shows under Brands › Website › Installation.
const WIDGET_CODE =
  process.env.NEXT_PUBLIC_SALESIQ_WIDGET_CODE ||
  'siq8564e2a4cf1e5ef1752e06072de13ab9b7fd450b60b58a00280ceb0636eed3d2';

// No chat bubble on the dashboard / staff pages.
const HIDE_ON = ['/admin', '/staff', '/login'];
const isHiddenPath = (p) => HIDE_ON.some((h) => (p || '/').startsWith(h));

function siq() {
  return typeof window !== 'undefined' ? window.$zoho?.salesiq : undefined;
}

function applyLang(lang) {
  try { siq()?.language?.(lang === 'en' ? 'en' : 'ar'); } catch { /* widget not ready */ }
}

function applyVisible(show) {
  try { siq()?.floatbutton?.visible?.(show ? 'show' : 'hide'); } catch { /* widget not ready */ }
}

export default function LiveChat() {
  const path = usePathname() || '/';
  const hidden = isHiddenPath(path);

  // Load the widget once, on the first public page the visitor opens.
  useEffect(() => {
    if (hidden) { applyVisible(false); return; }
    if (document.getElementById('zsiqscript')) { applyVisible(true); return; }

    window.$zoho = window.$zoho || {};
    window.$zoho.salesiq = window.$zoho.salesiq || {};
    window.$zoho.salesiq.ready = function () {
      applyLang(getStoredLang());
      applyVisible(!isHiddenPath(window.location.pathname));
    };

    const s = document.createElement('script');
    s.id = 'zsiqscript';
    s.src = 'https://salesiq.zohopublic.com/widget?wc=' + WIDGET_CODE;
    s.defer = true;
    document.body.appendChild(s);
  }, [hidden]);

  // Follow the site's AR/EN toggle.
  useEffect(() => {
    const on = (e) => (e?.detail === 'ar' || e?.detail === 'en') && applyLang(e.detail);
    window.addEventListener('qa-lang-change', on);
    return () => window.removeEventListener('qa-lang-change', on);
  }, []);

  return null;
}
