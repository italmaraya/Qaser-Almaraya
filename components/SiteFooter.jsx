import PaymentBadges from './PaymentBadges';

export default function SiteFooter() {
  return (
    <footer style={{ background: '#049dc5', color: 'rgba(255,255,255,.95)' }}>
      <div
        className="qa-foot"
        style={{ maxWidth: 1240, margin: '0 auto', padding: '24px 32px 16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(196px,1fr))', gap: '28px 24px', alignItems: 'start' }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ position: 'relative', alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 14 }}>
            <span
              style={{
                position: 'relative',
                flex: 'none',
                width: 78,
                height: 78,
                borderRadius: '50%',
                background: '#fff',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <img src="/assets/logo-mark-tight.webp" alt="قصر المرايا" style={{ width: 56, height: 56, objectFit: 'contain' }} />
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <p style={{ fontSize: 22, fontWeight: 700, color: '#fff', margin: 0, lineHeight: 1.3 }}>رحلتك تبدأ وياّنا</p>
              <span style={{ width: 56, height: 3, borderRadius: 2, background: '#faab18' }} />
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h4 style={{ fontSize: 18, color: '#fff', margin: 0 }}>للتواصل</h4>
          <a href="tel:009647749999600" dir="ltr" style={{ fontSize: 16, whiteSpace: 'nowrap', color: 'rgba(255,255,255,.9)', textDecoration: 'none' }}>00964-774-9999-600</a>
          <a href="tel:009647849999600" dir="ltr" style={{ fontSize: 16, whiteSpace: 'nowrap', color: 'rgba(255,255,255,.9)', textDecoration: 'none' }}>00964-784-9999-600</a>
          <a href="mailto:sales@almarayagroup.com" style={{ fontSize: 16, color: 'rgba(255,255,255,.9)', textDecoration: 'none' }}>sales@almarayagroup.com</a>
          <span style={{ fontSize: 16, lineHeight: 1.6 }}>العراق: شارع 14 رمضان، بغداد</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h4 style={{ fontSize: 18, color: '#fff', margin: 0 }}>تحتاج مساعدة؟</h4>
          <span style={{ fontSize: 16, lineHeight: 1.7, color: 'rgba(255,255,255,.85)' }}>الرقم المختصر 6393 — فريقنا جاهز لخدمتك بكل احترافية وسرعة.</span>
        </div>
        <PaymentBadges />
      </div>
      <div style={{ borderTop: '1px solid rgba(255,255,255,.2)', textAlign: 'center', padding: '14px 20px', fontSize: 14, color: 'rgba(255,255,255,.8)' }}>
        © 2026 قصر المرايا للسفر و السياحة — رقم الإجازة 784 — جميع الحقوق محفوظة
      </div>
    </footer>
  );
}
