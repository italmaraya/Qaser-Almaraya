import { pageMeta } from '../../lib/seo';

export const metadata = pageMeta({
  title: 'التأشيرات',
  description: 'استخراج تأشيرات السفر للعراقيين: المستندات المطلوبة، مدة الإصدار والأسعار لكل دولة. قدّم عبر واتساب أو اتصل بالرقم المختصر 6393.',
  path: '/visa',
  image: '/og/og-visa.jpg',
});

export default function VisaLayout({ children }) { return children; }
