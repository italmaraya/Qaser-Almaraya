'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Icon from './Icon';
import { getStoredLang } from '../lib/i18n';

// Thin bar at the very top of the public site for urgent notices (airspace
// closures, exceptional flights). Staff post it from the dashboard news editor
// under the category «تنبيه للمسافرين»; it shows for 14 days after its publish
// date. Visitors can close it (remembered per alert in this browser only).
// Never shown on the dashboard.
const KEY = 'qa-alert-closed';

export default function TravelAlert() {
  const path = usePathname() || '/';
  const hidden = /^\/(admin|staff|api)(\/|$)/.test(path);
  const [alert, setAlert] = useState(null);
  const [lang, setLang] = useState('ar');

  useEffect(() => {
    if (hidden) return undefined;
    let alive = true;
    setLang(getStoredLang());
    const onLang = (e) => setLang(e.detail === 'en' ? 'en' : 'ar');
    window.addEventListener('qa-lang-change', onLang);
    fetch('/api/news/alert').then((r) => (r.ok ? r.json() : null)).catch(() => null).then((a) => {
      if (!alive || !a || !a.id) return;
      let closed = '';
      try { closed = localStorage.getItem(KEY) || ''; } catch (e) { /* storage blocked */ }
      if (closed !== String(a.id)) setAlert(a);
    });
    return () => { alive = false; window.removeEventListener('qa-lang-change', onLang); };
  }, [hidden]);

  if (hidden || !alert) return null;
  const en = lang === 'en';
  const title = (en && alert.title_en) || alert.title_ar;
  const close = () => {
    try { localStorage.setItem(KEY, String(alert.id)); } catch (e) { /* storage blocked */ }
    setAlert(null);
  };
  return (
    <div className="qs-alert" role="status" data-no-i18n="" dir={en ? 'ltr' : 'rtl'}>
      <div className="qs-alert-in">
        <Icon name="alert-triangle" size={17} strokeWidth={2.2} />
        <span className="qs-alert-tag">{en ? 'Travel alert' : 'تنبيه للمسافرين'}</span>
        <a className="qs-alert-text" href={'/news/' + encodeURIComponent(alert.slug)}>{title}</a>
        <button type="button" className="qs-alert-x" onClick={close} aria-label={en ? 'Close alert' : 'إغلاق التنبيه'}><Icon name="x" size={16} strokeWidth={2.4} /></button>
      </div>
    </div>
  );
}
