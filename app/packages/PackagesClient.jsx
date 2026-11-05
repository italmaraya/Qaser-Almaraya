'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { packageUrgency } from '../../lib/packageUrgency';
import dynamic from 'next/dynamic';
import SiteHeader from '../../components/SiteHeader';
import SiteFooter from '../../components/SiteFooter';
import MascotLoader from '../../components/MascotLoader';
import PackageCard from '../../components/PackageCard';

const Globe3D = dynamic(() => import('../../components/Globe3D'), {
  ssr: false,
  loading: () => (
    <div style={{ height: 340, display: 'grid', placeItems: 'center', color: 'rgba(255,255,255,.6)', fontSize: 13 }}>
      جارٍ تحميل الكرة الأرضية...
    </div>
  ),
});
import Icon from '../../components/Icon';
import { useLangToggle } from '../../lib/i18n';
import { CATS, PREFS, T } from '../../lib/packagesData';
import { formatPrice } from '../../lib/currency';
import { COUNTRY_GEO } from '../../lib/geoData';
import { REGIONS, countryInfo, flagUrl, groupPackagesByCountry, packageCountries, packageCountry, nightsLabel, destinationLabel, isoFromName } from '../../lib/destinations';

export default function PackagesPage({ initialPackages = null }) {
  const router = useRouter();
  const { lang } = useLangToggle();
  const t = T[lang] || T.ar;
  const nm = (ar, en) => (lang === 'en' && en ? en : ar);

  const [packages, setPackages] = useState(Array.isArray(initialPackages) ? initialPackages : null);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [country, setCountry] = useState('all');
  // Opened from the homepage globe as /packages?q=<country name>
  useEffect(() => {
    try {
      const q = new URLSearchParams(window.location.search).get('q');
      if (q) {
        const iso = isoFromName(q);
        if (iso) setCountry(iso); else setQuery(q);
        setTimeout(() => document.getElementById('qa-pkg-results')?.scrollIntoView({ behavior: 'smooth' }), 400);
      }
    } catch {}
  }, []);
  const [cat, setCat] = useState('all');
  const [prefs, setPrefs] = useState([]);
  const [showDestDropdown, setShowDestDropdown] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [showTravelers, setShowTravelers] = useState(false);
  const [travelers, setTravelers] = useState({ adults: 2, children: 0, infants: 0, singleRooms: 1, doubleRooms: 0 });
  const [preferredDates, setPreferredDates] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (Array.isArray(initialPackages) && initialPackages.length) return; // already rendered by the server
    fetch('/api/packages')
      .then((r) => r.json())
      .then((data) => setPackages(Array.isArray(data) ? data : []))
      .catch(() => setError('تعذّر تحميل الباقات'));
  }, [initialPackages]);

  useEffect(() => {
    fetch('/api/packages/reviews')
      .then((r) => r.json())
      .then((data) => setReviews(Array.isArray(data) ? data : []))
      .catch(() => setReviews([]));
  }, []);

  // Every destination country we have packages for, with how many.
  const destCountries = useMemo(() => {
    const map = new Map();
    (packages || []).forEach((p) => {
      packageCountries(p).forEach((iso) => {
        const info = countryInfo(iso);
        if (!info) return;
        if (!map.has(iso)) map.set(iso, { ...info, count: 0 });
        map.get(iso).count += 1;
      });
    });
    return [...map.values()].sort((a, b) => b.count - a.count || a.ar.localeCompare(b.ar, 'ar'));
  }, [packages]);

  const regionGroups = useMemo(() => {
    const out = [];
    const order = Object.fromEntries(REGIONS.map((r, i) => [r.id, i]));
    [...destCountries].sort((a, b) => (order[a.regionId] ?? 99) - (order[b.regionId] ?? 99) || b.count - a.count).forEach((c) => {
      let g = out.find((x) => x.id === c.regionId);
      if (!g) { g = { id: c.regionId, ar: c.regionAr, en: c.regionEn, list: [] }; out.push(g); }
      g.list.push(c);
    });
    return out;
  }, [destCountries]);

  const catsWithPackages = useMemo(() => CATS.filter((c) => (packages || []).some((p) => p.cat === c.id)), [packages]);

  const currentReview = reviews[reviewIndex] || reviews[0] || null;

  const CAT_EMOJI = { family: '👨‍👩‍👧', honeymoon: '💍', music: '🎵', sports: '⚽', umrah: '🕋' };

  const heroImage = '/assets/packages-hero-cliffs.jpg';

  const globePins = useMemo(() => destCountries
    .map((c) => {
      const g = COUNTRY_GEO[c.iso];
      return g ? { lat: g[0], lng: g[1], name: nm(c.ar, c.en), iso: c.iso } : null;
    })
    .filter(Boolean), [destCountries, lang]);

  function pickCountry(iso) {
    setCountry(iso);
    setQuery('');
    setShowDestDropdown(false);
    document.getElementById('qa-pkg-results')?.scrollIntoView({ behavior: 'smooth' });
  }

  function setTravelerCount(key, delta, min = 0) {
    setTravelers((t) => ({ ...t, [key]: Math.max(min, t[key] + delta) }));
  }

  const travelersTotal = travelers.adults + travelers.children + travelers.infants;

  function togglePref(id) {
    setPrefs((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  }

  const filtered = useMemo(() => {
    if (!packages) return [];
    const q = query.trim().toLowerCase();
    return packages.filter((p) => {
      if (cat !== 'all' && p.cat !== cat) return false;
      if (country !== 'all' && !packageCountries(p).includes(country)) return false;
      if (prefs.length && !(p.prefs || []).some((pr) => prefs.includes(pr))) return false;
      if (q) {
        const names = packageCountries(p).map((iso) => { const c = countryInfo(iso); return c ? c.ar + ' ' + c.en : ''; });
        const hay = [p.dest_ar, p.dest_en, p.title_ar, p.title_en, ...names].filter(Boolean).join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [packages, cat, prefs, query, country]);

  // No filter → one block per country; otherwise a single sorted list.
  const grouped = useMemo(() => {
    if (country !== 'all' || query.trim()) {
      const list = [...filtered].sort((a, b) => (Number(a.nights) || 0) - (Number(b.nights) || 0) || (Number(a.price) || 0) - (Number(b.price) || 0));
      return [{ iso: country, ar: '', en: '', items: list }];
    }
    return groupPackagesByCountry(filtered);
  }, [filtered, country, query]);

  return (
    <div dir={lang === 'en' ? 'ltr' : 'rtl'} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <SiteHeader active="المجموعات والباقات" />
      <main style={{ flex: 1 }}>
        <div className="qa-page">
          {/* Hero — full-bleed photo, big search bar */}
          <section
            className="qa-hero-photo"
            style={{
              position: 'relative', height: 'clamp(400px,54vh,580px)', display: 'flex', alignItems: 'center',
              overflow: 'visible', paddingBottom: 84, paddingTop: 40,
            }}
          >
            {heroImage ? (
              <img src={heroImage} alt="" className="qa-hero-bg-img" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,#34bbe1,#049dc5)' }} />
            )}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(1,20,28,.82) 0%, rgba(1,20,28,.42) 55%, rgba(1,20,28,.18) 100%)' }} />

            <div style={{ position: 'relative', zIndex: 1, maxWidth: 860, margin: '0 auto', textAlign: 'center', padding: '0 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
              <span style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: '.08em', color: '#fff', background: 'rgba(255,255,255,.16)', border: '1px solid rgba(255,255,255,.35)', borderRadius: 999, padding: '7px 18px', backdropFilter: 'blur(6px)' }}>
                {t.hero_eyebrow}
              </span>
              <h1 style={{ margin: 0, fontSize: 'clamp(32px,6vw,58px)', fontWeight: 800, color: '#fff', lineHeight: 1.08, maxWidth: 760 }}>{t.hero_title}</h1>
              <p style={{ margin: 0, fontSize: 'clamp(14.5px,1.6vw,17px)', lineHeight: 1.7, color: 'rgba(255,255,255,.92)', maxWidth: 620 }}>{t.hero_sub}</p>
            </div>
          </section>

          {/* Floating search bar — overlaps the hero's bottom edge */}
          <div style={{ maxWidth: 1080, margin: 'clamp(-64px,-8vw,-46px) auto 0', padding: '0 20px', position: 'relative', zIndex: 30 }}>
            <div className="qa-search-bar" style={{ background: '#fff', borderRadius: 24, boxShadow: '0 22px 54px rgba(1,42,55,.28)', display: 'flex', flexWrap: 'wrap', alignItems: 'stretch' }}>
              <div className="qa-search-field" style={{ position: 'relative', flex: '1 1 220px', padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 3, minWidth: 200 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: '#7b8087', textTransform: 'uppercase', letterSpacing: '.03em' }}>
                  <Icon name="map-pin" size={12} style={{ color: '#049dc5' }} />{lang === 'en' ? 'Destination' : 'الوجهة'}
                </span>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => setShowDestDropdown(true)}
                  onBlur={() => setTimeout(() => setShowDestDropdown(false), 150)}
                  placeholder={t.filter_destination_ph}
                  style={{ width: '100%', boxSizing: 'border-box', border: 'none', outline: 'none', fontSize: 15, fontWeight: 600, fontFamily: 'inherit', color: '#1d2733', padding: 0, background: 'transparent' }}
                />
                {showDestDropdown && destCountries.length > 0 && (
                  <div
                    style={{
                      position: 'absolute', insetInlineStart: 0, insetInlineEnd: 0, top: 'calc(100% + 12px)', zIndex: 20,
                      background: '#fff', border: '1px solid #ececed', borderRadius: 18, boxShadow: '0 14px 34px rgba(29,39,51,.16)',
                      padding: 18, display: 'flex', flexDirection: 'column', gap: 14, maxHeight: 360, overflowY: 'auto', textAlign: 'start',
                    }}
                  >
                    {regionGroups.map((g) => (
                      <div key={g.id} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <span style={{ fontSize: 12.5, fontWeight: 700, color: '#7b8087' }}>{nm(g.ar, g.en)}</span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          {g.list.map((c) => (
                            <button
                              key={c.iso}
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => pickCountry(c.iso)}
                              className="qa-dest-chip"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={flagUrl(c.iso)} alt="" width="20" height="14" loading="lazy" />
                              {nm(c.ar, c.en)} <span style={{ color: '#7b8087', fontWeight: 500 }}>({c.count})</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="qa-search-divider" />

              <div className="qa-search-field" style={{ flex: '1 1 180px', padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 3, minWidth: 160 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: '#7b8087', textTransform: 'uppercase', letterSpacing: '.03em' }}>
                  <Icon name="calendar-days" size={12} style={{ color: '#049dc5' }} />{t.filter_dates_label}
                </span>
                <input
                  type="date"
                  value={preferredDates}
                  onChange={(e) => setPreferredDates(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', border: 'none', outline: 'none', fontSize: 15, fontWeight: 600, fontFamily: 'inherit', color: preferredDates ? '#1d2733' : '#9aa0a6', padding: 0, background: 'transparent', colorScheme: 'light', textAlign: lang === 'en' ? 'left' : 'right' }}
                />
              </div>

              <div className="qa-search-divider" />

              <div className="qa-search-field" style={{ position: 'relative', flex: '1 1 160px', padding: '14px 20px', minWidth: 150 }}>
                <button
                  type="button"
                  onClick={() => setShowTravelers((s) => !s)}
                  style={{ width: '100%', height: '100%', cursor: 'pointer', fontFamily: 'inherit', background: 'none', border: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 3, textAlign: 'start' }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: '#7b8087', textTransform: 'uppercase', letterSpacing: '.03em' }}>
                    <Icon name="users" size={12} style={{ color: '#049dc5' }} />{lang === 'en' ? 'Guests' : 'المسافرون'}
                  </span>
                  <span style={{ fontSize: 15, fontWeight: 600, color: '#1d2733' }}>{travelersTotal} {lang === 'en' ? 'traveler(s)' : 'مسافر'}</span>
                </button>

                {showTravelers && (
                  <div
                    style={{
                      position: 'absolute', insetInlineEnd: 0, top: 'calc(100% + 12px)', zIndex: 20, width: 280, maxWidth: '90vw',
                      background: '#fff', border: '1px solid #ececed', borderRadius: 18, boxShadow: '0 14px 34px rgba(29,39,51,.16)',
                      padding: 18, display: 'flex', flexDirection: 'column', gap: 12, textAlign: 'start',
                    }}
                  >
                    {[
                      ['adults', lang === 'en' ? 'Adults' : 'بالغون', lang === 'en' ? '12+ yrs' : 'أكبر من 12 سنة', 1],
                      ['children', lang === 'en' ? 'Children' : 'أطفال', lang === 'en' ? 'under 12 yrs' : 'أقل من 12 سنة', 0],
                      ['infants', lang === 'en' ? 'Infants' : 'رضّع', lang === 'en' ? 'under 2 yrs' : 'أقل من سنتين', 0],
                      ['singleRooms', lang === 'en' ? 'Single rooms' : 'غرفة مفردة', '', 0],
                      ['doubleRooms', lang === 'en' ? 'Double rooms' : 'غرفة مزدوجة', '', 0],
                    ].map(([key, label, sub, min]) => (
                      <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                        <span style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: 13.5, fontWeight: 600, color: '#1d2733' }}>{label}</span>
                          {sub ? <span style={{ fontSize: 11, color: '#7b8087' }}>{sub}</span> : null}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <button type="button" onClick={() => setTravelerCount(key, -1, min)} style={{ width: 26, height: 26, borderRadius: '50%', border: '1px solid #cacbcc', background: '#fff', cursor: 'pointer' }}>−</button>
                          <span style={{ minWidth: 16, textAlign: 'center', fontWeight: 700 }}>{travelers[key]}</span>
                          <button type="button" onClick={() => setTravelerCount(key, 1)} style={{ width: 26, height: 26, borderRadius: '50%', border: '1px solid #cacbcc', background: '#fff', cursor: 'pointer' }}>+</button>
                        </div>
                      </div>
                    ))}
                    <button type="button" onClick={() => setShowTravelers(false)} className="qa-btn qa-cyan" style={{ marginTop: 4 }}>{lang === 'en' ? 'Done' : 'تم'}</button>
                  </div>
                )}
              </div>

              <div className="qa-search-cta-wrap" style={{ padding: 10, display: 'flex', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => document.getElementById('qa-pkg-results')?.scrollIntoView({ behavior: 'smooth' })}
                  className="qa-search-cta"
                  aria-label={lang === 'en' ? 'Search' : 'بحث'}
                  style={{
                    width: 52, height: 52, borderRadius: 18, border: 'none', cursor: 'pointer', background: '#049dc5', color: '#fff',
                    display: 'grid', placeItems: 'center', flex: 'none', gap: 8,
                  }}
                >
                  <Icon name="search" size={20} />
                  <span className="qa-search-cta-label" style={{ display: 'none', fontSize: 14.5, fontWeight: 700 }}>{lang === 'en' ? 'Search' : 'بحث'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Horizontal filter pills + Filters drawer trigger */}
          <div className="qa-filter-sticky" style={{ position: 'sticky', top: 0, zIndex: 12, background: '#fff', borderBottom: '1px solid #ececed', marginTop: 'clamp(28px,5vw,44px)' }}>
            <div style={{ maxWidth: 1240, margin: '0 auto', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="qa-pill-scroll" style={{ display: 'flex', gap: 8, overflowX: 'auto', flex: 1 }}>
                <button type="button" onClick={() => { setCountry('all'); setCat('all'); setQuery(''); }} className={`qa-pill${country === 'all' && cat === 'all' && !query ? ' qa-pill-active' : ''}`}>
                  {lang === 'en' ? 'All destinations' : 'كل الوجهات'}
                </button>
                {destCountries.map((c) => (
                  <button key={c.iso} type="button" onClick={() => { setCountry(country === c.iso ? 'all' : c.iso); setQuery(''); }} className={`qa-pill${country === c.iso ? ' qa-pill-active' : ''}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={flagUrl(c.iso)} alt="" width="18" height="13" loading="lazy" style={{ borderRadius: 2, marginInlineEnd: 6, verticalAlign: '-1px', display: 'inline-block' }} />
                    {nm(c.ar, c.en)} <span style={{ opacity: .7, fontWeight: 500 }}>{c.count}</span>
                  </button>
                ))}
                {catsWithPackages.length > 1 && catsWithPackages.map((c) => (
                  <button key={c.id} type="button" onClick={() => setCat(cat === c.id ? 'all' : c.id)} className={`qa-pill${cat === c.id ? ' qa-pill-active' : ''}`}>
                    <span style={{ marginInlineEnd: 5 }}>{CAT_EMOJI[c.id] || ''}</span>{nm(c.ar, c.en)}
                  </button>
                ))}
              </div>
              <button type="button" onClick={() => setDrawerOpen(true)} className="qa-filters-btn">
                <Icon name="layout-grid" size={15} />
                {lang === 'en' ? 'Filters' : 'الفلاتر'}
                {prefs.length > 0 ? <span className="qa-filters-badge">{prefs.length}</span> : null}
              </button>
            </div>
          </div>

          {/* Filters side drawer */}
          {drawerOpen ? (
            <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', justifyContent: 'flex-end' }}>
              <div onClick={() => setDrawerOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(1,20,28,.45)' }} />
              <div className="qa-drawer" style={{ position: 'relative', width: 'min(360px,88vw)', height: '100%', background: '#fff', boxShadow: '-12px 0 40px rgba(1,42,55,.2)', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 22px', borderBottom: '1px solid #ececed' }}>
                  <h3 style={{ margin: 0, fontSize: 18 }}>{lang === 'en' ? 'Filters' : 'الفلاتر'}</h3>
                  <button type="button" onClick={() => setDrawerOpen(false)} style={{ border: 'none', background: '#f4f4f4', borderRadius: '50%', width: 34, height: 34, cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
                    <Icon name="x" size={16} />
                  </button>
                </div>
                <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 22, flex: 1 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#3d4650', marginBottom: 10 }}>{t.filter_pref_label}</div>
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
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#3d4650', marginBottom: 10 }}>{t.filter_destination_ph}</div>
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder={t.filter_destination_ph}
                      style={{ width: '100%', boxSizing: 'border-box', padding: '12px 16px', borderRadius: 12, border: '1px solid #cacbcc', fontSize: 15, fontFamily: 'inherit' }}
                    />
                  </div>
                </div>
                <div style={{ padding: 22, borderTop: '1px solid #ececed', display: 'flex', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => { setPrefs([]); setQuery(''); }}
                    style={{ flex: 1, padding: '11px 16px', borderRadius: 999, border: '1px solid #cacbcc', background: '#fff', color: '#3d4650', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    {lang === 'en' ? 'Reset' : 'إعادة تعيين'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setDrawerOpen(false); document.getElementById('qa-pkg-results')?.scrollIntoView({ behavior: 'smooth' }); }}
                    className="qa-btn qa-cyan"
                    style={{ flex: 1 }}
                  >
                    {lang === 'en' ? 'Show results' : 'عرض النتائج'}
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          <style jsx>{`
            .qa-showcase-wrap { animation: qa-showcase-reveal .45s ease; }
            @keyframes qa-showcase-reveal { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
            .qa-hover-lift-sm { transition: transform .2s ease, box-shadow .2s ease; border-radius: 22px; }
            .qa-hover-lift-sm:hover { transform: translateY(-4px); }
            .qa-hover-lift-sm:hover .qa-region-banner { box-shadow: 0 14px 30px rgba(1,42,55,.22); }
            .qa-region-pill { transition: background .15s ease, transform .15s ease; }
            .qa-region-pill:hover { background: rgba(255,255,255,.28) !important; transform: translateY(-1px); }
            .qa-search-divider { width: 1px; background: #ececed; margin: 10px 0; }
            .qa-dest-chip {
              display: inline-flex; align-items: center; gap: 7px; cursor: pointer; font-family: inherit; padding: 7px 13px;
              border-radius: 999px; border: 1px solid #dcebf0; background: #f4fafc; color: #1d2733; font-size: 13.5px; font-weight: 600;
              transition: border-color .15s ease, background .15s ease;
            }
            .qa-dest-chip:hover { border-color: #049dc5; background: #eaf8fd; }
            .qa-dest-chip img { width: 20px; height: 14px; object-fit: cover; border-radius: 2px; box-shadow: 0 0 0 1px rgba(0,0,0,.08); }
            .qa-pkg-group { display: flex; flex-direction: column; gap: 16px; margin-bottom: 40px; }
            .qa-pkg-group-head { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; border-bottom: 1px solid #ececed; padding-bottom: 10px; }
            .qa-pkg-group-head img { width: 28px; height: 20px; object-fit: cover; border-radius: 3px; box-shadow: 0 0 0 1px rgba(0,0,0,.08); }
            .qa-pkg-group-head h3 { margin: 0; font-size: 20px; color: #1d2733; }
            .qa-pkg-group-head span { font-size: 13px; color: #7b8087; }
            .qa-pkg-group-head button {
              margin-inline-start: auto; cursor: pointer; font-family: inherit; border: 0; background: none; color: #036f8c;
              font-size: 14px; font-weight: 700; padding: 4px 0;
            }
            .qa-pkg-group-head button:hover { text-decoration: underline; }
            .qa-pkg-row, .qa-pkg-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 24px; }
            @media (max-width: 1000px) { .qa-pkg-row, .qa-pkg-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
            @media (max-width: 720px) {
              .qa-pkg-grid { grid-template-columns: 1fr; }
              .qa-pkg-row { display: flex; overflow-x: auto; scroll-snap-type: x mandatory; gap: 14px; padding-bottom: 6px; scrollbar-width: none; }
              .qa-pkg-row::-webkit-scrollbar { display: none; }
              .qa-pkg-row > :global(*) { flex: 0 0 84%; scroll-snap-align: start; }
              .qa-pkg-group-head button { margin-inline-start: 0; width: 100%; text-align: start; }
            }
            .qa-pill {
              flex: none; cursor: pointer; font-family: inherit; white-space: nowrap; padding: 9px 16px; border-radius: 999px;
              border: 1px solid #ececed; background: #fff; color: #3d4650; font-size: 13.5px; font-weight: 600;
              transition: background .15s ease, border-color .15s ease, color .15s ease, transform .15s ease;
            }
            .qa-pill:hover { border-color: #049dc5; transform: translateY(-1px); }
            .qa-pill-active { background: #049dc5; border-color: #049dc5; color: #fff; }
            .qa-pill-scroll::-webkit-scrollbar { display: none; }
            .qa-filters-btn {
              flex: none; display: inline-flex; align-items: center; gap: 8px; cursor: pointer; font-family: inherit;
              padding: 10px 18px; border-radius: 999px; border: 1px solid #cacbcc; background: #fff; color: #1d2733;
              font-size: 13.5px; font-weight: 700; position: relative; transition: border-color .15s ease, transform .15s ease;
            }
            .qa-filters-btn:hover { border-color: #049dc5; transform: translateY(-1px); }
            .qa-filters-badge {
              display: inline-grid; place-items: center; min-width: 18px; height: 18px; border-radius: 999px;
              background: #d2324f; color: #fff; font-size: 10.5px; font-weight: 800; padding: 0 4px;
            }
            .qa-search-cta { transition: transform .15s ease, box-shadow .15s ease; }
            .qa-search-cta:hover { transform: translateY(-2px); box-shadow: 0 10px 24px rgba(4,157,197,.35); }
            @media (max-width: 720px) {
              .qa-search-divider { display: none; }
              .qa-search-field { border-bottom: 1px solid #f0f0f0; }
              .qa-search-cta-wrap { width: 100%; padding: 6px 10px 14px !important; }
              .qa-search-cta { width: 100% !important; border-radius: 14px !important; display: flex !important; flex-direction: row !important; gap: 8px !important; }
              .qa-search-cta-label { display: inline !important; }
            }
          `}</style>


          {/* Results */}
          <section id="qa-pkg-results" className="qa-sec" style={{ maxWidth: 1240, margin: '0 auto', padding: '40px 24px 88px' }}>
            <h2 style={{ fontSize: 22, marginBottom: 4 }}>{t.packages_title}</h2>
            <p style={{ color: '#7b8087', marginBottom: 24 }}>{t.packages_sub}</p>

            {error && <p style={{ color: '#d2324f', background: '#fdecef', border: '1px solid #f7c3cc', borderRadius: 10, padding: '14px 20px' }}>{error}</p>}

            {!packages && !error && <div style={{ padding: 40 }}><MascotLoader assetBase="/assets" /></div>}

            {packages && filtered.length === 0 && (
              <p style={{ color: '#7b8087', background: '#f8f7f8', border: '1px solid #ececed', borderRadius: 12, padding: '20px 24px' }}>{t.no_results}</p>
            )}

            {country !== 'all' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#1d2733' }}>
                  {nm('باقات', 'Packages in')} {nm((countryInfo(country) || {}).ar, (countryInfo(country) || {}).en)} · {filtered.length}
                </span>
                <button type="button" onClick={() => setCountry('all')} className="qa-dest-chip" style={{ background: '#fff' }}>
                  <Icon name="x" size={13} /> {nm('كل الوجهات', 'All destinations')}
                </button>
              </div>
            )}

            {filtered.length > 0 && grouped.map((g) => (
              <div key={g.iso || 'all'} className="qa-pkg-group">
                {g.ar ? (
                  <div className="qa-pkg-group-head">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {g.iso && g.iso !== 'zz' ? <img src={flagUrl(g.iso)} alt="" width="28" height="20" loading="lazy" /> : null}
                    <h3>{nm(g.ar, g.en)}</h3>
                    <span>{g.items.length} {nm(g.items.length === 1 ? 'باقة' : g.items.length === 2 ? 'باقتان' : g.items.length <= 10 ? 'باقات' : 'باقة', g.items.length === 1 ? 'package' : 'packages')}</span>
                    {g.items.length > 3 && g.iso !== 'zz' ? (
                      <button type="button" onClick={() => pickCountry(g.iso)}>{nm('عرض كل باقات ', 'See all ')}{nm(g.ar, g.en)} ({g.items.length})</button>
                    ) : null}
                  </div>
                ) : null}
                <div className={g.ar ? 'qa-pkg-row' : 'qa-pkg-grid'}>
                  {(g.ar && g.iso !== 'zz' ? g.items.slice(0, 3) : g.items).map((p) => (
                    <PackageCard
                      key={p.id}
                      title={nm(p.title_ar, p.title_en)}
                      destination={destinationLabel(p, lang)}
                      image={p.image_url || null}
                      nights={nightsLabel(p, lang)}
                      groupType={CATS.find((c) => c.id === p.cat) ? nm(CATS.find((c) => c.id === p.cat).ar, CATS.find((c) => c.id === p.cat).en) : undefined}
                      departs={nm(p.departs_ar, p.departs_en)}
                      price={formatPrice(p.price, 'IQD', lang)}
                      includes={(lang === 'en' && p.includes_en?.length ? p.includes_en : p.includes_ar) || []}
                      badge={nm(p.badge_ar, p.badge_en) || undefined}
                      hotels={p.hotels || []}
                      flights={p.flights || []}
                      lang={lang}
                      rating={p.rating || 4.8}
                      urgency={packageUrgency(p, lang)}
                      onDetails={() => router.push(`/packages/${p.id}`)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </section>

          {/* Discover all destinations — interactive 3D globe */}
          <section className="qa-sec" style={{ maxWidth: 1240, margin: '0 auto', padding: '8px 24px 8px' }}>
            <div style={{ background: 'linear-gradient(135deg,#0a2530,#0d4a5c)', borderRadius: 28, overflow: 'hidden', display: 'grid', gridTemplateColumns: 'minmax(260px,1fr) minmax(280px,1.1fr)', alignItems: 'center', gap: 8 }}>
              <div style={{ padding: 'clamp(28px,4vw,44px)', display: 'flex', flexDirection: 'column', gap: 14, color: '#fff' }}>
                <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.08em', color: 'rgba(255,255,255,.7)' }}>
                  {lang === 'en' ? 'EXPLORE THE WORLD' : 'استكشف العالم'}
                </span>
                <h2 style={{ margin: 0, fontSize: 'clamp(22px,3vw,30px)', color: '#fff' }}>
                  {lang === 'en' ? 'Discover all destinations' : 'اكتشف كل الوجهات'}
                </h2>
                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.8, color: 'rgba(255,255,255,.78)', maxWidth: 420 }}>
                  {lang === 'en'
                    ? 'Spin the globe and tap a pin to jump straight to that destination — every country we travel to, in one view.'
                    : 'أدر الكرة الأرضية واضغط على أي نقطة للانتقال مباشرة إلى تلك الوجهة — كل الدول التي نسافر إليها في مكان واحد.'}
                </p>
                <button
                  type="button"
                  onClick={() => { setQuery(''); setCat('all'); setCountry('all'); document.getElementById('qa-pkg-results')?.scrollIntoView({ behavior: 'smooth' }); }}
                  className="qa-btn qa-amber"
                  style={{ alignSelf: 'flex-start', marginTop: 6 }}
                >
                  {lang === 'en' ? 'Discover all' : 'استكشاف الكل'}
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <Globe3D
                  pins={globePins}
                  onSelectPin={(p) => (p.iso ? pickCountry(p.iso) : setQuery(p.name))}
                  height={340}
                />
              </div>
            </div>
          </section>

          {/* Destinations by region — built from the packages themselves */}
          {regionGroups.length > 0 && (
            <section className="qa-sec" style={{ maxWidth: 1240, margin: '0 auto', padding: '32px 24px 56px' }}>
              <h2 style={{ fontSize: 'clamp(20px,3vw,26px)', margin: '0 0 6px' }}>{lang === 'en' ? 'Destinations by region' : 'الوجهات حسب المنطقة'}</h2>
              <p style={{ margin: '0 0 22px', color: '#7b8087', fontSize: 14 }}>{lang === 'en' ? 'Pick a country to see its packages.' : 'اختر الدولة لتظهر باقاتها.'}</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 18 }}>
                {regionGroups.map((g) => (
                  <div key={g.id} className="qa-card" style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 20 }}>
                    <span style={{ fontSize: 16, fontWeight: 800, color: '#036f8c' }}>{nm(g.ar, g.en)}</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {g.list.map((c) => (
                        <button key={c.iso} type="button" onClick={() => pickCountry(c.iso)} className="qa-dest-chip">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={flagUrl(c.iso)} alt="" width="20" height="14" loading="lazy" />
                          {nm(c.ar, c.en)} <span style={{ color: '#7b8087', fontWeight: 500 }}>({c.count})</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Customer reviews */}
          {reviews.length > 0 && currentReview && (
            <section style={{ background: '#f8f7f8', padding: '48px clamp(16px,4vw,32px)' }}>
              <div style={{ maxWidth: 1240, margin: '0 auto', display: 'grid', gridTemplateColumns: 'minmax(280px,1fr) minmax(260px,1fr)', gap: 24, alignItems: 'stretch' }}>
                <div style={{ background: '#eaf8fd', borderRadius: 24, padding: 'clamp(28px,4vw,44px)', display: 'flex', flexDirection: 'column', gap: 16, position: 'relative', overflow: 'hidden' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#7b8087' }}>{lang === 'en' ? 'Our testimonials' : 'آراء عملائنا'}</span>
                  <h2 style={{ margin: 0, fontSize: 'clamp(20px,3vw,28px)', color: '#1d2733' }}>{lang === 'en' ? 'What our customers say' : 'ماذا يقول عملاؤنا عنا'}</h2>
                  <div style={{ display: 'flex', gap: 2 }}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Icon key={i} name="star" size={16} style={{ color: i < Math.round(currentReview.rating || 5) ? '#faab18' : '#dcdfe2' }} />
                    ))}
                  </div>
                  <p style={{ margin: 0, fontSize: 15, lineHeight: 1.8, color: '#3d4650' }}>{nm(currentReview.text_ar, currentReview.text_en)}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 'auto', position: 'relative', zIndex: 1 }}>
                    {currentReview.image_url ? (
                      <img src={currentReview.image_url} alt="" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', flex: 'none' }} />
                    ) : (
                      <span style={{ width: 44, height: 44, borderRadius: '50%', background: '#fff', display: 'grid', placeItems: 'center', color: '#049dc5', fontWeight: 700, flex: 'none' }}>
                        {(nm(currentReview.name_ar, currentReview.name_en) || '?').charAt(0)}
                      </span>
                    )}
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#1d2733' }}>{nm(currentReview.name_ar, currentReview.name_en)}</span>
                  </div>
                  {reviews.length > 1 && (
                    <div style={{ display: 'flex', gap: 6 }}>
                      {reviews.map((_, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setReviewIndex(i)}
                          aria-label={`review-${i}`}
                          style={{ width: 8, height: 8, padding: 0, borderRadius: '50%', border: 'none', cursor: 'pointer', background: i === reviewIndex ? '#049dc5' : '#c7dee6' }}
                        />
                      ))}
                    </div>
                  )}
                  <span style={{ position: 'absolute', bottom: 14, insetInlineEnd: 28, fontSize: 56, fontWeight: 800, color: 'rgba(4,157,197,.15)', lineHeight: 1, fontFamily: 'Georgia, serif' }}>”</span>
                </div>
                <div style={{ borderRadius: 24, overflow: 'hidden', minHeight: 260, background: '#eaf8fd' }}>
                  {currentReview.photo_url ? (
                    <img src={currentReview.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', color: '#7fd4ee' }}>
                      <Icon name="image" size={40} />
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Highlights: inventory numbers */}
          <section style={{ background: '#eaf8fd', padding: 'clamp(28px,4vw,40px) clamp(16px,4vw,32px)' }}>
            <div style={{ maxWidth: 1240, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 28 }}>
              {[
                { icon: 'building-2', value: lang === 'en' ? '+1,000,000' : '+1,000,000', label: lang === 'en' ? 'Hotels' : 'فندق', sub: lang === 'en' ? 'In our booking inventory, across every destination' : 'ضمن مخزوننا من الفنادق حول العالم' },
                { icon: 'plane', value: lang === 'en' ? '+150' : '+150', label: lang === 'en' ? 'Tours & package types' : 'جولة ونوع باقة', sub: lang === 'en' ? 'For every kind of traveller and group' : 'تناسب كل أنواع المسافرين والمجموعات' },
              ].map((s) => (
                <div key={s.label} style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  <span style={{ width: 48, height: 48, borderRadius: '50%', background: '#fff', display: 'grid', placeItems: 'center', flex: 'none', boxShadow: '0 4px 12px rgba(4,157,197,.18)' }}>
                    <Icon name={s.icon} size={22} style={{ color: '#049dc5' }} />
                  </span>
                  <div>
                    <div style={{ fontSize: 17, fontWeight: 800, color: '#1d2733' }}>{s.value} <span style={{ fontWeight: 600, fontSize: 14, color: '#3d4650' }}>{s.label}</span></div>
                    <div style={{ fontSize: 12.5, color: '#7b8087', marginTop: 3 }}>{s.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Custom package CTA */}
          <section style={{ background: '#f8f7f8', padding: '56px clamp(16px,4vw,32px)' }}>
            <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 22 }}>{t.custom_title}</h3>
              <p style={{ margin: 0, color: '#7b8087', lineHeight: 1.7 }}>{t.custom_body}</p>
              <a href="/contact?topic=package" className="qa-btn qa-cyan" style={{ textDecoration: 'none', marginTop: 8 }}>{t.custom_cta}</a>
            </div>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
