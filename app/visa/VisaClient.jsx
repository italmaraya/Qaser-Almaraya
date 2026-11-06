'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { WHATSAPP_NUMBER } from '../../lib/whatsapp';
import SiteHeader from '../../components/SiteHeader';
import HomeGlobe from '../../components/HomeGlobe';
import SiteFooter from '../../components/SiteFooter';
import MascotLoader from '../../components/MascotLoader';
import { useLangToggle } from '../../lib/i18n';
import { formatPrice } from '../../lib/currency';
import { flagSrc, isUploadedFlag } from '../../lib/flags';
import CountrySelect from '../../components/CountrySelect';
import Icon from '../../components/Icon';
import { regionRank, workDaysLabel } from '../../lib/destinations';

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

// Shown on the tracking card when the application's current status is
// flagged (in "الحالات" → إعدادات الحالة الداخلية) to accept a customer
// upload — e.g. "مطلوب جواز/مستند". Uploading here attaches the file
// directly to the application, visible immediately in the dashboard.
function ActionUpload({ application }) {
  const [fileName, setFileName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(!!application.customer_upload_url);

  async function handleFile(file) {
    if (!file) return;
    setError('');
    setFileName(file.name);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/visa/upload', { method: 'POST', body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'تعذّر رفع الملف');
      const attachRes = await fetch('/api/visa/track/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId: application.id, phone: application.customer_phone, url: data.url }),
      });
      const attachData = await attachRes.json().catch(() => ({}));
      if (!attachRes.ok) throw new Error(attachData.error || 'تعذّر إرسال الملف');
      setDone(true);
    } catch (e) {
      setError(e.message || 'تعذّر رفع الملف — حاول مرة أخرى');
      setFileName('');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, background: '#eaf8fd', border: '1px solid #bfe9f6', borderRadius: 'var(--tw-radius-sm,10px)', padding: '12px 14px' }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: '#036f8c' }}>مطلوب منك رفع مستند أو ملف</span>
      {done ? (
        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12.5, color: '#1e7d46' }}><Icon name="check" size={14} style={{ flex: 'none' }} />تم استلام ملفك، سيراجعه فريقنا قريباً.</span>
      ) : (
        <>
          <label style={{ cursor: uploading ? 'not-allowed' : 'pointer', opacity: uploading ? 0.6 : 1, display: 'inline-flex', alignItems: 'center', gap: 8, alignSelf: 'flex-start', padding: '8px 16px', borderRadius: 999, background: '#fff', border: '1px solid #036f8c', color: '#036f8c', fontSize: 12.5, fontWeight: 700 }}>
            {uploading ? 'جارٍ الرفع...' : fileName ? fileName : 'اختر ملفاً للرفع'}
            <input type="file" accept="image/*,.pdf" disabled={uploading} style={{ display: 'none' }} onChange={(e) => handleFile(e.target.files && e.target.files[0])} />
          </label>
          {error && <span style={{ fontSize: 12, color: '#d2324f' }}>{error}</span>}
        </>
      )}
    </div>
  );
}

