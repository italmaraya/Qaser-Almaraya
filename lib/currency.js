'use client';
import { useEffect, useState, useCallback } from 'react';
import { IQD_PER_USD } from './exchangeRate';

const STORAGE_KEY = 'qa_currency';

export { IQD_PER_USD };

// The live USD→IQD rate (set in the dashboard → الإعدادات). Starts at the
// built-in default and is replaced by the stored value as soon as the page
// has fetched it, so every displayed USD figure follows the central setting.
let RATE = IQD_PER_USD;
let ratePromise = null;
export function getRate() { return RATE; }
export function setRuntimeRate(r) { const v = Number(r); if (v > 0) RATE = v; }
export function loadRate() {
  if (typeof window === 'undefined') return Promise.resolve(RATE);
  if (!ratePromise) {
    ratePromise = fetch('/api/rate').then((r) => r.json()).then((d) => { setRuntimeRate(d.usd_iqd_rate); return RATE; }).catch(() => RATE);
  }
  return ratePromise;
}

export function getStoredCurrency() {
  if (typeof window === 'undefined') return 'IQD';
  try {
    return localStorage.getItem(STORAGE_KEY) || 'IQD';
  } catch {
    return 'IQD';
  }
}

function setStoredCurrency(currency) {
  try {
    localStorage.setItem(STORAGE_KEY, currency);
  } catch {
    /* ignore */
  }
}

/**
 * Formats a price that is stored in the database as IQD, converting it to
 * USD for display only when the visitor has switched currency. Nothing is
 * ever written back to the database in USD — this only changes what's shown.
 */
export function formatPrice(amountIqd, currency, lang) {
  const n = Number(amountIqd) || 0;
  if (currency === 'USD') {
    const usd = n / RATE;
    const s = usd.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    return '$' + s;
  }
  const s = n.toLocaleString('en-US');
  return lang === 'en' ? 'IQD ' + s : s.replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[+d]).replace(/,/g, '٬') + ' د.ع';
}

/**
 * Formats an amount that is already stored in the given currency — no IQD
 * conversion, unlike formatPrice. Use this for internal cost fields, where
 * the admin picks a currency and enters the cost directly in it (e.g. a
 * supplier invoice quoted in USD), as opposed to customer-facing prices,
 * which are always stored in IQD and only converted for display.
 */
export function formatRawAmount(amount, currency, lang) {
  const n = Number(amount) || 0;
  if (currency === 'USD') {
    return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }
  const s = n.toLocaleString('en-US');
  return lang === 'en' ? 'IQD ' + s : s.replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[+d]).replace(/,/g, '٬') + ' د.ع';
}

/**
 * Same as formatPrice, but prefixes a +/- sign for upgrade/downgrade
 * differences (e.g. a pricier hotel option), and reads as "Included" when
 * there's no difference at all.
 */
export function formatSignedPrice(amountIqd, currency, lang) {
  const n = Number(amountIqd) || 0;
  if (n === 0) return lang === 'en' ? 'Included' : 'مشمول';
  const sign = n > 0 ? '+ ' : '- ';
  return sign + formatPrice(Math.abs(n), currency, lang);
}

/**
 * Drop this into any page (via SiteHeader) to get a working IQD/USD toggle
 * that stays in sync with the rest of the site across real page navigations,
 * the same way useLangToggle keeps language in sync.
 */
export function useCurrencyToggle() {
  const [currency, setCurrency] = useState('IQD');
  const [, setRateTick] = useState(0);

  useEffect(() => {
    setCurrency(getStoredCurrency());
    loadRate().then(() => setRateTick((x) => x + 1)); // re-render with the live rate
  }, []);

  const toggle = useCallback(() => {
    setCurrency((prev) => {
      const next = prev === 'IQD' ? 'USD' : 'IQD';
      setStoredCurrency(next);
      return next;
    });
  }, []);

  return { currency, toggle };
}
