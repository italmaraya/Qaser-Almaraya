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
                {filtered.map((c) => (
                  <div key={c.id} className="qa-card" style={{ padding: 0, overflow: 'hidden', display: 'grid', gridTemplateColumns: '200px 1fr', minHeight: 160 }}>
                    <div style={{ position: 'relative', background: 'linear-gradient(135deg,#0e6f8f,#049dc5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {providerHints && providerHints[c.id] && (
                        <span
                          style={{
                            position: 'absolute',
                            top: 8,
                            insetInlineStart: 8,
                            zIndex: 2,
                            fontSize: 10.5,
                            fontWeight: 700,
                            color: '#036f8c',
                            background: 'rgba(255,255,255,.96)',
                            borderRadius: 999,
                            padding: '3px 9px',
                            boxShadow: '0 4px 10px rgba(1,42,55,.25)',
                            whiteSpace: 'nowrap',
                          }}
                          title="مزود الخدمة — يظهر لفريق العمل فقط"
                        >
                          {providerHints[c.id]}
                        </span>
                      )}
                      {c.flag_code ? (
                        <span style={{ width: 60, height: 60, borderRadius: '50%', border: '2px dashed rgba(255,255,255,.6)', display: 'grid', placeItems: 'center' }}>
                          <img src={flagSrc(c.flag_code)} alt="" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                        </span>
                      ) : (
                        <span style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>{(c.country_name_en || '').slice(0, 2).toUpperCase()}</span>
                      )}
                    </div>
                    <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        <span style={pillStyle}>{nm(c.visa_type_name_ar, c.visa_type_name_en)}</span>
                        {c.stay_duration ? <span style={pillStyle}>إقامة {c.stay_duration}</span> : null}
                      </div>
                      <h3 style={{ margin: 0, fontSize: 19, color: '#1d2733' }}>{nm(c.visa_type_name_ar, c.visa_type_name_en)} — {nm(c.country_name_ar, c.country_name_en)}</h3>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, fontSize: 13.5, color: '#3d4650' }}>
                        <span>مدة الإصدار: {c.issuing_time_days || '—'} أيام عمل</span>
                        {c.validity_before_travel ? <span>صلاحية قبل السفر: {c.validity_before_travel}</span> : null}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginTop: 4 }}>
                        <div>
                          <div style={{ fontSize: 20, fontWeight: 700, color: '#049dc5' }}>{formatPrice(c.adult_price, 'IQD', lang)}</div>
                          <div style={{ fontSize: 12.5, color: '#7b8087' }}>للبالغ · {formatPrice(c.child_price, 'IQD', lang)} للطفل</div>
                        </div>
                        <Link href={`/visa/${c.id}`} className="qa-btn qa-cyan" style={{ textDecoration: 'none' }}>عرض التفاصيل</Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
      <SiteFooter />
      {cards == null && !error && <MascotLoader assetBase="/assets" />}
      {providerHints && (
        <div style={{ position: 'fixed', bottom: 18, insetInlineStart: 18, zIndex: 60, background: '#1d2733', color: '#fff', fontSize: 12.5, fontWeight: 700, borderRadius: 999, padding: '8px 16px', boxShadow: '0 10px 24px rgba(1,42,55,.3)' }}>
          ⌕ وضع الموظفين مفعّل — Ctrl+Shift+P للإخفاء
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
