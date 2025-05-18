
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import 'dotenv/config'; // Ensure .env variables are loaded for Genkit CLI

const apiKey = process.env.GOOGLE_API_KEY;

// This log will appear in the server console (e.g., where `npm run dev` is running)
// when Next.js starts up or when this module is first initialized.
if (typeof window === 'undefined') { // Ensure this only runs server-side
  console.log(`[Genkit Init] GOOGLE_API_KEY from process.env: ${apiKey ? 'Found' : 'NOT FOUND'}`);
  if (!apiKey) {
    console.warn('[Genkit Init] Warning: GOOGLE_API_KEY is not set. AI features may not work.');
  }
}

export const ai = genkit({
  plugins: [
    googleAI({ apiKey: apiKey }) // Explicitly pass the API key
  ],
  model: 'googleai/gemini-1.5-flash-latest', // Updated model identifier
});

