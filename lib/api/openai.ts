// Define the perspective types
export type PerspectiveType = 'supportive' | 'critical';

// Generate a response from a specific perspective
export async function generatePerspectiveResponse(
  perspective: PerspectiveType,
  userMessage: string,
  conversationHistory: string[] = []
): Promise<string> {
  try {
    const response = await fetch('/api/perspective', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        perspective,
        userMessage,
        conversationHistory
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate AI response');
    }

    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error('Error generating AI response:', error);
    throw new Error('Failed to generate AI response. Please check your API key and try again.');
  }
}

// Generate a synthesis of the conversation
export async function generateSynthesis(
  userMessages: string[],
  perspectiveAMessages: string[],
  perspectiveBMessages: string[]
): Promise<string> {
  try {
    const response = await fetch('/api/synthesis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userMessages,
        perspectiveAMessages,
        perspectiveBMessages
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate synthesis');
    }

    const data = await response.json();
    return data.synthesis;
  } catch (error) {
    console.error('Error generating synthesis:', error);
    throw new Error('Failed to generate synthesis. Please check your API key and try again.');
  }
} 