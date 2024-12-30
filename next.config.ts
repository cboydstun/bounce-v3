/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['media3.giphy.com', 'res.cloudinary.com'],
  },
  experimental: {
    turbo: true,
  },
};

export default nextConfig;
