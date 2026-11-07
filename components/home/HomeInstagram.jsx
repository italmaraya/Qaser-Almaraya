'use client';
import Icon from '../Icon';

// A pointer to the company's Instagram, where the daily offers, airfares and
// destination clips are posted. The topics listed are what the account
// actually posts (seen 7 Nov 2026); nothing here is pulled live from Meta.
const URL = 'https://www.instagram.com/qaseralmaraya/';
const TOPICS = [
  { ar: 'عروض الباقات', en: 'Package offers' },
  { ar: 'أسعار الطيران من بغداد', en: 'Airfares from Baghdad' },
  { ar: 'مقاطع من الوجهات', en: 'Destination clips' },
  { ar: 'التأشيرات', en: 'Visas' },
  { ar: 'تجارب الزبائن', en: 'Customer stories' },
];

export default function HomeInstagram({ lang = 'ar' }) {
  const en = lang === 'en';
  return (
    <section className="qs-band qs-ig" data-no-i18n="" dir={en ? 'ltr' : 'rtl'}>
      <div className="qs-wrap qs-ig-in">
        <div className="qs-ig-copy">
          <span className="qs-kicker">{en ? 'Instagram' : 'انستغرام'}</span>
          <h2 className="qs-h2">{en ? 'Follow our trips and offers as they happen' : 'تابعوا رحلاتنا وعروضنا أولاً بأول'}</h2>
          <p className="qs-lead">{en ? 'New offers, clips from our destinations and the latest airfares from Baghdad go up on our Instagram first.' : 'العروض الجديدة، ومقاطع من وجهاتنا، وآخر أسعار الطيران من بغداد تُنشر أولاً على حسابنا في انستغرام.'}</p>
          <ul className="qs-ig-topics">
            {TOPICS.map((t) => <li key={t.ar}>{en ? t.en : t.ar}</li>)}
          </ul>
        </div>
        <a className="qs-ig-card" href={URL} target="_blank" rel="noopener noreferrer">
          <span className="qs-ig-mark"><img src="/assets/logo-mark-tight.webp" alt="" width="44" height="44" /></span>
          <span className="qs-ig-handle" dir="ltr" data-keep-dir="">@qaseralmaraya</span>
          <span className="qs-ig-name">{en ? 'Qaser Almaraya Travel & Tourism' : 'شركة قصر المرايا للسفر والسياحة'}</span>
          <span className="qs-btn qs-btn-pri qs-ig-btn"><Icon name="instagram" size={18} strokeWidth={2} />{en ? 'Follow us on Instagram' : 'تابعنا على انستغرام'}</span>
        </a>
      </div>
    </section>
  );
}
