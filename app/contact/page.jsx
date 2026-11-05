import Site from '../../components/Site';
import { getSiteContent } from '../../lib/content';
import { getLegacyVisaData } from '../../lib/legacyVisaTransform';
import { pageMeta } from '../../lib/seo';

export const metadata = pageMeta({ title: 'تواصل معنا', description: 'تواصل مع قصر المرايا للسفر والسياحة: الرقم المختصر 6393، واتساب +964 784 999 9600، العنوان شارع 14 رمضان، بغداد.', path: '/contact' });

export const revalidate = 60; // cached at the edge for fast page changes; admin saves refresh it at once

// ?topic=package pre-selects the subject; Site reads it in the browser.
export default async function ContactPage() {
  const [content, legacy] = await Promise.all([getSiteContent(), getLegacyVisaData()]);
  return <Site content={{ ...content, ...legacy }} initialPage="contact" />;
}
