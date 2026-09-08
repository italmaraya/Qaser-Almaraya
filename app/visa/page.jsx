'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

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
    <div dir="rtl" style={{ fontFamily: "'IBM Plex Sans Arabic', system-ui, sans-serif", minHeight: '100vh', background: '#f8f7f8' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '48px 20px' }}>
        <h1 style={{ color: '#049dc5', fontSize: 32, marginBottom: 8 }}>خدمات التأشيرات</h1>
        <p style={{ color: '#7b8087', marginBottom: 32 }}>اختر الدولة ونوع التأشيرة لبدء طلبك.</p>

        {error && <p style={{ color: '#d2324f' }}>{error}</p>}
        {cards == null && !error && <p>...جارٍ التحميل</p>}
        {cards && cards.length === 0 && <p style={{ color: '#7b8087' }}>لا توجد تأشيرات متاحة حاليًا.</p>}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 20 }}>
          {(cards || []).map((c) => (
            <Link
              key={c.id}
              href={`/visa/${c.id}`}
              style={{
                textDecoration: 'none',
                color: 'inherit',
                background: '#fff',
                border: '1px solid #ececed',
                borderRadius: 16,
                padding: 22,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                boxShadow: '0 2px 8px rgba(29,39,51,.06)',
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 700, color: '#faab18' }}>{c.visa_type_name_ar}</span>
              <h3 style={{ margin: 0, fontSize: 20, color: '#1d2733' }}>{c.country_name_ar}</h3>
              <span style={{ fontSize: 14, color: '#7b8087' }}>مدة الإصدار: {c.issuing_time_days || '—'} يوم</span>
              <span style={{ fontSize: 18, fontWeight: 700, color: '#049dc5', marginTop: 6 }}>{c.adult_price} د.ع للبالغ</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
