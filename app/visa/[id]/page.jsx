'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import SiteHeader from '../../../components/SiteHeader';
import SiteFooter from '../../../components/SiteFooter';
import MascotLoader from '../../../components/MascotLoader';
import { printDoc, visaTableHtml, combinedDocsLine, esc } from '../../../lib/printDoc';
import { useLangToggle } from '../../../lib/i18n';
import { formatPrice } from '../../../lib/currency';
import { flagSrc } from '../../../lib/flags';

const WHY_US = [
  'مراجعة كاملة لمستنداتك قبل التقديم',
  'متابعة حالة الطلب حتى الإصدار',
  'دعم مباشر على واتساب طوال الوقت',
];

export default function VisaDetailPage() {
  const { lang } = useLangToggle();
  const nm = (ar, en) => (lang === 'en' && en ? en : ar);
  const { id } = useParams();
  const [card, setCard] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/visa/cards/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError('تعذّر تحميل بيانات التأشيرة');
        else setCard(data);
      })
      .catch(() => setError('تعذّر تحميل بيانات التأشيرة'));
  }, [id]);

  if (error) {
    return (
      <div dir="rtl" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <SiteHeader active="التأشيرات" />
        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
            <p style={{ color: '#d2324f', background: '#fdecef', border: '1px solid #f7c3cc', borderRadius: 10, padding: '14px 20px' }}>{error}</p>
            <Link href="/visa" className="qa-btn qa-cyan" style={{ textDecoration: 'none' }}>← رجوع إلى التأشيرات</Link>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }
  if (!card) {
    return (
      <div dir="rtl" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <SiteHeader active="التأشيرات" />
        <main style={{ flex: 1 }} />
        <SiteFooter />
        <MascotLoader assetBase="/assets" />
      </div>
    );
  }

  const included = [
    { label: 'نحجز لك موعداً في السفارة', on: !!card.needs_appointment },
    { label: 'تستلم ملف التأشيرة للتحميل', on: !!card.delivers_visa_file },
    { label: 'نجهّز الأوراق: الاستمارة والحجوزات والتأمين والترجمة', on: !!card.prepares_papers },
    { label: 'نستلم جوازك ونعيده لاحقاً', on: !!card.collects_passport },
    { label: 'النتيجة مضمونة', on: !!card.result_guaranteed },
  ];

  const requiredDocs = (card.documents || []).filter((d) => d.required);
  const optionalDocs = (card.documents || []).filter((d) => !d.required);

  return (
    <div dir="rtl" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <SiteHeader active="التأشيرات" />
      <main style={{ flex: 1 }}>
        <div className="qa-page">
          <div className="qa-sec" style={{ paddingBottom: 0 }}>
            <Link href={`/visa/country/${card.country_id}`} style={{ fontSize: 13.5, fontWeight: 600, color: '#036f8c', textDecoration: 'none' }}>← رجوع</Link>
          </div>

          <section className="qa-sec qa-2col" style={{ display: 'grid', gridTemplateColumns: 'minmax(240px,320px) 1fr', gap: 28, alignItems: 'flex-start' }}>
            <div className="qa-card qa-visa-side" style={{ position: 'sticky', top: 90, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <h3 style={{ margin: 0, fontSize: 19 }}>{nm(card.visa_type_name_ar, card.visa_type_name_en)} — {nm(card.country_name_ar, card.country_name_en)}</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#7b8087' }}>مدة الإقامة</span><span>{card.stay_duration || '—'}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#7b8087' }}>مدة الإصدار</span><span>{card.issuing_time_days || '—'} أيام عمل</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#7b8087' }}>صلاحية قبل السفر</span><span>{card.validity_before_travel || '—'}</span></div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #ececed', paddingTop: 12 }}>
                <div>
                  <div style={{ fontSize: 12, color: '#7b8087' }}>البالغ</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#049dc5' }}>{formatPrice(card.adult_price, 'IQD', lang)}</div>
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 12, color: '#7b8087' }}>الطفل</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#049dc5' }}>{formatPrice(card.child_price, 'IQD', lang)}</div>
                </div>
              </div>
              <Link href={`/visa/${id}/apply`} className="qa-btn qa-cyan" style={{ textAlign: 'center', textDecoration: 'none' }}>ابدأ الآن</Link>
              <button
                type="button"
                onClick={() => {
                  const bodyHtml =
                    '<h1>' + esc(nm(card.country_name_ar, card.country_name_en)) + '</h1>' +
                    visaTableHtml([card], lang) +
                    '<h2>' + (lang === 'en' ? 'Required documents:' : 'المستمسكات المطلوبة:') + '</h2>' +
                    '<p class="docs">' + combinedDocsLine([card], lang) + '</p>';
                  printDoc(nm(card.visa_type_name_ar, card.visa_type_name_en) + ' — ' + nm(card.country_name_ar, card.country_name_en), bodyHtml, lang);
                }}
                style={{ cursor: 'pointer', border: '1px solid #ececed', borderRadius: 999, padding: '10px 20px', fontSize: 14, fontWeight: 700, fontFamily: 'inherit', background: '#fff', color: '#036f8c', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                تحميل PDF لهذه التأشيرة
              </button>
              <span style={{ fontSize: 12, color: '#7b8087', textAlign: 'center' }}>السعر بالدينار العراقي، ويُثبَّت عند تقديم الطلب.</span>

              <div style={{ background: 'linear-gradient(135deg,#0e6f8f,#049dc5)', borderRadius: 14, padding: 18, color: '#fff', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <h4 style={{ margin: 0, fontSize: 15, color: '#fff' }}>لماذا قصر المرايا؟</h4>
                {WHY_US.map((w, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(255,255,255,.2)', fontSize: 11, fontWeight: 700, display: 'grid', placeItems: 'center', flex: 'none' }}>{i + 1}</span>
                    <span style={{ fontSize: 13, lineHeight: 1.5 }}>{w}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ position: 'relative', height: 220, borderRadius: 20, overflow: 'hidden', background: 'linear-gradient(135deg,#34bbe1,#049dc5)', display: 'flex', alignItems: 'flex-end', padding: 20 }}>
                {card.flag_code ? (
                  <img
                    src={flagSrc(card.flag_code)}
                    alt=""
                    style={{ position: 'absolute', top: 20, right: 20, width: 52, height: 52, borderRadius: '50%', border: '2px solid #fff', objectFit: 'cover' }}
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                ) : null}
                <div>
                  <h1 style={{ margin: 0, fontSize: 30, color: '#fff' }}>{nm(card.country_name_ar, card.country_name_en)}</h1>
                  <span style={{ fontSize: 14.5, color: 'rgba(255,255,255,.9)' }}>{nm(card.visa_type_name_ar, card.visa_type_name_en)} · إقامة {card.stay_duration || '—'}</span>
                </div>
              </div>

              <div className="qa-card">
                <h4 style={{ margin: '0 0 14px' }}>بطاقة التأشيرة</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12 }}>
                  {[
                    ['الدولة', nm(card.country_name_ar, card.country_name_en)],
                    ['النوع', nm(card.visa_type_name_ar, card.visa_type_name_en)],
                    ['مدة الإقامة', card.stay_duration || '—'],
                    ['سعر البالغ', Number(card.adult_price).toLocaleString() + ' د.ع'],
                    ['صلاحية قبل السفر', card.validity_before_travel || '—'],
                    ['مدة الإصدار', (card.issuing_time_days || '—') + ' أيام عمل'],
                    ['سعر الطفل', Number(card.child_price).toLocaleString() + ' د.ع'],
                  ].map(([label, value]) => (
                    <div key={label} style={{ border: '1px solid #ececed', borderRadius: 10, padding: '12px 14px' }}>
                      <div style={{ fontSize: 12, color: '#7b8087' }}>{label}</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#1d2733' }}>{value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {included.some((f) => f.on) && (
                <div className="qa-card">
                  <h4 style={{ margin: '0 0 14px' }}>ما يشمله هذا النوع</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {included.filter((f) => f.on).map((f) => (
                      <div key={f.label} className="qa-feat-row" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ flex: 'none', color: '#049dc5', fontWeight: 700 }}>✓</span>
                        <span style={{ fontSize: 14.5, color: '#1d2733' }}>{f.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {(card.documents || []).length > 0 && (
                <div className="qa-card">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <h4 style={{ margin: 0 }}>المستندات المطلوبة</h4>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#036f8c', background: '#eaf8fd', borderRadius: 999, padding: '4px 12px' }}>{card.documents.length} بند</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[...requiredDocs, ...optionalDocs].map((d) => (
                      <div key={d.id} className="qa-doc-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderBottom: '1px solid #f4f4f4', paddingBottom: 10 }}>
                        <div>
                          <div style={{ fontSize: 14.5, color: '#1d2733' }}>{d.name_ar}</div>
                          <div style={{ fontSize: 12, color: '#7b8087' }}>{d.kind === 'file' ? 'رفع ملف' : d.kind === 'photo' ? 'رفع صورة' : 'إجابة'} · {d.audience === 'adults' ? 'البالغين' : d.audience === 'children' ? 'الأطفال' : 'الجميع'}</div>
                        </div>
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            borderRadius: 999,
                            padding: '4px 12px',
                            color: d.required ? '#a06a00' : '#7b8087',
                            background: d.required ? '#fef3dc' : '#f4f4f4',
                            flex: 'none',
                          }}
                        >
                          {d.required ? 'مطلوب' : 'اختياري'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
