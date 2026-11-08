'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
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

// Same fields as the flamingo.iq flight search (owner's request, 7 Nov 2026):
// trip type, from / to with a swap button, departure and return dates, and
// one "travellers and class" picker (adults 12+, children 2-11, infants 0-2,
// cabin class). flamingo.iq has no hotel search yet, so hotels follow the
// same layout with destination, dates and one "rooms and guests" picker.
const CABINS = [
  { id: 'any', ar: 'جميع الفئات', en: 'Any class' },
  { id: 'eco', ar: 'الفئة الاقتصادية', en: 'Economy' },
  { id: 'bus', ar: 'فئة رجال الأعمال', en: 'Business' },
  { id: 'first', ar: 'الدرجة الأولى', en: 'First' },
];
// Suggestions only; any city or airport can be typed.
const PLACES = [
  ['بغداد', 'Baghdad', 'BGW'], ['البصرة', 'Basra', 'BSR'], ['أربيل', 'Erbil', 'EBL'], ['النجف', 'Najaf', 'NJF'], ['السليمانية', 'Sulaymaniyah', 'ISU'],
  ['إسطنبول', 'Istanbul', 'IST'], ['أنطاليا', 'Antalya', 'AYT'], ['طرابزون', 'Trabzon', 'TZX'], ['دبي', 'Dubai', 'DXB'], ['الشارقة', 'Sharjah', 'SHJ'],
  ['عمّان', 'Amman', 'AMM'], ['بيروت', 'Beirut', 'BEY'], ['القاهرة', 'Cairo', 'CAI'], ['شرم الشيخ', 'Sharm El Sheikh', 'SSH'], ['دمشق', 'Damascus', 'DAM'],
  ['الدوحة', 'Doha', 'DOH'], ['مسقط', 'Muscat', 'MCT'], ['جدة', 'Jeddah', 'JED'], ['المدينة المنورة', 'Madinah', 'MED'], ['تبليسي', 'Tbilisi', 'TBS'],
  ['باكو', 'Baku', 'GYD'], ['كوالالمبور', 'Kuala Lumpur', 'KUL'], ['بانكوك', 'Bangkok', 'BKK'], ['بالي', 'Bali', 'DPS'], ['كولومبو', 'Colombo', 'CMB'], ['المالديف', 'Maldives', 'MLE'],
];

// A button that opens a small panel of +/- counters (and optional chips).
function CountPicker({ summary, title, rows, values, onChange, chips, chip, onChip, en }) {
  const [open, setOpen] = useState(false);
  const box = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const off = (e) => { if (box.current && !box.current.contains(e.target)) setOpen(false); };
    const esc = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', off);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', off); document.removeEventListener('keydown', esc); };
  }, [open]);
  return (
    <div className="qs-bp-pick" ref={box}>
      <button type="button" className="qs-bp-pick-btn" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <Icon name="users" size={16} strokeWidth={1.9} /><span>{summary}</span><Icon name="chevron-down" size={16} strokeWidth={2} />
      </button>
      {open && (
        <div className="qs-bp-pop" role="dialog" aria-label={title}>
          <div className="qs-bp-pop-head"><b>{title}</b><button type="button" onClick={() => setOpen(false)} aria-label={en ? 'Close' : 'إغلاق'}><Icon name="x" size={16} strokeWidth={2.2} /></button></div>
          {rows.map((r) => {
            const v = values[r.key];
            const max = typeof r.max === 'function' ? r.max(values) : r.max;
            return (
              <div key={r.key} className="qs-bp-count">
                <span><b>{r.label}</b>{r.sub ? <small>{r.sub}</small> : null}</span>
                <span className="qs-bp-step">
                  <button type="button" disabled={v <= r.min} onClick={() => onChange(r.key, v - 1)} aria-label={(en ? 'Fewer ' : 'إنقاص ') + r.label}>−</button>
                  <output>{v}</output>
                  <button type="button" disabled={v >= max} onClick={() => onChange(r.key, v + 1)} aria-label={(en ? 'More ' : 'زيادة ') + r.label}>+</button>
                </span>
              </div>
            );
          })}
          {chips ? (
            <div className="qs-bp-chips">
              <b>{en ? 'Cabin class' : 'درجة السفر'}</b>
              <div>{chips.map((c) => <button key={c.id} type="button" className={chip === c.id ? 'on' : ''} aria-pressed={chip === c.id} onClick={() => onChip(c.id)}>{en ? c.en : c.ar}</button>)}</div>
            </div>
          ) : null}
          <button type="button" className="qs-btn qs-btn-pri qs-bp-pop-done" onClick={() => setOpen(false)}>{en ? 'Done' : 'تم'}</button>
        </div>
      )}
    </div>
  );
}

