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
  const filtered = countryCards.filter((c) => typeFilter === 'الكل' || c.visa_type_name_ar === typeFilter);
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

              {typeOptions.length > 2 && (
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

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {filtered.map((c) => {
                  const photo = c.image_url || c.card_image_url || '';
                  const theme = getVisaTheme(c.visa_type_name_ar);
                  return (
                  <div key={c.id} className="qa-card qa-visa-card" style={{ padding: 0, overflow: 'hidden', position: 'relative', display: 'grid', gridTemplateColumns: '200px 1fr', minHeight: 180 }}>
                    <div style={{ position: 'relative', height: '100%', minHeight: 180, background: theme.gradient, overflow: 'hidden' }}>
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

                    <div style={{ padding: '22px 26px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: '1 1 280px', minWidth: 0 }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            <span style={pillStyle}>{nm(c.visa_type_name_ar, c.visa_type_name_en)}</span>
                            {c.stay_duration ? <span style={pillStyleOutline}>{nm(c.country_name_ar, c.country_name_en)}</span> : null}
                          </div>
                          <h3 style={{ margin: 0, fontSize: 19, fontWeight: 700, color: '#1d2733' }}>
                            {lang === 'en'
                              ? `${nm(c.country_name_ar, c.country_name_en)} visa${c.stay_duration ? ' for ' + c.stay_duration + ' stay' : ''}`
                              : `تأشيرة ${nm(c.country_name_ar, c.country_name_en)}${c.stay_duration ? ' لمدة ' + c.stay_duration : ''}`}
                          </h3>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#3d4650' }}>
                            <span style={{ width: 17, height: 17, borderRadius: '50%', background: '#d2324f', color: '#fff', display: 'grid', placeItems: 'center', flex: 'none', fontSize: 11, fontWeight: 800 }}>!</span>
                            {lang === 'en'
                              ? `Iraqi passport — you need a visa for ${nm(c.country_name_ar, c.country_name_en)}.`
                              : `بجواز عراقي! تحتاجون تأشيرة لدخول ${nm(c.country_name_ar, c.country_name_en)}.`}
                          </div>
                          <Link href={`/visa/${c.id}`} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: '#049dc5', fontWeight: 600, textDecoration: 'none' }}>
                            <Icon name="info" size={13} />
                            {lang === 'en' ? 'Click to see requirements' : 'اضغط لمعرفة المتطلبات'}
                          </Link>
                        </div>

                        <div style={{ background: '#f8fbfc', border: '1px solid #ececed', borderRadius: 16, padding: '16px 20px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flex: 'none', minWidth: 190 }}>
                          <span style={{ fontSize: 11, color: '#7b8087' }}>{lang === 'en' ? 'Travel visa provided' : 'التأشيرة السياحية متوفرة'}</span>
                          <span style={{ fontSize: 13.5, color: '#3d4650' }}>{formatPrice(c.child_price, 'IQD', lang)} <span style={{ color: '#7b8087', fontSize: 11.5 }}>{lang === 'en' ? '/ per child' : '/ للطفل'}</span></span>
                          <span style={{ fontSize: 22, fontWeight: 800, color: '#1d2733' }}>{formatPrice(c.adult_price, 'IQD', lang)}</span>
                          <span style={{ fontSize: 11.5, color: '#7b8087', marginTop: -4 }}>{lang === 'en' ? 'Total per adult' : 'الإجمالي للبالغ'}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, width: '100%', justifyContent: 'flex-end' }}>
                            <span title={lang === 'en' ? 'Requirements & info' : 'المتطلبات والمعلومات'} style={{ width: 30, height: 30, borderRadius: '50%', border: '1.5px solid #1d2733', display: 'grid', placeItems: 'center', flex: 'none' }}>
                              <Icon name="info" size={14} style={{ color: '#1d2733' }} />
                            </span>
                            <Link
                              href={`/visa/${c.id}`}
                              className="qa-btn qa-cyan"
                              style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 22px', flex: 1, justifyContent: 'center' }}
                            >
                              {lang === 'en' ? 'View deal' : 'عرض العرض'}
                              <span style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(255,255,255,.3)', display: 'grid', placeItems: 'center', flex: 'none' }}>
                                <Icon name="check" size={11} />
                              </span>
                            </Link>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 0, borderTop: '1px solid #f0f0f0', paddingTop: 14, flexWrap: 'wrap' }}>
                        {[
                          { icon: 'shield-check', label: lang === 'en' ? 'Type' : 'النوع', value: nm(c.visa_type_name_ar, c.visa_type_name_en) },
                          { icon: 'clock', label: lang === 'en' ? 'Issuance' : 'مدة الإصدار', value: c.issuing_time_days ? c.issuing_time_days + (lang === 'en' ? ' working days' : ' أيام عمل') : '—' },
                          { icon: 'calendar-check', label: lang === 'en' ? 'Validity' : 'الصلاحية', value: c.validity_before_travel || '—' },
                        ].map((s, i, arr) => (
                          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 10, flex: '1 1 180px', padding: '4px 18px', borderInlineStart: i > 0 ? '1px solid #f0f0f0' : 'none' }}>
                            <span style={{ width: 34, height: 34, borderRadius: 10, background: '#eaf8fd', display: 'grid', placeItems: 'center', flex: 'none' }}>
                              <Icon name={s.icon} size={16} style={{ color: '#049dc5' }} />
                            </span>
                            <span style={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }}>
                              <span style={{ fontSize: 11, color: '#7b8087' }}>{s.label}</span>
                              <span style={{ fontSize: 13.5, fontWeight: 700, color: '#1d2733', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.value}</span>
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  );
                })}
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
