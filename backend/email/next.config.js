/** @type {import('next').NextConfig} */
// eslint-disable-next-line
const path = require('path')
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    serverComponentsExternalPackages: [
      '@react-email/components',
      '@react-email/render',
      '@react-email/tailwind',
    ],
    externalDir: true, // compile files that are located next to the .react-email directory
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      common: path.resolve(__dirname, '../../common/lib'),
      shared: path.resolve(__dirname, '../shared/lib'),
      email: path.resolve(__dirname, './emails'),
    }
    return config
  },
}

module.exports = nextConfig
