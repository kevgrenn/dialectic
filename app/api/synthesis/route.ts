import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

    // Call the OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: 'system',
          content: `You are a dialectical synthesis generator. 
Based on the conversation between the user and two perspectives (supportive and critical), 
create a synthesis that:
1. Identifies the strongest points made by each perspective
2. Highlights areas of consensus
3. Articulates key remaining questions or tensions
4. Suggests next steps for deeper understanding

Format your response in Markdown with clear sections for each of these components.
Be concise but comprehensive, focusing on the most important insights.`
        },
        {
          role: 'user',
          content: `Please generate a synthesis of this dialectical conversation:\n\n${conversationHistory.join('\n\n')}`
        }
      ],
      temperature: 0.5,
      max_tokens: 500,
    });

    const synthesisContent = completion.choices[0].message.content || "I couldn't generate a synthesis. Please try again.";
    
    return NextResponse.json({ synthesis: synthesisContent });
  } catch (error: any) {
    console.error('Error in synthesis API:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred while generating the synthesis' },
      { status: 500 }
    );
  }
} 