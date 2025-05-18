
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import 'dotenv/config'; // Ensure .env variables are loaded for Genkit CLI

export const ai = genkit({
  plugins: [
    googleAI({ apiKey: process.env.GOOGLE_API_KEY }) // Explicitly pass the API key
  ],
  model: 'googleai/gemini-pro', // Using 'googleai/gemini-pro' as a standard model identifier
});

