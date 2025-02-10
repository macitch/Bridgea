/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["lh3.googleusercontent.com"],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  transpilePackages: [], // Add other packages if needed
  serverExternalPackages: ['firebase-admin'],
  experimental: {
    serverActions: {},
    optimizePackageImports: ['@headlessui/react'],
  },
  webpack(config) {
    // Resolve fallback configurations
    config.resolve.fallback = { 
      net: false,
      tls: false,
      fs: false,
    };

    // Exclude SVGs from the default file loader
    const fileLoaderRule = config.module.rules.find((rule) =>
      rule.test?.test?.('.svg')
    );

    if (fileLoaderRule) {
      fileLoaderRule.exclude = /\.svg$/;
    }

    // Add SVGR loader for SVGs with correct SVGO configuration
    config.module.rules.push({
      test: /\.svg$/,
      issuer: {
        and: [/\.(js|ts)x?$/], // Match JavaScript and TypeScript files
      },
      use: [
        {
          loader: '@svgr/webpack',
          options: {
            svgo: true,
            svgoConfig: {
              plugins: [
                {
                  name: 'removeViewBox', // Specify plugin name
                  active: false, // Disable the plugin
                },
                // Add more plugins with names if needed
              ],
            },
            titleProp: true,
          },
        },
      ],
    });

    return config;
  },
};

export default nextConfig;