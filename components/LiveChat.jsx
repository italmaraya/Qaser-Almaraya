'use client';
import { useEffect, useState } from 'react';
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

function openChat() {
  try { siq()?.floatwindow?.visible?.('show'); } catch { /* widget not ready */ }
}

// Text next to the Skylo button. Zoho's own launcher message disappears once
// a visitor closes it, so the site keeps its own label beside the button.
const LABEL = {
  ar: { title: 'تحدّث معنا 💬', sub: 'سكايلو جاهز لمساعدتك' },
  en: { title: 'Chat with us 💬', sub: 'Skylo is here to help' },
};

export default function LiveChat() {
  const path = usePathname() || '/';
  const hidden = isHiddenPath(path);
  const [lang, setLang] = useState('ar');
  const [pos, setPos] = useState(null); // where the label sits, next to the button

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
    setLang(getStoredLang() === 'en' ? 'en' : 'ar');
    const on = (e) => {
      if (e?.detail !== 'ar' && e?.detail !== 'en') return;
      applyLang(e.detail);
      setLang(e.detail);
    };
    window.addEventListener('qa-lang-change', on);
    return () => window.removeEventListener('qa-lang-change', on);
  }, []);

  // Keep the label next to the button; hide it while the chat window is open.
  useEffect(() => {
    if (hidden) { setPos(null); return undefined; }
    const tick = () => {
      const btn = document.getElementById('zsiq_float');
      const wrap = document.getElementById('zsiq_chat_wrap');
      const r = btn?.getBoundingClientRect();
      const chatOpen = (wrap?.getBoundingClientRect().height || 0) > 0;
      if (!r || !r.width || chatOpen) { setPos(null); return; }
      const w = document.documentElement.clientWidth;
      const h = window.innerHeight;
      const next = { right: Math.round(w - r.left + 12), bottom: Math.round(h - r.bottom + r.height / 2) };
      setPos((p) => (p && p.right === next.right && p.bottom === next.bottom ? p : next));
    };
    tick();
    const id = setInterval(tick, 700);
    window.addEventListener('resize', tick);
    return () => { clearInterval(id); window.removeEventListener('resize', tick); };
  }, [hidden]);

  if (hidden) return null;
  const t = LABEL[lang];
  return (
    <button
      type="button"
      className={'qa-chat-label' + (pos ? ' on' : '')}
      data-no-i18n=""
      dir={lang === 'en' ? 'ltr' : 'rtl'}
      style={pos ? { right: pos.right, bottom: pos.bottom, transform: 'translateY(50%)' } : undefined}
      onClick={openChat}
      aria-label={t.title}
    >
      <b>{t.title}</b>
      <span>{t.sub}</span>
    </button>
  );
}
