import { pageMeta, seoPackage, nightsText } from '../../../lib/seo';

// Gives each package page its own title, description and share picture
// (the page itself draws in the browser, so the title has to come from here).
export async function generateMetadata({ params }) {
  const { id } = await params;
  const p = await seoPackage(id);
  if (!p) return pageMeta({ title: 'الباقات السياحية', description: 'باقات سياحية من بغداد.', path: '/packages' });
  const nights = nightsText(p);
  return pageMeta({
    title: p.title_ar || p.dest_ar,
    description: ['باقة سياحية', p.dest_ar, nights].filter(Boolean).join(' — ') + '. طيران وفندق وجولات من بغداد مع قصر المرايا. احجز عبر واتساب أو الرقم المختصر 6393.',
    path: '/packages/' + p.id,
    image: p.image_url || undefined,
  });
}

export default function PackageLayout({ children }) { return children; }
