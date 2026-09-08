import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  generateEtags: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [360, 480, 640, 750, 828, 1080, 1200, 1440, 1920],
    imageSizes: [32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [
      {protocol: 'https', hostname: 'images.unsplash.com'},
      {protocol: 'https', hostname: 'images.pexels.com'},
    ],
  },
  async headers() {
    return [
      {
        source: '/uploads/cms/:path*',
        headers: [
          {key: 'Cache-Control', value: 'public, max-age=31536000, immutable'},
        ],
      },
      {
        source: '/images/:path*',
        headers: [
          {key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800'},
        ],
      },
    ];
  },
};

export default nextConfig;
