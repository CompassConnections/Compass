/** @type {import('next').NextConfig} */
module.exports = {
  productionBrowserSourceMaps: true,
  reactStrictMode: true,
  // optimizeFonts: false,
  modularizeImports: {
    '@heroicons/react/solid/?(((\\w*)?/?)*)': {
      transform: '@heroicons/react/solid/{{ matches.[1] }}/{{member}}',
    },
    '@heroicons/react/outline/?(((\\w*)?/?)*)': {
      transform: '@heroicons/react/outline/{{ matches.[1] }}/{{member}}',
    },

    lodash: {
      transform: 'lodash/{{member}}',
    },
  },
  transpilePackages: ['common'],
  experimental: {
    scrollRestoration: true,
  },
  rewrites: async () => {
    return [
      {
        source: '/ingest/static/:path*',
        destination: 'https://us-assets.i.posthog.com/static/:path*',
      },
      {
        source: '/ingest/:path*',
        destination: 'https://us.i.posthog.com/:path*',
      },
      {
        source: '/ingest/decide',
        destination: 'https://us.i.posthog.com/decide',
      },
    ]
  },
  skipTrailingSlashRedirect: true,
  images: {
    dangerouslyAllowSVG: true,
    remotePatterns: [
      { hostname: 'manifold.markets' },
      { hostname: 'compassmeet.com' },
      { hostname: 'lh3.googleusercontent.com' },
      { hostname: 'i.imgur.com' },
      { hostname: 'firebasestorage.googleapis.com' },
      { hostname: 'storage.googleapis.com' },
      { hostname: 'picsum.photos' },
      { hostname: '*.giphy.com' },
      { hostname: 'ui-avatars.com' },
      { hostname: 'localhost' },
    ],
  },
  webpack: (config) => {
    config.module.rules.push({
      test: /\.svg$/,
      use: [
        {
          loader: '@svgr/webpack',
          options: {
            svgoConfig: {
              plugins: [{ name: 'removeViewBox', active: false }],
              floatPrecision: 2,
            },
          },
        },
      ],
    })
    return config
  },
  async redirects() {
      return [
          { source: '/discord', destination: 'https://discord.gg/8Vd7jzqjun', permanent: false },
          { source: '/patreon', destination: 'https://patreon.com/CompassMeet', permanent: false },
          { source: '/paypal', destination: 'https://www.paypal.com/paypalme/CompassConnections', permanent: false },
          { source: '/github', destination: "https://github.com/CompassConnections/Compass", permanent: false },
      ];
  },
}
