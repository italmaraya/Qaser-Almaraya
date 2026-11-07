'use client';
import { useEffect, useMemo, useState } from 'react';
import Icon from '../Icon';
import { waLink } from '../../lib/whatsapp';
import { loadPackages } from '../../lib/publicPackages';
import { groupPackagesByCountry } from '../../lib/destinations';

// Booking panel under the homepage hero. It does not pretend to be a live
// fare search: the site has no booking engine of its own. Flights and hotels
// are booked either by our team (the request goes to the company WhatsApp
// with every detail filled in) or by the customer on flamingo.iq, our booking
// partner. Packages and visas lead into the real catalogues on this site.
const TABS = [
  { id: 'flights', ar: 'طيران', en: 'Flights', icon: 'plane' },
  { id: 'hotels', ar: 'فنادق', en: 'Hotels', icon: 'building-2' },
  { id: 'packages', ar: 'باقات', en: 'Packages', icon: 'luggage' },
  { id: 'visa', ar: 'تأشيرات', en: 'Visas', icon: 'stamp' },
];

// Defined outside the panel so inputs keep focus while typing.
function Field({ label, children, wide }) {
  return (
    <label className={'qs-bp-field' + (wide ? ' wide' : '')}>
      <span>{label}</span>
      {children}
    </label>
  );
}

const today = () => new Date().toISOString().slice(0, 10);

