import './site.css';

export const metadata = {
  title: 'قصر المرايا للسفر و السياحة | Qaser Almaraya for Travel & Tourism',
  description: 'حجوزات الطيران، الفنادق، والبرامج السياحية — رحلتك تبدأ معنا.',
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
        <script src="/qa-i18n.js" />
        <script src="/qa-i18n-1.js" />
        <script src="/qa-i18n-2.js" />
        <script src="/qa-i18n-3.js" />
        <script src="/qa-i18n-4.js" />
        <script src="/qa-i18n-5.js" />
        <script src="/qa-i18n-6.js" />
      </head>
      <body>{children}</body>
    </html>
  );
}