export default function BookingPanel({ lang = 'ar' }) {
  const en = lang === 'en';
  const t = (ar, e) => (en ? e : ar);
  const [tab, setTab] = useState('flights');
  const [f, setF] = useState({ trip: 'round', from: '', to: '', dep: '', ret: '', adults: 1, children: 0, infants: 0, cabin: 'eco', city: '', cin: '', cout: '', rooms: 1, hAdults: 2, hChildren: 0, dest: '', visa: '' });
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const put = (k, v) => setF((s) => {
    const n = { ...s, [k]: v };
    if (n.infants > n.adults) n.infants = n.adults; // one infant per adult lap
    return n;
  });
  const swap = () => setF((s) => ({ ...s, from: s.to, to: s.from }));
  const cabin = CABINS.find((c) => c.id === f.cabin) || CABINS[1];
  const paxTotal = f.adults + f.children + f.infants;
  const paxSummary = en
    ? `${paxTotal} traveller${paxTotal > 1 ? 's' : ''} · ${cabin.en}`
    : `${paxTotal === 1 ? 'مسافر 1' : paxTotal + ' مسافرين'} · ${cabin.ar}`;
  const guestTotal = f.hAdults + f.hChildren;
  const roomSummary = en
    ? `${f.rooms} room${f.rooms > 1 ? 's' : ''} · ${guestTotal} guest${guestTotal > 1 ? 's' : ''}`
    : `${f.rooms === 1 ? 'غرفة 1' : f.rooms + ' غرف'} · ${guestTotal === 1 ? 'ضيف 1' : guestTotal + ' ضيوف'}`;
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
    const oneWay = f.trip === 'oneway';
    const lines = en
      ? ['Hello Qaser Almaraya, I would like a flight quote:', `Trip: ${oneWay ? 'one way' : 'return'}`, `From: ${f.from || 'Baghdad'}`, `To: ${f.to || '—'}`, `Departure: ${f.dep || '—'}`, ...(oneWay ? [] : [`Return: ${f.ret || '—'}`]), `Adults: ${f.adults}`, `Children (2-11): ${f.children}`, `Infants (0-2): ${f.infants}`, `Class: ${cabin.en}`]
      : ['مرحباً قصر المرايا، أرغب بعرض سعر لحجز طيران:', `نوع الرحلة: ${oneWay ? 'ذهاب فقط' : 'ذهاب وعودة'}`, `المغادرة من: ${f.from || 'بغداد'}`, `الوصول إلى: ${f.to || '—'}`, `تاريخ المغادرة: ${f.dep || '—'}`, ...(oneWay ? [] : [`تاريخ العودة: ${f.ret || '—'}`]), `بالغين: ${f.adults}`, `أطفال (2-11 سنة): ${f.children}`, `رضع (0-2 سنة): ${f.infants}`, `درجة السفر: ${cabin.ar}`];
    return lines.join('\n');
  };
  const hotelMsg = () => {
    const lines = en
      ? ['Hello Qaser Almaraya, I would like a hotel quote:', `Destination: ${f.city || '—'}`, `Check-in: ${f.cin || '—'}`, `Check-out: ${f.cout || '—'}`, `Rooms: ${f.rooms}`, `Adults: ${f.hAdults}`, `Children: ${f.hChildren}`]
      : ['مرحباً قصر المرايا، أرغب بعرض سعر لحجز فندق:', `الوجهة: ${f.city || '—'}`, `تاريخ الوصول: ${f.cin || '—'}`, `تاريخ المغادرة: ${f.cout || '—'}`, `عدد الغرف: ${f.rooms}`, `بالغين: ${f.hAdults}`, `أطفال: ${f.hChildren}`];
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
            <div className="qs-bp-top">
              <div className="qs-bp-trip" role="radiogroup" aria-label={t('نوع الرحلة', 'Trip type')}>
                {[['oneway', 'ذهاب فقط', 'One way'], ['round', 'ذهاب وعودة', 'Return']].map(([id, ar, e]) => (
                  <button key={id} type="button" role="radio" aria-checked={f.trip === id} className={f.trip === id ? 'on' : ''} onClick={() => setF((s) => ({ ...s, trip: id, ret: id === 'oneway' ? '' : s.ret }))}>{en ? e : ar}</button>
                ))}
              </div>
              <CountPicker
                en={en}
                title={t('المسافرون والدرجة', 'Travellers and class')}
                summary={paxSummary}
                values={f}
                onChange={put}
                rows={[
                  { key: 'adults', label: t('بالغين', 'Adults'), sub: t('+12 سنة', '12+ years'), min: 1, max: 9 },
                  { key: 'children', label: t('أطفال', 'Children'), sub: t('2-11 سنة', '2-11 years'), min: 0, max: 9 },
                  { key: 'infants', label: t('رضع', 'Infants'), sub: t('0-2 سنة', '0-2 years'), min: 0, max: (v) => Math.min(9, v.adults) },
                ]}
                chips={CABINS}
                chip={f.cabin}
                onChip={(id) => put('cabin', id)}
              />
            </div>
            <datalist id="qs-bp-places">
              {PLACES.map(([ar, e, code]) => <option key={code} value={(en ? e : ar) + ' (' + code + ')'} />)}
            </datalist>
            <div className={'qs-bp-grid qs-bp-fl' + (f.trip === 'oneway' ? ' oneway' : '')}>
              <Field label={t('المغادرة من', 'From')}><input value={f.from} onChange={set('from')} placeholder={t('اختر المطار أو المدينة', 'Airport or city')} list="qs-bp-places" autoComplete="off" /></Field>
              <button type="button" className="qs-bp-swap" onClick={swap} aria-label={t('تبديل المغادرة والوصول', 'Swap from and to')}><Icon name="arrow-left-right" size={18} strokeWidth={2} /></button>
              <Field label={t('الوصول إلى', 'To')}><input value={f.to} onChange={set('to')} placeholder={t('اختر المطار أو المدينة', 'Airport or city')} list="qs-bp-places" autoComplete="off" /></Field>
              <Field label={t('تاريخ المغادرة', 'Departure date')}><input type="date" min={today()} value={f.dep} onChange={set('dep')} /></Field>
              {f.trip === 'round' ? <Field label={t('تاريخ العودة', 'Return date')}><input type="date" min={f.dep || today()} value={f.ret} onChange={set('ret')} /></Field> : null}
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
            <div className="qs-bp-top">
              <span className="qs-bp-note">{t('نحجز لك الفندق ونرسل لك العرض على واتساب.', 'We book the hotel and send you the offer on WhatsApp.')}</span>
              <CountPicker
                en={en}
                title={t('الغرف والضيوف', 'Rooms and guests')}
                summary={roomSummary}
                values={f}
                onChange={put}
                rows={[
                  { key: 'rooms', label: t('الغرف', 'Rooms'), min: 1, max: 9 },
                  { key: 'hAdults', label: t('بالغين', 'Adults'), sub: t('+12 سنة', '12+ years'), min: 1, max: 18 },
                  { key: 'hChildren', label: t('أطفال', 'Children'), sub: t('0-11 سنة', '0-11 years'), min: 0, max: 9 },
                ]}
              />
            </div>
            <div className="qs-bp-grid qs-bp-ht">
              <Field label={t('الوجهة', 'Destination')}><input value={f.city} onChange={set('city')} placeholder={t('المدينة أو اسم الفندق', 'City or hotel name')} list="qs-bp-places" autoComplete="off" /></Field>
              <Field label={t('تاريخ الوصول', 'Check-in date')}><input type="date" min={today()} value={f.cin} onChange={set('cin')} /></Field>
              <Field label={t('تاريخ المغادرة', 'Check-out date')}><input type="date" min={f.cin || today()} value={f.cout} onChange={set('cout')} /></Field>
            </div>
            <datalist id="qs-bp-places">
              {PLACES.map(([ar, e, code]) => <option key={code} value={en ? e : ar} />)}
            </datalist>
            <div className="qs-bp-actions">
              <a className="qs-btn qs-btn-pri" href={waLink(hotelMsg())} target="_blank" rel="noopener">
                <Icon name="message-circle" size={18} strokeWidth={2} />{t('اطلب السعر عبر واتساب', 'Get a quote on WhatsApp')}
              </a>
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
