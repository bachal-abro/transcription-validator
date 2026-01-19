/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable all caching for real-time data updates
  experimental: {
    staleTimes: {
      dynamic: 0,
      static: 0,
    },
  },
};

export default nextConfig;
