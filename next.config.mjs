/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export removed: the admin dashboard and visa module need real
  // API routes (login, saving content, image uploads, database access),
  // which only run on a server.
  images: { unoptimized: true },
};
export default nextConfig;