export default function VisaLandingPage({ initialCards = null }) {
  const router = useRouter();
  const { lang } = useLangToggle();
  const nm = (ar, en) => (lang === 'en' && en ? en : ar);
  const [cards, setCards] = useState(Array.isArray(initialCards) && initialCards.length ? initialCards : null);
  const [error, setError] = useState('');
  const [typeFilter, setTypeFilter] = useState('الكل');
  const [countrySearch, setCountrySearch] = useState('');
  const [destination, setDestination] = useState('');
  const [adultCount, setAdultCount] = useState(1);
  const [childCount, setChildCount] = useState(0);
  const [nationality, setNationality] = useState('');
  const [travelDate, setTravelDate] = useState('');
  const [nationalities, setNationalities] = useState([]);
  const [travelersOpen, setTravelersOpen] = useState(false);
  const [trackOpen, setTrackOpen] = useState(false);
  const [trackInput, setTrackInput] = useState('');
  const [trackLoading, setTrackLoading] = useState(false);
  const [trackError, setTrackError] = useState('');
  const [trackResults, setTrackResults] = useState(null);
  const [trackStages, setTrackStages] = useState([]);

  useEffect(() => {
    if (!(Array.isArray(initialCards) && initialCards.length)) {
      fetch('/api/visa/cards')
        .then((r) => r.json())
        .then(setCards)
        .catch(() => setError('تعذّر تحميل قائمة التأشيرات'));
    }
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
          card_image_url: c.card_image_url,
          region: c.region || 'وجهات أخرى',
          region_en: c.region_en || '',
          region_id: c.region_id || 'other',
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
    const q = countrySearch.trim().toLowerCase();
    const filtered = countries.filter((c) => {
      if (typeFilter !== 'الكل' && !c.typeNames.includes(typeFilter)) return false;
      if (q) {
        const hay = [c.country_name_ar, c.country_name_en].filter(Boolean).join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    const byRegion = new Map();
    const sorted = [...filtered].sort((a, b) => regionRank(a.region_id) - regionRank(b.region_id) || String(a.country_name_ar).localeCompare(String(b.country_name_ar), 'ar'));
    for (const c of sorted) {
      const label = lang === 'en' && c.region_en ? c.region_en : c.region;
      if (!byRegion.has(label)) byRegion.set(label, []);
      byRegion.get(label).push(c);
    }
    return Array.from(byRegion.entries());
  }, [countries, typeFilter, countrySearch, lang]);

  const selectedCountry = countries.find((c) => String(c.country_id) === destination);
  const cheapestForSelected = selectedCountry
    ? selectedCountry.cards.reduce((min, c) => (Number(c.adult_price) < Number(min.adult_price) ? c : min), selectedCountry.cards[0])
    : null;
  const estimatedTotal = cheapestForSelected
    ? Number(cheapestForSelected.adult_price) * adultCount + Number(cheapestForSelected.child_price) * childCount
    : null;

  function goSearch(e) {
    e.preventDefault();
    if (selectedCountry) {
      const qs = travelDate ? `?date=${encodeURIComponent(travelDate)}` : '';
      router.push(`/visa/country/${selectedCountry.country_id}${qs}`);
    }
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
          <section style={{ position: 'relative', background: 'var(--tw-band-deep,#049dc5)', paddingBottom: 50, overflow: 'hidden' }}>
            <img src="/assets/logo-mark-white.webp" alt="" style={{ position: 'absolute', insetInlineEnd: -150, top: -80, height: 480, opacity: 0.1 }} />
            <div className="qa-sec qa-2col" style={{ position: 'relative', paddingTop: 36, paddingBottom: 0, display: 'grid', gridTemplateColumns: 'minmax(0,1.05fr) minmax(0,.95fr)', gap: 28, alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start', textAlign: 'start' }}>
                <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: '.06em', color: '#fff' }}>VISAS</span>
                <h1 style={{ margin: 0, fontSize: 'clamp(28px,3vw,46px)', color: '#fff' }}>التأشيرات</h1>
                <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6, color: 'rgba(255,255,255,.92)', maxWidth: 600 }}>
                  اختر الدولة من الشريط أدناه لتظهر لك نوع التأشيرة ورسومها ومدة الإنجاز والمستندات المطلوبة.
                </p>
              </div>

              <div data-jobs-art="" className="qa-visa-hero-art" style={{ position: 'relative', alignSelf: 'stretch', minHeight: 250, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                <img
                  src="/assets/visa-fan-cutout.webp"
                  alt="سكايلو يحمل تأشيرات وجواز سفر"
                  style={{ position: 'relative', zIndex: 2, display: 'block', width: 'clamp(150px,52%,240px)', height: 'auto', marginBottom: -14, objectFit: 'contain', filter: 'drop-shadow(0 10px 18px rgba(1,42,55,.22))' }}
                />
              </div>
            </div>

            <div className="qa-sec" style={{ paddingTop: 20, paddingBottom: 0 }}>
              <div style={{ position: 'relative', background: '#fff', borderRadius: 'var(--tw-radius,16px)', boxShadow: 'var(--tw-card-shadow,0 1px 3px rgba(29,39,51,.06))' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 26px', borderBottom: '1px solid #ececed' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 17, fontWeight: 700, color: '#1d2733' }}>طلب تأشيرة</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#5f666e', letterSpacing: '.06em' }}>VISA REQUEST</span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#5f666e', letterSpacing: '.04em' }}>QASER · ALMARAYA</span>
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
                    <input
                      type="date"
                      value={travelDate}
                      onChange={(e) => setTravelDate(e.target.value)}
                      style={{ ...segmentSelect, appearance: 'auto', WebkitAppearance: 'auto' }}
                    />
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
                      <Icon name="chevron-down" size={16} style={{ color: '#5f666e', flex: 'none' }} />
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
                          borderRadius: 'var(--tw-radius-sm,10px)',
                          boxShadow: 'var(--tw-card-shadow,0 1px 3px rgba(29,39,51,.06))',
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
                    <span style={{ fontSize: 12.5, color: '#5f666e' }}>
                      {selectedCountry.typeNames.map((t) => nm(t, typeNameMap[t])).join('، ')} · الإصدار من {Math.round(selectedCountry.minIssuing)} أيام عمل
                    </span>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, padding: '18px 26px', background: '#f8fdfe' }}>
                  <button type="submit" onClick={goSearch} disabled={!selectedCountry} className="qa-btn qa-cyan" style={{ opacity: selectedCountry ? 1 : 0.5, cursor: selectedCountry ? 'pointer' : 'not-allowed' }}>
                    عرض التفاصيل
                  </button>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: 13, color: '#5f666e' }}>الإجمالي التقديري</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: '#049dc5' }}>{estimatedTotal != null ? formatPrice(estimatedTotal, 'IQD', lang) : '—'}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="qa-sec" style={{ paddingTop: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, background: 'rgba(255,255,255,.14)', border: '1px solid rgba(255,255,255,.3)', borderRadius: 'var(--tw-radius,16px)', padding: '16px 22px' }}>
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

          <HomeGlobe lang={lang} mode="visa" />

          <section className="qa-sec" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#faab18' }}>الدول</span>
              <h2 style={{ fontSize: 'clamp(22px,2.4vw,32px)' }}>الدول المتاحة للتأشيرة</h2>
              <span style={{ fontSize: 14, color: '#5f666e' }}>{countries.length} {countries.length > 2 && countries.length <= 10 ? 'دول' : 'دولة'} · {cards ? cards.length : 0} {cards && cards.length > 2 && cards.length <= 10 ? 'تأشيرات' : 'تأشيرة'}</span>
            </div>

            {error && <p style={{ color: '#d2324f', background: '#fdecef', border: '1px solid #f7c3cc', borderRadius: 'var(--tw-radius-sm,10px)', padding: '12px 16px' }}>{error}</p>}

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: '1 1 260px', maxWidth: 420 }}>
              <input
                type="text"
                value={countrySearch}
                onChange={(e) => setCountrySearch(e.target.value)}
                placeholder={nm('ابحث عن دولة...', 'Search for a country...')}
                style={{
                  width: '100%', boxSizing: 'border-box', padding: '12px 44px 12px 16px', borderRadius: 999,
                  border: '1px solid #cacbcc', fontSize: 15, fontFamily: 'inherit',
                }}
              />
              <span style={{ position: 'absolute', insetInlineEnd: 16, top: '50%', transform: 'translateY(-50%)', color: '#5f666e', pointerEvents: 'none' }}>
                <Icon name="search" size={18} />
              </span>
              {countrySearch && (
                <button
                  type="button"
                  onClick={() => setCountrySearch('')}
                  aria-label={nm('مسح', 'Clear')}
                  style={{ position: 'absolute', insetInlineStart: 10, top: '50%', transform: 'translateY(-50%)', border: 0, background: 'transparent', cursor: 'pointer', color: '#5f666e', padding: 4 }}
                >
                  <Icon name="x" size={16} />
                </button>
              )}
            </div>

              {typeOptions.length > 2 && (
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '0 1 280px' }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#3d4650', whiteSpace: 'nowrap' }}>{nm('نوع التأشيرة', 'Visa type')}</span>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    style={{ flex: 1, minWidth: 0, padding: '11px 14px', borderRadius: 999, border: '1px solid #cacbcc', fontSize: 15, fontFamily: 'inherit', background: '#fff', color: '#1d2733' }}
                  >
                    {typeOptions.map((t) => (
                      <option key={t} value={t}>{t === 'الكل' ? nm('كل الأنواع', 'All types') : nm(t, typeNameMap[t])}</option>
                    ))}
                  </select>
                </label>
              )}
            </div>

            {cards && countries.length === 0 && (
              <div className="qa-card" style={{ textAlign: 'center', padding: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <img src="/assets/mascot-skylo-tours.webp" alt="" style={{ height: 120, width: 'auto' }} />
                <p style={{ color: '#5f666e', margin: 0 }}>لا توجد تأشيرات متاحة حاليًا — تواصل معنا وسنساعدك في ترتيب رحلتك.</p>
                <Link href="/contact" className="qa-btn qa-cyan" style={{ textDecoration: 'none' }}>تواصل معنا</Link>
              </div>
            )}

            {countries.length > 0 && filteredByRegion.length === 0 && (
              <div className="qa-card" style={{ textAlign: 'center', padding: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                <p style={{ color: '#5f666e', margin: 0 }}>{nm('لم نجد دولة مطابقة لبحثكم.', "We couldn't find a matching country.")}</p>
                <button type="button" onClick={() => { setCountrySearch(''); setTypeFilter('الكل'); }} className="qa-btn qa-cyan" style={{ border: 0 }}>
                  {nm('مسح البحث', 'Clear search')}
                </button>
              </div>
            )}

            {filteredByRegion.map(([region, list]) => (
              <div key={region} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #ececed', paddingBottom: 8 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#1d2733' }}>{region}</span>
                  <span style={{ fontSize: 13, color: '#5f666e' }}>{list.length} {nm(list.length <= 10 && list.length > 2 ? 'دول' : 'دولة', list.length === 1 ? 'country' : 'countries')}</span>
                </div>
                <div className="qa-visa-grid">
                  {list.map((c) => (
                    <Link key={c.country_id} href={`/visa/country/${c.country_id}${travelDate ? `?date=${encodeURIComponent(travelDate)}` : ''}`} className="qa-card" style={{ padding: 0, overflow: 'hidden', textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column' }}>
                      <div
                        style={{
                          position: 'relative', height: 96, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: 16,
                          background: c.card_image_url
                            ? `linear-gradient(135deg, rgba(1,42,55,.45), rgba(1,42,55,.15)), url(${c.card_image_url}) center/cover`
                            : 'var(--tw-band-deep,#049dc5)',
                        }}
                      >
                        <span style={{ background: 'rgba(255,255,255,.18)', color: '#fff', fontSize: 12, fontWeight: 700, borderRadius: 999, padding: '5px 12px' }}>
                          من {formatPrice(c.minPrice, 'IQD', lang)}
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
                        </div>
                        <span style={{ fontSize: 13, color: '#5f666e' }}>{c.typeNames.length === 1 ? 'نوع واحد' : c.typeNames.length + ' أنواع'}: {c.typeNames.map((t) => nm(t, typeNameMap[t])).join('، ')}</span>
                        {c.minIssuing < 999 ? <span style={{ fontSize: 12.5, color: '#5f666e' }}>{nm('الإصدار خلال ', 'Issued in ')}{workDaysLabel(c.minIssuing, lang)}</span> : null}
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
            <div className="qa-grid qa-swipe" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))' }}>
              {STEPS.map((s) => (
                <div key={s.n} className="qa-card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 20, fontWeight: 700, color: '#cacbcc' }}>{s.n}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: s.who === 'أنت' ? '#036f8c' : '#a06a00', background: s.who === 'أنت' ? '#eaf8fd' : '#fef3dc', borderRadius: 999, padding: '3px 12px' }}>{s.who}</span>
                  </div>
                  <span style={{ fontSize: 16, fontWeight: 700, color: '#1d2733' }}>{s.title}</span>
                  <span style={{ fontSize: 13.5, color: '#5f666e' }}>{s.hint}</span>
                </div>
              ))}
            </div>
            <div className="qa-swipe-hint" aria-hidden="true">اسحب لرؤية المزيد ↔</div>
            <div style={{ background: '#fef3dc', border: '1px solid #fdd27c', borderRadius: 'var(--tw-radius-sm,10px)', padding: '14px 20px', textAlign: 'center', fontSize: 14, color: '#a06a00', fontWeight: 600 }}>
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
            style={{ width: '100%', maxWidth: 460, maxHeight: '88vh', overflow: 'auto', background: '#fff', borderRadius: 'var(--tw-radius,16px)', boxShadow: 'var(--tw-card-shadow,0 1px 3px rgba(29,39,51,.06))' }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14, padding: '22px 24px 14px', borderBottom: '1px solid #ececed' }}>
              <span style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#faab18' }}>تتبّع الطلب</span>
                <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#1d2733' }}>حالة طلب التأشيرة</h3>
              </span>
              <button type="button" onClick={closeTrack} aria-label="إغلاق" style={{ flex: 'none', width: 34, height: 34, borderRadius: '50%', border: '1px solid #ececed', background: '#fff', color: '#5f666e', display: 'grid', placeItems: 'center', cursor: 'pointer' }}><Icon name="x" size={15} /></button>
            </div>

            <form onSubmit={submitTrack} style={{ padding: '22px 24px 26px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14, fontWeight: 600, color: '#3d4650' }}>
                رقم الهاتف أو رقم الطلب
                <input
                  autoFocus
                  value={trackInput}
                  onChange={(e) => setTrackInput(e.target.value)}
                  placeholder="مثال: 07xxxxxxxx أو QA-000012"
                  style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 'var(--tw-radius-xs,8px)', border: '1px solid #ececed', fontSize: 15, fontFamily: 'inherit' }}
                />
              </label>
              {trackError && (
                <p style={{ margin: 0, background: '#fdecef', border: '1px solid #f7c3cc', borderRadius: 'var(--tw-radius-xs,8px)', padding: '10px 14px', fontSize: 14, color: '#d2324f' }}>{trackError}</p>
              )}
              <button type="submit" disabled={trackLoading} className="qa-btn qa-cyan" style={{ opacity: trackLoading ? 0.6 : 1, cursor: trackLoading ? 'not-allowed' : 'pointer' }}>
                {trackLoading ? '...جارٍ البحث' : 'بحث'}
              </button>

              {trackResults && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 6 }}>
                  {trackResults.map((a) => {
                    const currentIdx = trackStages.findIndex((s) => s.id === a.customer_status_id);
                    return (
                      <div key={a.id} style={{ border: '1px solid #ececed', borderRadius: 'var(--tw-radius-sm,10px)', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: '#1d2733' }}>QA-{String(a.id).padStart(6, '0')}</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#036f8c', background: '#eaf8fd', borderRadius: 999, padding: '3px 12px' }}>{a.status_name_ar}</span>
                        </div>
                        <span style={{ fontSize: 13.5, color: '#3d4650' }}>{nm(a.country_name_ar, a.country_name_en)} — {nm(a.visa_type_name_ar, a.visa_type_name_en)}</span>
                        <span style={{ fontSize: 12.5, color: '#5f666e' }}>{a.customer_name}</span>

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
                                      {done ? <Icon name="check" size={13} strokeWidth={3} /> : i + 1}
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
                          <div style={{ fontSize: 13, color: '#a06a00', background: '#fef3dc', border: '1px solid #fdd27c', borderRadius: 'var(--tw-radius-xs,8px)', padding: '10px 12px', lineHeight: 1.6 }}>
                            {a.latest_note}
                          </div>
                        )}

                        {a.can_upload && (
                          <ActionUpload application={a} />
                        )}

                        {a.result_file_url && (
                          <a
                            href={a.result_file_url}
                            target="_blank"
                            rel="noopener"
                            className="qa-btn qa-cyan"
                            style={{ textAlign: 'center', textDecoration: 'none' }}
                          >
                            <Icon name="download" size={16} style={{ marginInlineEnd: 8 }} />تحميل ملف التأشيرة
                          </a>
                        )}

                        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                          <a
                            href={"https://wa.me/" + WHATSAPP_NUMBER}
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

const segmentLabel = { fontSize: 12.5, color: '#5f666e' };

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
  color: '#5f666e',
  fontSize: 14,
  pointerEvents: 'none',
};
