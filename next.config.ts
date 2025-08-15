/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enforce no trailing slashes for consistent URLs
  trailingSlash: false,

  // Redirect configuration for canonical URLs
  async redirects() {
    return [
      // Redirect non-www to www (permanent redirect for SEO)
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: "satxbounce.com",
          },
        ],
        destination: "https://www.satxbounce.com/:path*",
        permanent: true,
      },
      // Redirect HTTP to HTTPS for www domain
      {
        source: "/:path*",
        has: [
          {
            type: "header",
            key: "x-forwarded-proto",
            value: "http",
          },
          {
            type: "host",
            value: "www.satxbounce.com",
          },
        ],
        destination: "https://www.satxbounce.com/:path*",
        permanent: true,
      },
      // Redirect trailing slash URLs to non-trailing slash versions
      {
        source: "/:path+/",
        destination: "/:path+",
        permanent: true,
      },
    ];
  },
  images: {
    domains: [
      "media.giphy.com",
      "media2.giphy.com",
      "media3.giphy.com",
      "res.cloudinary.com",
      "m.media-amazon.com",
      "assets-v2.lottiefiles.com",
    ],
    unoptimized: true, // disable Next.js image optimization
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
  experimental: {
    turbo: {
      // Configure Turbopack to handle source maps
      resolveExtensions: [".tsx", ".ts", ".jsx", ".js", ".mjs", ".json"],
      // You can add rules for any webpack loaders you're using if needed
      // rules: {
      //   // Example if you need to configure any loaders
      // },
    },
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
