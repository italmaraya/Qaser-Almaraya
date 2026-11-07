'use client';
import Link from 'next/link';
import SiteHeader from '../../components/SiteHeader';
import SiteFooter from '../../components/SiteFooter';
import { GuideFull, guideName } from '../../components/DestinationGuide';
import { GUIDE_ISOS, guideFor } from '../../lib/destinationGuide';
import { flagUrl, regionRank, countryInfo } from '../../lib/destinations';
import { useLangToggle } from '../../lib/i18n';
import { openWhatsApp } from '../../lib/whatsapp';

// Guide pages: the list of countries (no iso) or one country's guide.
export default function GuideClient({ iso = null }) {
  const { lang } = useLangToggle();
  const en = lang === 'en';
  const name = iso ? guideName(iso, lang) : '';
  const g = iso ? guideFor(iso, lang) : null;
  const list = GUIDE_ISOS
    .map((i) => countryInfo(i))
    .filter(Boolean)
    .sort((a, b) => regionRank(a.regionId) - regionRank(b.regionId) || a.ar.localeCompare(b.ar, 'ar'));

  return (
    <div dir={en ? 'ltr' : 'rtl'} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <SiteHeader active="دليل الوجهات" />
      <main className="qa-page" style={{ flex: 1 }} data-no-i18n="">
        <section className="qa-sec" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {iso ? (
            <>
              <Link href="/guide" style={{ fontSize: 14, fontWeight: 600 }}>{en ? '← All destination guides' : '→ كل أدلة الوجهات'}</Link>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={flagUrl(iso)} alt="" width="64" height="44" style={{ width: 64, height: 44, objectFit: 'cover', borderRadius: 'var(--tw-radius-xs,8px)', border: '1px solid var(--qs-line,#ececed)' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <h1 style={{ fontSize: 34, fontWeight: 700 }}>{en ? 'Travel guide: ' + name : 'دليل السفر إلى ' + name}</h1>
                  <p style={{ fontSize: 16, color: 'var(--qs-ink-2,#5f666e)' }}>{en ? `Weather, money, time and practical tips for ${g.city} and beyond.` : `الطقس والعملة والتوقيت ونصائح عملية لزيارة ${g.city} وما حولها.`}</p>
                </div>
              </div>
              <GuideFull iso={iso} lang={lang} />
              <div className="qa-card" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, justifyContent: 'space-between', background: 'var(--qs-brand-soft,#eaf8fd)', borderColor: 'var(--qs-line-2,#bfe9f6)' }}>
                <b style={{ fontSize: 17, color: 'var(--qs-brand-deep,#036f8c)' }}>{en ? `Planning a trip to ${name}?` : `تخطط لرحلة إلى ${name}؟`}</b>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  <Link href={'/packages?q=' + encodeURIComponent(countryInfo(iso).ar)} className="qa-btn qa-cyan qa-btn-fit" style={{ padding: '10px 20px', fontSize: 14 }}>{en ? 'Packages' : 'الباقات'}</Link>
                  <Link href="/visa" className="qa-btn qa-btn-fit" style={{ padding: '10px 20px', fontSize: 14, background: '#fff', color: 'var(--qs-brand-deep,#036f8c)', border: '1px solid var(--qs-line-2,#bfe9f6)' }}>{en ? 'Visas' : 'التأشيرات'}</Link>
                  <button type="button" className="qa-btn" onClick={() => openWhatsApp(en ? `Hello, I would like to travel to ${name}.` : `مرحباً، أرغب بالسفر إلى ${name}.`)} style={{ padding: '10px 20px', fontSize: 14, background: '#25d366', color: '#fff' }}>{en ? 'Ask us on WhatsApp' : 'اسألنا على واتساب'}</button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <h1 style={{ fontSize: 34, fontWeight: 700 }}>{en ? 'Destination guides' : 'دليل الوجهات'}</h1>
                <p style={{ fontSize: 16, color: 'var(--qs-ink-2,#5f666e)' }}>{en ? 'Weather by month, currency, time difference, plugs and tips for every country we travel to.' : 'الطقس في كل شهر، العملة، فرق التوقيت، نوع المقبس ونصائح لكل دولة نسافر إليها.'}</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 12 }}>
                {list.map((c) => {
                  const gi = guideFor(c.iso, lang);
                  return (
                    <Link key={c.iso} href={'/guide/' + c.iso} className="qa-card qa-hover-lift" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, color: 'var(--qs-ink,#1d2733)' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={flagUrl(c.iso)} alt="" width="40" height="28" loading="lazy" style={{ width: 40, height: 28, objectFit: 'cover', borderRadius: 5, border: '1px solid var(--qs-line,#ececed)' }} />
                      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                        <b style={{ fontSize: 16 }}>{en ? c.en : c.ar}</b>
                        <span style={{ fontSize: 13, color: 'var(--qs-ink-2,#5f666e)' }}>{gi.city} · {gi.currencyCode}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
