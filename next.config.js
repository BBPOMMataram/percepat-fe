/** @type {import('next').NextConfig} */
const authBackendImagePattern = (() => {
    const authBackendUrl = process.env.NEXT_PUBLIC_BACKEND_URL_AUTH;
    if (!authBackendUrl) return null;

    try {
        const url = new URL(authBackendUrl);
        return {
            protocol: url.protocol.slice(0, -1),
            hostname: url.hostname,
            port: url.port,
            pathname: "/**",
        };
    } catch {
        return null;
    }
})();

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
            ...(authBackendImagePattern ? [authBackendImagePattern] : []),
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
    async headers() {
        return [
            {
                source: '/models/:path*',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable',
                    },
                ],
            },
            {
                source: '/assets/:path*',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable',
                    },
                ],
            },
        ];
    },
}

module.exports = nextConfig
