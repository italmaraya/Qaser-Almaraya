// Navigate with the banner-plane transition when it is on the page;
// otherwise (staff pages, reduced motion, not mounted yet) a plain push.
export function goWithPlane(router, href) {
  if (typeof window !== 'undefined' && typeof window.qaPlaneGo === 'function') {
    window.qaPlaneGo(href);
    return;
  }
  router.push(href);
}
