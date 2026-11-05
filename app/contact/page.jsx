import Site from '../../components/Site';
import { getContent } from '../../lib/content';
import { getLegacyVisaData } from '../../lib/legacyVisaTransform';
import { pageMeta } from '../../lib/seo';

export const metadata = pageMeta({ title: 'تواصل معنا', description: 'تواصل مع قصر المرايا للسفر والسياحة: الرقم المختصر 6393، واتساب +964 784 999 9600، العنوان شارع 14 رمضان، بغداد.', path: '/contact' });

export const dynamic = 'force-dynamic'; // content can change any time via the admin dashboard

export default async function ContactPage() {
  const [content, legacy] = await Promise.all([getContent(), getLegacyVisaData()]);
  return <Site content={{ ...content, ...legacy }} initialPage="contact" />;
}
