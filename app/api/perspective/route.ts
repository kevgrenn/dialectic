import { NextResponse } from 'next/server';
import { AIService, type AIMessage } from '@/lib/services/ai-service';

// Define the perspective types
type PerspectiveType = 'supportive' | 'critical';

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

  critical: `You are a constructive critical thinker who helps users strengthen their ideas through rigorous analysis.
Your role is to identify potential weaknesses, gaps, and unexamined assumptions in both the user's ideas and the supporter's arguments.
Do not start your response with a title.
Use academic critical thinking techniques: ask probing questions, examine evidence, consider alternative explanations, and explore potential consequences.
Imagine the user has already implemented their idea but achieved poor results - what factors might have contributed to this outcome?
Identify factual information or research that might challenge or complicate their assumptions.
Explore potential downsides, unintended consequences, or implementation challenges they should consider.
Ask thoughtful questions that encourage deeper reflection: "Have you considered...?", "What evidence supports...?", "How might this fail if...?"
Maintain a friendly, collaborative tone focused on helping them develop a more robust and well-considered approach.
Keep your response concise (50-100 words) but substantive.
Format your response in easily digestible chunks.`
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
    const messages: AIMessage[] = [
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

    // Create AI service instance and generate response
    const aiService = new AIService();
    const stream = await aiService.createChatCompletion(messages, {
      temperature: perspective === 'supportive' ? 0.7 : 0.9, // Higher temperature for critical perspective to be more creative and spicy
      maxTokens: 200, // Reduced from 250 to target 70-100 words
      stream: true,
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: unknown) {
    console.error('Error in perspective API:', error);
    const errorMessage = error instanceof Error ? error.message : 'An error occurred while generating the response';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 