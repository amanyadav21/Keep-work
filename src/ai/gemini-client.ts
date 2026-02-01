import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI('AIzaSyDBpXMLuZaCALmKFtoqBwP-4dCzcYIULI0');

export const getGeminiResponse = async (taskTitle: string, taskDescription: string): Promise<string> => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });
    
    const prompt = `You are a helpful assistant. Answer this question about a task:
    
Task: ${taskTitle}
${taskDescription ? `Description: ${taskDescription}` : ''}

Please provide a helpful response about this task in a concise way (2-3 sentences).`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();
    return response;
  } catch (error) {
    console.error('Gemini API error:', error);
    throw error;
  }
};
