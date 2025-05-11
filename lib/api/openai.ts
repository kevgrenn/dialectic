// Define the perspective types
export type PerspectiveType = 'supportive' | 'critical';

// Generate a response from a specific perspective with streaming
export async function generatePerspectiveResponse(
  perspective: PerspectiveType,
  userMessage: string,
  conversationHistory: string[] = [],
  onChunk?: (chunk: string) => void
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

    // Check if the response is a stream
    if (response.headers.get('Content-Type')?.includes('text/event-stream')) {
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.substring(6));
                
                if (data.content) {
                  if (onChunk) {
                    onChunk(data.content);
                  }
                  fullResponse += data.content;
                }
                
                if (data.done) {
                  return data.fullContent || fullResponse;
                }
              } catch {
                // Skip invalid JSON
              }
            }
          }
        }
      }
      
      return fullResponse;
    } else {
      // Fall back to non-streaming response
      const data = await response.json();
      return data.response;
    }
  } catch (error) {
    console.error('Error generating AI response:', error);
    throw new Error('Failed to generate AI response. Please check your API key and try again.');
  }
}

// Generate a synthesis of the conversation with streaming
export async function generateSynthesis(
  userMessages: string[],
  perspectiveAMessages: string[],
  perspectiveBMessages: string[],
  onChunk?: (chunk: string) => void
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

    // Check if the response is a stream
    if (response.headers.get('Content-Type')?.includes('text/event-stream')) {
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullSynthesis = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.substring(6));
                
                if (data.content) {
                  if (onChunk) {
                    onChunk(data.content);
                  }
                  fullSynthesis += data.content;
                }
                
                if (data.done) {
                  return data.fullContent || fullSynthesis;
                }
              } catch {
                // Skip invalid JSON
              }
            }
          }
        }
      }
      
      return fullSynthesis;
    } else {
      // Fall back to non-streaming response
      const data = await response.json();
      return data.synthesis;
    }
  } catch (error) {
    console.error('Error generating synthesis:', error);
    throw new Error('Failed to generate synthesis. Please check your API key and try again.');
  }
} 