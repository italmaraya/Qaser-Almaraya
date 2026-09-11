'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

// The phrase staff type (anywhere on the page, not inside a text field) to
// reveal provider badges. Change this any time — it's just a plain string.
const SECRET_PHRASE = 'staffmode';

/**
 * Lets a logged-in staff member reveal each visa card's provider directly on
 * the live public site, by typing a secret phrase — invisible to everyone
 * else, and immune to browser/OS keyboard shortcuts (no Ctrl/Alt combo is
 * used, since those get intercepted by the browser itself — e.g. Ctrl+Shift+P
 * opens Chrome's print dialog on many systems before our code ever runs).
 *
 * Security note: hiding the badge with CSS would NOT be enough, since anyone
 * could still see the data by opening dev tools. Instead, nothing is fetched
 * until the phrase is typed, and the server endpoint itself checks for a
 * valid admin session before returning anything. A regular customer typing
 * the phrase just gets a 401 and nothing happens.
 */
export function useProviderReveal() {
  const [providers, setProviders] = useState(null); // null = not revealed yet
  const [denied, setDenied] = useState(false);
  const bufferRef = useRef('');

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
      // Ignore typing while the visitor is actually filling out a field —
      // only treat "loose" keystrokes on the page itself as the secret code.
      const tag = (e.target && e.target.tagName) || '';
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target?.isContentEditable) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key.length !== 1) return; // ignore Shift, Enter, arrows, etc.

      bufferRef.current = (bufferRef.current + e.key).slice(-SECRET_PHRASE.length).toLowerCase();
      if (bufferRef.current === SECRET_PHRASE) {
        bufferRef.current = '';
        setProviders((prev) => {
          if (prev != null) return null; // typing it again toggles off
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

