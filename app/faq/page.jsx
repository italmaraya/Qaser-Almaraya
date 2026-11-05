import Site from '../../components/Site';
import { getSiteContent } from '../../lib/content';
import { getLegacyVisaData } from '../../lib/legacyVisaTransform';
import { pageMeta } from '../../lib/seo';

export const metadata = pageMeta({ title: 'الأسئلة الشائعة', description: 'إجابات عن الحجز والدفع والتأشيرات والمتابعة مع قصر المرايا للسفر والسياحة.', path: '/faq' });

export const revalidate = 60; // cached at the edge for fast page changes; admin saves refresh it at once

export default async function FaqPage() {
  const [content, legacy] = await Promise.all([getSiteContent(), getLegacyVisaData()]);
  return <Site content={{ ...content, ...legacy }} initialPage="faq" />;
}
