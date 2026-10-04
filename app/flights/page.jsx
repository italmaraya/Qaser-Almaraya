import Site from '../../components/Site';
import { getContent } from '../../lib/content';
import { getLegacyVisaData } from '../../lib/legacyVisaTransform';

export const dynamic = 'force-dynamic'; // content can change any time via the admin dashboard

export default async function FlightsPage() {
  const [content, legacy] = await Promise.all([getContent(), getLegacyVisaData()]);
  return <Site content={{ ...content, ...legacy }} initialPage="flights" />;
}
