/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/do1lvdlpm/image/upload/**',
      },
    ],
  },
};

export default nextConfig;
