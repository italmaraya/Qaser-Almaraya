import Icon from '../../components/Icon';
import { WA_ICON } from '../../components/WhatsAppButton';
import { waLink } from '../../lib/whatsapp';
import { pageMeta } from '../../lib/seo';

// Link-in-bio page for the Instagram profile. Same content as the old
// qalmaraya.carrd.co card (Owner, 9 Nov 2026: keep its details, only bring the
// look to the new identity); the carrd login was lost, so it now lives here.
export const metadata = pageMeta({
  title: 'شركة قصر المرايا',
  description: 'قصر المرايا للسفر والسياحة: نرسم لك رحلتك من البداية إلى الذكرى. حجوزات الطيران والفنادق والتأشيرات والكروبات السياحية من بغداد.',
  path: '/links',
});

const ln = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };
const I = {
  mail: <svg width="20" height="20" viewBox="0 0 24 24" {...ln} aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>,
  store: <svg width="16" height="16" viewBox="0 0 24 24" {...ln} aria-hidden="true"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" /><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" /><path d="M2 7h20" /><path d="M22 7v3a2 2 0 0 1-2 2a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12a2 2 0 0 1-2-2V7" /></svg>,
  linkedin: <svg width="16" height="16" viewBox="0 0 24 24" {...ln} aria-hidden="true"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" /><rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" /></svg>,
  youtube: <svg width="16" height="16" viewBox="0 0 24 24" {...ln} aria-hidden="true"><path d="M2.5 17a24 24 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.6 49.6 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24 24 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.6 49.6 0 0 1-16.2 0A2 2 0 0 1 2.5 17" /><path d="m10 15 5-3-5-3z" /></svg>,
  x: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.8 3h3.1l-6.8 7.7L22 21h-6.2l-4.9-6.3L5.3 21H2.2l7.3-8.3L2 3h6.4l4.4 5.8zm-1.1 16.2h1.7L7.4 4.7H5.6z" /></svg>,
  facebook: <svg width="16" height="16" viewBox="0 0 24 24" {...ln} aria-hidden="true"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>,
  tiktok: <svg width="16" height="16" viewBox="0 0 24 24" {...ln} aria-hidden="true"><path d="M15 3c.5 2.4 2 3.8 4.5 4v3a7.6 7.6 0 0 1-4.5-1.4V15a5.5 5.5 0 1 1-5.5-5.5v3.1A2.5 2.5 0 1 0 12 15V3z" /></svg>,
};

// The old card's buttons, in its order (Snapchat left out: its link was empty).
const BUTTONS = [
  { label: 'LinkedIn', href: 'https://www.linkedin.com/company/qaseralmaraya', icon: I.linkedin },
  { label: 'YouTube', href: 'https://www.youtube.com/@qaseralmarya', icon: I.youtube },
  { label: 'X', href: 'https://x.com/qaseralmaraya', icon: I.x },
  { label: 'Instagram', href: 'https://www.instagram.com/qaseralmaraya/', icon: <Icon name="instagram" size={16} strokeWidth={1.8} /> },
  { label: 'Facebook', href: 'https://www.facebook.com/profile.php?id=61567289284263', icon: I.facebook },
  { label: 'WebSite', href: '/', icon: <Icon name="globe" size={16} strokeWidth={1.8} />, self: true },
  { label: 'TikTok', href: 'https://www.tiktok.com/@qaseralmaraya', icon: I.tiktok },
  { label: 'Google Business', href: 'https://share.google/mJh2iRvrcGKkMqNNO', icon: I.store },
];

// Amber "lightning" marks, as on the Instagram posts.
const Spark = ({ className }) => (
  <svg className={className} width="34" height="34" viewBox="0 0 34 34" fill="none" stroke="#faab18" strokeWidth="3" strokeLinecap="round" aria-hidden="true"><path d="M6 14 2 8M14 9l-1-7M21 13l5-5" /></svg>
);

