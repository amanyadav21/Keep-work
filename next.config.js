/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // The env block here was for client-side exposure and is not needed for server-side API key access
  // or for NEXT_PUBLIC_ prefixed variables.
  // Server-side code (like Genkit flows) will use process.env.GOOGLE_API_KEY directly,
  // loaded from the .env file by Next.js or dotenv.
  // Client-side Firebase config uses NEXT_PUBLIC_ variables from .env.local.
}

module.exports = nextConfig
