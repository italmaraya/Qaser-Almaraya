import './site.css';
import MobileBottomBar from '../components/MobileBottomBar';
import LiveChat from '../components/LiveChat';
import AirportChime from '../components/AirportChime';
import PlaneTransition from '../components/PlaneTransition';
import { SITE_URL, DEFAULT_OG, ORG_JSON_LD } from '../lib/seo';

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#049dc5',
};

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'قصر المرايا للسفر و السياحة | Qaser Almaraya for Travel & Tourism',
  description: 'حجوزات الطيران، الفنادق، والبرامج السياحية — رحلتك تبدأ معنا.',
  applicationName: 'قصر المرايا للسفر والسياحة',
  openGraph: { siteName: 'قصر المرايا للسفر والسياحة', locale: 'ar_IQ', type: 'website', images: [DEFAULT_OG] },
  twitter: { card: 'summary_large_image', images: [DEFAULT_OG] },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
        {/* Arabic -> English dictionaries; loaded before hydration so the toggle works on first paint */}
        <script src="/qa-i18n.js" defer />
        <script src="/qa-i18n-1.js" defer />
        <script src="/qa-i18n-2.js" defer />
        <script src="/qa-i18n-3.js" defer />
        <script src="/qa-i18n-4.js" defer />
        <script src="/qa-i18n-5.js" defer />
        <script src="/qa-i18n-6.js" defer />
      </head>
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ORG_JSON_LD) }} />
        {children}
        <MobileBottomBar />
        <LiveChat />
        <AirportChime />
        <PlaneTransition />
      </body>
    </html>
  );
}
