'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import SiteHeader from '../../components/SiteHeader';
import SiteFooter from '../../components/SiteFooter';
import MascotLoader from '../../components/MascotLoader';

export default function VisaBrowsePage() {
  const [cards, setCards] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/visa/cards')
      .then((r) => r.json())
      .then(setCards)
      .catch(() => setError('تعذّر تحميل قائمة التأشيرات'));
  }, []);

  return (
    <div dir="rtl" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <SiteHeader active="التأشيرات" />
      <main style={{ flex: 1 }}>
        <div className="qa-page">
          <section className="qa-sec" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: '.02em', color: '#faab18' }}>VISA SERVICES</span>
            <h1 style={{ fontSize: 'clamp(28px,3vw,44px)' }}>خدمات التأشيرات</h1>
            <p style={{ color: '#7b8087', fontSize: 17, maxWidth: 640 }}>اختر الدولة ونوع التأشيرة لبدء طلبك — نتابع معك من التقديم حتى استلام التأشيرة.</p>
          </section>

          <section className="qa-sec" style={{ paddingTop: 0 }}>
            {error && (
              <p style={{ color: '#d2324f', background: '#fdecef', border: '1px solid #f7c3cc', borderRadius: 10, padding: '12px 16px' }}>{error}</p>
            )}
            {cards && cards.length === 0 && (
              <div className="qa-card" style={{ textAlign: 'center', padding: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <img src="/assets/mascot-skylo-tours.webp" alt="" style={{ height: 120, width: 'auto' }} />
                <p style={{ color: '#7b8087', margin: 0 }}>لا توجد تأشيرات متاحة حاليًا — تواصل معنا وسنساعدك في ترتيب رحلتك.</p>
                <Link href="/#contact" className="qa-btn qa-cyan" style={{ textDecoration: 'none' }}>تواصل معنا</Link>
              </div>
            )}

            <div className="qa-grid">
              {(cards || []).map((c) => (
                <Link
                  key={c.id}
                  href={`/visa/${c.id}`}
                  className="qa-card"
                  style={{
                    textDecoration: 'none',
                    color: 'inherit',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                    transition: 'transform .2s cubic-bezier(.16,1,.3,1), box-shadow .2s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {c.flag_code ? (
                      <img
                        src={`/assets/flags/${c.flag_code}.png`}
                        alt=""
                        style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', border: '1px solid #ececed', flex: 'none' }}
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    ) : null}
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#faab18' }}>{c.visa_type_name_ar}</span>
                  </div>
                  <h3 style={{ margin: 0, fontSize: 21, color: '#1d2733' }}>{c.country_name_ar}</h3>
                  <span style={{ fontSize: 14, color: '#7b8087' }}>مدة الإصدار: {c.issuing_time_days || '—'} يوم</span>
                  <span style={{ fontSize: 19, fontWeight: 700, color: '#049dc5', marginTop: 4 }}>{c.adult_price} د.ع للبالغ</span>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </main>
      <SiteFooter />
      {cards == null && !error && <MascotLoader assetBase="/assets" />}
    </div>
  );
}
