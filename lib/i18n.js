'use client';
import { useEffect, useRef, useState, useCallback } from 'react';

const STORAGE_KEY = 'qa_lang';
const origMap = typeof WeakMap !== 'undefined' ? new WeakMap() : null;

export function getStoredLang() {
  if (typeof window === 'undefined') return 'ar';
  try {
    return localStorage.getItem(STORAGE_KEY) || 'ar';
  } catch {
    return 'ar';
  }
}

function setStoredLang(lang) {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    /* ignore */
  }
}

/**
 * Walks the visible DOM and swaps text to/from English using the same
 * window.QA_I18N dictionary the homepage already uses (public/qa-i18n*.js).
 * Shared so every page — old or new — translates consistently.
 */
export function applyLangToDOM(lang) {
  const I = typeof window !== 'undefined' && window.QA_I18N;
  if (!I || !origMap) return;
  const en = lang === 'en';
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => {
      const p = n.parentElement;
      if (!p || p.closest('[data-no-i18n]')) return NodeFilter.FILTER_REJECT;
      if (p.tagName === 'SCRIPT' || p.tagName === 'STYLE') return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  const nodes = [];
  let n;
  while ((n = walker.nextNode())) nodes.push(n);
  nodes.forEach((node) => {
    if (en) {
      if (!origMap.has(node)) origMap.set(node, node.nodeValue);
      const p = node.parentElement;
      const out = (p && p.closest('[data-i18n-short]') ? I.ts : I.t)(origMap.get(node));
      if (node.nodeValue !== out) node.nodeValue = out;
    } else if (origMap.has(node)) {
      const o = origMap.get(node);
      if (node.nodeValue !== o) node.nodeValue = o;
    }
  });
  ['alt', 'title', 'placeholder', 'aria-label'].forEach((attr) => {
    const key = 'ar' + attr.replace(/-(\w)/g, (m, c) => c.toUpperCase());
    document.body.querySelectorAll('[' + attr + ']').forEach((el) => {
      if (el.closest('[data-no-i18n]')) return;
      if (en) {
        if (el.dataset[key] == null) el.dataset[key] = el.getAttribute(attr) || '';
        const out = I.t(el.dataset[key]);
        if (el.getAttribute(attr) !== out) el.setAttribute(attr, out);
      } else if (el.dataset[key] != null && el.getAttribute(attr) !== el.dataset[key]) {
        el.setAttribute(attr, el.dataset[key]);
      }
    });
  });
  document.querySelectorAll('[dir]').forEach((el) => {
    if (!el.hasAttribute('data-keep-dir')) el.setAttribute('dir', en ? 'ltr' : 'rtl');
  });
  document.documentElement.setAttribute('lang', en ? 'en' : 'ar');
  document.documentElement.setAttribute('dir', en ? 'ltr' : 'rtl');
}

/**
 * Drop this into any page (via SiteHeader) to get a working EN/AR toggle
 * that stays in sync with the rest of the site across real page navigations.
 */
export function useLangToggle() {
  const [lang, setLang] = useState('ar');
  const busy = useRef(false);
  const applied = useRef(false);

  useEffect(() => {
    const stored = getStoredLang();
    setLang(stored);
  }, []);

  useEffect(() => {
    busy.current = true;
    applyLangToDOM(lang);
    applied.current = true;
    busy.current = false;
  }, [lang]);

  useEffect(() => {
    const obs = new MutationObserver(() => {
      if (lang !== 'en' || busy.current || !applied.current) return;
      clearTimeout(obs._tm);
      obs._tm = setTimeout(() => applyLangToDOM('en'), 40);
    });
    obs.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => obs.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  const toggle = useCallback(() => {
    setLang((prev) => {
      const next = prev === 'ar' ? 'en' : 'ar';
      setStoredLang(next);
      return next;
    });
  }, []);

  return { lang, toggle };
}
