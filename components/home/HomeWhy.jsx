'use client';
import Icon from '../Icon';

// Why Al Maraya: only facts the company already states elsewhere on the
// site (licence number in the footer, accredited agent, Flamingo partner,
// the Baghdad office and hotline). No invented numbers.
const POINTS = [
  { icon: 'shield-check', ar: 'شركة مجازة', en: 'A licensed company',
    dAr: 'قصر المرايا للسفر والسياحة شركة عراقية مجازة، رقم الإجازة 784.', dEn: 'Qaser Almaraya for Travel & Tourism is a licensed Iraqi company, licence no. 784.' },
  { icon: 'handshake', ar: 'وكلاء معتمدون', en: 'Accredited agents',
    dAr: 'وكلاء معتمدون لعدد من شركات الطيران والفنادق والوجهات السياحية.', dEn: 'Accredited agents for a number of airlines, hotels and destinations.' },
  { icon: 'plane-takeoff', ar: 'الشريك الرسمي لـ \u2068Flamingo\u2069', en: 'Official Flamingo partner',
    dAr: 'تحجز الطيران والفنادق بنفسك على flamingo.iq أو نحجزها نحن لك.', dEn: 'Book flights and hotels yourself on flamingo.iq, or let us book them for you.' },
  { icon: 'map-pin', ar: 'مكتب في بغداد', en: 'An office in Baghdad',
    dAr: 'شارع 14 رمضان، والرقم المختصر 6393 داخل العراق. فريق واحد يتابع طلبك.', dEn: '14 Ramadan Street, hotline 6393 inside Iraq. One team follows your request.' },
];

// English names for the company's milestones (the Arabic comes from the
// ACHIEVEMENTS list in Site.jsx, the same one the About page shows).
const MILE_EN = {
  forum: 'Travel & Tourism Companies Forum, Baghdad International Fair',
  fitur: 'FITUR travel fair, Madrid',
  turkish: 'Recognition from Turkish Airlines',
  salam: 'Recognition from SalamAir',
  fans: 'Flying the national team’s fans',
};

export default function HomeWhy({ lang = 'ar', milestones = [] }) {
  const en = lang === 'en';
  return (
    <section className="qs-band qs-sand" data-no-i18n="" dir={en ? 'ltr' : 'rtl'}>
      <div className="qs-wrap qs-why">
        <div className="qs-why-media">
          <div className="qs-photo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/ach-forum-baghdad.webp" alt={en ? 'Qaser Almaraya at the travel and tourism companies forum, Baghdad International Fair' : 'قصر المرايا في ملتقى شركات السفر والسياحة، معرض بغداد الدولي'} loading="lazy" decoding="async" />
          </div>
        </div>
        <div className="qs-why-copy">
          <span className="qs-kicker">{en ? 'Why Al Maraya' : 'لماذا قصر المرايا'}</span>
          <h2 className="qs-h2">{en ? 'A travel company you can visit, call and hold to its word' : 'شركة سفر تزورها وتتصل بها وتعرف من يتابع رحلتك'}</h2>
          <dl className="qs-why-list">
            {POINTS.map((p) => (
              <div key={p.ar}>
                <dt><Icon name={p.icon} size={20} strokeWidth={1.7} />{en ? p.en : p.ar}</dt>
                <dd>{en ? p.dEn : p.dAr}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
      {milestones.length ? (
        <div className="qs-wrap">
          <div className="qs-miles">
            {milestones.filter((m) => m.id !== 'forum').slice(0, 4).map((m) => (
              <figure key={m.id} className="qs-mile">
                <div className="qs-photo">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={'/assets/' + m.photo} alt={en ? MILE_EN[m.id] || m.title : m.title} loading="lazy" decoding="async" />
                </div>
                <figcaption>
                  <b>{m.year}</b>
                  <span>{en ? MILE_EN[m.id] || m.title : m.title}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
