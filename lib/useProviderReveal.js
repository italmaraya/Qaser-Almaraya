'use client';
import { useCallback, useEffect, useState } from 'react';

/**
 * Lets a logged-in staff member reveal each visa card's provider directly on
 * the live public site, via a keyboard shortcut — invisible to everyone else.
 *
 * Security note: hiding the badge with CSS would NOT be enough, since anyone
 * could still see the data by opening dev tools. Instead, nothing is fetched
 * until the shortcut is pressed, and the server endpoint itself checks for a
 * valid admin session before returning anything. A regular customer pressing
 * the shortcut just gets a 401 and nothing happens.
 *
 * Shortcut: Ctrl+Shift+P ("P" for Provider). Deliberately not Ctrl+A, since
 * that would hijack the browser's normal "select all" everywhere on the page.
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
      if (e.ctrlKey && e.shiftKey && (e.key === 'P' || e.key === 'p')) {
        e.preventDefault();
        setProviders((prev) => {
          if (prev != null) return null; // toggle off if already revealed
          reveal();
          return prev;
        });
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [reveal]);

  return { providers, revealed: providers != null, denied };
}
