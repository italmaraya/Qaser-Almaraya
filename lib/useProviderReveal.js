'use client';
import { useCallback, useEffect, useState } from 'react';

// Staff shortcut: Alt + Q (Option + Q on Mac) toggles staff mode.
// Uses the physical key position (e.code), so it works the same whether the
// keyboard is set to English or Arabic. Alt + Q is not taken by Chrome, Edge
// or Firefox, unlike Ctrl + number (switches tabs) or Ctrl + Shift + P (print).
function isStaffShortcut(e) {
  return e.altKey && !e.ctrlKey && !e.metaKey && e.code === 'KeyQ';
}

/**
 * Lets a logged-in staff member reveal each visa card's provider directly on
 * the live public site, by pressing Alt + Q — invisible to everyone
 * else, and immune to browser/OS keyboard shortcuts (no Ctrl/Alt combo is
 * used, since those get intercepted by the browser itself — e.g. Ctrl+Shift+P
 * opens Chrome's print dialog on many systems before our code ever runs).
 *
 * Security note: hiding the badge with CSS would NOT be enough, since anyone
 * could still see the data by opening dev tools. Instead, nothing is fetched
 * until the shortcut is pressed, and the server endpoint itself checks for a
 * valid admin session before returning anything. A regular customer pressing
 * the shortcut just gets a 401 and nothing happens.
 */
export function useProviderReveal() {
  const [providers, setProviders] = useState(null); // null = not revealed yet
  const [denied, setDenied] = useState(false);

  const reveal = useCallback(async () => {
    try {
      const res = await fetch('/api/visa/provider-hints');
      if (!res.ok) {
        setDenied(true);
        setTimeout(() => setDenied(false), 1500);
        return;
      }
      const data = await res.json();
      setProviders(data);
    } catch {
      /* ignore — fail silently either way */
    }
  }, []);

  useEffect(() => {
    function onKeyDown(e) {
      if (!isStaffShortcut(e) || e.repeat) return;
      e.preventDefault();
      setProviders((prev) => {
        if (prev != null) return null; // pressing it again turns staff mode off
        reveal();
        return prev;
      });
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [reveal]);

  return { providers, revealed: providers != null, denied };
}

