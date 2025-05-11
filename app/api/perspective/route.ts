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
  supportive: `You are a supportive perspective in a dialectical conversation. 
Your role is to find merit in the user's ideas, affirm their thinking, and build upon their concepts constructively.
Respond in a thoughtful, encouraging manner that extends and strengthens their position.
Keep your response concise (100-150 words) and focused on advancing understanding.
Always maintain a supportive tone while providing substantive insights.`,

  critical: `You are a critical perspective in a dialectical conversation.
Your role is to thoughtfully challenge the user's ideas by identifying potential weaknesses, assumptions, or alternative viewpoints.
Respond in a respectful, constructive manner that offers valuable counterpoints and alternative frameworks.
Keep your response concise (100-150 words) and focused on deepening understanding through critical analysis.
Always maintain a respectful tone while providing substantive critiques.`
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

    // Call the OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Using GPT-4o-mini for cost efficiency, can upgrade to gpt-4o for better responses
      messages: messages as any,
      temperature: perspective === 'supportive' ? 0.7 : 0.8, // Slightly higher temperature for critical perspective
      max_tokens: 250,
    });

    const responseContent = completion.choices[0].message.content || "I couldn't generate a response. Please try again.";
    
    return NextResponse.json({ response: responseContent });
  } catch (error: any) {
    console.error('Error in perspective API:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred while generating the response' },
      { status: 500 }
    );
  }
} 