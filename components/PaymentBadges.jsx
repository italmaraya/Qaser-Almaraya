export default function PaymentBadges({ assetBase = '/assets' }) {
  const chip = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: 34,
    padding: '0 12px',
    borderRadius: 8,
    background: '#fff',
    boxShadow: '0 2px 6px rgba(1,42,55,.12)',
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span style={{ fontSize: 12.5, fontWeight: 700, color: 'rgba(255,255,255,.85)' }}>طرق الدفع</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <span style={chip} title="Mastercard" aria-label="Mastercard">
          <svg width="34" height="20" viewBox="0 0 34 20" aria-hidden="true">
            <circle cx="13" cy="10" r="9" fill="#EB001B" />
            <circle cx="21" cy="10" r="9" fill="#F79E1B" />
            <path d="M17 3.3a9 9 0 0 1 0 13.4 9 9 0 0 1 0-13.4Z" fill="#FF5F00" />
          </svg>
        </span>
        <span style={{ ...chip, fontWeight: 800, fontSize: 13, gap: 1, color: '#5b0e91', fontFamily: 'inherit' }} title="ZainCash" aria-label="ZainCash">
          <span style={{ color: '#5b0e91' }}>Zain</span>
          <span style={{ color: '#f7941d' }}>Cash</span>
        </span>
        <span style={chip} title="اقساطي" aria-label="اقساطي">
          <img src={`${assetBase}/payment-aqsati.png`} alt="اقساطي" style={{ height: 22, width: 'auto', objectFit: 'contain' }} />
        </span>
      </div>
    </div>
  );
}
