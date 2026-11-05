import Site from '../../components/Site';
import { getContent } from '../../lib/content';
import { getLegacyVisaData } from '../../lib/legacyVisaTransform';
import { pageMeta } from '../../lib/seo';

export const metadata = pageMeta({ title: 'الوظائف', description: 'فرص عمل في قصر المرايا للسفر والسياحة في بغداد — انضم إلى فريقنا.', path: '/jobs' });

export const dynamic = 'force-dynamic'; // content can change any time via the admin dashboard

export default async function JobsPage() {
  const [content, legacy] = await Promise.all([getContent(), getLegacyVisaData()]);
  return <Site content={{ ...content, ...legacy }} initialPage="jobs" />;
}
