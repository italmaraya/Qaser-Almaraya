import VisaClient from './VisaClient';
import { listVisaCards, toPlain } from '../../lib/publicData';

// Visa countries are rendered on the server so they show up in search results
// and appear instantly; refreshed every 5 minutes.
export const revalidate = 300;

export default async function VisaPage() {
  let cards = null;
  try {
    cards = toPlain(await listVisaCards());
  } catch (e) {
    console.error('visa page: server list failed', e);
  }
  return <VisaClient initialCards={cards} />;
}
