
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

// Schema definitions are now local to this file and not exported.
const SuggestCategoryInputSchema = z.object({
  description: z.string().describe('The description of the task.'),
});
export type SuggestCategoryInput = z.infer<typeof SuggestCategoryInputSchema>;

const SuggestCategoryOutputSchema = z.object({
  category: z.enum(taskCategories).describe('The suggested category for the task.'),
});
export type SuggestCategoryOutput = z.infer<typeof SuggestCategoryOutputSchema>;

export async function suggestTaskCategory(input: SuggestCategoryInput): Promise<SuggestCategoryOutput> {
  return suggestCategoryFlow(input);
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
    // The Zod schema validation on output (defined in suggestCategoryPrompt)
    // already ensures the category is one of the allowed taskCategories.
    // The explicit check below is redundant.
    // if (!taskCategories.includes(output.category as TaskCategory)) {
    //     console.warn(`AI returned an unexpected category: ${output.category}. This might indicate an issue with the prompt or model response if Zod validation didn't catch it.`);
    // }
    return output;
  }
);

