'use client';
import { useEffect, useRef, useState, useCallback } from 'react';

const STORAGE_KEY = 'qa_lang';
const origMap = typeof WeakMap !== 'undefined' ? new WeakMap() : null;
// Last text this module wrote into each node. If a node now holds something else,
// React re-rendered it (e.g. a page that has its own English strings), so the
// stored Arabic original is stale and must not be written back over it.
const outMap = typeof WeakMap !== 'undefined' ? new WeakMap() : null;

export function getStoredLang() {
  if (typeof window === 'undefined') return 'ar';
  try {
    return localStorage.getItem(STORAGE_KEY) || 'ar';
  } catch {
    return 'ar';
  }
}

// After the first page has hydrated, later pages are mounted by client-side
// navigation, so they can start in the stored language straight away instead
// of rendering Arabic first and swapping a moment later (visible flash).
let hydrated = false;
export function markHydrated() { hydrated = true; }
export function initialLang() { return hydrated ? getStoredLang() : 'ar'; }

function setStoredLang(lang) {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    /* ignore */
  }
  try {
    window.dispatchEvent(new CustomEvent('qa-lang-change', { detail: lang }));
  } catch {
    /* ignore */
  }
}

/**
 * The dictionaries (public/qa-i18n*.js) load with `defer` so they no longer
 * block the first paint. The last file sets window.QA_I18N_READY and fires
 * 'qa-i18n-ready'; callers wait for that before swapping text.
 */
export function i18nReady() {
  return typeof window !== 'undefined' && !!window.QA_I18N_READY && !!window.QA_I18N;
}

export function onI18nReady(cb) {
  if (typeof window === 'undefined') return () => {};
  if (i18nReady()) { cb(); return () => {}; }
  const h = () => cb();
  window.addEventListener('qa-i18n-ready', h, { once: true });
  return () => window.removeEventListener('qa-i18n-ready', h);
}

/**
 * Walks the visible DOM and swaps text to/from English using the same
 * window.QA_I18N dictionary the homepage already uses (public/qa-i18n*.js).
 * Shared so every page — old or new — translates consistently.
 */
export function applyLangToDOM(lang) {
  const I = i18nReady() && window.QA_I18N;
  if (!I || !origMap || !outMap) return;
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
    const changed = outMap.has(node) && node.nodeValue !== outMap.get(node) && node.nodeValue !== origMap.get(node);
    if (en) {
      if (!origMap.has(node) || changed) origMap.set(node, node.nodeValue);
      const p = node.parentElement;
      const out = (p && p.closest('[data-i18n-short]') ? I.ts : I.t)(origMap.get(node));
      outMap.set(node, out);
      if (node.nodeValue !== out) node.nodeValue = out;
    } else if (origMap.has(node)) {
      const o = origMap.get(node);
      origMap.delete(node);
      outMap.delete(node);
      if (!changed && node.nodeValue !== o) node.nodeValue = o;
    }
  });
  ['alt', 'title', 'placeholder', 'aria-label'].forEach((attr) => {
    const key = 'ar' + attr.replace(/-(\w)/g, (m, c) => c.toUpperCase());
    document.body.querySelectorAll('[' + attr + ']').forEach((el) => {
      if (el.closest('[data-no-i18n]')) return;
      const outKey = key + 'Out';
      const cur = el.getAttribute(attr) || '';
      const changed = el.dataset[outKey] != null && cur !== el.dataset[outKey] && cur !== el.dataset[key];
      if (en) {
        if (el.dataset[key] == null || changed) el.dataset[key] = cur;
        const out = I.t(el.dataset[key]);
        el.dataset[outKey] = out;
        if (cur !== out) el.setAttribute(attr, out);
      } else if (el.dataset[key] != null) {
        const o = el.dataset[key];
        delete el.dataset[key];
        delete el.dataset[outKey];
        if (!changed && cur !== o) el.setAttribute(attr, o);
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
  const [lang, setLang] = useState(initialLang);
  const busy = useRef(false);
  const applied = useRef(false);
  const [ready, setReady] = useState(i18nReady);

  useEffect(() => onI18nReady(() => setReady(true)), []);

  useEffect(() => {
    const stored = getStoredLang();
    setLang(stored);
  }, []);

  useEffect(() => {
    function onExternalChange(e) {
      const next = e?.detail;
      if (next === 'ar' || next === 'en') setLang(next);
    }
    window.addEventListener('qa-lang-change', onExternalChange);
    return () => window.removeEventListener('qa-lang-change', onExternalChange);
  }, []);

  useEffect(() => {
    busy.current = true;
    applyLangToDOM(lang);
    applied.current = ready;
    busy.current = false;
  }, [lang, ready]);

  useEffect(() => {
    const obs = new MutationObserver(() => {
      if (lang !== 'en' || busy.current || !applied.current) return;
      // Next frame (before it is painted), so new text never shows in Arabic.
      if (obs._raf) return;
      obs._raf = requestAnimationFrame(() => { obs._raf = 0; applyLangToDOM('en'); });
    });
    obs.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => { obs.disconnect(); cancelAnimationFrame(obs._raf); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, ready]);

  const toggle = useCallback(() => {
    setLang((prev) => {
      const next = prev === 'ar' ? 'en' : 'ar';
      setStoredLang(next);
      return next;
    });
  }, []);

  return { lang, toggle };
}
