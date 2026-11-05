'use client';

import { useEffect, useLayoutEffect } from 'react';
import { usePathname } from 'next/navigation';
import { applyLangToDOM, getStoredLang, i18nReady, markHydrated } from '../lib/i18n';

// Visitors who chose English should never see the next page in Arabic first.
// After the first load, every page change is translated in a layout effect,
// i.e. after React puts the new page in the DOM and before the browser paints.
export default function LangGuard() {
  const path = usePathname();
  useEffect(() => { markHydrated(); }, []);
  useLayoutEffect(() => {
    if (getStoredLang() === 'en' && i18nReady()) applyLangToDOM('en');
  }, [path]);
  return null;
}
