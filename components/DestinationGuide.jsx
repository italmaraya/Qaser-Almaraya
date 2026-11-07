'use client';
import Icon from './Icon';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { guideFor } from '../lib/destinationGuide';
import { COUNTRY_TZ } from '../lib/timezones';
import { countryInfo } from '../lib/destinations';

// Destination guide blocks: <GuideFull> for /guide/[iso], <GuideCompact> for
// the package page side column. Content comes from lib/destinationGuide.js.

const MONTHS_AR = ['كانون الثاني', 'شباط', 'آذار', 'نيسان', 'أيار', 'حزيران', 'تموز', 'آب', 'أيلول', 'تشرين الأول', 'تشرين الثاني', 'كانون الأول'];
const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function offsetMinutes(tz, at) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).formatToParts(at);
  const g = (t) => Number(parts.find((p) => p.type === t).value);
  return Math.round((Date.UTC(g('year'), g('month') - 1, g('day'), g('hour'), g('minute')) - at.getTime()) / 60000);
}

function useClock(tz) {
  const [now, setNow] = useState(null);
  useEffect(() => {
    if (!tz) return undefined;
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, [tz]);
  if (!tz || !now) return null;
  try {
    const diff = offsetMinutes(tz, now) - offsetMinutes('Asia/Baghdad', now);
    const time = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(now);
    return { diff, time };
  } catch {
    return null;
  }
}

function diffText(mins, en) {
  if (mins === 0) return en ? 'Same time as Baghdad' : 'نفس توقيت بغداد';
  const h = Math.abs(mins) / 60;
  const hs = Number.isInteger(h) ? String(h) : h.toFixed(1);
  if (en) return `${hs}h ${mins > 0 ? 'ahead of' : 'behind'} Baghdad`;
  const unit = h === 1 ? 'ساعة' : h === 2 ? 'ساعتين' : hs + ' ساعات';
  return `${mins > 0 ? 'تسبق' : 'تتأخر عن'} بغداد بـ${unit}`;
}

export function guideName(iso, lang) {
  const c = countryInfo(iso);
  if (!c) return '';
  return lang === 'en' ? c.en : c.ar;
}

function Fact({ icon, label, value, note }) {
  return (
    <div className="qa-gd-fact">
      <span className="qa-gd-ico" aria-hidden="true"><Icon name={icon} size={18} /></span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
        <span style={{ fontSize: 13, color: 'var(--qs-ink-2,#5f666e)' }}>{label}</span>
        <b style={{ fontSize: 16, color: 'var(--qs-ink,#1d2733)' }}>{value}</b>
        {note ? <span style={{ fontSize: 12, color: '#8a5a00' }}>{note}</span> : null}
      </div>
    </div>
  );
}

const CSS = `
.qa-gd-facts{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
.qa-gd-fact{display:flex;gap:10px;align-items:flex-start;background:#fff;border:1px solid #ececed;border-radius:var(--tw-radius,16px);padding:14px}
.qa-gd-ico{width:36px;height:36px;flex-shrink:0;border-radius:var(--tw-radius-sm,10px);background:#eaf8fd;color:#036f8c;display:grid;place-items:center}
.qa-gd-chart{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:6px;align-items:end;height:170px;padding-top:22px}
.qa-gd-col{display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:4px;height:100%}
.qa-gd-bar{width:100%;max-width:34px;border-radius:8px 8px 3px 3px;position:relative}
.qa-gd-bar b{position:absolute;top:-19px;left:50%;transform:translateX(-50%);font-size:11.5px;color:#3d4650;font-weight:700}
.qa-gd-col span{font-size:11px;color:#5f666e;white-space:nowrap;text-align:center;line-height:1.2}
.qa-gd-n{display:none}
@media (max-width:1100px){.qa-gd-col span.qa-gd-m{white-space:normal;font-size:10px}}
.qa-gd-col.on span{color:#036f8c;font-weight:700}
@media (max-width:820px){.qa-gd-facts{grid-template-columns:repeat(2,minmax(0,1fr))!important;display:grid!important}.qa-gd-chart{gap:3px;height:150px}.qa-gd-bar b{font-size:10px}.qa-gd-col span.qa-gd-m{display:none}.qa-gd-col span.qa-gd-n{display:block;font-size:11px}}
`;

function tempColor(t) {
  if (t >= 35) return '#e0364f';
  if (t >= 28) return '#faab18';
  if (t >= 20) return '#34bbe1';
  return '#7aa7d6';
}

export function ClimateChart({ temps, lang, month }) {
  const en = lang === 'en';
  const max = Math.max(...temps, 1);
  return (
    <div className="qa-gd-chart" dir="ltr" role="img" aria-label={en ? 'Average daytime high by month' : 'متوسط درجة الحرارة العظمى لكل شهر'}>
      {temps.map((t, i) => (
        <div key={i} className={'qa-gd-col' + (i === month ? ' on' : '')}>
          <div className="qa-gd-bar" style={{ height: Math.max(12, (t / max) * 100) + '%', background: tempColor(t), opacity: i === month ? 1 : 0.75, outline: i === month ? '2px solid var(--qs-brand-deep,#036f8c)' : 'none', outlineOffset: 2 }}>
            <b>{t}°</b>
          </div>
          <span className="qa-gd-m">{en ? MONTHS_EN[i] : MONTHS_AR[i]}</span>
          <span className="qa-gd-n">{i + 1}</span>
        </div>
      ))}
    </div>
  );
}

export function GuideFull({ iso, lang = 'ar' }) {
  const en = lang === 'en';
  const g = guideFor(iso, lang);
  const tz = (g && g.tz) || COUNTRY_TZ[iso];
  const clock = useClock(tz);
  const [month, setMonth] = useState(null);
  useEffect(() => { setMonth(new Date().getMonth()); }, []);
  if (!g) return null;
  return (
    <div data-no-i18n="" dir={en ? 'ltr' : 'rtl'} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <style>{CSS}</style>
      <div className="qa-gd-facts">
        <Fact icon="clock" label={en ? 'Local time in ' + g.city : 'الوقت الآن في ' + g.city} value={clock ? clock.time : '—'} note={clock ? diffText(clock.diff, en) : ''} />
        <Fact icon="banknote" label={en ? 'Currency' : 'العملة'} value={g.currency + ' (' + g.currencyCode + ')'} />
        <Fact icon="languages" label={en ? 'Language' : 'اللغة'} value={g.language} />
        <Fact icon="plug" label={en ? 'Plug type' : 'نوع المقبس'} value={g.plugs} note={g.needsAdapter ? (en ? 'You will need an adapter' : 'تحتاج إلى محوّل') : (en ? 'Iraqi plugs usually fit' : 'مقابس العراق تعمل غالباً')} />
      </div>

      <div className="qa-card" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <h3 style={{ fontSize: 19, fontWeight: 700, color: 'var(--qs-ink,#1d2733)' }}>{en ? 'Weather in ' + g.city + ' through the year' : 'الطقس في ' + g.city + ' على مدار السنة'}</h3>
        <span style={{ fontSize: 13, color: 'var(--qs-ink-2,#5f666e)' }}>{en ? 'Average daytime high (°C), approximate. Highlighted: this month.' : 'متوسط تقريبي لدرجة الحرارة العظمى نهاراً (°م). الشهر الحالي مظلَّل.'}</span>
        <ClimateChart temps={g.temps} lang={lang} month={month} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.4fr)', gap: 16 }} className="qa-2col">
        <div className="qa-card" style={{ display: 'flex', flexDirection: 'column', gap: 8, background: '#fffaf0', borderColor: '#fde5b4' }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: '#8a5a00' }}>{en ? 'Best time to go' : 'أفضل وقت للزيارة'}</h3>
          <p style={{ fontSize: 16, lineHeight: 1.7, color: 'var(--qs-body,#3d4650)' }}>{g.best}</p>
        </div>
        <div className="qa-card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--qs-ink,#1d2733)' }}>{en ? 'Good to know' : 'نصائح قبل السفر'}</h3>
          <ul style={{ margin: 0, paddingInlineStart: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {g.tips.map((t, i) => <li key={i} style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--qs-body,#3d4650)' }}>{t}</li>)}
          </ul>
        </div>
      </div>
    </div>
  );
}

// Side-column box on a package page: key facts + the weather in the month of
// travel, with a link to the full guide.
export function GuideCompact({ iso, lang = 'ar', month = null }) {
  const en = lang === 'en';
  const g = guideFor(iso, lang);
  const [m, setM] = useState(month);
  useEffect(() => { if (month === null) setM(new Date().getMonth()); else setM(month); }, [month]);
  if (!g) return null;
  const name = guideName(iso, lang);
  const t = m === null ? null : g.temps[m];
  return (
    <div className="qa-card" data-no-i18n="" dir={en ? 'ltr' : 'rtl'} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <h4 style={{ margin: 0, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}><Icon name="compass" size={16} style={{ color: 'var(--qs-brand-deep,#049dc5)', flex: 'none' }} />{en ? 'Travel guide: ' + name : 'دليل السفر إلى ' + name}</h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14, color: 'var(--qs-body,#3d4650)' }}>
        {t !== null && <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Icon name="sun" size={14} style={{ color: 'var(--qs-ink-2,#5f666e)', flex: 'none' }} />{en ? `${MONTHS_EN[m]} in ${g.city}: around ${t}°C by day` : `${MONTHS_AR[m]} في ${g.city}: حوالي ${t}° نهاراً`}</span>}
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Icon name="banknote" size={14} style={{ color: 'var(--qs-ink-2,#5f666e)', flex: 'none' }} />{g.currency} ({g.currencyCode})</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Icon name="plug" size={14} style={{ color: 'var(--qs-ink-2,#5f666e)', flex: 'none' }} />{g.plugs}{g.needsAdapter ? (en ? ' — adapter needed' : ' — تحتاج إلى محوّل') : ''}</span>
      </div>
      <Link href={'/guide/' + g.iso} style={{ fontSize: 14, fontWeight: 700, color: 'var(--qs-brand-deep,#036f8c)' }}>{en ? 'Full guide: weather, tips and more →' : 'الدليل الكامل: الطقس والنصائح والمزيد ←'}</Link>
    </div>
  );
}
