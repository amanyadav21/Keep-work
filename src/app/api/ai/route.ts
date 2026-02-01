import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(request: Request) {
  try {
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: 'Missing GROQ_API_KEY' }, { status: 500 });
    }

    const { title, description } = await request.json();

    if (!title || typeof title !== 'string') {
      return NextResponse.json({ error: 'Invalid task title' }, { status: 400 });
    }

    const prompt = `You are a helpful assistant. Answer this question about a task:\n\nTask: ${title}\n${description ? `Description: ${description}` : ''}\n\nPlease provide a helpful response about this task in a concise way (2-3 sentences).`;

    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: 'You are a helpful assistant for student tasks.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 120,
    });

    const content = completion.choices?.[0]?.message?.content?.trim() || '';

    return NextResponse.json({ response: content });
  } catch (error) {
    console.error('Groq API error:', error);
    return NextResponse.json({ error: 'Failed to generate response' }, { status: 500 });
  }
}
