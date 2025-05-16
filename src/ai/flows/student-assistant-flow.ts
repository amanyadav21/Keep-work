
'use server';
/**
 * @fileOverview An AI flow that acts as a helpful assistant for students.
 * It analyzes a given task and provides tailored assistance.
 *
 * - getStudentAssistance - A function that provides AI-driven assistance for a student's task.
 * - StudentAssistantInput - The input type for the getStudentAssistance function.
 * - StudentAssistantOutput - The return type for the getStudentAssistance function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Input schema for the flow
const StudentAssistantInputSchema = z.object({
  userTask: z.string().describe("The task, question, or reminder submitted by the student."),
});
export type StudentAssistantInput = z.infer<typeof StudentAssistantInputSchema>;

// Output schema for the flow
const StudentAssistantOutputSchema = z.object({
  assistantResponse: z.string().describe(
    "The AI's comprehensive response. This should be formatted based on the identified task type: " +
    "For 'writing' tasks, provide a well-written paragraph. " +
    "For 'coding' tasks, provide the code (e.g., in a markdown code block) followed by an explanation. " +
    "For 'planning_reminder' tasks, provide a list of steps or suggestions (e.g., using markdown lists). " +
    "For 'general_query', provide a direct answer or information. " +
    "If 'unknown', explain why the task is unclear or ask for clarification."
  ),
  identifiedTaskType: z.enum(["writing", "coding", "planning_reminder", "general_query", "unknown"])
    .describe("The category of task the AI identified from the input."),
});
export type StudentAssistantOutput = z.infer<typeof StudentAssistantOutputSchema>;

/**
 * Provides AI-driven assistance for a student's task.
 * @param input The student's task or query.
 * @returns A promise that resolves to the AI's assistance and identified task type.
 */
export async function getStudentAssistance(input: StudentAssistantInput): Promise<StudentAssistantOutput> {
  return studentAssistantGenkitFlow(input);
}

const studentAssistantPrompt = ai.definePrompt({
  name: 'studentAssistantPrompt',
  input: {schema: StudentAssistantInputSchema},
  output: {schema: StudentAssistantOutputSchema},
  prompt: `You are a helpful assistant for students. Based on the task provided by the user, understand what they want to complete. The task can be an assignment, personal reminder, class work, or a general question.

Task: {{{userTask}}}

Your goal is to:
1. Identify the type of task. Valid types are: "writing", "coding", "planning_reminder", "general_query", or "unknown".
2. Generate a complete and helpful response tailored to that task type:
    - If it's a "writing" task (e.g., "write an essay on climate change", "summarize this article"), provide a well-written paragraph that helps them get started or offers key points.
    - If it's a "coding" task (e.g., "python function to sort a list", "explain recursion"), provide the relevant code (use markdown for code blocks like \`\`\`python ... \`\`\`) followed by a clear explanation.
    - If it's a "planning_reminder" task (e.g., "plan my study schedule for next week", "remind me to buy textbooks"), break it down into actionable steps or provide helpful suggestions (use markdown lists for clarity, e.g., "- Step 1: ...").
    - If it's a "general_query" (e.g., "what is the capital of France?", "explain photosynthesis"), provide a concise and accurate answer.
    - If the task is "unknown" or too ambiguous to categorize, explain why it's unclear and perhaps ask a clarifying question.

Respond with a JSON object matching the following structure:
{
  "identifiedTaskType": "...", // Your identified task type from the list above
  "assistantResponse": "..."  // Your detailed, formatted response as per the instructions for the identified task type
}

Ensure your "assistantResponse" is directly helpful and actionable for a student.
`,
});

const studentAssistantGenkitFlow = ai.defineFlow(
  {
    name: 'studentAssistantGenkitFlow',
    inputSchema: StudentAssistantInputSchema,
    outputSchema: StudentAssistantOutputSchema,
  },
  async (input) => {
    if (!input.userTask.trim()) {
        return {
            identifiedTaskType: "unknown" as const,
            assistantResponse: "Please provide a task or question."
        };
    }
    const {output} = await studentAssistantPrompt(input);
    if (!output) {
      throw new Error('AI assistant failed to generate a response or return valid output.');
    }
    return output;
  }
);
