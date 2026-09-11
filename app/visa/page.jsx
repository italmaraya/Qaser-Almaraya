'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import SiteHeader from '../../components/SiteHeader';
import SiteFooter from '../../components/SiteFooter';
import MascotLoader from '../../components/MascotLoader';
import { useLangToggle } from '../../lib/i18n';
import { useCurrencyToggle, formatPrice } from '../../lib/currency';
import { flagSrc, isUploadedFlag } from '../../lib/flags';
import CountrySelect from '../../components/CountrySelect';

const STEPS = [
  { n: '01', who: 'أنت', title: 'تختار التأشيرة', hint: 'ترى السعر والمدة وقائمة المستندات' },
  { n: '02', who: 'أنت', title: 'تعبّئ وترفع', hint: 'فقط ما طلبناه منك — لا أكثر' },
  { n: '03', who: 'أنت', title: 'تدفع', hint: 'بالبطاقة أو المحفظة أو نقداً في المكتب' },
  { n: '04', who: 'النظام', title: 'يُرسَل إلى الجهة المصدرة', hint: 'تلقائياً بعد الدفع واكتمال المستندات' },
  { n: '05', who: 'فريقنا', title: 'نتابع ملفك', hint: 'نجهّز الملف ونحدّث الحالة' },
  { n: '06', who: 'النظام', title: 'يراقب الوقت', hint: 'أي تأخير يصل لفريقنا فوراً' },
  { n: '07', who: 'فريقنا', title: 'نرفع التأشيرة', hint: 'أو تأكيد موعد السفارة' },
  { n: '08', who: 'أنت', title: 'تحمّلها', hint: 'تصبح الحالة جاهزة للتحميل' },
];

