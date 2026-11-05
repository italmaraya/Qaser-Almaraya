'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

// The menu buttons change page with router.push, which Next does not prefetch
// on its own. Once the page is idle, fetch the main pages in the background so
// a tap on the menu opens the next page straight away.
const MAIN = ['/', '/packages', '/visa', '/flights', '/jobs', '/faq', '/contact'];

export default function RoutePrefetch() {
  const router = useRouter();
  const path = usePathname() || '/';
  useEffect(() => {
    if (path.startsWith('/admin') || path.startsWith('/staff')) return undefined;
    try {
      const c = navigator.connection;
      if (c && (c.saveData || /2g/.test(c.effectiveType || ''))) return undefined;
    } catch { /* ignore */ }
    const run = () => MAIN.forEach((p) => { if (p !== path) { try { router.prefetch(p); } catch { /* ignore */ } } });
    const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 1500));
    const cancel = window.cancelIdleCallback || clearTimeout;
    const id = idle(run, { timeout: 3000 });
    return () => cancel(id);
  }, [path, router]);
  return null;
}
