import { notFound } from 'next/navigation';
import { GUIDE_ISOS, guideFor } from '../../../lib/destinationGuide';
import { countryInfo } from '../../../lib/destinations';
import { pageMeta } from '../../../lib/seo';
import GuideClient from '../GuideClient';

// /guide/<iso>: travel guide for one country (static content, built once).
export function generateStaticParams() {
  return GUIDE_ISOS.map((iso) => ({ iso }));
}
export const dynamicParams = false;

export async function generateMetadata({ params }) {
  const { iso } = await params;
  const c = countryInfo(iso);
  const g = guideFor(iso, 'ar');
  if (!c || !g) return pageMeta({ title: 'دليل السفر', path: '/guide', image: '/og/og-guide.jpg' });
  return pageMeta({
    title: 'دليل السفر إلى ' + c.ar + ': الطقس والعملة وفرق التوقيت',
    description: `كل ما تحتاجه قبل السفر إلى ${c.ar} من بغداد: طقس ${g.city} في كل شهر، العملة (${g.currency})، فرق التوقيت، نوع المقبس، أفضل وقت للزيارة ونصائح عملية.`,
    path: '/guide/' + iso,
    image: '/og/og-guide.jpg',
  });
}

export default async function GuidePage({ params }) {
  const { iso } = await params;
  if (!guideFor(iso) || !countryInfo(iso)) notFound();
  return <GuideClient iso={iso} />;
}
