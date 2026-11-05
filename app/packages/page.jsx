import PackagesClient from './PackagesClient';
import { listPublicPackages, toPlain } from '../../lib/publicData';

// The package list is rendered on the server (so search engines and slow
// phones see every package straight away) and refreshed every 5 minutes.
export const revalidate = 300;

export default async function PackagesPage() {
  let packages = null;
  try {
    packages = toPlain(await listPublicPackages());
  } catch (e) {
    console.error('packages page: server list failed', e);
  }
  return <PackagesClient initialPackages={packages} />;
}
