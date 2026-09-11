// Countries store their flag either as a short code (legacy — looks up
// public/assets/flags/{code}.png) or, once uploaded from the dashboard, as a
// full image URL. This resolves either shape to something an <img> can use.
export function flagSrc(flagCode) {
  if (!flagCode) return '';
  if (/^https?:\/\//i.test(flagCode) || flagCode.startsWith('/')) return flagCode;
  return `/assets/flags/${flagCode}.png`;
}

export function isUploadedFlag(flagCode) {
  return !!flagCode && (/^https?:\/\//i.test(flagCode) || flagCode.startsWith('/'));
}
