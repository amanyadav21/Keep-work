
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [googleAI()],
  model: 'gemini-pro', // Switched to gemini-pro as gemini-1.5-flash-latest was not found
});
