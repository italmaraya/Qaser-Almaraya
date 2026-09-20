'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import SiteHeader from '../../components/SiteHeader';
import SiteFooter from '../../components/SiteFooter';
import MascotLoader from '../../components/MascotLoader';
import PackageCard from '../../components/PackageCard';
import Icon from '../../components/Icon';
import { useLangToggle } from '../../lib/i18n';
import { CATS, PREFS, T } from '../../lib/packagesData';
import { formatPrice } from '../../lib/currency';

export default function PackagesPage() {
  const router = useRouter();
  const { lang } = useLangToggle();
  const t = T[lang] || T.ar;
  const nm = (ar, en) => (lang === 'en' && en ? en : ar);

  const [packages, setPackages] = useState(null);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState('all');
  const [prefs, setPrefs] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [showDestDropdown, setShowDestDropdown] = useState(false);

  useEffect(() => {
    fetch('/api/packages')
      .then((r) => r.json())
      .then((data) => setPackages(Array.isArray(data) ? data : []))
      .catch(() => setError('تعذّر تحميل الباقات'));
  }, []);

  useEffect(() => {
    fetch('/api/packages/destinations')
      .then((r) => r.json())
      .then((data) => setDestinations(Array.isArray(data) ? data : []))
      .catch(() => setDestinations([]));
  }, []);

  const mostSearched = destinations.filter((d) => d.kind === 'most_searched');
  const popularCities = destinations.filter((d) => d.kind !== 'most_searched');

  function pickCity(d) {
    setQuery(nm(d.name_ar, d.name_en));
    setShowDestDropdown(false);
    document.getElementById('qa-pkg-results')?.scrollIntoView({ behavior: 'smooth' });
  }

  function togglePref(id) {
    setPrefs((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  }

  const filtered = useMemo(() => {
    if (!packages) return [];
    const q = query.trim().toLowerCase();
    return packages.filter((p) => {
      if (cat !== 'all' && p.cat !== cat) return false;
      if (prefs.length && !(p.prefs || []).some((pr) => prefs.includes(pr))) return false;
      if (q) {
        const hay = [p.dest_ar, p.dest_en, p.title_ar, p.title_en].filter(Boolean).join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [packages, cat, prefs, query]);

  return (
    <div dir="rtl" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <SiteHeader active="المجموعات والباقات" />
      <main style={{ flex: 1 }}>
        <div className="qa-page">
          {/* Hero */}
          <section style={{ background: 'linear-gradient(135deg,#34bbe1 0%,#049dc5 100%)', color: '#fff', padding: 'clamp(48px,7vw,88px) clamp(16px,4vw,32px)', overflow: 'hidden' }}>
            <div style={{ maxWidth: 1240, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 32, flexWrap: 'wrap-reverse' }}>
              <div style={{ flex: '1 1 420px', display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'flex-start', minWidth: 280 }}>
                <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '.08em', color: 'rgba(255,255,255,.85)' }}>{t.hero_eyebrow}</span>
                <h1 style={{ margin: 0, fontSize: 'clamp(26px,4vw,40px)', color: '#fff', maxWidth: 640 }}>{t.hero_title}</h1>
                <p style={{ margin: 0, fontSize: 16, lineHeight: 1.7, color: 'rgba(255,255,255,.92)', maxWidth: 620 }}>{t.hero_sub}</p>
                <a
                  href="#qa-pkg-results"
                  onClick={(e) => { e.preventDefault(); document.getElementById('qa-pkg-results')?.scrollIntoView({ behavior: 'smooth' }); }}
                  className="qa-btn qa-amber"
                  style={{ marginTop: 8, textDecoration: 'none' }}
                >
                  {t.hero_cta2}
                </a>
              </div>
              <div style={{ flex: '0 0 220px', display: 'flex', justifyContent: 'center' }}>
                <img
                  src="/assets/mascot-skylo-packages-hero.png"
                  alt=""
                  style={{ width: 220, height: 220, objectFit: 'cover', borderRadius: '50%', border: '4px solid rgba(255,255,255,.35)', boxShadow: '0 16px 40px rgba(1,42,55,.3)' }}
                />
              </div>
            </div>
          </section>

          {/* Categories */}
          <section className="qa-sec" style={{ maxWidth: 1240, margin: '0 auto', padding: '48px 24px 8px' }}>
            <h2 style={{ fontSize: 24, marginBottom: 4 }}>{t.categories_title}</h2>
            <p style={{ color: '#7b8087', marginBottom: 24 }}>{t.categories_sub}</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 18 }}>
              <button
                type="button"
                onClick={() => { setCat('all'); document.getElementById('qa-pkg-results')?.scrollIntoView({ behavior: 'smooth' }); }}
                style={{
                  textAlign: 'start', cursor: 'pointer', background: cat === 'all' ? '#eaf8fd' : '#fff',
                  border: `1.5px solid ${cat === 'all' ? '#049dc5' : '#ececed'}`, borderRadius: 16, padding: 18,
                  display: 'flex', flexDirection: 'column', gap: 8, fontFamily: 'inherit',
                }}
              >
                <Icon name="layout-grid" size={22} style={{ color: '#049dc5' }} />
                <span style={{ fontSize: 16, fontWeight: 700, color: '#1d2733' }}>{t.all_categories}</span>
              </button>
              {CATS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => { setCat(c.id); document.getElementById('qa-pkg-results')?.scrollIntoView({ behavior: 'smooth' }); }}
                  style={{
                    textAlign: 'start', cursor: 'pointer', background: cat === c.id ? '#eaf8fd' : '#fff',
                    border: `1.5px solid ${cat === c.id ? '#049dc5' : '#ececed'}`, borderRadius: 16, padding: 18,
                    display: 'flex', flexDirection: 'column', gap: 8, fontFamily: 'inherit',
                  }}
                >
                  <Icon name={c.icon} size={22} style={{ color: '#049dc5' }} />
                  <span style={{ fontSize: 16, fontWeight: 700, color: '#1d2733' }}>{nm(c.ar, c.en)}</span>
                  <span style={{ fontSize: 13, color: '#7b8087', lineHeight: 1.5 }}>{nm(c.blurbAr, c.blurbEn)}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Filter panel */}
          <section className="qa-sec" style={{ maxWidth: 1240, margin: '0 auto', padding: '32px 24px 0' }}>
            <div style={{ background: '#fff', border: '1px solid #ececed', borderRadius: 20, boxShadow: '0 8px 24px rgba(29,39,51,.08)', padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
              <h3 style={{ margin: 0, fontSize: 17 }}>{t.filter_panel_title}</h3>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => setShowDestDropdown(true)}
                  onBlur={() => setTimeout(() => setShowDestDropdown(false), 150)}
                  placeholder={t.filter_destination_ph}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '12px 16px', borderRadius: 10, border: '1px solid #cacbcc', fontSize: 15, fontFamily: 'inherit' }}
                />
                {showDestDropdown && (mostSearched.length > 0 || popularCities.length > 0) && (
                  <div
                    style={{
                      position: 'absolute', insetInlineStart: 0, insetInlineEnd: 0, top: 'calc(100% + 8px)', zIndex: 20,
                      background: '#fff', border: '1px solid #ececed', borderRadius: 14, boxShadow: '0 14px 34px rgba(29,39,51,.14)',
                      padding: 18, display: 'flex', flexDirection: 'column', gap: 16, maxHeight: 340, overflowY: 'auto',
                    }}
                  >
                    {mostSearched.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <span style={{ fontSize: 12.5, fontWeight: 700, color: '#7b8087' }}>{lang === 'en' ? 'Most searched cities' : 'الأكثر بحثاً'}</span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          {mostSearched.map((d) => (
                            <button
                              key={d.id}
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => pickCity(d)}
                              style={{
                                cursor: 'pointer', fontFamily: 'inherit', padding: '8px 16px', borderRadius: 999,
                                border: '1px solid #049dc5', background: '#049dc5', color: '#fff', fontSize: 13.5, fontWeight: 700,
                              }}
                            >
                              {nm(d.name_ar, d.name_en)}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {popularCities.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <span style={{ fontSize: 12.5, fontWeight: 700, color: '#7b8087' }}>{lang === 'en' ? 'Popular cities' : 'مدن شائعة'}</span>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(120px,1fr))', gap: 6 }}>
                          {popularCities.map((d) => (
                            <button
                              key={d.id}
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => pickCity(d)}
                              style={{
                                cursor: 'pointer', fontFamily: 'inherit', textAlign: 'start', padding: '6px 4px', borderRadius: 8,
                                border: 'none', background: 'transparent', color: '#3d4650', fontSize: 13.5,
                              }}
                            >
                              {nm(d.name_ar, d.name_en)}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#3d4650', marginBottom: 8 }}>{t.filter_pref_label}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {PREFS.map((p) => {
                    const on = prefs.includes(p.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => togglePref(p.id)}
                        style={{
                          padding: '8px 16px', borderRadius: 999, fontSize: 13.5, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
                          background: on ? '#049dc5' : '#fff', color: on ? '#fff' : '#3d4650', border: `1px solid ${on ? '#049dc5' : '#cacbcc'}`,
                        }}
                      >
                        {nm(p.ar, p.en)}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* Results */}
          <section id="qa-pkg-results" className="qa-sec" style={{ maxWidth: 1240, margin: '0 auto', padding: '40px 24px 88px' }}>
            <h2 style={{ fontSize: 22, marginBottom: 4 }}>{t.packages_title}</h2>
            <p style={{ color: '#7b8087', marginBottom: 24 }}>{t.packages_sub}</p>

            {error && <p style={{ color: '#d2324f', background: '#fdecef', border: '1px solid #f7c3cc', borderRadius: 10, padding: '14px 20px' }}>{error}</p>}

            {!packages && !error && <div style={{ padding: 40 }}><MascotLoader assetBase="/assets" /></div>}

            {packages && filtered.length === 0 && (
              <p style={{ color: '#7b8087', background: '#f8f7f8', border: '1px solid #ececed', borderRadius: 12, padding: '20px 24px' }}>{t.no_results}</p>
            )}

            {filtered.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 24 }}>
                {filtered.map((p) => (
                  <PackageCard
                    key={p.id}
                    title={nm(p.title_ar, p.title_en)}
                    destination={nm(p.dest_ar, p.dest_en)}
                    image={p.image_url || null}
                    nights={nm(p.nights_ar, p.nights_en)}
                    groupType={CATS.find((c) => c.id === p.cat) ? nm(CATS.find((c) => c.id === p.cat).ar, CATS.find((c) => c.id === p.cat).en) : undefined}
                    departs={nm(p.departs_ar, p.departs_en)}
                    price={t.starts_from + ' ' + formatPrice(p.price, 'IQD', lang)}
                    includes={(lang === 'en' && p.includes_en?.length ? p.includes_en : p.includes_ar) || []}
                    badge={nm(p.badge_ar, p.badge_en) || undefined}
                    hotels={p.hotels || []}
                    flights={p.flights || []}
                    lang={lang}
                    onDetails={() => router.push(`/packages/${p.id}`)}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Custom package CTA */}
          <section style={{ background: '#f8f7f8', padding: '56px clamp(16px,4vw,32px)' }}>
            <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 22 }}>{t.custom_title}</h3>
              <p style={{ margin: 0, color: '#7b8087', lineHeight: 1.7 }}>{t.custom_body}</p>
              <a href="/contact" className="qa-btn qa-cyan" style={{ textDecoration: 'none', marginTop: 8 }}>{t.custom_cta}</a>
            </div>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
