/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The env block here is for client-side exposure and not needed for server-side API key access.
  // Server-side code (like Genkit flows) will use process.env.GOOGLE_API_KEY directly,
  // loaded from the .env file by Next.js or dotenv.
}

module.exports = nextConfig
