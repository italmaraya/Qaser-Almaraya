'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { loadPackages, upcomingDates } from '../lib/publicPackages';
import { BUDGETS } from '../lib/budgets';
import { CATS } from '../lib/packagesData';
import { formatPrice } from '../lib/currency';
import { nightsLabel, destinationLabel } from '../lib/destinations';
import { openWhatsApp } from '../lib/whatsapp';

// Homepage "Where can I go on my budget?": the customer picks a budget, a
// month and a trip type, and gets the 3 closest packages, with one button
// that sends the picks to the company WhatsApp (784 line).

const MONTHS_AR = ['كانون الثاني', 'شباط', 'آذار', 'نيسان', 'أيار', 'حزيران', 'تموز', 'آب', 'أيلول', 'تشرين الأول', 'تشرين الثاني', 'كانون الأول'];
const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_EN_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function nextMonths(n = 6) {
  const d = new Date();
  const out = [];
  for (let i = 0; i < n; i++) {
    const x = new Date(d.getFullYear(), d.getMonth() + i, 1);
    out.push(x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0'));
  }
  return out;
}

function Chip({ on, onClick, children }) {
  return <button type="button" className={'qa-tf-chip' + (on ? ' on' : '')} aria-pressed={on} onClick={onClick}>{children}</button>;
}

function score(p, { budget, month, cat }) {
  const b = BUDGETS.find((x) => x.id === budget);
  const price = Number(p.price) || 0;
  const dates = upcomingDates(p);
  const fit = { budget: !b || (price >= b.min && price < b.max), month: month === 'any' || dates.some((d) => d.startsWith(month)), cat: cat === 'any' || p.cat === cat };
  let s = 0;
  if (b) s += fit.budget ? 30 : -Math.min(20, Math.abs(price - (price < b.min ? b.min : b.max)) / 100000);
  if (month !== 'any') s += fit.month ? 30 : dates.length === 0 ? 8 : 0;
  if (cat !== 'any') s += fit.cat ? 30 : 0;
  return { p, s, exact: fit.budget && fit.month && fit.cat, price };
}

export default function TripFinder({ lang = 'ar' }) {
  const en = lang === 'en';
  const nm = (ar, enText) => (en && enText ? enText : ar);
  const [list, setList] = useState(null);
  const [budget, setBudget] = useState('any');
  const [month, setMonth] = useState('any');
  const [cat, setCat] = useState('any');
  const [asked, setAsked] = useState(false);
  const months = useMemo(() => nextMonths(6), []);

  useEffect(() => {
    let alive = true;
    loadPackages().then((l) => { if (alive) setList(l); });
    return () => { alive = false; };
  }, []);

  const cats = useMemo(() => CATS.filter((c) => (list || []).some((p) => p.cat === c.id)), [list]);
  const picks = useMemo(() => {
    if (!list) return [];
    return list
      .filter((p) => Number(p.price) > 0)
      .map((p) => score(p, { budget, month, cat }))
      .sort((a, b) => b.s - a.s || a.price - b.price)
      .slice(0, 3);
  }, [list, budget, month, cat]);

  if (list && list.length === 0) return null;
  const show = asked || budget !== 'any' || month !== 'any' || cat !== 'any';

  const monthName = (ym, full) => { const [y, m] = ym.split('-').map(Number); return (en ? (full ? MONTHS_EN_FULL : MONTHS_EN) : MONTHS_AR)[m - 1] + (full ? ' ' + y : ''); };
  const budgetName = (id) => { const b = BUDGETS.find((x) => x.id === id); return b ? nm(b.ar, b.en) : en ? 'Any budget' : 'أي ميزانية'; };
  const catName = (id) => { const c = CATS.find((x) => x.id === id); return c ? nm(c.ar, c.en) : en ? 'Any type' : 'أي نوع'; };

  function sendWhatsApp() {
    const origin = window.location.origin;
    const lines = [
      en ? 'Hello, I am looking for a trip:' : 'مرحباً، أبحث عن رحلة:',
      (en ? 'Budget per person: ' : 'الميزانية للشخص: ') + budgetName(budget),
      (en ? 'Month: ' : 'الشهر: ') + (month === 'any' ? (en ? 'Flexible' : 'مرن') : monthName(month, true)),
      cat !== 'any' ? (en ? 'Trip type: ' : 'نوع الرحلة: ') + catName(cat) : null,
    ].filter(Boolean);
    if (picks.length) {
      lines.push('', en ? 'Suggestions from the website:' : 'اقتراحات الموقع:');
      picks.forEach(({ p }, i) => lines.push((i + 1) + ') ' + nm(p.title_ar, p.title_en) + ' — ' + formatPrice(p.price, 'IQD', lang) + '\n' + origin + '/packages/' + p.id));
    }
    openWhatsApp(lines.join('\n'));
  }

  return (
    <section className="qa-sec" data-no-i18n="" dir={en ? 'ltr' : 'rtl'}>
      <style>{`
.qa-tf{position:relative;overflow:hidden;border-radius:var(--tw-radius,16px);background:#035a73;color:#fff;padding:34px 34px 30px;display:flex;flex-direction:column;gap:22px}
.qa-tf h2{color:#fff;font-size:32px;font-weight:700}
.qa-tf-row{display:flex;flex-direction:column;gap:9px}
.qa-tf-row>b{font-size:14px;color:#bfe9f6;font-weight:600}
.qa-tf-chips{display:flex;flex-wrap:wrap;gap:8px}
.qa-tf-chip{font-family:inherit;font-size:14px;font-weight:600;padding:8px 16px;border-radius:999px;border:1px solid rgba(255,255,255,.28);background:rgba(255,255,255,.08);color:#fff;cursor:pointer;transition:background .15s,transform .15s,border-color .15s}
.qa-tf-chip:hover{background:rgba(255,255,255,.18)}
.qa-tf-chip.on{background:#faab18;border-color:#faab18;color:#fff}
.qa-tf-res{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}
.qa-tf-card{display:flex;gap:12px;align-items:stretch;background:#fff;color:#1d2733;border-radius:var(--tw-radius-sm,10px);overflow:hidden;animation:qa-tf-in .45s cubic-bezier(.16,1,.3,1) both;transition:box-shadow .2s}
.qa-tf-card:hover{color:#1d2733;box-shadow:var(--tw-lift-shadow,0 8px 22px rgba(1,42,55,.12))}
.qa-tf-card img{width:96px;flex-shrink:0;object-fit:cover;background:#e4f5fb}
.qa-tf-card:nth-child(2){animation-delay:.07s}.qa-tf-card:nth-child(3){animation-delay:.14s}
@keyframes qa-tf-in{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
.qa-tf-tag{align-self:flex-start;font-size:11px;font-weight:700;border-radius:999px;padding:2px 8px}
.qa-tf-wa{display:inline-flex;align-items:center;gap:8px;align-self:flex-start;font-family:inherit;font-size:15px;font-weight:700;border:0;border-radius:999px;padding:12px 22px;background:#25d366;color:#fff;cursor:pointer}
.qa-tf .qa-btn{white-space:nowrap!important;min-height:0!important;line-height:1.3}
@media (max-width:820px){.qa-tf{padding:24px 18px 22px;gap:18px}.qa-tf h2{font-size:22px!important}.qa-tf-chips{flex-wrap:nowrap;overflow-x:auto;scrollbar-width:none;padding-bottom:2px}.qa-tf-chips::-webkit-scrollbar{display:none}.qa-tf-chip{white-space:nowrap;flex-shrink:0}.qa-tf-res{display:flex!important;flex-direction:column}.qa-tf-wa{align-self:stretch;justify-content:center}}
@media (prefers-reduced-motion:reduce){.qa-tf-card{animation:none}}
`}</style>
      <div className="qa-tf">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, position: 'relative' }}>
          <h2>{en ? 'Where can I go on my budget?' : 'وين أسافر بميزانيتي؟'}</h2>
          <p style={{ fontSize: 16, color: '#d6f1fa' }}>{en ? 'Pick what suits you and we suggest the closest trips.' : 'اختر اللي يناسبك ونقترح عليك أقرب الرحلات.'}</p>
        </div>

        <div className="qa-tf-row">
          <b>{en ? '1. Budget per person' : '١. ميزانيتك للشخص'}</b>
          <div className="qa-tf-chips">
            <Chip on={budget === 'any'} onClick={() => setBudget('any')}>{en ? 'Any' : 'أي ميزانية'}</Chip>
            {BUDGETS.map((b) => <Chip key={b.id} on={budget === b.id} onClick={() => setBudget(b.id)}>{nm(b.ar, b.en)}</Chip>)}
          </div>
        </div>
        <div className="qa-tf-row">
          <b>{en ? '2. When?' : '٢. متى تسافر؟'}</b>
          <div className="qa-tf-chips">
            <Chip on={month === 'any'} onClick={() => setMonth('any')}>{en ? 'Flexible' : 'أي وقت'}</Chip>
            {months.map((m) => <Chip key={m} on={month === m} onClick={() => setMonth(m)}>{monthName(m, false)}</Chip>)}
          </div>
        </div>
        {cats.length > 1 && <div className="qa-tf-row">
          <b>{en ? '3. Trip type' : '٣. نوع الرحلة'}</b>
          <div className="qa-tf-chips">
            <Chip on={cat === 'any'} onClick={() => setCat('any')}>{en ? 'Any' : 'أي نوع'}</Chip>
            {cats.map((c) => <Chip key={c.id} on={cat === c.id} onClick={() => setCat(c.id)}>{nm(c.ar, c.en)}</Chip>)}
          </div>
        </div>}

        {!show ? (
          <button type="button" className="qa-btn qa-amber" style={{ alignSelf: 'flex-start', color: '#012a37', fontWeight: 700 }} onClick={() => setAsked(true)}>{en ? 'Suggest trips' : 'اقترح لي'}</button>
        ) : (
          <>
            <div className="qa-tf-res" key={budget + month + cat}>
              {list === null
                ? [0, 1, 2].map((i) => <div key={i} className="qa-tf-card" style={{ minHeight: 96, opacity: 0.5 }} />)
                : picks.map(({ p, exact }) => (
                  <Link key={p.id} href={'/packages/' + p.id} className="qa-tf-card">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {p.image_url ? <img src={p.image_url} alt="" loading="lazy" /> : <span style={{ width: 96, background: '#e4f5fb' }} />}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '10px 12px 10px 0', paddingInlineEnd: 12, minWidth: 0, flex: 1 }}>
                      <span className="qa-tf-tag" style={exact ? { background: '#e7f8ee', color: '#11804a' } : { background: '#fff4dc', color: '#8a5a00' }}>{exact ? (en ? 'Matches your choice' : 'يطابق اختيارك') : (en ? 'Closest option' : 'أقرب خيار')}</span>
                      <b style={{ fontSize: 15, lineHeight: 1.35, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{nm(p.title_ar, p.title_en)}</b>
                      <span style={{ fontSize: 13, color: '#5f666e' }}>{[destinationLabel(p, lang), nightsLabel(p, lang)].filter(Boolean).join(' · ')}</span>
                      <span style={{ marginTop: 'auto', fontSize: 15, fontWeight: 700, color: '#036f8c' }}>{formatPrice(p.price, 'IQD', lang)}</span>
                    </div>
                  </Link>
                ))}
            </div>
            <button type="button" className="qa-tf-wa" onClick={sendWhatsApp}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.5 14.4c-.3-.1-1.8-.9-2-1s-.5-.1-.7.1-.8 1-1 1.2-.4.2-.7.1a8.2 8.2 0 0 1-2.4-1.5 9 9 0 0 1-1.7-2.1c-.2-.3 0-.5.1-.6l.5-.6.3-.5v-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6a1.1 1.1 0 0 0-.8.4 3.4 3.4 0 0 0-1 2.5 5.9 5.9 0 0 0 1.2 3.1 13.5 13.5 0 0 0 5.2 4.6c.7.3 1.3.5 1.7.6a4.2 4.2 0 0 0 1.9.1 3.1 3.1 0 0 0 2-1.4 2.5 2.5 0 0 0 .2-1.4c-.1-.1-.3-.2-.6-.4ZM12 21.8a9.9 9.9 0 0 1-5-1.4l-.4-.2-3.7 1 1-3.6-.2-.4A9.9 9.9 0 1 1 12 21.8Zm8.4-18.3A11.8 11.8 0 0 0 1.8 17.7L.1 24l6.4-1.7a11.8 11.8 0 0 0 5.6 1.4A11.9 11.9 0 0 0 20.4 3.5Z" /></svg>
              {en ? 'Send these picks on WhatsApp' : 'أرسل الاقتراحات على واتساب'}
            </button>
          </>
        )}
      </div>
    </section>
  );
}
