import Link from 'next/link';
import SiteHeader from '../components/SiteHeader';
import SiteFooter from '../components/SiteFooter';
import { waLink } from '../lib/whatsapp';

export const metadata = { title: 'الصفحة غير موجودة | قصر المرايا للسفر والسياحة', robots: { index: false } };

// Arabic "page not found" with the main ways forward, instead of the English default.
export default function NotFound() {
  return (
    <>
      <SiteHeader active="" />
      <main className="qa-sec" style={{ minHeight: '55vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, textAlign: 'center' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/mascot-skylo-questions-cut.webp" alt="" width="220" height="191" style={{ width: 220, height: 'auto' }} />
        <h1 style={{ fontSize: 34, fontWeight: 700 }}>عذراً، هذه الصفحة غير موجودة</h1>
        <p style={{ fontSize: 17, color: 'var(--qs-body,#3d4650)', maxWidth: 520, lineHeight: 1.7 }}>ربما تغيّر الرابط أو انتهت هذه الباقة. اختر من الأقسام التالية أو تواصل معنا مباشرة.</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
          <Link href="/packages" className="qa-btn qa-cyan">الباقات</Link>
          <Link href="/visa" className="qa-btn qa-cyan">التأشيرات</Link>
          <Link href="/" className="qa-btn" style={{ background: '#fff', color: 'var(--qs-brand-deep,#036f8c)', border: '1px solid #cfe9f2' }}>الرئيسية</Link>
          <a href={waLink('مرحباً قصر المرايا، أحتاج مساعدة.')} target="_blank" rel="noopener" className="qa-btn qa-amber" style={{ color: 'var(--qs-ink,#012a37)' }}>واتساب</a>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