export default function BookingPanel({ lang = 'ar' }) {
  const en = lang === 'en';
  const t = (ar, e) => (en ? e : ar);
  const [tab, setTab] = useState('flights');
  const [f, setF] = useState({ from: '', to: '', dep: '', ret: '', pax: 1, city: '', cin: '', cout: '', guests: 2, rooms: 1, dest: '', visa: '' });
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const [pkgs, setPkgs] = useState(null);
  const [cards, setCards] = useState(null);

  useEffect(() => {
    if (tab === 'packages' && pkgs === null) loadPackages().then(setPkgs);
    if (tab === 'visa' && cards === null) {
      fetch('/api/visa/cards').then((r) => (r.ok ? r.json() : [])).catch(() => []).then((l) => setCards(Array.isArray(l) ? l : []));
    }
  }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  const countries = useMemo(() => groupPackagesByCountry(pkgs || []).filter((g) => g.iso !== 'zz'), [pkgs]);
  const visaCountries = useMemo(() => {
    const m = new Map();
    (cards || []).forEach((c) => { if (!m.has(c.country_id)) m.set(c.country_id, { id: String(c.country_id), ar: c.country_name_ar, en: c.country_name_en }); });
    return [...m.values()].sort((a, b) => String(a.ar).localeCompare(String(b.ar), 'ar'));
  }, [cards]);

  const flightMsg = () => {
    const lines = en
      ? ['Hello Qaser Almaraya, I would like a flight quote:', `From: ${f.from || 'Baghdad'}`, `To: ${f.to || '—'}`, `Departure: ${f.dep || '—'}`, `Return: ${f.ret || 'one way'}`, `Travellers: ${f.pax}`]
      : ['مرحباً قصر المرايا، أرغب بعرض سعر لحجز طيران:', `من: ${f.from || 'بغداد'}`, `إلى: ${f.to || '—'}`, `الذهاب: ${f.dep || '—'}`, `العودة: ${f.ret || 'ذهاب فقط'}`, `عدد المسافرين: ${f.pax}`];
    return lines.join('\n');
  };
  const hotelMsg = () => {
    const lines = en
      ? ['Hello Qaser Almaraya, I would like a hotel quote:', `City: ${f.city || '—'}`, `Check-in: ${f.cin || '—'}`, `Check-out: ${f.cout || '—'}`, `Guests: ${f.guests}`, `Rooms: ${f.rooms}`]
      : ['مرحباً قصر المرايا، أرغب بعرض سعر لحجز فندق:', `المدينة: ${f.city || '—'}`, `الوصول: ${f.cin || '—'}`, `المغادرة: ${f.cout || '—'}`, `عدد الضيوف: ${f.guests}`, `عدد الغرف: ${f.rooms}`];
    return lines.join('\n');
  };

  const dest = countries.find((c) => c.iso === f.dest);
  const pkgHref = dest ? '/packages?q=' + encodeURIComponent(dest.en) : '/packages';
  const visaHref = f.visa ? '/visa/country/' + f.visa : '/visa';

  return (
    <section className="qs-bp-wrap" data-no-i18n="" dir={en ? 'ltr' : 'rtl'} aria-label={t('احجز رحلتك', 'Plan your trip')}>
      <div className="qs-bp">
        <div className="qs-bp-tabs" role="tablist">
          {TABS.map((x) => (
            <button key={x.id} type="button" role="tab" aria-selected={tab === x.id} className="qs-bp-tab" onClick={() => setTab(x.id)}>
              <Icon name={x.icon} size={18} strokeWidth={1.8} />
              {en ? x.en : x.ar}
            </button>
          ))}
        </div>

        {tab === 'flights' && (
          <div className="qs-bp-body" role="tabpanel">
            <div className="qs-bp-grid">
              <Field label={t('من', 'From')}><input value={f.from} onChange={set('from')} placeholder={t('بغداد', 'Baghdad')} autoComplete="off" /></Field>
              <Field label={t('إلى', 'To')}><input value={f.to} onChange={set('to')} placeholder={t('المدينة أو المطار', 'City or airport')} autoComplete="off" /></Field>
              <Field label={t('الذهاب', 'Departure')}><input type="date" min={today()} value={f.dep} onChange={set('dep')} /></Field>
              <Field label={t('العودة (اختياري)', 'Return (optional)')}><input type="date" min={f.dep || today()} value={f.ret} onChange={set('ret')} /></Field>
              <Field label={t('المسافرون', 'Travellers')}><input type="number" min={1} max={30} value={f.pax} onChange={set('pax')} inputMode="numeric" /></Field>
            </div>
            <div className="qs-bp-actions">
              <a className="qs-btn qs-btn-pri" href={waLink(flightMsg())} target="_blank" rel="noopener">
                <Icon name="message-circle" size={18} strokeWidth={2} />{t('اطلب السعر عبر واتساب', 'Get a quote on WhatsApp')}
              </a>
              <a className="qs-link" href="https://flamingo.iq" target="_blank" rel="noopener">{t('أو احجز بنفسك على flamingo.iq', 'or book it yourself on flamingo.iq')}<Icon name="arrow-up-right" size={16} /></a>
            </div>
          </div>
        )}

        {tab === 'hotels' && (
          <div className="qs-bp-body" role="tabpanel">
            <div className="qs-bp-grid">
              <Field label={t('المدينة', 'City')}><input value={f.city} onChange={set('city')} placeholder={t('إلى أين؟', 'Where to?')} autoComplete="off" /></Field>
              <Field label={t('الوصول', 'Check-in')}><input type="date" min={today()} value={f.cin} onChange={set('cin')} /></Field>
              <Field label={t('المغادرة', 'Check-out')}><input type="date" min={f.cin || today()} value={f.cout} onChange={set('cout')} /></Field>
              <Field label={t('الضيوف', 'Guests')}><input type="number" min={1} max={30} value={f.guests} onChange={set('guests')} inputMode="numeric" /></Field>
              <Field label={t('الغرف', 'Rooms')}><input type="number" min={1} max={15} value={f.rooms} onChange={set('rooms')} inputMode="numeric" /></Field>
            </div>
            <div className="qs-bp-actions">
              <a className="qs-btn qs-btn-pri" href={waLink(hotelMsg())} target="_blank" rel="noopener">
                <Icon name="message-circle" size={18} strokeWidth={2} />{t('اطلب السعر عبر واتساب', 'Get a quote on WhatsApp')}
              </a>
              <a className="qs-link" href="https://flamingo.iq" target="_blank" rel="noopener">{t('أو احجز بنفسك على flamingo.iq', 'or book it yourself on flamingo.iq')}<Icon name="arrow-up-right" size={16} /></a>
            </div>
          </div>
        )}

        {tab === 'packages' && (
          <div className="qs-bp-body" role="tabpanel">
            <div className="qs-bp-grid two">
              <Field label={t('الوجهة', 'Destination')} wide>
                <select value={f.dest} onChange={set('dest')}>
                  <option value="">{pkgs === null ? t('جارٍ التحميل…', 'Loading…') : t('كل الوجهات', 'All destinations')}</option>
                  {countries.map((c) => (
                    <option key={c.iso} value={c.iso}>{(en ? c.en : c.ar) + ' (' + c.items.length + ')'}</option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="qs-bp-actions">
              <a className="qs-btn qs-btn-pri" href={pkgHref}><Icon name="search" size={18} strokeWidth={2} />{t('اعرض الباقات', 'Show packages')}</a>
              <a className="qs-link" href="/contact?topic=package">{t('أو اطلب باقة مصممة لك', 'or ask for a tailor-made trip')}</a>
            </div>
          </div>
        )}

        {tab === 'visa' && (
          <div className="qs-bp-body" role="tabpanel">
            <div className="qs-bp-grid two">
              <Field label={t('الدولة (لحاملي الجواز العراقي)', 'Country (Iraqi passport)')} wide>
                <select value={f.visa} onChange={set('visa')}>
                  <option value="">{cards === null ? t('جارٍ التحميل…', 'Loading…') : t('اختر الدولة', 'Choose a country')}</option>
                  {visaCountries.map((c) => (
                    <option key={c.id} value={c.id}>{en ? c.en || c.ar : c.ar}</option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="qs-bp-actions">
              <a className="qs-btn qs-btn-pri" href={visaHref}><Icon name="file-text" size={18} strokeWidth={2} />{t('المتطلبات والسعر', 'Requirements and price')}</a>
              <a className="qs-link" href="/visa">{t('كل التأشيرات', 'All visas')}</a>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
