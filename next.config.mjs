/** @type {import('next').NextConfig} */

// Standard browser protections, sent with every page and API response.
const securityHeaders = [
  // Always use HTTPS for this domain (2 years)
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
  // Don't let browsers guess file types (stops uploaded files being run as pages)
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Only our own site may show our pages inside a frame (anti click-jacking)
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Content-Security-Policy', value: "frame-ancestors 'self'; object-src 'none'; base-uri 'self'" },
  // Share only the domain (not full URLs) when visitors click external links
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Features the site never uses are switched off
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()' },
];

const nextConfig = {
  // Static export removed: the admin dashboard and visa module need real
  // API routes (login, saving content, image uploads, database access),
  // which only run on a server.
  images: { unoptimized: true },
  poweredByHeader: false,
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      // Keep the dashboard and staff pages out of Google
      { source: '/admin/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] },
      { source: '/staff/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] },
      { source: '/admin', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] },
      { source: '/staff', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] },
    ];
  },
};
export default nextConfig;
