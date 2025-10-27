/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Exclude pdfkit and nodemailer from webpack bundling on server side
      config.externals = config.externals || []
      config.externals.push('pdfkit', 'nodemailer')
    }
    return config
  },
}

module.exports = nextConfig