export default function VisaLandingPage() {
  const router = useRouter();
  const { lang } = useLangToggle();
  const { currency } = useCurrencyToggle();
  const nm = (ar, en) => (lang === 'en' && en ? en : ar);
  const [cards, setCards] = useState(null);
  const [error, setError] = useState('');
  const [typeFilter, setTypeFilter] = useState('الكل');
  const [destination, setDestination] = useState('');
  const [adultCount, setAdultCount] = useState(1);
  const [childCount, setChildCount] = useState(0);
  const [nationality, setNationality] = useState('');
  const [nationalities, setNationalities] = useState([]);
  const [travelersOpen, setTravelersOpen] = useState(false);
  const [trackOpen, setTrackOpen] = useState(false);
  const [trackInput, setTrackInput] = useState('');
  const [trackLoading, setTrackLoading] = useState(false);
  const [trackError, setTrackError] = useState('');
  const [trackResults, setTrackResults] = useState(null);
  const [trackStages, setTrackStages] = useState([]);

  useEffect(() => {
    fetch('/api/visa/cards')
      .then((r) => r.json())
      .then(setCards)
      .catch(() => setError('تعذّر تحميل قائمة التأشيرات'));
    fetch('/api/visa/nationalities')
      .then((r) => r.json())
      .then((list) => {
        setNationalities(list);
        if (list.length && !nationality) setNationality(String(list[0].id));
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const countries = useMemo(() => {
    if (!cards) return [];
    const byCountry = new Map();
    for (const c of cards) {
      const key = c.country_id;
      if (!byCountry.has(key)) {
        byCountry.set(key, {
          country_id: c.country_id,
          country_name_ar: c.country_name_ar,
          country_name_en: c.country_name_en,
          flag_code: c.flag_code,
          region: c.region || 'وجهات أخرى',
          cards: [],
        });
      }
      byCountry.get(key).cards.push(c);
    }
    return Array.from(byCountry.values()).map((c) => ({
      ...c,
      minPrice: Math.min(...c.cards.map((x) => Number(x.adult_price) || 0)),
      minIssuing: Math.min(...c.cards.map((x) => Number(x.issuing_time_days) || 999)),
      typeNames: [...new Set(c.cards.map((x) => x.visa_type_name_ar))],
    }));
  }, [cards]);

  const destinationOptions = useMemo(
    () => countries.map((c) => ({ value: c.country_id, label: nm(c.country_name_ar, c.country_name_en), flagCode: c.flag_code })),
    [countries, lang]
  );

  const nationalityOptions = useMemo(
    () => nationalities.map((n) => ({ value: n.id, label: nm(n.name_ar, n.name_en) })),
    [nationalities, lang]
  );

  const typeNameMap = useMemo(() => {
    const m = {};
    (cards || []).forEach((c) => { m[c.visa_type_name_ar] = c.visa_type_name_en; });
    return m;
  }, [cards]);

  const typeOptions = useMemo(() => {
    const set = new Set();
    countries.forEach((c) => c.typeNames.forEach((t) => set.add(t)));
    return ['الكل', ...Array.from(set)];
  }, [countries]);

  const filteredByRegion = useMemo(() => {
    const filtered = countries.filter((c) => typeFilter === 'الكل' || c.typeNames.includes(typeFilter));
    const byRegion = new Map();
    for (const c of filtered) {
      if (!byRegion.has(c.region)) byRegion.set(c.region, []);
      byRegion.get(c.region).push(c);
    }
    return Array.from(byRegion.entries());
  }, [countries, typeFilter]);

  const selectedCountry = countries.find((c) => String(c.country_id) === destination);
  const cheapestForSelected = selectedCountry
    ? selectedCountry.cards.reduce((min, c) => (Number(c.adult_price) < Number(min.adult_price) ? c : min), selectedCountry.cards[0])
    : null;
  const estimatedTotal = cheapestForSelected
    ? Number(cheapestForSelected.adult_price) * adultCount + Number(cheapestForSelected.child_price) * childCount
    : null;

  function goSearch(e) {
    e.preventDefault();
    if (selectedCountry) router.push(`/visa/country/${selectedCountry.country_id}`);
  }

  async function submitTrack(e) {
    if (e) e.preventDefault();
    if (!trackInput.trim()) {
      setTrackError('يرجى إدخال رقم الهاتف أو رقم الطلب');
      return;
    }
    setTrackLoading(true);
    setTrackError('');
    setTrackResults(null);
    try {
      const res = await fetch(`/api/visa/track?q=${encodeURIComponent(trackInput.trim())}`);
      const data = await res.json();
      if (!res.ok) {
        setTrackError(data.error || 'تعذّر البحث عن الطلب');
      } else if (!data.applications || data.applications.length === 0) {
        setTrackError('لم يتم العثور على أي طلب بهذا الرقم. تأكد من رقم الهاتف أو رقم الطلب وحاول مرة أخرى.');
      } else {
        setTrackResults(data.applications);
        setTrackStages(data.stages || []);
      }
    } catch {
      setTrackError('تعذّر البحث عن الطلب — تحقق من الاتصال وحاول مرة أخرى');
    } finally {
      setTrackLoading(false);
    }
  }

  function closeTrack() {
    setTrackOpen(false);
    setTrackInput('');
    setTrackError('');
    setTrackResults(null);
  }

  return (
    <div dir="rtl" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <SiteHeader active="التأشيرات" />
      <main style={{ flex: 1 }}>
        <div className="qa-page">
          <section style={{ position: 'relative', background: 'linear-gradient(135deg,#34bbe1 0%,#049dc5 100%)', paddingBottom: 90 }}>
            <div className="qa-sec" style={{ paddingBottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end', textAlign: 'right', flex: '1 1 380px', minWidth: 280 }}>
                <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: '.06em', color: '#fff' }}>VISAS</span>
                <h1 style={{ margin: 0, fontSize: 'clamp(30px,3.4vw,56px)', color: '#fff' }}>التأشيرات</h1>
                <p style={{ margin: 0, fontSize: 17, lineHeight: 1.7, color: 'rgba(255,255,255,.92)', maxWidth: 620 }}>
                  اختر الدولة من الشريط أدناه لتظهر لك نوع التأشيرة ورسومها ومدة الإنجاز والمستندات المطلوبة.
                </p>
              </div>
              <img
                src="/assets/mascot-skylo-visa-fan.png"
                alt="سكايلو يحمل تأشيرات وجواز سفر"
                className="qa-visa-hero-mascot"
                style={{ width: 220, maxWidth: '36vw', height: 'auto', flex: 'none', filter: 'drop-shadow(0 24px 44px rgba(1,42,55,.35))' }}
              />
            </div>

            <div className="qa-sec" style={{ paddingTop: 32, paddingBottom: 0 }}>
              <div style={{ position: 'relative', background: '#fff', borderRadius: 24, boxShadow: '0 24px 50px rgba(1,42,55,.28)', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 26px', borderBottom: '1px solid #ececed' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 17, fontWeight: 700, color: '#1d2733' }}>طلب تأشيرة</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#7b8087', letterSpacing: '.06em' }}>VISA REQUEST</span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#7b8087', letterSpacing: '.04em' }}>QASER · ALMARAYA</span>
                </div>
                <form
                  onSubmit={goSearch}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))',
                  }}
                >
                  <label style={segmentStyle}>
                    <span style={segmentLabel}>إلى أين تسافر؟</span>
                    <CountrySelect
                      value={destination}
                      onChange={setDestination}
                      options={destinationOptions}
                      placeholder="اختر دولة"
                      searchPlaceholder="ابحث عن دولة…"
                      emptyLabel="لا توجد دولة بهذا الاسم"
                    />
                  </label>

                  <label style={segmentStyle}>
                    <span style={segmentLabel}>الجنسية</span>
                    <CountrySelect
                      value={nationality}
                      onChange={setNationality}
                      options={nationalityOptions}
                      placeholder="اختر جنسية"
                      searchPlaceholder="ابحث عن جنسية…"
                      emptyLabel="لا توجد جنسية بهذا الاسم"
                    />
                  </label>

                  <label style={segmentStyle}>
                    <span style={segmentLabel}>تاريخ السفر</span>
                    <input type="date" style={{ ...segmentSelect, appearance: 'auto', WebkitAppearance: 'auto' }} />
                  </label>

                  <div style={{ ...segmentStyle, position: 'relative' }}>
                    <span style={segmentLabel}>عدد المسافرين</span>
                    <button
                      type="button"
                      onClick={() => setTravelersOpen((o) => !o)}
                      style={{ ...segmentSelect, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', textAlign: 'right' }}
                    >
                      <span>
                        {adultCount} {nm('بالغ', 'adult')}{childCount > 0 ? ` · ${childCount} ${nm('طفل', 'child')}` : ''}
                      </span>
                      <span style={{ color: '#7b8087' }}>⌄</span>
                    </button>

                    {travelersOpen && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '100%',
                          insetInlineEnd: 0,
                          marginTop: 8,
                          zIndex: 20,
                          background: '#fff',
                          border: '1px solid #ececed',
                          borderRadius: 14,
                          boxShadow: '0 16px 36px rgba(1,42,55,.2)',
                          padding: 16,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 14,
                          minWidth: 200,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                          <span style={{ fontSize: 14, color: '#3d4650' }}>بالغ</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <button type="button" onClick={() => setAdultCount((n) => Math.max(0, n - 1))} style={stepperBtn}>−</button>
                            <span style={{ fontSize: 16, fontWeight: 700, minWidth: 16, textAlign: 'center' }}>{adultCount}</span>
                            <button type="button" onClick={() => setAdultCount((n) => n + 1)} style={stepperBtn}>+</button>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                          <span style={{ fontSize: 14, color: '#3d4650' }}>طفل</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <button type="button" onClick={() => setChildCount((n) => Math.max(0, n - 1))} style={stepperBtn}>−</button>
                            <span style={{ fontSize: 16, fontWeight: 700, minWidth: 16, textAlign: 'center' }}>{childCount}</span>
                            <button type="button" onClick={() => setChildCount((n) => n + 1)} style={stepperBtn}>+</button>
                          </div>
                        </div>
                        <button type="button" onClick={() => setTravelersOpen(false)} className="qa-btn qa-cyan" style={{ padding: '8px 0', fontSize: 13.5 }}>
                          تم
                        </button>
                      </div>
                    )}
                  </div>
                </form>

                {selectedCountry && (
                  <div style={{ padding: '0 26px 18px' }}>
                    <span style={{ fontSize: 12.5, color: '#7b8087' }}>
                      {selectedCountry.typeNames.map((t) => nm(t, typeNameMap[t])).join('، ')} · الإصدار من {Math.round(selectedCountry.minIssuing)} أيام عمل
                    </span>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, padding: '18px 26px', background: '#f8fdfe' }}>
                  <button type="submit" onClick={goSearch} disabled={!selectedCountry} className="qa-btn qa-cyan" style={{ opacity: selectedCountry ? 1 : 0.5, cursor: selectedCountry ? 'pointer' : 'not-allowed' }}>
                    عرض التفاصيل
                  </button>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: 13, color: '#7b8087' }}>الإجمالي التقديري</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: '#049dc5' }}>{estimatedTotal != null ? formatPrice(estimatedTotal, currency, lang) : '—'}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="qa-sec" style={{ paddingTop: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, background: 'rgba(255,255,255,.14)', border: '1px solid rgba(255,255,255,.3)', borderRadius: 16, padding: '16px 22px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>هل لديك طلب تأشيرة؟</span>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,.85)' }}>تتبع حالة طلبك بإدخال رقم الهاتف أو رقم الطلب</span>
                </div>
                <button
                  type="button"
                  onClick={() => setTrackOpen(true)}
                  style={{ cursor: 'pointer', border: 0, borderRadius: 999, padding: '11px 24px', fontSize: 14, fontWeight: 700, fontFamily: 'inherit', background: '#fff', color: '#049dc5' }}
                >
                  تتبع طلبك
                </button>
              </div>
            </div>
          </section>

          <section className="qa-sec" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#faab18' }}>الدول</span>
              <h2 style={{ fontSize: 'clamp(22px,2.4vw,32px)' }}>الدول المتاحة للتأشيرة</h2>
              <span style={{ fontSize: 14, color: '#7b8087' }}>{countries.length} دولة · {cards ? cards.length : 0} تأشيرة</span>
            </div>

            {error && <p style={{ color: '#d2324f', background: '#fdecef', border: '1px solid #f7c3cc', borderRadius: 10, padding: '12px 16px' }}>{error}</p>}

            {typeOptions.length > 1 && (
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {typeOptions.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTypeFilter(t)}
                    style={{
                      cursor: 'pointer',
                      border: '1px solid ' + (typeFilter === t ? '#049dc5' : '#ececed'),
                      background: typeFilter === t ? '#049dc5' : '#fff',
                      color: typeFilter === t ? '#fff' : '#3d4650',
                      borderRadius: 999,
                      padding: '8px 18px',
                      fontSize: 14,
                      fontWeight: 600,
                      fontFamily: 'inherit',
                    }}
                  >
                    {t === 'الكل' ? nm('الكل', 'All') : nm(t, typeNameMap[t])}
                  </button>
                ))}
              </div>
            )}

            {cards && countries.length === 0 && (
              <div className="qa-card" style={{ textAlign: 'center', padding: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <img src="/assets/mascot-skylo-tours.webp" alt="" style={{ height: 120, width: 'auto' }} />
                <p style={{ color: '#7b8087', margin: 0 }}>لا توجد تأشيرات متاحة حاليًا — تواصل معنا وسنساعدك في ترتيب رحلتك.</p>
                <Link href="/contact" className="qa-btn qa-cyan" style={{ textDecoration: 'none' }}>تواصل معنا</Link>
              </div>
            )}

            {filteredByRegion.map(([region, list]) => (
              <div key={region} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #ececed', paddingBottom: 8 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#1d2733' }}>{region}</span>
                  <span style={{ fontSize: 13, color: '#7b8087' }}>{list.length} دولة</span>
                </div>
                <div className="qa-grid">
                  {list.map((c) => (
                    <Link key={c.country_id} href={`/visa/country/${c.country_id}`} className="qa-card" style={{ padding: 0, overflow: 'hidden', textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ position: 'relative', height: 96, background: 'linear-gradient(135deg,#34bbe1,#049dc5)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: 16 }}>
                        <span style={{ background: 'rgba(255,255,255,.18)', color: '#fff', fontSize: 12, fontWeight: 700, borderRadius: 999, padding: '5px 12px' }}>
                          من {formatPrice(c.minPrice, currency, lang)}
                        </span>
                        {c.flag_code ? (
                          <img src={flagSrc(c.flag_code)} alt="" style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid #fff', objectFit: 'cover' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                        ) : (
                          <span style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,.3)' }} />
                        )}
                      </div>
                      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: 17, fontWeight: 700, color: '#1d2733' }}>{nm(c.country_name_ar, c.country_name_en)}</span>
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#7b8087' }}>{isUploadedFlag(c.flag_code) ? '' : (c.flag_code || '').toUpperCase()}</span>
                        </div>
                        <span style={{ fontSize: 13, color: '#7b8087' }}>{c.typeNames.length === 1 ? 'نوع واحد' : c.typeNames.length + ' أنواع'}: {c.typeNames.map((t) => nm(t, typeNameMap[t])).join('، ')}</span>
                        <span style={{ fontSize: 12.5, color: '#7b8087' }}>الإصدار من {Math.round(c.minIssuing)} {c.minIssuing < 3 ? 'ساعة' : 'أيام عمل'}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </section>

          <section className="qa-sec" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#faab18' }}>من الاختيار إلى التحميل</span>
              <h2 style={{ fontSize: 'clamp(22px,2.4vw,32px)' }}>كيف تُباع التأشيرة وتُنجَز؟</h2>
            </div>
            <div className="qa-grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))' }}>
              {STEPS.map((s) => (
                <div key={s.n} className="qa-card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 20, fontWeight: 700, color: '#cacbcc' }}>{s.n}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: s.who === 'أنت' ? '#036f8c' : '#a06a00', background: s.who === 'أنت' ? '#eaf8fd' : '#fef3dc', borderRadius: 999, padding: '3px 12px' }}>{s.who}</span>
                  </div>
                  <span style={{ fontSize: 16, fontWeight: 700, color: '#1d2733' }}>{s.title}</span>
                  <span style={{ fontSize: 13.5, color: '#7b8087' }}>{s.hint}</span>
                </div>
              ))}
            </div>
            <div style={{ background: '#fef3dc', border: '1px solid #fdd27c', borderRadius: 14, padding: '14px 20px', textAlign: 'center', fontSize: 14, color: '#a06a00', fontWeight: 600 }}>
              الخطوات لا تتغير — ما يتغير هو المحتوى: الدول والمستندات والأسعار والحالات.
            </div>
          </section>
        </div>
      </main>
      <SiteFooter />
      {cards == null && !error && <MascotLoader assetBase="/assets" />}

      {trackOpen && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(1,42,55,.55)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={closeTrack}
        >
          <div
            dir="rtl"
            onClick={(e) => e.stopPropagation()}
            style={{ width: '100%', maxWidth: 460, maxHeight: '88vh', overflow: 'auto', background: '#fff', borderRadius: 24, boxShadow: '0 30px 70px rgba(1,42,55,.4)' }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14, padding: '22px 24px 14px', borderBottom: '1px solid #ececed' }}>
              <span style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#faab18' }}>تتبّع الطلب</span>
                <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#1d2733' }}>حالة طلب التأشيرة</h3>
              </span>
              <button type="button" onClick={closeTrack} aria-label="إغلاق" style={{ flex: 'none', width: 34, height: 34, borderRadius: '50%', border: '1px solid #ececed', background: '#fff', color: '#7b8087', fontSize: 15, cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={submitTrack} style={{ padding: '22px 24px 26px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14, fontWeight: 600, color: '#3d4650' }}>
                رقم الهاتف أو رقم الطلب
                <input
                  autoFocus
                  value={trackInput}
                  onChange={(e) => setTrackInput(e.target.value)}
                  placeholder="مثال: 07xxxxxxxx أو QA-000012"
                  style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 8, border: '1px solid #ececed', fontSize: 15, fontFamily: 'inherit' }}
                />
              </label>
              {trackError && (
                <p style={{ margin: 0, background: '#fdecef', border: '1px solid #f7c3cc', borderRadius: 8, padding: '10px 14px', fontSize: 14, color: '#d2324f' }}>{trackError}</p>
              )}
              <button type="submit" disabled={trackLoading} className="qa-btn qa-cyan" style={{ opacity: trackLoading ? 0.6 : 1, cursor: trackLoading ? 'not-allowed' : 'pointer' }}>
                {trackLoading ? '...جارٍ البحث' : 'بحث'}
              </button>

              {trackResults && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 6 }}>
                  {trackResults.map((a) => {
                    const currentIdx = trackStages.findIndex((s) => s.id === a.customer_status_id);
                    return (
                      <div key={a.id} style={{ border: '1px solid #ececed', borderRadius: 12, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: '#1d2733' }}>QA-{String(a.id).padStart(6, '0')}</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#036f8c', background: '#eaf8fd', borderRadius: 999, padding: '3px 12px' }}>{a.status_name_ar}</span>
                        </div>
                        <span style={{ fontSize: 13.5, color: '#3d4650' }}>{nm(a.country_name_ar, a.country_name_en)} — {nm(a.visa_type_name_ar, a.visa_type_name_en)}</span>
                        <span style={{ fontSize: 12.5, color: '#7b8087' }}>{a.customer_name}</span>

                        {trackStages.length > 0 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 0, padding: '8px 0 2px', overflowX: 'auto' }}>
                            {trackStages.map((s, i) => {
                              const done = currentIdx >= 0 && i <= currentIdx;
                              return (
                                <div key={s.id} style={{ display: 'flex', alignItems: 'center', flex: i < trackStages.length - 1 ? 1 : 'none', minWidth: 0 }}>
                                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 'none' }}>
                                    <span
                                      style={{
                                        width: 22,
                                        height: 22,
                                        borderRadius: '50%',
                                        flex: 'none',
                                        display: 'grid',
                                        placeItems: 'center',
                                        fontSize: 11,
                                        fontWeight: 700,
                                        color: done ? '#fff' : '#a8adb3',
                                        background: done ? '#049dc5' : '#f0f0f0',
                                      }}
                                    >
                                      {done ? '✓' : i + 1}
                                    </span>
                                    <span style={{ fontSize: 10, color: done ? '#036f8c' : '#a8adb3', fontWeight: done ? 700 : 500, textAlign: 'center', maxWidth: 64, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                      {s.name_ar}
                                    </span>
                                  </div>
                                  {i < trackStages.length - 1 && (
                                    <span style={{ flex: 1, height: 2, background: currentIdx >= 0 && i < currentIdx ? '#049dc5' : '#f0f0f0', margin: '0 2px', marginBottom: 16 }} />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {a.latest_note && (
                          <div style={{ fontSize: 13, color: '#a06a00', background: '#fef3dc', border: '1px solid #fdd27c', borderRadius: 8, padding: '10px 12px', lineHeight: 1.6 }}>
                            {a.latest_note}
                          </div>
                        )}

                        {a.result_file_url && (
                          <a
                            href={a.result_file_url}
                            target="_blank"
                            rel="noopener"
                            className="qa-btn qa-cyan"
                            style={{ textAlign: 'center', textDecoration: 'none' }}
                          >
                            ⬇ تحميل ملف التأشيرة
                          </a>
                        )}

                        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                          <a
                            href="https://wa.me/9647749999600"
                            target="_blank"
                            rel="noopener"
                            style={{ flex: 1, textAlign: 'center', textDecoration: 'none', fontSize: 13, fontWeight: 700, color: '#fff', background: '#25d366', borderRadius: 999, padding: '9px 0' }}
                          >
                            واتساب
                          </a>
                          <a
                            href="tel:+9647749999600"
                            style={{ flex: 1, textAlign: 'center', textDecoration: 'none', fontSize: 13, fontWeight: 700, color: '#036f8c', background: '#eaf8fd', borderRadius: 999, padding: '9px 0' }}
                          >
                            اتصال
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const stepperBtn = {
  cursor: 'pointer',
  width: 26,
  height: 26,
  borderRadius: '50%',
  border: '1px solid #ececed',
  background: '#fff',
  fontSize: 16,
  fontWeight: 700,
  color: '#049dc5',
  display: 'grid',
  placeItems: 'center',
  padding: 0,
};

const segmentStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  textAlign: 'right',
  padding: '20px 22px',
  borderInlineStart: '1px solid #ececed',
};

const segmentLabel = { fontSize: 12.5, color: '#7b8087' };

const segmentSelect = {
  fontFamily: 'inherit',
  fontSize: 16,
  fontWeight: 700,
  color: '#1d2733',
  border: 0,
  background: 'transparent',
  padding: '2px 0',
  width: '100%',
  appearance: 'none',
  WebkitAppearance: 'none',
  MozAppearance: 'none',
  cursor: 'pointer',
};

const chevron = {
  position: 'absolute',
  insetInlineStart: 0,
  top: '50%',
  transform: 'translateY(-50%)',
  color: '#7b8087',
  fontSize: 14,
  pointerEvents: 'none',
};
