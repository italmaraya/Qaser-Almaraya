'use client';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import SiteHeader from '../../../../components/SiteHeader';
import SiteFooter from '../../../../components/SiteFooter';
import MascotLoader from '../../../../components/MascotLoader';
import { printDoc, visaTableHtml, combinedDocsLine, esc } from '../../../../lib/printDoc';
import { useLangToggle } from '../../../../lib/i18n';
import { formatPrice } from '../../../../lib/currency';
import { flagSrc } from '../../../../lib/flags';
import { useProviderReveal } from '../../../../lib/useProviderReveal';
import Icon from '../../../../components/Icon';

// Give each visa type its own personality instead of one flat blue box —
// matched by keyword against the type's Arabic name, since types are
// admin-defined free text rather than a fixed enum.
const VISA_THEMES = [
  { test: /سريع|مستعجل|urgent|express/i, icon: 'zap', gradient: 'linear-gradient(150deg,#34bbe1,#0e6f8f)', iconColor: '#e8590c' },
  { test: /متعدد|سنة|سنوات|multiple/i, icon: 'refresh-cw', gradient: 'linear-gradient(150deg,#34bbe1,#0e6f8f)', iconColor: '#5b3df0' },
  { test: /الكترون|electronic|e-?visa/i, icon: 'laptop', gradient: 'linear-gradient(150deg,#34bbe1,#0e6f8f)', iconColor: '#0e968c' },
  { test: /أمن|موافق|security|approval/i, icon: 'shield-check', gradient: 'linear-gradient(150deg,#34bbe1,#0e6f8f)', iconColor: '#232f3d' },
];
const DEFAULT_VISA_THEME = { icon: 'plane-takeoff', gradient: 'linear-gradient(150deg,#34bbe1,#0e6f8f)', iconColor: '#049dc5' };
function getVisaTheme(nameAr) {
  return VISA_THEMES.find((t) => t.test.test(nameAr || '')) || DEFAULT_VISA_THEME;
}

