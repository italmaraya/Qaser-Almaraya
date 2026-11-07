'use client';
import Link from 'next/link';
import Icon from '../Icon';

// The five services, as an editorial index rather than a row of identical
// cards. Every line links to the page that actually delivers the service.
const ITEMS = [
  { href: '/flights', icon: 'plane', ar: 'الطيران', en: 'Flights',
    dAr: 'تذاكر على شركات الطيران التي نتعامل معها، يحجزها فريقنا أو تحجزها بنفسك عبر شريكنا \u2068Flamingo\u2069.',
    dEn: 'Tickets on the airlines we work with, booked by our team or by you through our partner Flamingo.' },
  { href: '/flights', icon: 'building-2', ar: 'الفنادق', en: 'Hotels',
    dAr: 'إقامة في وجهتك عبر \u2068Flamingo\u2069، ويتابع فريقنا الحجز معك حتى تسجيل الدخول.',
    dEn: 'Stays at your destination through Flamingo, with our team following the booking until check-in.' },
  { href: '/visa', icon: 'stamp', ar: 'التأشيرات', en: 'Visas',
    dAr: 'المستندات المطلوبة ومدة الإصدار والسعر لكل دولة، ونتابع طلبك حتى الإصدار.',
    dEn: 'Documents, processing time and price for each country, and we follow your application to the end.' },
  { href: '/packages', icon: 'luggage', ar: 'الباقات السياحية', en: 'Holiday packages',
    dAr: 'رحلات جاهزة من بغداد بسعر واحد للفرد: طيران وفندق وجولات.',
    dEn: 'Ready-made trips from Baghdad at one price per person: flights, hotel and tours.' },
  { href: '/contact', icon: 'users', ar: 'سفر الشركات والمجموعات', en: 'Corporate & group travel',
    dAr: 'سفر الموظفين والوفود والمجموعات: ننسق الطيران والفنادق والتأشيرات في طلب واحد.',
    dEn: 'Staff, delegations and groups: flights, hotels and visas coordinated in one request.' },
];

export default function HomeServices({ lang = 'ar' }) {
  const en = lang === 'en';
  return (
    <section className="qs-band" data-no-i18n="" dir={en ? 'ltr' : 'rtl'}>
      <div className="qs-wrap qs-svc">
        <div className="qs-svc-head">
          <span className="qs-kicker">{en ? 'What we do' : 'خدماتنا'}</span>
          <h2 className="qs-h2">{en ? 'One office in Baghdad for the whole trip' : 'مكتب واحد في بغداد لرحلتك كاملة'}</h2>
          <p className="qs-lead">{en ? 'Packages, visas, flights and hotels, all run from our office in Baghdad. One team follows your request from the first call to the end of the trip.' : 'باقات سياحية، تأشيرات، وحجوزات طيران وفنادق. تُدار كلها من مكتبنا في بغداد، ويتابع فريق واحد طلبك من أول اتصال حتى انتهاء الرحلة.'}</p>
        </div>
        <ul className="qs-svc-list">
          {ITEMS.map((s, i) => (
            <li key={s.ar}>
              <Link href={s.href} className="qs-svc-row">
                <span className="qs-svc-num">{String(i + 1).padStart(2, '0')}</span>
                <span className="qs-svc-icon"><Icon name={s.icon} size={22} strokeWidth={1.6} /></span>
                <span className="qs-svc-text">
                  <strong>{en ? s.en : s.ar}</strong>
                  <span>{en ? s.dEn : s.dAr}</span>
                </span>
                <span className="qs-svc-go"><Icon name={en ? 'chevron-right' : 'chevron-left'} size={20} strokeWidth={1.8} /></span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
