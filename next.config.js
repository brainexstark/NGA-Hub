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
      // Supabase Storage — all projects
      { protocol: 'https', hostname: 'rhdfnxrbbzaqcedwgsfm.supabase.co' },
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: '*.supabase.in' },
      // Google / OAuth avatars
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: '*.googleusercontent.com' },
      { protocol: 'https', hostname: 'cdn-icons-png.flaticon.com' },
      // Allow all HTTPS images (wildcard fallback)
      { protocol: 'https', hostname: '**' },
    ],
    // Never block unoptimized images — let blob/data URLs through
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  compress: true,
  staticPageGenerationTimeout: 120,
  experimental: {},
};

module.exports = nextConfig;
