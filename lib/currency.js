'use client';
import { useEffect, useState, useCallback } from 'react';

const STORAGE_KEY = 'qa_currency';

// How many Iraqi Dinars make up one US Dollar. Adjust this single number
// whenever the exchange rate changes — every price on the site reads from it.
export const IQD_PER_USD = 1310;

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
    const usd = n / IQD_PER_USD;
    const s = usd.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    return '$' + s;
  }
  const s = n.toLocaleString('en-US');
  return lang === 'en' ? 'IQD ' + s : s.replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[+d]).replace(/,/g, '٬') + ' د.ع';
}

/**
 * Drop this into any page (via SiteHeader) to get a working IQD/USD toggle
 * that stays in sync with the rest of the site across real page navigations,
 * the same way useLangToggle keeps language in sync.
 */
export function useCurrencyToggle() {
  const [currency, setCurrency] = useState('IQD');

  useEffect(() => {
    setCurrency(getStoredCurrency());
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
