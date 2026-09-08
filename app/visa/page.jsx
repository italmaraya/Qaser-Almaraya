'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import SiteHeader from '../../components/SiteHeader';
import SiteFooter from '../../components/SiteFooter';
import MascotLoader from '../../components/MascotLoader';

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
  const [cards, setCards] = useState(null);
  const [error, setError] = useState('');
  const [typeFilter, setTypeFilter] = useState('الكل');
  const [destination, setDestination] = useState('');
  const [adultCount, setAdultCount] = useState(1);
  const [childCount, setChildCount] = useState(0);

  useEffect(() => {
    fetch('/api/visa/cards')
      .then((r) => r.json())
      .then(setCards)
      .catch(() => setError('تعذّر تحميل قائمة التأشيرات'));
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

  return (
    <div dir="rtl" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <SiteHeader active="التأشيرات" />
      <main style={{ flex: 1 }}>
        <div className="qa-page">
          <section style={{ position: 'relative', background: 'linear-gradient(135deg,#34bbe1 0%,#049dc5 100%)', paddingBottom: 90 }}>
            <div className="qa-sec" style={{ paddingBottom: 0, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end', textAlign: 'right' }}>
              <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: '.06em', color: '#fff' }}>VISAS</span>
              <h1 style={{ margin: 0, fontSize: 'clamp(30px,3.4vw,56px)', color: '#fff' }}>التأشيرات</h1>
              <p style={{ margin: 0, fontSize: 17, lineHeight: 1.7, color: 'rgba(255,255,255,.92)', maxWidth: 620 }}>
                اختر الدولة من الشريط أدناه لتظهر لك نوع التأشيرة ورسومها ومدة الإنجاز والمستندات المطلوبة.
              </p>
            </div>

            <div className="qa-sec" style={{ paddingTop: 32, paddingBottom: 0 }}>
              <div style={{ position: 'relative', background: '#fff', borderRadius: 24, boxShadow: '0 24px 50px rgba(1,42,55,.28)', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 26px', borderBottom: '1px solid #ececed' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#7b8087', letterSpacing: '.04em' }}>QASER · ALMARAYA</span>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <span style={{ fontSize: 17, fontWeight: 700, color: '#1d2733' }}>طلب تأشيرة</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#7b8087', letterSpacing: '.06em' }}>VISA REQUEST</span>
                  </div>
                </div>
                <form onSubmit={goSearch} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 20, padding: '24px 26px' }}>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 6, textAlign: 'right' }}>
                    <span style={{ fontSize: 13, color: '#7b8087' }}>إلى أين تسافر؟</span>
                    <select
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      style={{ fontFamily: 'inherit', fontSize: 17, fontWeight: 700, color: '#1d2733', border: 0, background: 'transparent', padding: '4px 0' }}
                    >
                      <option value="">اختر دولة</option>
                      {countries.map((c) => (
                        <option key={c.country_id} value={c.country_id}>{c.country_name_ar}</option>
                      ))}
                    </select>
                    <span style={{ fontSize: 12, color: '#7b8087' }}>{selectedCountry ? selectedCountry.typeNames.join('، ') : 'بلد التقديم'}</span>
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 6, textAlign: 'right' }}>
                    <span style={{ fontSize: 13, color: '#7b8087' }}>تاريخ السفر المتوقع</span>
                    <input type="date" style={{ fontFamily: 'inherit', fontSize: 15, border: 0, color: '#1d2733', padding: '4px 0' }} />
                    <span style={{ fontSize: 12, color: '#7b8087' }}>الإصدار من {selectedCountry ? Math.round(selectedCountry.minIssuing) : '٣'} أيام عمل</span>
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, textAlign: 'right' }}>
                    <span style={{ fontSize: 13, color: '#7b8087' }}>عدد المسافرين</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button type="button" onClick={() => setAdultCount((n) => Math.max(0, n - 1))} style={stepperBtn}>−</button>
                      <span style={{ fontSize: 16, fontWeight: 700, minWidth: 14, textAlign: 'center' }}>{adultCount}</span>
                      <button type="button" onClick={() => setAdultCount((n) => n + 1)} style={stepperBtn}>+</button>
                      <span style={{ fontSize: 13, color: '#7b8087' }}>بالغ</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button type="button" onClick={() => setChildCount((n) => Math.max(0, n - 1))} style={stepperBtn}>−</button>
                      <span style={{ fontSize: 16, fontWeight: 700, minWidth: 14, textAlign: 'center' }}>{childCount}</span>
                      <button type="button" onClick={() => setChildCount((n) => n + 1)} style={stepperBtn}>+</button>
                      <span style={{ fontSize: 13, color: '#7b8087' }}>طفل</span>
                    </div>
                  </div>
                </form>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, padding: '18px 26px', background: '#f8fdfe' }}>
                  <button type="submit" onClick={goSearch} disabled={!selectedCountry} className="qa-btn qa-cyan" style={{ opacity: selectedCountry ? 1 : 0.5, cursor: selectedCountry ? 'pointer' : 'not-allowed' }}>
                    عرض التفاصيل
                  </button>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: 13, color: '#7b8087' }}>الإجمالي التقديري</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: '#049dc5' }}>{estimatedTotal != null ? estimatedTotal.toLocaleString() : '—'} د.ع</div>
                  </div>
                </div>
              </div>
            </div>
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
                    {t}
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
                          من {Number(c.minPrice).toLocaleString()} د.ع
                        </span>
                        {c.flag_code ? (
                          <img src={`/assets/flags/${c.flag_code}.png`} alt="" style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid #fff', objectFit: 'cover' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                        ) : (
                          <span style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,.3)' }} />
                        )}
                      </div>
                      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: 17, fontWeight: 700, color: '#1d2733' }}>{c.country_name_ar}</span>
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#7b8087' }}>{(c.flag_code || '').toUpperCase()}</span>
                        </div>
                        <span style={{ fontSize: 13, color: '#7b8087' }}>{c.typeNames.length === 1 ? 'نوع واحد' : c.typeNames.length + ' أنواع'}: {c.typeNames.join('، ')}</span>
                        <span style={{ fontSize: 12.5, color: '#7b8087' }}>الإصدار من {Math.round(c.minIssuing)} {c.minIssuing < 3 ? 'ساعة' : 'أيام عمل'}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </section>
        </div>
      </main>
      <SiteFooter />
      {cards == null && !error && <MascotLoader assetBase="/assets" />}
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
