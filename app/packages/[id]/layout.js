import { pageMeta, seoPackage, nightsText, packageJsonLd } from '../../../lib/seo';

// Gives each package page its own title, description and share picture
// (the page itself draws in the browser, so the title has to come from here).
export async function generateMetadata({ params }) {
  const { id } = await params;
  const p = await seoPackage(id);
  if (!p) return pageMeta({ title: 'الباقات السياحية', description: 'باقات سياحية من بغداد.', path: '/packages', image: '/og/og-packages.jpg' });
  const nights = nightsText(p);
  const price = Number(p.price) > 0 ? 'يبدأ من ' + Number(p.price).toLocaleString('en-US') + ' د.ع للشخص' : '';
  return pageMeta({
    title: p.title_ar || p.dest_ar,
    // WhatsApp/Facebook show this under the photo when the link is shared,
    // so it leads with the duration and the price.
    description: [[nights, price].filter(Boolean).join(' · '), ['باقة سياحية', p.dest_ar].filter(Boolean).join(' — ')].filter(Boolean).join(' | ') + '. طيران وفندق وجولات من بغداد مع قصر المرايا. احجز عبر واتساب أو الرقم المختصر 6393.',
    path: '/packages/' + p.id,
    image: p.image_url || '/og/og-packages.jpg',
  });
}

export default async function PackageLayout({ children, params }) {
  const { id } = await params;
  const ld = packageJsonLd(await seoPackage(id));
  return (
    <>
      {ld ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, '\\u003c') }} /> : null}
      {children}
    </>
  );
}
