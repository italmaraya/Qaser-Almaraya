import { notFound } from 'next/navigation';
import { getPublished, listPublished, readingMinutes } from '../../../lib/news';
import { NewsArticleView } from '../../../components/NewsViews';

export const revalidate = 60;

async function load(slugParam) {
  const slug = decodeURIComponent(slugParam);
  try { return await getPublished(slug); } catch { return null; }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = await load(slug);
  if (!post) return { title: 'المدونة | قصر المرايا' };
  return {
    title: post.title_ar + ' | قصر المرايا للسفر و السياحة',
    description: post.excerpt_ar || undefined,
    openGraph: { title: post.title_ar, description: post.excerpt_ar || undefined, images: post.cover_url ? [post.cover_url] : undefined, type: 'article' },
  };
}

export default async function NewsArticlePage({ params }) {
  const { slug } = await params;
  const post = await load(slug);
  if (!post) notFound();
  let related = [];
  try { related = (await listPublished({ category: post.category, limit: 4 })).filter((p) => p.id !== post.id).slice(0, 3); } catch {}
  const data = JSON.parse(JSON.stringify({ ...post, minutes: readingMinutes(post.body_ar) }));
  return <NewsArticleView post={data} related={JSON.parse(JSON.stringify(related))} />;
}
