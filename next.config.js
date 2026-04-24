/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  // Webpack fallbacks for Node.js-only packages (production builds)
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false, net: false, tls: false, dns: false,
        child_process: false, readline: false,
      };
    }
    return config;
  },
  // Turbopack config for dev server — just keep it minimal
  experimental: {},
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
};

module.exports = nextConfig;
