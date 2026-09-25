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
                protocol: 'http',
                hostname: '127.0.0.1',
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
            {
                protocol: 'https',
                hostname: 'simpel.bbpommataram.id',
            },
        ],
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },
}

module.exports = nextConfig
