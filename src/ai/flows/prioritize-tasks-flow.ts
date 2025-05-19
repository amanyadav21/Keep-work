
'use server';
/**
 * @fileOverview An AI flow to suggest task priorities for students.
 *
 * - suggestTaskPriorities - A function that suggests task priorities based on a list of pending tasks.
 * - PrioritizeTasksInput - The input type for the suggestTaskPriorities function.
 * - PrioritizeTasksOutput - The return type for the suggestTaskPriorities function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { Task, TaskCategory } from '@/types'; // Assuming Task type is defined here

// Define input schema for the tasks provided to the flow
const TaskInputSchema = z.object({
  id: z.string(),
  description: z.string(),
  dueDate: z.string().describe("The due date of the task in ISO format."),
  category: z.enum(["Assignment", "Class", "Personal"] as [TaskCategory, ...TaskCategory[]]).describe("The category of the task."),
  // isCompleted is not needed as we will only pass pending tasks
});
export type FlowTaskInput = z.infer<typeof TaskInputSchema>;

const PrioritizeTasksInputSchema = z.object({
  tasks: z.array(TaskInputSchema).describe('A list of pending tasks for the student.'),
});
export type PrioritizeTasksInput = z.infer<typeof PrioritizeTasksInputSchema>;

// Define output schema for the prioritized tasks
const PrioritizedTaskSchema = z.object({
  taskId: z.string().describe('The ID of the task being prioritized.'),
  reason: z.string().describe('A brief justification for why this task is considered high priority.'),
});

const PrioritizeTasksOutputSchema = z.object({
  prioritizedSuggestions: z.array(PrioritizedTaskSchema).describe('A list of suggested high-priority tasks with reasons, typically the top 3-5.'),
});
export type PrioritizeTasksOutput = z.infer<typeof PrioritizeTasksOutputSchema>;


export async function suggestTaskPriorities(input: PrioritizeTasksInput): Promise<PrioritizeTasksOutput> {
  if (input.tasks.length === 0) {
    return { prioritizedSuggestions: [] };
  }
  try {
    return await prioritizeTasksFlow(input);
  } catch (error: any) {
    if (error.message && (error.message.includes("API_KEY_SERVICE_BLOCKED") || error.message.includes("SERVICE_DISABLED") || error.message.includes("PERMISSION_DENIED"))) {
      console.error("Prioritize Tasks Flow Error (Google Cloud Configuration Likely):", error.message);
      throw new Error('AI service error for priority suggestions: Your API key might be blocked, the Generative Language API may be disabled, or billing is not configured for your Google Cloud project. Please verify your Google Cloud Console settings.');
    }
    console.error("Prioritize Tasks Flow Error (Unexpected):", error);
    throw new Error('An unexpected error occurred while trying to suggest task priorities.');
  }
}

const prioritizeTasksPrompt = ai.definePrompt({
  name: 'prioritizeTasksPrompt',
  input: {schema: PrioritizeTasksInputSchema},
  output: {schema: PrioritizeTasksOutputSchema},
  prompt: `You are a helpful student productivity assistant. Your goal is to help a college student prioritize their pending tasks.
Analyze the following list of tasks, considering their descriptions, due dates, and categories.
Identify the top 3 to 5 most critical tasks that the student should focus on next.
For each critical task you identify, provide its \`taskId\` and a concise \`reason\` (under 20 words) explaining why it's a high priority.

Focus on urgency (due dates), importance (e.g., assignments usually over personal tasks if deadlines are similar), and potential impact.

Tasks:
{{#each tasks}}
- Task ID: {{{id}}}, Description: "{{{description}}}", Due: {{{dueDate}}}, Category: {{{category}}}
{{/each}}

Return your response as a JSON object matching the following structure:
{
  "prioritizedSuggestions": [
    { "taskId": "...", "reason": "..." },
    // ... more tasks
  ]
}
Ensure the \`taskId\` matches one of the provided task IDs.
`,
});

const prioritizeTasksFlow = ai.defineFlow(
  {
    name: 'prioritizeTasksFlow',
    inputSchema: PrioritizeTasksInputSchema,
    outputSchema: PrioritizeTasksOutputSchema,
  },
  async (input) => {
    // Redundant check, already handled in the wrapper function
    // if (input.tasks.length === 0) {
    //   return { prioritizedSuggestions: [] };
    // }
    const {output} = await prioritizeTasksPrompt(input);
    if (!output) {
        throw new Error('AI failed to suggest task priorities or return valid output.');
    }
    return output;
  }
);
