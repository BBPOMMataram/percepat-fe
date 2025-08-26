/** @type {import('next').NextConfig} */
const nextConfig = {
    compiler: { styledComponents: true },
    images: {
        remotePatterns: [
            {
                protocol: 'http',
                hostname: 'localhost',
            },
            {
                protocol: 'https',
                hostname: 'percepat-api.bbpommataram.id',
            },
            {
                protocol: 'https',
                hostname: 'media.giphy.com',
            },
        ],
    }
}

module.exports = nextConfig
