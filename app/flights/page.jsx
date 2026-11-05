import Site from '../../components/Site';
import { getContent } from '../../lib/content';
import { getLegacyVisaData } from '../../lib/legacyVisaTransform';
import { pageMeta } from '../../lib/seo';

export const metadata = pageMeta({ title: 'حجز الطيران والفنادق', description: 'احجز تذاكر الطيران والفنادق من بغداد إلى كل العالم عبر شريكنا Flamingo، أو اتصل بالرقم المختصر 6393 وسنحجز لك.', path: '/flights' });

export const revalidate = 60; // cached at the edge for fast page changes; admin saves refresh it at once

export default async function FlightsPage() {
  const [content, legacy] = await Promise.all([getContent(), getLegacyVisaData()]);
  return <Site content={{ ...content, ...legacy }} initialPage="flights" />;
}