export default function LinksPage() {
  const wa = waLink('مرحباً قصر المرايا، أرغب في الاستفسار عن رحلة.');
  return (
    <main className="ql" data-no-i18n="">
      <article className="ql-card">
        <div className="ql-hero">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="ql-q" src="/assets/logo-mark-white.webp" alt="" width="510" height="556" aria-hidden="true" />
          <svg className="ql-path" viewBox="0 0 400 120" fill="none" aria-hidden="true"><path d="M8 110C90 100 150 30 260 34s120 30 132 20" stroke="#049dc5" strokeWidth="2" strokeDasharray="2 8" strokeLinecap="round" /></svg>
          <span className="ql-plane" aria-hidden="true"><Icon name="plane" size={22} strokeWidth={1.8} /></span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="ql-skylo" src="/assets/mascot-skylo-passport-cut.webp" alt="سكايلو، شخصية قصر المرايا، يحمل جواز السفر" width="659" height="489" />
          <div className="ql-intro">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="ql-logo" src="/assets/logo-mark-tight.webp" alt="قصر المرايا" width="64" height="64" />
            <p className="ql-slogan"><Spark className="ql-spark" />رحلتك تبدأ <span>معنا</span></p>
            <p className="ql-slogan-en" dir="ltr">Your memories begin with us</p>
            <h1>شركة <span>قصر المرايا</span></h1>
            <p className="ql-sub">قصر المرايا للسفر والسياحة</p>
            <p className="ql-motto">نرسم لك رحلتك من البداية إلى الذكرى!</p>
          </div>
        </div>

        <div className="ql-body">
          <div className="ql-about">
            <p>شركة عراقية رائدة في مجال السفر والسياحة، متخصصة بتنظيم البرامج السياحية المتكاملة إلى مختلف الوجهات العالمية. نُقدّم خدماتنا باحترافية عالية تشمل حجوزات الطيران، الإقامة الفندقية، استخراج التأشيرات، الجولات السياحية، النقل، وخدمة العملاء على مدار الساعة.</p>
            <p>نتميّز بتنظيم كروبات جماعية مميزة تناسب كل الأذواق، سواء كانت عائلية، شبابية، علاجية أو فاخرة، مع عروض حصرية في مواسم الأعياد والعطل الرسمية.</p>
            <p>ثقة آلاف العملاء هي رأس مالنا الحقيقي، وخبرتنا هي جواز مرورك نحو تجربة سفر آمنة، منظمة، ومليئة بالذكريات.</p>
            <p className="ql-sign">قصر المرايا – سفرتك تبدي ويّانا</p>
          </div>

          <div className="ql-reach">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="ql-skylo-2" src="/assets/mascot-skylo-questions-cut.webp" alt="" width="793" height="689" loading="lazy" />
            <div className="ql-contact">
              <a href="tel:+9647849999600" aria-label="Mobile" title="Mobile"><Icon name="smartphone" size={20} strokeWidth={1.8} /></a>
              <a href={wa} target="_blank" rel="noopener" aria-label="WhatsApp" title="WhatsApp">{WA_ICON}</a>
              <a href="mailto:sales@almarayagroup.com" aria-label="Email" title="Email">{I.mail}</a>
            </div>
          </div>

          <section className="ql-more">
            <div>
              <h2>رحلات مصممة لتناسب <span>أحلامك</span></h2>
              <p>نسهّل لك كل خطوات السفر من التأشيرة وحتى العودة، بخدمة احترافية ودعم متواصل.</p>
            </div>
            <div>
              <h2>مع <span>قصر المرايا</span>... وجهتك أوضح</h2>
              <p>من تركيا إلى شرق آسيا، نأخذك إلى وجهات تفوق التوقعات، بأسعار مدروسة وعروض موسمية مميزة.</p>
            </div>
          </section>

          <nav className="ql-buttons" aria-label="حساباتنا">
            {BUTTONS.map((b) => (
              <a key={b.label} href={b.href} {...(b.self ? {} : { target: '_blank', rel: 'noopener' })} dir="ltr">{b.icon}<span>{b.label}</span></a>
            ))}
          </nav>
        </div>
      </article>
    </main>
  );
}
