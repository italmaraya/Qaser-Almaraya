'use client';
import Icon from './Icon';
import { useEffect, useState } from 'react';
import { siteUrgency } from '../lib/packageUrgency';

// Package page: live countdown to the next departure + seats left.
// Shows nothing when the package has no departure date and no seat count.
const COUNTDOWN_DAYS = 30;

function parts(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
}
const pad = (n) => String(n).padStart(2, '0');

// "Next departure: Tuesday 10 November" (shown above the live countdown, so
// the label and the boxes never disagree by a day around midnight).
function dateLabel(ymd, en) {
  let txt = ymd;
  try {
    txt = new Intl.DateTimeFormat(en ? 'en-GB' : 'ar-IQ-u-nu-latn', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(ymd + 'T00:00:00Z'));
  } catch { /* keep YYYY-MM-DD */ }
  return (en ? 'Next departure: ' : 'أقرب انطلاق: ') + txt;
}

export default function UrgencyPanel({ pkg, lang = 'ar' }) {
  const en = lang === 'en';
  const u = siteUrgency(pkg, lang);
  const target = u && u.date && u.days !== null && u.days >= 1 && u.days <= COUNTDOWN_DAYS ? new Date(u.date + 'T00:00:00+03:00').getTime() : null;
  const [now, setNow] = useState(null);

  useEffect(() => {
    if (!target) return undefined;
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [target]);

  if (!u || !u.label) return null;
  const tone = u.soldOut ? { bg: '#1d2733', fg: '#fff', box: 'rgba(255,255,255,.12)' } : u.hot ? { bg: '#fdecef', fg: '#c02643', box: '#fff' } : { bg: '#fff4dc', fg: '#8a5a00', box: '#fff' };
  const c = target && now ? parts(target - now) : null;
  const units = en ? ['days', 'hrs', 'min', 'sec'] : ['يوم', 'ساعة', 'دقيقة', 'ثانية'];

  return (
    <div data-no-i18n="" className={'qa-urg' + (u.hot && !u.soldOut ? ' qa-urg-hot' : '')} style={{ display: 'flex', flexDirection: 'column', gap: 10, borderRadius: 'var(--tw-radius-sm,10px)', padding: '12px 14px', background: tone.bg, color: tone.fg }}>
      <style>{`
.qa-urg-dot{width:9px;height:9px;border-radius:50%;background:currentColor;flex-shrink:0}
.qa-urg-hot .qa-urg-dot{animation:qa-urg-pulse 1.2s ease-out infinite}
@keyframes qa-urg-pulse{0%{box-shadow:none}100%{box-shadow:none}}
.qa-urg-box{flex:1;min-width:0;display:flex;flex-direction:column;align-items:center;border-radius:var(--tw-radius-sm,10px);padding:6px 2px}
.qa-urg-box b{font-size:20px;line-height:1.1;font-variant-numeric:tabular-nums}
.qa-urg-box span{font-size:11px;font-weight:600;opacity:.8}
@media (prefers-reduced-motion:reduce){.qa-urg-hot .qa-urg-dot{animation:none}}
`}</style>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 700, fontSize: 14 }}>
        {u.soldOut ? <Icon name="ban" size={16} style={{ flex: 'none' }} /> : <span className="qa-urg-dot" aria-hidden="true" />}
        <span>
          {c && !u.soldOut ? dateLabel(u.date, en) : u.label}
          {u.soldOut ? (en ? ' — message us to join the waiting list' : ' — راسلنا للانضمام لقائمة الانتظار') : ''}
        </span>
      </div>
      {c && !u.soldOut && (
        <div style={{ display: 'flex', gap: 6 }} aria-label={en ? 'Time until departure' : 'الوقت المتبقي للانطلاق'}>
          {[c.d, c.h, c.m, c.s].map((v, i) => (
            <div key={i} className="qa-urg-box" style={{ background: tone.box }}>
              <b>{i === 0 ? v : pad(v)}</b>
              <span>{units[i]}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
