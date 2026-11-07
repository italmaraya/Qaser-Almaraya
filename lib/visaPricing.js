// Visa selling prices.
//
// A visa card's adult/child selling price is entered either in IQD (the
// default, and how every older card is stored) or in USD. A USD card is
// converted with the dashboard's exchange rate every time it is read, and
// rounded to the nearest 1,000 IQD — exactly like a package priced in USD —
// so changing the rate in الإعدادات moves visa prices with it, with no
// per-card editing.
import { round1000 } from './packagePricing';

const n = (v) => Number(v) || 0;

export function visaPricedInUsd(card) { return !!card && card.price_currency === 'USD'; }

/** The customer price in IQD for one stored value. */
export function visaPriceIqd(card, value, rate = 1) {
  return visaPricedInUsd(card) ? round1000(n(value) * (n(rate) || 1)) : n(value);
}

/** The card with adult_price / child_price in IQD, ready for the public side. */
export function withVisaSellPrices(card, rate = 1) {
  if (!card) return card;
  return {
    ...card,
    adult_price: visaPriceIqd(card, card.adult_price, rate),
    child_price: visaPriceIqd(card, card.child_price, rate),
  };
}
