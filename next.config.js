/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['ipfs.infura.io', 'infura-ipfs.io'],
  },
  env: {
    NEXT_PUBLIC_IPFS_PROJECT_ID: process.env.NEXT_PUBLIC_IPFS_PROJECT_ID,
    NEXT_PUBLIC_IPFS_PROJECT_SECRET: process.env.NEXT_PUBLIC_IPFS_PROJECT_SECRET,
    NEXT_PUBLIC_MARKETPLACE_ADDRESS: process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS,
  },
}

module.exports = nextConfig
