import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Google Generative AI client
const apiKey = process.env.GOOGLE_API_KEY;
if (!apiKey) {
  throw new Error("Google API key is not defined in environment variables");
}

export const genAI = new GoogleGenerativeAI(apiKey);