'use client';
import { openWhatsApp } from '../lib/whatsapp';

export const WA_ICON = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12.04 2a9.9 9.9 0 0 0-8.5 14.98L2 22l5.16-1.5A9.93 9.93 0 1 0 12.04 2zm0 18.1a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.06.89.9-2.98-.2-.31a8.2 8.2 0 1 1 6.84 3.73zm4.5-6.14c-.25-.12-1.46-.72-1.69-.8-.23-.09-.39-.13-.56.12-.16.25-.64.8-.79.97-.14.16-.29.19-.54.06a6.7 6.7 0 0 1-3.34-2.92c-.25-.43.25-.4.72-1.34.08-.16.04-.3-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.41-.56-.42h-.48a.92.92 0 0 0-.66.31 2.78 2.78 0 0 0-.87 2.07 4.83 4.83 0 0 0 1.01 2.56 11.05 11.05 0 0 0 4.23 3.74c1.58.68 2.2.74 2.99.62.48-.07 1.46-.6 1.67-1.18.2-.58.2-1.07.14-1.18-.06-.1-.22-.16-.47-.28z" />
  </svg>
);

// Green WhatsApp button. `getMessage` is called on click so the text always
// reflects what the customer has selected at that moment.
export default function WhatsAppButton({ getMessage, label, style }) {
  return (
    <button
      type="button"
      onClick={() => openWhatsApp(getMessage())}
      className="qa-btn"
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, background: '#25d366', color: '#fff', border: 0, fontWeight: 700, ...style }}
    >
      {WA_ICON}
      <span>{label}</span>
    </button>
  );
}
