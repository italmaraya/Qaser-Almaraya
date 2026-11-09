import Link from 'next/link';
import Icon from '../../components/Icon';
import { WA_ICON } from '../../components/WhatsAppButton';
import OfferStories from '../../components/home/OfferStories';
import { waLink } from '../../lib/whatsapp';
import { HOURS_AR, ADDRESS_AR } from '../../lib/company';
import { pageMeta } from '../../lib/seo';

// Link-in-bio page for the Instagram profile (replaces qalmaraya.carrd.co,
// whose login was lost — Owner, 9 Nov 2026). It lives on our own site, so it
// needs no outside account and follows the site's look.
export const metadata = pageMeta({
  title: 'روابطنا',
  description: 'كل روابط قصر المرايا للسفر والسياحة: واتساب، الرقم المختصر 6393، الباقات، التأشيرات، الطيران، وحساباتنا على مواقع التواصل.',
  path: '/links',
});

const MAIN = [
  { href: '/packages', icon: 'luggage', title: 'الباقات السياحية', sub: 'كروبات وبرامج سياحية متكاملة' },
  { href: '/visa', icon: 'id-card', title: 'التأشيرات', sub: 'المستندات المطلوبة ومدة الإصدار لكل دولة' },
  { href: '/flights', icon: 'plane', title: 'حجز الطيران', sub: 'تذاكر الطيران وحجز الفنادق' },
  { href: '/guide', icon: 'globe', title: 'دليل الوجهات', sub: 'معلومات ونصائح السفر لكل دولة' },
  { href: '/', icon: 'house', title: 'موقعنا الإلكتروني', sub: 'almarayagroup.iq' },
];

const SOCIAL = [
  { href: 'https://www.instagram.com/qaseralmaraya/', label: 'Instagram', icon: <Icon name="instagram" size={20} /> },
  { href: 'https://www.tiktok.com/@qaseralmaraya', label: 'TikTok', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16.5 3c.4 2.3 1.9 3.9 4.2 4.1v3.1a7.4 7.4 0 0 1-4.1-1.3v6.4a6 6 0 1 1-6-6c.3 0 .7 0 1 .1v3.2a2.9 2.9 0 1 0 1.9 2.7V3z" /></svg> },
  { href: 'https://www.facebook.com/profile.php?id=61567289284263', label: 'Facebook', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13.5 21v-7.5H16l.4-3h-2.9V8.6c0-.9.3-1.5 1.5-1.5h1.5V4.4c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8v2.4H8v3h2.6V21z" /></svg> },
  { href: 'https://www.youtube.com/@qaseralmarya', label: 'YouTube', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.3 5 12 5 12 5s-6.3 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.8 1.8C5.7 19 12 19 12 19s6.3 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8zM10 15V9l5.2 3z" /></svg> },
  { href: 'https://x.com/qaseralmaraya', label: 'X', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.8 3h3.1l-6.8 7.7L22 21h-6.2l-4.9-6.3L5.3 21H2.2l7.3-8.3L2 3h6.4l4.4 5.8zm-1.1 16.2h1.7L7.4 4.7H5.6z" /></svg> },
  { href: 'https://www.linkedin.com/company/qaseralmaraya', label: 'LinkedIn', icon: <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-.02em' }}>in</span> },
];

export default function LinksPage() {
  const wa = waLink('مرحباً قصر المرايا، أتواصل معكم من إنستغرام وأرغب في الاستفسار عن رحلة.');
  return (
    <main className="ql" data-no-i18n="">
      <div className="ql-wrap">
        <header className="ql-head">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="ql-logo" src="/assets/logo-mark-tight.webp" alt="" width="84" height="84" />
          <h1>قصر المرايا للسفر والسياحة</h1>
          <p className="ql-tag">نأخذك إلى حيث تتمنى، لنصنع ذكريات لا تُنسى</p>
          <p className="ql-hours"><Icon name="clock" size={14} /> {HOURS_AR}</p>
        </header>

        <div className="ql-cta">
          <a className="ql-btn wa" href={wa} target="_blank" rel="noopener">{WA_ICON}<span><b>احجز عبر واتساب</b><small>+964 784 999 9600</small></span></a>
          <a className="ql-btn call" href="tel:6393"><Icon name="phone" size={20} /><span><b>اتصل بالرقم المختصر 6393</b><small>خدمة العملاء</small></span></a>
        </div>

        <div className="ql-stories"><OfferStories lang="ar" /></div>

        <nav className="ql-list" aria-label="روابط الموقع">
          {MAIN.map((l) => (
            <Link key={l.href} className="ql-item" href={l.href}>
              <span className="ql-ic"><Icon name={l.icon} size={20} /></span>
              <span className="ql-tx"><b>{l.title}</b><small>{l.sub}</small></span>
              <Icon name="chevron-left" size={18} />
            </Link>
          ))}
          <a className="ql-item" href="https://share.google/mJh2iRvrcGKkMqNNO" target="_blank" rel="noopener">
            <span className="ql-ic"><Icon name="map-pin" size={20} /></span>
            <span className="ql-tx"><b>موقعنا على الخريطة</b><small>{ADDRESS_AR}</small></span>
            <Icon name="chevron-left" size={18} />
          </a>
        </nav>

        <div className="ql-social" aria-label="حساباتنا">
          {SOCIAL.map((s) => (
            <a key={s.label} href={s.href} target="_blank" rel="noopener" aria-label={s.label} title={s.label}>{s.icon}</a>
          ))}
        </div>
        <p className="ql-mail"><a href="mailto:sales@almarayagroup.com">sales@almarayagroup.com</a></p>
      </div>
    </main>
  );
}
