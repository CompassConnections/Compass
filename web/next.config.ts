import {withSentryConfig} from '@sentry/nextjs'
import {IS_LOCAL} from 'common/hosting/constants'
import type {NextConfig} from 'next'

const isAppBuild = !!process.env.NEXT_PUBLIC_WEBVIEW
console.log({isAppBuild})

const nextConfig: NextConfig = {
  output: isAppBuild ? 'export' : undefined,
  // productionBrowserSourceMaps: !isAppBuild, // no source maps in Android build
  reactStrictMode: true,
  modularizeImports: {
    // heroicons v1 transforms removed — v2 has tree-shaking built in
    lodash: {
      transform: 'lodash/{{member}}',
    },
  },
  transpilePackages: ['common'],
  experimental: {
    serverSourceMaps: true,
    scrollRestoration: true,
    turbopackFileSystemCacheForDev: true, // filesystem cache for faster dev rebuilds
  },
  env: {
    NEXT_PUBLIC_VERCEL_DEPLOYMENT_ID: process.env.VERCEL_DEPLOYMENT_ID,
  },
  // Remove once confirmed that posthog.init works without it
  // rewrites: async () => {
  //     if (isAppBuild) {
  //         return []
  //     }
  //     return [
  //         {
  //             source: '/ingest/static/:path*',
  //             destination: 'https://us-assets.i.posthog.com/static/:path*',
  //         },
  //         {
  //             source: '/ingest/:path*',
  //             destination: 'https://us.i.posthog.com/:path*',
  //         },
  //         {
  //             source: '/ingest/decide',
  //             destination: 'https://us.i.posthog.com/decide',
  //         },
  //     ]
  // },
  skipTrailingSlashRedirect: true,
  images: {
    unoptimized: isAppBuild || IS_LOCAL,
    dangerouslyAllowSVG: true,
    remotePatterns: [
      {hostname: 'martinbraquet.com'},
      {hostname: 'compassmeet.com'},
      {hostname: 'lh3.googleusercontent.com'},
      {hostname: 'i.imgur.com'},
      {hostname: 'firebasestorage.googleapis.com'},
      {hostname: 'storage.googleapis.com'},
      {hostname: 'picsum.photos'},
      {hostname: '*.giphy.com'},
      {hostname: 'ui-avatars.com'},
      {hostname: 'localhost'},
      {hostname: '127.0.0.1'},
    ],
    // Allow private IPs for local OG image generation
    minimumCacheTTL: 0,
  },
  webpack: (config, {dev}) => {
    // console.log({dev})
    if (dev) {
      config.cache = {type: 'filesystem'}
      config.infrastructureLogging = {level: 'warn'}
      config.stats = 'minimal'
    }
    config.module.rules.push({
      test: /\.svg$/,
      use: [
        {
          loader: '@svgr/webpack',
          options: {
            svgoConfig: {
              plugins: [{name: 'removeViewBox', active: false}],
              floatPrecision: 2,
            },
          },
        },
      ],
    })
    if (!dev) {
      // Find and disable source maps in CSS plugins
      config.plugins.forEach((plugin: any) => {
        if (plugin.constructor.name === 'MiniCssExtractPlugin') {
          plugin.options = {...plugin.options, ignoreOrder: true}
        }
      })

      config.module.rules.forEach((rule: any) => {
        if (rule.oneOf) {
          rule.oneOf.forEach((r: any) => {
            if (r.use) {
              const uses = Array.isArray(r.use) ? r.use : [r.use]
              uses.forEach((u: any) => {
                if (u.loader?.includes('css-loader') && u.options) {
                  u.options.sourceMap = false
                }
              })
            }
          })
        }
      })
    }
    return config
  },
  async redirects() {
    return [
      {source: '/discord', destination: 'https://discord.gg/8Vd7jzqjun', permanent: false},
      {source: '/patreon', destination: 'https://patreon.com/CompassMeet', permanent: false},
      {
        source: '/paypal',
        destination: 'https://www.paypal.com/paypalme/CompassConnections',
        permanent: false,
      },
      {
        source: '/github',
        destination: 'https://github.com/CompassConnections/Compass',
        permanent: false,
      },
      {source: '/charts', destination: '/stats', permanent: true},
    ]
  },
}

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: 'compass-0l',

  project: 'compass',

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  authToken: process.env.SENTRY_AUTH_TOKEN,

  // hideSourceMaps: true,
  // disableLogger: true,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: isAppBuild ? undefined : '/monitoring',

  sourcemaps: {
    disable: false, // ✅ enable uploading to Sentry
    deleteSourcemapsAfterUpload: true, // ✅ removes them from the server after upload so they're not publicly served
  },

  webpack: {
    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,

    // Tree-shaking options for reducing bundle size
    treeshake: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      removeDebugLogging: true,
    },
  },
})
