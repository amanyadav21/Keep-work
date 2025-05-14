
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [googleAI()],
  model: 'gemini-1.0-pro', // Switched to gemini-1.0-pro
});

