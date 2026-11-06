import { pageMeta } from '../../lib/seo';
import GuideClient from './GuideClient';

export const metadata = pageMeta({
  title: 'دليل الوجهات',
  description: 'أدلة سفر مختصرة لوجهات قصر المرايا: الطقس في كل شهر، العملة، فرق التوقيت عن بغداد، نوع المقبس ونصائح قبل السفر.',
  path: '/guide',
  image: '/og/og-guide.jpg',
});

export default function GuideIndexPage() {
  return <GuideClient />;
}
