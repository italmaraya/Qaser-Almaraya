import { listPublished, NEWS_CATEGORIES } from '../../lib/news';
import { NewsIndexView } from '../../components/NewsViews';

export const revalidate = 60; // new posts appear within a minute

export const metadata = {
  title: 'المدونة — أخبار ونصائح السفر | قصر المرايا للسفر و السياحة',
  description: 'آخر أخبار قصر المرايا للسفر والسياحة، تحديثات التأشيرات، نصائح السفر والرحلات الجديدة.',
};

export default async function NewsPage({ searchParams }) {
  const sp = await searchParams;
  const category = NEWS_CATEGORIES.some((c) => c.id === sp?.category) ? sp.category : '';
  let posts = [];
  try { posts = await listPublished({ category }); } catch (e) { console.error('news list failed', e); }
  return <NewsIndexView posts={JSON.parse(JSON.stringify(posts))} category={category} />;
}
