import Link from 'next/link';
import Icon from '../../components/Icon';
import { WA_ICON } from '../../components/WhatsAppButton';
import OfferStories from '../../components/home/OfferStories';
import LinksDepartures from '../../components/LinksDepartures';
import { waLink } from '../../lib/whatsapp';
import { ADDRESS_AR } from '../../lib/company';
import { pageMeta } from '../../lib/seo';

// Link-in-bio page for the Instagram profile (replaces qalmaraya.carrd.co,
// whose login was lost — Owner, 9 Nov 2026). Quiet chrome; the one rich
// moment is the boarding pass of the next real departures from Baghdad.
export const metadata = pageMeta({
  title: 'روابطنا',
  description: 'تواصل مع قصر المرايا للسفر والسياحة عبر واتساب أو الرقم المختصر 6393، وتصفح الرحلات القادمة من بغداد والباقات والتأشيرات.',
  path: '/links',
});

const LINKS = [
  { href: '/packages', icon: 'luggage', title: 'الباقات السياحية' },
  { href: '/visa', icon: 'id-card', title: 'التأشيرات' },
  { href: '/flights', icon: 'plane', title: 'الطيران والفنادق' },
  { href: '/guide', icon: 'compass', title: 'دليل الوجهات' },
];

const SOCIAL = [
  { href: 'https://www.instagram.com/qaseralmaraya/', label: 'Instagram', icon: <Icon name="instagram" size={18} /> },
  { href: 'https://www.tiktok.com/@qaseralmaraya', label: 'TikTok', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden="true"><path d="M15 3c.5 2.4 2 3.8 4.5 4v3a7.6 7.6 0 0 1-4.5-1.4V15a5.5 5.5 0 1 1-5.5-5.5V12.6A2.5 2.5 0 1 0 12 15V3z" /></svg> },
  { href: 'https://www.facebook.com/profile.php?id=61567289284263', label: 'Facebook', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 21v-8h3l.5-3.5H14V7.8c0-1 .3-1.8 1.8-1.8h1.8V3.1C17 3 16 3 15 3c-2.7 0-4.5 1.6-4.5 4.6v1.9h-3V13h3v8" /></svg> },
  { href: 'https://www.youtube.com/@qaseralmarya', label: 'YouTube', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden="true"><rect x="2.5" y="5.5" width="19" height="13" rx="4" /><path d="M10.5 9.5v5l4-2.5z" fill="currentColor" /></svg> },
  { href: 'https://x.com/qaseralmaraya', label: 'X', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M4 4l16 16M20 4L4 20" /></svg> },
  { href: 'https://www.linkedin.com/company/qaseralmaraya', label: 'LinkedIn', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="4" /><path d="M8 10.5V16M8 7.8v.2M12 16v-5.5M12 13a2.5 2.5 0 0 1 5 0v3" /></svg> },
];

export default function LinksPage() {
  const wa = waLink('مرحباً قصر المرايا، أتواصل معكم من إنستغرام وأرغب في الاستفسار عن رحلة.');
  return (
    <main className="ql" data-no-i18n="">
      <div className="ql-wrap">
        <div className="ql-head">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="ql-logo" src="/assets/logo-mark-tight.webp" alt="" width="56" height="56" />
          <div>
            <h1>قصر المرايا للسفر والسياحة</h1>
            <p>بغداد · يومياً من 9 صباحاً حتى منتصف الليل</p>
          </div>
        </div>

        <div className="ql-actions">
          <a className="ql-wa" href={wa} target="_blank" rel="noopener">{WA_ICON}<span>احجز عبر واتساب</span></a>
          <a className="ql-call" href="tel:6393" aria-label="اتصل بالرقم المختصر 6393"><Icon name="phone" size={18} /><span dir="ltr">6393</span></a>
        </div>

        <OfferStories lang="ar" />

        <LinksDepartures />

        <nav className="ql-list" aria-label="روابط الموقع">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href}>
              <Icon name={l.icon} size={18} />
              <span>{l.title}</span>
              <Icon name="chevron-left" size={16} />
            </Link>
          ))}
          <a href="https://share.google/mJh2iRvrcGKkMqNNO" target="_blank" rel="noopener">
            <Icon name="map-pin" size={18} />
            <span>{ADDRESS_AR}</span>
            <Icon name="chevron-left" size={16} />
          </a>
        </nav>

        <div className="ql-foot">
          <div className="ql-social">
            {SOCIAL.map((s) => (
              <a key={s.label} href={s.href} target="_blank" rel="noopener" aria-label={s.label} title={s.label}>{s.icon}</a>
            ))}
          </div>
          <a className="ql-mail" href="mailto:sales@almarayagroup.com" dir="ltr">sales@almarayagroup.com</a>
        </div>
      </div>
    </main>
  );
}
