/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
      ignoreDuringBuilds: true, // 👈 disables ESLint checks at build time
    },
  };

export default nextConfig;
