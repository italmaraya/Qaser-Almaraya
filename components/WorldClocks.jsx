'use client';
import { useEffect, useState } from 'react';
import { COUNTRY_TZ, PLACE_TZ } from '../lib/timezones';

const BAGHDAD_TZ = 'Asia/Baghdad';

// Picks the destination's time zone: a known place name first (e.g. Bali),
// then the country's main zone.
export function destinationTz(iso, placeText = '') {
  for (const [re, tz] of PLACE_TZ) if (re.test(placeText || '')) return tz;
  return (iso && COUNTRY_TZ[String(iso).toLowerCase()]) || null;
}

// Minutes the zone is ahead of UTC at a given moment.
function offsetMinutes(tz, at = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).formatToParts(at);
  const g = (t) => Number(parts.find((p) => p.type === t).value);
  const asUtc = Date.UTC(g('year'), g('month') - 1, g('day'), g('hour'), g('minute'));
  return Math.round((asUtc - at.getTime()) / 60000);
}

function fmtTime(tz, at, lang) {
  return new Intl.DateTimeFormat(lang === 'en' ? 'en-GB' : 'ar-IQ', { timeZone: tz, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(at);
}

// "08:00" in `fromTz` → same moment's clock time in `toTz`.
function convertClock(hhmm, fromTz, toTz) {
  const m = String(hhmm || '').match(/(\d{1,2})[:.](\d{2})/);
  if (!m) return null;
  let mins = Number(m[1]) * 60 + Number(m[2]);
  if (/pm|م|مساء/i.test(hhmm) && Number(m[1]) < 12) mins += 720;
  const diff = offsetMinutes(toTz) - offsetMinutes(fromTz);
  let out = (mins + diff) % 1440;
  if (out < 0) out += 1440;
  const dayShift = mins + diff >= 1440 ? 1 : mins + diff < 0 ? -1 : 0;
  return { text: String(Math.floor(out / 60)).padStart(2, '0') + ':' + String(out % 60).padStart(2, '0'), dayShift };
}

function diffLabel(mins, place, en) {
  if (mins === 0) return en ? `Same time as Baghdad` : `نفس توقيت بغداد`;
  const h = Math.abs(mins) / 60;
  const hs = Number.isInteger(h) ? String(h) : h.toFixed(1);
  if (en) return `${place} is ${hs}h ${mins > 0 ? 'ahead of' : 'behind'} Baghdad`;
  const unit = h === 1 ? 'ساعة' : h === 2 ? 'ساعتين' : hs + ' ساعات';
  return `${place} ${mins > 0 ? 'تسبق' : 'تتأخر عن'} بغداد بـ${unit}`;
}

/**
 * @param tz destination IANA zone
 * @param place destination name to show
 * @param flight optional { arrive: "08:00", depart: "15:00" } local times at the destination
 */
export default function WorldClocks({ tz, place, lang = 'ar', flight = null, compact = false }) {
  const en = lang === 'en';
  const [now, setNow] = useState(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 20000);
    return () => clearInterval(id);
  }, []);
  if (!tz || !now) return null;
  let diff;
  try { diff = offsetMinutes(tz, now) - offsetMinutes(BAGHDAD_TZ, now); } catch { return null; }

  const clock = (label, zone, accent) => (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '10px 8px', borderRadius: 12, background: accent ? '#eaf8fd' : '#f6f7f8' }}>
      <span style={{ fontSize: 12, color: '#7b8087' }}>{label}</span>
      <span data-no-i18n="" style={{ fontSize: compact ? 20 : 24, fontWeight: 700, color: accent ? '#036f8c' : '#1d2733', fontFamily: "'IBM Plex Sans',sans-serif", direction: 'ltr' }}>{fmtTime(zone, now, 'en')}</span>
    </div>
  );

  const arr = flight?.arrive ? convertClock(flight.arrive, tz, BAGHDAD_TZ) : null;
  const dep = flight?.depart ? convertClock(flight.depart, tz, BAGHDAD_TZ) : null;
  const shift = (d) => (d > 0 ? (en ? ' (next day)' : ' (اليوم التالي)') : d < 0 ? (en ? ' (previous day)' : ' (اليوم السابق)') : '');

  return (
    <div className="qa-card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <h4 style={{ margin: 0, fontSize: 15 }}>🕐 {en ? 'Time difference' : 'فرق التوقيت'}</h4>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {clock(en ? 'Baghdad' : 'بغداد', BAGHDAD_TZ, false)}
        <span style={{ color: '#049dc5', fontSize: 18 }}>⇄</span>
        {clock(place, tz, true)}
      </div>
      <span style={{ fontSize: 13, color: '#3d4650', textAlign: 'center' }}>{diffLabel(diff, place, en)}</span>
      {(arr || dep) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, color: '#3d4650', borderTop: '1px solid #ececed', paddingTop: 8 }}>
          {arr && (
            <span>✈️ {en ? `When you land at ${flight.arrive} in ${place}, it's ` : `عند وصولك الساعة ${flight.arrive} بتوقيت ${place}، تكون الساعة `}<b data-no-i18n="">{arr.text}</b>{en ? ' in Baghdad' : ' في بغداد'}{shift(arr.dayShift)}</span>
          )}
          {dep && (
            <span>🛫 {en ? `Your return leaves at ${flight.depart} ${place} time — ` : `رحلة العودة تغادر ${flight.depart} بتوقيت ${place} — أي `}<b data-no-i18n="">{dep.text}</b>{en ? ' in Baghdad' : ' في بغداد'}{shift(dep.dayShift)}</span>
          )}
          <span style={{ fontSize: 12, color: '#7b8087' }}>{en ? 'Handy for planning calls with family.' : 'مفيد لترتيب الاتصال مع العائلة.'}</span>
        </div>
      )}
    </div>
  );
}
