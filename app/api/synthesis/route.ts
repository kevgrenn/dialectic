import { NextResponse } from 'next/server';
import { AIService, type AIMessage } from '@/lib/services/ai-service';

export async function POST(request: Request) {
  try {
    const { userMessages, perspectiveAMessages, perspectiveBMessages } = await request.json();
    
    // Validate inputs
    if (!userMessages || !perspectiveAMessages || !perspectiveBMessages) {
      return NextResponse.json(
        { error: 'Missing required message arrays' },
        { status: 400 }
      );
    }

    // Prepare the conversation history
    const conversationHistory = [];
    
    // Interleave messages to create a coherent conversation history
    const maxLength = Math.max(
      userMessages.length,
      perspectiveAMessages.length,
      perspectiveBMessages.length
    );
    
    for (let i = 0; i < maxLength; i++) {
      if (i < userMessages.length) {
        conversationHistory.push(`User: ${userMessages[i]}`);
      }
      if (i < perspectiveAMessages.length) {
        conversationHistory.push(`Supporter: ${perspectiveAMessages[i]}`);
      }
      if (i < perspectiveBMessages.length) {
        conversationHistory.push(`Critic: ${perspectiveBMessages[i]}`);
      }
    }

    // Build the messages array for synthesis
    const messages: AIMessage[] = [
      {
        role: 'system',
        content: `You are a dialectical synthesis generator. 
Based on the conversation between the user and two contrasting perspectives (enthusiastic supporter and skeptical critic), 
create a balanced synthesis that:
1. Identifies the strongest arguments from both the supportive and critical perspectives
2. Finds nuanced middle ground between the opposing viewpoints
3. Highlights the most important tensions or trade-offs that emerged
4. Suggests productive next steps or questions for deeper exploration

Keep your response concise (70-100 words).
Format your response in easily digestible chunks.
Use bullet points for lists.
Format any headings or section names as bold text using markdown (e.g., **Heading**).
Keep everything easy to read and digest.
Format your response in Markdown with clear sections for each of these components.
Be concise but comprehensive, focusing on the most important insights.`
      },
      {
        role: 'user',
        content: `Please generate a synthesis of this dialectical conversation:\n\n${conversationHistory.join('\n\n')}`
      }
    ];

    // Create AI service instance and generate response
    const aiService = new AIService();
    const stream = await aiService.createChatCompletion(messages, {
      temperature: 0.5,
      maxTokens: 300,
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
    console.error('Error in synthesis API:', error);
    const errorMessage = error instanceof Error ? error.message : 'An error occurred while generating the synthesis';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 