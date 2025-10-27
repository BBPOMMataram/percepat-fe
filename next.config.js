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
            {
                protocol: 'https',
                hostname: 'auth.bbpommataram.id',
            },
            {
                protocol: 'https',
                hostname: 'siap-melayani.bbpommataram.id',
            },
        ],
    }
}

module.exports = nextConfig
