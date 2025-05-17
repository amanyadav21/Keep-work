
'use server';
/**
 * @fileOverview An AI flow that acts as a helpful assistant for students.
 * It analyzes a given task or inquiry and provides tailored assistance.
 * It can also handle follow-up questions based on conversation history and help with brainstorming/elaboration.
 *
 * - getStudentAssistance - A function that provides AI-driven assistance.
 * - StudentAssistantInput - The input type for the getStudentAssistance function.
 * - StudentAssistantOutput - The return type for the getStudentAssistance function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { ChatMessage } from '@/types'; // Import ChatMessage

// Input schema for the flow
const ChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
  timestamp: z.number().optional(), // Timestamp is managed client-side, optional here
});

const StudentAssistantInputSchema = z.object({
  currentInquiry: z.string().describe("The student's current task, question, or follow-up inquiry. This could also be a request to brainstorm or elaborate on a previous topic."),
  conversationHistory: z.array(ChatMessageSchema).optional().describe("The history of the conversation so far, if any."),
  originalTaskContext: z.string().optional().describe("The description of the very first task or question that started this interaction, for context persistence. The AI should refer to this if the current inquiry is a request to elaborate or brainstorm on it.")
});
export type StudentAssistantInput = z.infer<typeof StudentAssistantInputSchema>;

// Output schema for the flow
const StudentAssistantOutputSchema = z.object({
  assistantResponse: z.string().describe(
    "The AI's comprehensive response to the current inquiry. This should be formatted based on the identified task type: " +
    "For 'writing' tasks, provide a well-written paragraph. " +
    "For 'coding' tasks, provide the code (e.g., in a markdown code block) followed by an explanation. " +
    "For 'planning_reminder' tasks, provide a list of steps or suggestions (e.g., using markdown lists). " +
    "For 'general_query' or 'brainstorming_elaboration', provide a direct answer, ideas, or information. " +
    "If 'unknown', explain why the task is unclear or ask for clarification."
  ),
  identifiedTaskType: z.enum(["writing", "coding", "planning_reminder", "general_query", "brainstorming_elaboration", "unknown"])
    .describe("The category of task the AI identified from the current inquiry. Use 'brainstorming_elaboration' if the user is asking for ideas, expansion, or deeper thought on a topic."),
});
export type StudentAssistantOutput = z.infer<typeof StudentAssistantOutputSchema>;

/**
 * Provides AI-driven assistance for a student's task or inquiry, supporting conversation history.
 * @param input The student's current inquiry, along with optional conversation history and original task context.
 * @returns A promise that resolves to the AI's assistance and identified task type for the current inquiry.
 */
export async function getStudentAssistance(input: StudentAssistantInput): Promise<StudentAssistantOutput> {
  return studentAssistantGenkitFlow(input);
}

const studentAssistantPrompt = ai.definePrompt({
  name: 'studentAssistantPrompt',
  input: {schema: StudentAssistantInputSchema},
  output: {schema: StudentAssistantOutputSchema},
  prompt: `You are a helpful AI assistant for college students. Your goal is to provide clear, actionable, and well-formatted assistance.

{{#if conversationHistory.length}}
You are in an ongoing conversation.
{{#if originalTaskContext}}
The conversation initially started with this task/question from the student: "{{originalTaskContext}}"
{{/if}}
Here is the conversation history so far (latest messages are at the end):
{{#each conversationHistory}}
  {{this.role}}: {{this.content}}
{{/each}}
The student's LATEST message is: "{{currentInquiry}}"
Based on the original task context (if provided), the conversation history, and the student's LATEST message, provide a helpful and contextual response.
Your primary focus is to assist with their LATEST message ("{{currentInquiry}}").
{{else}}
The student has submitted the following initial task or question: "{{currentInquiry}}"
There is no prior conversation history.
{{/if}}

For the CURRENT INQUIRY ("{{currentInquiry}}"), your goal is to:
1. Identify the type of task or request. Valid types are: "writing", "coding", "planning_reminder", "general_query", "brainstorming_elaboration", or "unknown".
   - If the CURRENT INQUIRY asks you to 'brainstorm', 'elaborate', 'give ideas for', or similar requests related to the "{{currentInquiry}}" or the "{{originalTaskContext}}", categorize it as "brainstorming_elaboration".
2. Generate a complete and helpful response tailored to that task type for the CURRENT INQUIRY:
    - If "writing" (e.g., "help me write an essay on...", "summarize this concept for my paper"), provide a well-written paragraph that helps them get started, offers key points, or directly addresses the writing need.
    - If "coding" (e.g., "python function to sort a list", "explain recursion in Java"), provide the relevant code (use markdown for code blocks like \`\`\`python ... \`\`\`) followed by a clear explanation.
    - If "planning_reminder" (e.g., "plan my study schedule for next week", "remind me to buy textbooks", "what are the steps to prepare for an exam?"), break it down into actionable steps or provide helpful suggestions (use markdown lists for clarity, e.g., "- Step 1: ...").
    - If "general_query" (e.g., "what is the capital of France?", "explain photosynthesis", "tell me more about X"), provide a concise and accurate answer.
    - If "brainstorming_elaboration" (e.g., "brainstorm ideas for my project on renewable energy", "elaborate on the concept of mitosis for me based on our previous discussion"), provide a list of relevant ideas, key points for expansion, counter-arguments, or insightful questions to stimulate further thought. Use markdown lists if appropriate.
    - If the CURRENT INQUIRY is "unknown" or too ambiguous to categorize, explain why it's unclear and perhaps ask a clarifying question.

Respond with a JSON object matching the following structure:
{
  "identifiedTaskType": "...",
  "assistantResponse": "..."
}

Ensure your "assistantResponse" is directly helpful and actionable for a student based on their CURRENT INQUIRY.
If referring to past parts of the conversation or the original task, do so naturally. Use Markdown for formatting lists, code blocks, bolding, etc., to make the response easy to read.
`,
});

const studentAssistantGenkitFlow = ai.defineFlow(
  {
    name: 'studentAssistantGenkitFlow',
    inputSchema: StudentAssistantInputSchema,
    outputSchema: StudentAssistantOutputSchema,
  },
  async (input) => {
    if (!input.currentInquiry.trim()) {
        return {
            identifiedTaskType: "unknown" as const,
            assistantResponse: "Please provide a task, question, or follow-up."
        };
    }
    const {output} = await studentAssistantPrompt(input);
    if (!output) {
      throw new Error('AI assistant failed to generate a response or return valid output.');
    }
    return output;
  }
);
