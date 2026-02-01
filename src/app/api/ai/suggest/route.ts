import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const SYSTEM_PROMPT = `You are a task assistant. Return ONLY valid JSON with keys: category, priority, summary.
- category must be one of: Assignment, Class, Personal.
- priority must be one of: Low, Medium, High.
- summary must be a short sentence (max 200 chars).
No extra text.`;

export async function POST(request: Request) {
  try {
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: 'Missing GROQ_API_KEY' }, { status: 500 });
    }

    const { title, description, dueDate } = await request.json();

    if (!title || typeof title !== 'string' || !description || typeof description !== 'string') {
      return NextResponse.json({ error: 'Invalid task data' }, { status: 400 });
    }

    const prompt = `Task Title: ${title}\nTask Description: ${description}\nDue Date: ${dueDate || 'Not provided'}\n\nReturn JSON only.`;

    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      temperature: 0.4,
      max_tokens: 160,
    });

    const content = completion.choices?.[0]?.message?.content?.trim() || '';

    let data: { category?: string; priority?: string; summary?: string } = {};
    try {
      data = JSON.parse(content);
    } catch {
      return NextResponse.json({ error: 'AI response was not valid JSON' }, { status: 500 });
    }

    return NextResponse.json({
      category: data.category,
      priority: data.priority,
      summary: data.summary,
    });
  } catch (error) {
    console.error('Groq API error:', error);
    return NextResponse.json({ error: 'Failed to generate suggestions' }, { status: 500 });
  }
}
