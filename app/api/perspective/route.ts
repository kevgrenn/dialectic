import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Define the perspective types
type PerspectiveType = 'supportive' | 'critical';

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Define the system prompts for each perspective
const SYSTEM_PROMPTS: Record<PerspectiveType, string> = {
  supportive: `You are an enthusiastic advocate for the user's ideas.
Your role is to strongly support, amplify, and build upon the user's perspective with genuine excitement.
Do not start your response with a title.
Find the most compelling aspects of their thinking and emphasize the positive potential.
Respond in an encouraging, optimistic manner that extends and strengthens their position.
Look for innovative possibilities and beneficial outcomes their ideas could lead to.
Keep your response concise (50-100 words) and focused on advancing understanding.
Format your response in easily digestible chunks. 
Keep everything easy to read and digest.
Always maintain a supportive, energetic tone while providing substantive insights.`,

  critical: `You are a thoughtful skeptic examining potential flaws in the user's ideas.
Your role is to identify weaknesses, question assumptions, and challenge the user's perspective.
Do not start your response with a title.
Find the most questionable aspects of their thinking and highlight potential problems or contradictions.
Respond in a direct, analytical manner that offers valuable counterpoints and alternative frameworks.
Consider unintended consequences, logical gaps, or evidence that might contradict their position.
Keep your response concise (50-100 words) and focused on deepening understanding through critical analysis.
Format your response in easily digestible chunks. Do not start your response with a title.
Keep everything easy to read and digest.
Always maintain an intellectually rigorous tone while providing substantive critiques.`
};

export async function POST(request: Request) {
  try {
    const { perspective, userMessage, conversationHistory } = await request.json();
    
    // Validate inputs
    if (!perspective || !userMessage) {
      return NextResponse.json(
        { error: 'Missing required fields: perspective and userMessage' },
        { status: 400 }
      );
    }
    
    // Check if perspective is valid
    if (perspective !== 'supportive' && perspective !== 'critical') {
      return NextResponse.json(
        { error: 'Invalid perspective: must be "supportive" or "critical"' },
        { status: 400 }
      );
    }

    // Build the messages array for the conversation
    const messages = [
      {
        role: 'system',
        content: SYSTEM_PROMPTS[perspective as PerspectiveType]
      },
      {
        role: 'user',
        content: `Here is the topic or question I want to explore: ${userMessage}`
      }
    ];

    // Add conversation history if available
    if (conversationHistory && conversationHistory.length > 0) {
      messages.push({
        role: 'user',
        content: `Here is the conversation so far: ${conversationHistory.join('\n\n')}`
      });
    }

    // Create a stream response
    const stream = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Using GPT-4o-mini for cost efficiency, can upgrade to gpt-4o for better responses
      messages: messages as any,
      temperature: perspective === 'supportive' ? 0.7 : 0.8, // Slightly higher temperature for critical perspective
      max_tokens: 200, // Reduced from 250 to target 70-100 words
      stream: true,
    });

    // Return the stream
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        let responseText = '';
        
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || '';
          if (content) {
            responseText += content;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
          }
        }
        
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, fullContent: responseText })}\n\n`));
        controller.close();
      }
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('Error in perspective API:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred while generating the response' },
      { status: 500 }
    );
  }
} 