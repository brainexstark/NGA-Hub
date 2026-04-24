/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'placehold.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'plus.unsplash.com' },
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'cdn.tuko.co.ke' },
      { protocol: 'https', hostname: 'teacher.co.ke' },
      { protocol: 'https', hostname: 'i.ytimg.com' },
      { protocol: 'https', hostname: 'rejnac.co.ke' },
      { protocol: 'https', hostname: 'educationnewshub.co.ke' },
      { protocol: 'https', hostname: 'encrypted-tbn0.gstatic.com' },
      { protocol: 'https', hostname: 'chatgpt.com' },
    ],
  },
  compress: true,
  staticPageGenerationTimeout: 120,
  experimental: {},
};

module.exports = nextConfig;
