
'use server';
/**
 * @fileOverview An AI flow to suggest task categories.
 *
 * - suggestTaskCategory - A function that suggests a task category based on its description.
 * - SuggestCategoryInput - The input type for the suggestTaskCategory function.
 * - SuggestCategoryOutput - The return type for the suggestTaskCategory function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { TaskCategory } from '@/types';

const taskCategories: [TaskCategory, ...TaskCategory[]] = ["Assignment", "Class", "Personal"];

const SuggestCategoryInputSchema = z.object({
  description: z.string().describe('The description of the task.'),
});
export type SuggestCategoryInput = z.infer<typeof SuggestCategoryInputSchema>;

const SuggestCategoryOutputSchema = z.object({
  category: z.enum(taskCategories).describe('The suggested category for the task.'),
});
export type SuggestCategoryOutput = z.infer<typeof SuggestCategoryOutputSchema>;

export async function suggestTaskCategory(input: SuggestCategoryInput): Promise<SuggestCategoryOutput> {
  if (!input.description || input.description.trim() === "") {
    // Return a default or throw a specific error for empty descriptions
    // For now, let's assume the model can handle it or return 'Personal' by default if really empty.
    // Or, throw new Error("Task description cannot be empty for category suggestion.");
    // This might be better handled in the calling component.
  }
  try {
    return await suggestCategoryFlow(input);
  } catch (error: any) {
    if (error.message && (error.message.includes("API_KEY_SERVICE_BLOCKED") || error.message.includes("SERVICE_DISABLED") || error.message.includes("PERMISSION_DENIED"))) {
      console.error("Suggest Category Flow Error (Google Cloud Configuration Likely):", error.message);
      throw new Error('AI service error for category suggestion: Your API key might be blocked, the Generative Language API may be disabled, or billing is not configured for your Google Cloud project. Please verify your Google Cloud Console settings.');
    }
    console.error("Suggest Category Flow Error (Unexpected):", error);
    throw new Error('An unexpected error occurred while trying to suggest a task category.');
  }
}

const suggestCategoryPrompt = ai.definePrompt({
  name: 'suggestCategoryPrompt',
  input: {schema: SuggestCategoryInputSchema},
  output: {schema: SuggestCategoryOutputSchema},
  prompt: `You are an expert at categorizing tasks. Based on the task description provided, identify the most appropriate category.
The available categories are: "Assignment", "Class", "Personal".

Respond with a JSON object containing a single key "category" whose value is one of the allowed categories.

Task Description:
"{{{description}}}"

Your JSON response (ensure the value for "category" is one of "Assignment", "Class", or "Personal") :`
});


const suggestCategoryFlow = ai.defineFlow(
  {
    name: 'suggestCategoryFlow',
    inputSchema: SuggestCategoryInputSchema,
    outputSchema: SuggestCategoryOutputSchema,
  },
  async (input) => {
    const {output} = await suggestCategoryPrompt(input);
    if (!output) {
        throw new Error('AI failed to suggest a category or return valid output.');
    }
    return output;
  }
);

    