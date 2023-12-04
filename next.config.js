/** @type {import('next').NextConfig} */
const nextConfig = {
    images: { domains: ['media.giphy.com', 'localhost', 'api-percepat.bbpommataram.id'] },
    experimental:{
        appDir:true
    }
}

module.exports = nextConfig
