import type {NextConfig} from 'next';

import dotenv from 'dotenv';
dotenv.config(); // Load .env variables

const isDev = process.env.NODE_ENV === 'development';
const serverPort = process.env.SERVER_PORT ?? '7787';

const nextConfig: NextConfig = {
    images: {
        unoptimized: true,
    },

    trailingSlash: true, // Optional: adds trailing slashes to URLs
    // reactStrictMode: true,
    reactStrictMode: false,
    cleanDistDir: true,

    env: {
        ENV: isDev ? 'development' : 'production',
    },

    async rewrites() {
        if (isDev) {
            return [
                {
                    source: '/api/:path*',
                    destination: `http://localhost:${serverPort}/api/:path*`,
                },
            ];
        }
        return [];
    },

    output: 'export',
    distDir: 'build',

    webpack: (config, context) => {
        config.resolve.symlinks = false; // Ensure Webpack doesn’t resolve symlinks to real paths
        return config;
    },
};

module.exports = nextConfig;