export default function CountryVisaListPage() {
  const { lang } = useLangToggle();
  const { providers: providerHints, denied: providerDenied } = useProviderReveal();
  const nm = (ar, en) => (lang === 'en' && en ? en : ar);
  const { countryId } = useParams();
  const [cards, setCards] = useState(null);
  const [error, setError] = useState('');
  const [typeFilter, setTypeFilter] = useState('الكل');
  const [speedFilter, setSpeedFilter] = useState('all');
  const [maxPrice, setMaxPrice] = useState(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetch('/api/visa/cards')
      .then((r) => r.json())
      .then(setCards)
      .catch(() => setError('تعذّر تحميل قائمة التأشيرات'));
  }, []);

  const countryCards = useMemo(() => {
    if (!cards) return [];
    return cards.filter((c) => String(c.country_id) === String(countryId));
  }, [cards, countryId]);

  const typeOptions = useMemo(() => ['الكل', ...new Set(countryCards.map((c) => c.visa_type_name_ar))], [countryCards]);
  const typeNameMap = useMemo(() => {
    const m = {};
    countryCards.forEach((c) => { m[c.visa_type_name_ar] = c.visa_type_name_en; });
    return m;
  }, [countryCards]);
  const priceBounds = useMemo(() => {
    const prices = countryCards.map((c) => Number(c.adult_price) || 0);
    return { min: prices.length ? Math.min(...prices) : 0, max: prices.length ? Math.max(...prices) : 0 };
  }, [countryCards]);
  const effectiveMaxPrice = maxPrice === null ? priceBounds.max : maxPrice;
  function speedBucket(days) {
    const n = Number(days) || 0;
    if (n <= 3) return 'fast';
    if (n <= 7) return 'normal';
    return 'slow';
  }
  const filtered = countryCards.filter((c) => {
    if (typeFilter !== 'الكل' && c.visa_type_name_ar !== typeFilter) return false;
    if (speedFilter !== 'all' && speedBucket(c.issuing_time_days) !== speedFilter) return false;
    if (Number(c.adult_price) > effectiveMaxPrice) return false;
    return true;
  });
  const country = countryCards[0];

  async function downloadCountryPdf() {
    setDownloading(true);
    try {
      const detailed = await Promise.all(
        filtered.map((c) => fetch(`/api/visa/cards/${c.id}`).then((r) => r.json()).catch(() => c))
      );
      const bodyHtml =
        '<h1>' + esc(nm(country.country_name_ar, country.country_name_en)) + '</h1>' +
        visaTableHtml(detailed, lang) +
        '<h2>' + (lang === 'en' ? 'Required documents:' : 'المستمسكات المطلوبة:') + '</h2>' +
        '<p class="docs">' + combinedDocsLine(detailed, lang) + '</p>';
      printDoc((lang === 'en' ? 'Visas — ' : 'تأشيرات ') + nm(country.country_name_ar, country.country_name_en), bodyHtml, lang);
    } finally {
      setDownloading(false);
    }
  }

  if (cards && countryCards.length === 0) {
    return (
      <div dir="rtl" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <SiteHeader active="التأشيرات" />
        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
            <p style={{ color: '#7b8087' }}>لم يتم العثور على تأشيرات لهذه الدولة.</p>
            <Link href="/visa" className="qa-btn qa-cyan" style={{ textDecoration: 'none' }}>← رجوع إلى التأشيرات</Link>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div dir="rtl" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <SiteHeader active="التأشيرات" />
      <main style={{ flex: 1 }}>
        <div className="qa-page qa-sec" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Link href="/visa" style={{ fontSize: 13.5, fontWeight: 600, color: '#036f8c', textDecoration: 'none', alignSelf: 'flex-start' }}>← رجوع إلى التأشيرات</Link>

          {error && <p style={{ color: '#d2324f', background: '#fdecef', border: '1px solid #f7c3cc', borderRadius: 10, padding: '12px 16px' }}>{error}</p>}

          {country && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <h1 style={{ fontSize: 'clamp(24px,2.6vw,34px)', margin: 0 }}>{filtered.length} تأشيرة متاحة لـ {nm(country.country_name_ar, country.country_name_en)}</h1>
                <button
                  type="button"
                  onClick={downloadCountryPdf}
                  disabled={downloading}
                  style={{ cursor: downloading ? 'not-allowed' : 'pointer', opacity: downloading ? 0.6 : 1, border: '1px solid #ececed', borderRadius: 999, padding: '10px 20px', fontSize: 14, fontWeight: 700, fontFamily: 'inherit', background: '#fff', color: '#036f8c' }}
                >
                  {downloading ? '...جارٍ التحضير' : <>تحميل PDF لكل تأشيرات {nm(country.country_name_ar, country.country_name_en)}</>}
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 260px', gap: 24, alignItems: 'start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {filtered.map((c) => {
                  const photo = c.image_url || c.card_image_url || '';
                  const theme = getVisaTheme(c.visa_type_name_ar);
                  return (
                  <div key={c.id} className="qa-card qa-visa-card" style={{ padding: 0, overflow: 'hidden', position: 'relative', display: 'grid', gridTemplateColumns: '140px 1fr', minHeight: 140 }}>
                    <div style={{ position: 'relative', height: '100%', minHeight: 140, background: theme.gradient, overflow: 'hidden' }}>
                      {photo ? (
                        <img src={photo} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <>
                          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(135deg, rgba(255,255,255,.07) 0 2px, transparent 2px 16px)' }} />
                          <Icon name={theme.icon} size={130} strokeWidth={1} style={{ position: 'absolute', insetInlineStart: -26, bottom: -30, color: 'rgba(255,255,255,.16)' }} />
                          <span style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
                            <span style={{ width: 68, height: 68, borderRadius: '50%', background: 'rgba(255,255,255,.14)', border: '2px solid rgba(255,255,255,.55)', display: 'grid', placeItems: 'center', boxShadow: '0 12px 26px rgba(1,42,55,.35)' }}>
                              {c.flag_code ? (
                                <img src={flagSrc(c.flag_code)} alt="" style={{ width: 50, height: 50, borderRadius: '50%', objectFit: 'cover' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                              ) : (
                                <span style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>{(c.country_name_en || '').slice(0, 2).toUpperCase()}</span>
                              )}
                            </span>
                          </span>
                        </>
                      )}
                      <button
                        type="button"
                        aria-label={lang === 'en' ? 'Save' : 'حفظ'}
                        style={{ position: 'absolute', top: 10, insetInlineStart: 10, width: 30, height: 30, borderRadius: '50%', border: 'none', cursor: 'pointer', background: 'rgba(1,20,28,.4)', display: 'grid', placeItems: 'center', backdropFilter: 'blur(3px)' }}
                      >
                        <Icon name="heart" size={15} style={{ color: '#fff' }} />
                      </button>
                      {providerHints && providerHints[c.id] && (
                        <span
                          style={{
                            position: 'absolute', bottom: 8, insetInlineStart: 8, zIndex: 2, fontSize: 10.5, fontWeight: 700, color: '#036f8c',
                            background: 'rgba(255,255,255,.96)', borderRadius: 999, padding: '3px 9px', boxShadow: '0 4px 10px rgba(1,42,55,.25)', whiteSpace: 'nowrap',
                          }}
                          title="مزود الخدمة — يظهر لفريق العمل فقط"
                        >
                          {providerHints[c.id]}
                        </span>
                      )}
                    </div>

                    <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: '1 1 240px', minWidth: 0 }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            <span style={{ ...pillStyle, fontSize: 11, padding: '3px 10px' }}>{nm(c.visa_type_name_ar, c.visa_type_name_en)}</span>
                            {c.stay_duration ? <span style={{ ...pillStyleOutline, fontSize: 11, padding: '3px 10px' }}>{nm(c.country_name_ar, c.country_name_en)}</span> : null}
                          </div>
                          <h3 style={{ margin: 0, fontSize: 15.5, fontWeight: 700, color: '#1d2733' }}>
                            {lang === 'en'
                              ? `${nm(c.country_name_ar, c.country_name_en)} visa${c.stay_duration ? ' for ' + c.stay_duration + ' stay' : ''}`
                              : `تأشيرة ${nm(c.country_name_ar, c.country_name_en)}${c.stay_duration ? ' لمدة ' + c.stay_duration : ''}`}
                          </h3>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: '#3d4650' }}>
                            <span style={{ width: 15, height: 15, borderRadius: '50%', background: '#d2324f', color: '#fff', display: 'grid', placeItems: 'center', flex: 'none', fontSize: 10, fontWeight: 800 }}>!</span>
                            {lang === 'en'
                              ? `Iraqi passport — you need a visa for ${nm(c.country_name_ar, c.country_name_en)}.`
                              : `بجواز عراقي! تحتاجون تأشيرة لدخول ${nm(c.country_name_ar, c.country_name_en)}.`}
                          </div>
                          <Link href={`/visa/${c.id}`} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: '#049dc5', fontWeight: 600, textDecoration: 'none' }}>
                            <Icon name="info" size={12} />
                            {lang === 'en' ? 'Click to see requirements' : 'اضغط لمعرفة المتطلبات'}
                          </Link>
                        </div>

                        <div style={{ background: '#f8fbfc', border: '1px solid #ececed', borderRadius: 14, padding: '12px 16px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flex: 'none', minWidth: 168 }}>
                          <span style={{ fontSize: 10, color: '#7b8087' }}>{lang === 'en' ? 'Travel visa provided' : 'التأشيرة السياحية متوفرة'}</span>
                          <span style={{ fontSize: 12, color: '#3d4650' }}>{formatPrice(c.child_price, 'IQD', lang)} <span style={{ color: '#7b8087', fontSize: 10.5 }}>{lang === 'en' ? '/ per child' : '/ للطفل'}</span></span>
                          <span style={{ fontSize: 18, fontWeight: 800, color: '#1d2733' }}>{formatPrice(c.adult_price, 'IQD', lang)}</span>
                          <span style={{ fontSize: 10.5, color: '#7b8087', marginTop: -4 }}>{lang === 'en' ? 'Total per adult' : 'الإجمالي للبالغ'}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, width: '100%', justifyContent: 'flex-end' }}>
                            <span title={lang === 'en' ? 'Requirements & info' : 'المتطلبات والمعلومات'} style={{ width: 26, height: 26, borderRadius: '50%', border: '1.5px solid #1d2733', display: 'grid', placeItems: 'center', flex: 'none' }}>
                              <Icon name="info" size={13} style={{ color: '#1d2733' }} />
                            </span>
                            <Link
                              href={`/visa/${c.id}`}
                              className="qa-btn qa-cyan"
                              style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', fontSize: 13, flex: 1, justifyContent: 'center' }}
                            >
                              {lang === 'en' ? 'View deal' : 'عرض العرض'}
                              <span style={{ width: 15, height: 15, borderRadius: '50%', background: 'rgba(255,255,255,.3)', display: 'grid', placeItems: 'center', flex: 'none' }}>
                                <Icon name="check" size={9} />
                              </span>
                            </Link>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 0, borderTop: '1px solid #f0f0f0', paddingTop: 10, flexWrap: 'wrap' }}>
                        {[
                          { icon: 'shield-check', label: lang === 'en' ? 'Type' : 'النوع', value: nm(c.visa_type_name_ar, c.visa_type_name_en) },
                          { icon: 'clock', label: lang === 'en' ? 'Issuance' : 'مدة الإصدار', value: c.issuing_time_days ? c.issuing_time_days + (lang === 'en' ? ' working days' : ' أيام عمل') : '—' },
                          { icon: 'calendar-check', label: lang === 'en' ? 'Validity' : 'الصلاحية', value: c.validity_before_travel || '—' },
                        ].map((s, i) => (
                          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '1 1 150px', padding: '2px 14px', borderInlineStart: i > 0 ? '1px solid #f0f0f0' : 'none' }}>
                            <span style={{ width: 27, height: 27, borderRadius: 8, background: '#eaf8fd', display: 'grid', placeItems: 'center', flex: 'none' }}>
                              <Icon name={s.icon} size={13} style={{ color: '#049dc5' }} />
                            </span>
                            <span style={{ display: 'flex', flexDirection: 'column', gap: 0, minWidth: 0 }}>
                              <span style={{ fontSize: 10, color: '#7b8087' }}>{s.label}</span>
                              <span style={{ fontSize: 12, fontWeight: 700, color: '#1d2733', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.value}</span>
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  );
                })}
                </div>

                <aside style={{ background: '#fff', border: '1px solid #ececed', borderRadius: 16, padding: 18, display: 'flex', flexDirection: 'column', gap: 20, position: 'sticky', top: 90 }}>
                  <h4 style={{ margin: 0, fontSize: 15, display: 'flex', alignItems: 'center', gap: 7 }}>
                    <Icon name="layout-grid" size={15} style={{ color: '#049dc5' }} />
                    {nm('الفلاتر', 'Filters')}
                  </h4>

                  {typeOptions.length > 2 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: '#7b8087' }}>{nm('نوع التأشيرة', 'Visa type')}</span>
                      {typeOptions.map((t) => (
                        <button
                          key={t}
                          onClick={() => setTypeFilter(t)}
                          style={{
                            cursor: 'pointer', textAlign: 'start', display: 'flex', alignItems: 'center', gap: 8,
                            border: 'none', background: 'none', padding: '5px 2px', fontFamily: 'inherit',
                            fontSize: 13.5, fontWeight: typeFilter === t ? 700 : 500, color: typeFilter === t ? '#049dc5' : '#3d4650',
                          }}
                        >
                          <span style={{ width: 14, height: 14, borderRadius: '50%', border: '1.5px solid ' + (typeFilter === t ? '#049dc5' : '#cacbcc'), display: 'grid', placeItems: 'center', flex: 'none' }}>
                            {typeFilter === t ? <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#049dc5' }} /> : null}
                          </span>
                          {t === 'الكل' ? nm('الكل', 'All') : nm(t, typeNameMap[t])}
                        </button>
                      ))}
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: '#7b8087' }}>{nm('سرعة الإصدار', 'Issuance speed')}</span>
                    {[
                      ['all', nm('الكل', 'All')],
                      ['fast', nm('سريعة (٣ أيام أو أقل)', 'Fast (≤3 days)')],
                      ['normal', nm('متوسطة (٤-٧ أيام)', 'Normal (4-7 days)')],
                      ['slow', nm('طويلة (٨ أيام فأكثر)', 'Slow (8+ days)')],
                    ].map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => setSpeedFilter(key)}
                        style={{
                          cursor: 'pointer', textAlign: 'start', display: 'flex', alignItems: 'center', gap: 8,
                          border: 'none', background: 'none', padding: '5px 2px', fontFamily: 'inherit',
                          fontSize: 13.5, fontWeight: speedFilter === key ? 700 : 500, color: speedFilter === key ? '#049dc5' : '#3d4650',
                        }}
                      >
                        <span style={{ width: 14, height: 14, borderRadius: '50%', border: '1.5px solid ' + (speedFilter === key ? '#049dc5' : '#cacbcc'), display: 'grid', placeItems: 'center', flex: 'none' }}>
                          {speedFilter === key ? <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#049dc5' }} /> : null}
                        </span>
                        {label}
                      </button>
                    ))}
                  </div>

                  {priceBounds.max > priceBounds.min && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: '#7b8087' }}>{nm('الحد الأقصى للسعر', 'Max price')}</span>
                      <input
                        type="range"
                        min={priceBounds.min}
                        max={priceBounds.max}
                        step={Math.max(1, Math.round((priceBounds.max - priceBounds.min) / 20))}
                        value={effectiveMaxPrice}
                        onChange={(e) => setMaxPrice(Number(e.target.value))}
                        style={{ width: '100%' }}
                      />
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#1d2733' }}>{formatPrice(effectiveMaxPrice, 'IQD', lang)}</span>
                    </div>
                  )}

                  {(typeFilter !== 'الكل' || speedFilter !== 'all' || maxPrice !== null) && (
                    <button
                      type="button"
                      onClick={() => { setTypeFilter('الكل'); setSpeedFilter('all'); setMaxPrice(null); }}
                      style={{ cursor: 'pointer', border: '1px solid #ececed', borderRadius: 999, padding: '8px 14px', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', background: '#fff', color: '#7b8087' }}
                    >
                      {nm('إعادة تعيين الفلاتر', 'Reset filters')}
                    </button>
                  )}
                </aside>
              </div>
            </>
          )}
        </div>
      </main>
      <SiteFooter />
      {cards == null && !error && <MascotLoader assetBase="/assets" />}
      {providerHints && (
        <div style={{ position: 'fixed', bottom: 18, insetInlineStart: 18, zIndex: 60, background: '#1d2733', color: '#fff', fontSize: 12.5, fontWeight: 700, borderRadius: 999, padding: '8px 16px', boxShadow: '0 10px 24px rgba(1,42,55,.3)' }}>
          ⌕ وضع الموظفين مفعّل — اكتب نفس الكلمة السرية للإخفاء
        </div>
      )}
      {providerDenied && (
        <div style={{ position: 'fixed', bottom: 18, insetInlineStart: 18, zIndex: 60, background: '#d2324f', color: '#fff', fontSize: 12.5, fontWeight: 700, borderRadius: 999, padding: '8px 16px', boxShadow: '0 10px 24px rgba(1,42,55,.3)' }}>
          غير مصرح لك بعرض هذه المعلومات
        </div>
      )}
    </div>
  );
}

const pillStyle = {
  fontSize: 12,
  fontWeight: 700,
  color: '#036f8c',
  background: '#eaf8fd',
  borderRadius: 999,
  padding: '4px 12px',
};
const pillStyleOutline = {
  fontSize: 12,
  fontWeight: 600,
  color: '#3d4650',
  background: '#fff',
  border: '1px solid #dbe1e6',
  borderRadius: 999,
  padding: '4px 12px',
};
