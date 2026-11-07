'use client';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

// Keeps <html data-area> right after client-side navigation (the inline
// script in app/layout.js sets it on first load). The redesign styles in
// app/qs.css apply only to data-area="site", never to /admin or /staff.
export default function AreaMark() {
  const path = usePathname() || '/';
  useEffect(() => {
    const admin = /^\/(admin|staff)(\/|$)/.test(path);
    document.documentElement.setAttribute('data-area', admin ? 'admin' : 'site');
  }, [path]);
  return null;
}
