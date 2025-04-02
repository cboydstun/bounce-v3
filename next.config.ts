/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["media3.giphy.com", "res.cloudinary.com"],
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  // Add webpack configuration for source maps
  webpack: (
    config: any,
    { dev, isServer }: { dev: boolean; isServer: boolean },
  ) => {
    // Enable source maps in development
    if (dev) {
      // This is a more complete source map for better debugging
      // but might be slightly slower to generate
      config.devtool = "source-map";

      // Alternative options if 'source-map' is too slow:
      // - 'eval-source-map': Good quality source maps, faster than 'source-map'
      // - 'cheap-module-source-map': Faster but less detailed
      // - 'eval': Fastest but minimal source mapping
    }

    // Optionally, you can also configure source maps for production
    // if (!dev) {
    //   config.devtool = 'source-map';
    // }

    return config;
  },
};

export default nextConfig;
