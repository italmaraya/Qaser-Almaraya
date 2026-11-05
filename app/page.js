import Site from '../components/Site';
import { getSiteContent } from '../lib/content';
import { getLegacyVisaData } from '../lib/legacyVisaTransform';
import { pageMeta } from '../lib/seo';

export const metadata = pageMeta({ absoluteTitle: 'قصر المرايا للسفر والسياحة | باقات سياحية وتأشيرات وطيران من بغداد', description: 'قصر المرايا للسفر والسياحة في بغداد: باقات سياحية، تأشيرات، حجز طيران وفنادق وسفر المجموعات. تواصل عبر واتساب أو الرقم المختصر 6393.', path: '/' });

export const revalidate = 60; // cached at the edge for fast page changes; admin saves refresh it at once

export default async function Page() {
  const [content, legacy] = await Promise.all([getSiteContent(), getLegacyVisaData()]);
  return <Site content={{ ...content, ...legacy }} />;
}
