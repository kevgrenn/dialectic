import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { getAIConfig, validateAIConfig, type AIConfig } from '@/lib/config/ai-providers';

export interface StreamChunk {
  content: string;
  done?: boolean;
  fullContent?: string;
}

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export class AIService {
  private config: AIConfig;
  private openaiClient?: OpenAI;
  private anthropicClient?: Anthropic;

  constructor() {
    this.config = getAIConfig();
    
    // Validate configuration
    const validationError = validateAIConfig(this.config);
    if (validationError) {
      throw new Error(validationError);
    }

    // Initialize the appropriate client
    if (this.config.provider === 'openai') {
      this.openaiClient = new OpenAI({
        apiKey: this.config.openai.apiKey,
      });
    } else if (this.config.provider === 'anthropic') {
      this.anthropicClient = new Anthropic({
        apiKey: this.config.anthropic.apiKey,
      });
    }
  }

  async createChatCompletion(
    messages: AIMessage[],
    options: {
      temperature?: number;
      maxTokens?: number;
      stream?: boolean;
    } = {}
  ): Promise<ReadableStream<Uint8Array>> {
    const { temperature = 0.7, maxTokens = 200, stream = true } = options;

    if (this.config.provider === 'openai') {
      return this.createOpenAIStream(messages, { temperature, maxTokens, stream });
    } else if (this.config.provider === 'anthropic') {
      return this.createAnthropicStream(messages, { temperature, maxTokens, stream });
    }

    throw new Error(`Unsupported AI provider: ${this.config.provider}`);
  }

  private async createOpenAIStream(
    messages: AIMessage[],
    options: { temperature: number; maxTokens: number; stream: boolean }
  ): Promise<ReadableStream<Uint8Array>> {
    if (!this.openaiClient) {
      throw new Error('OpenAI client not initialized');
    }

    const stream = await this.openaiClient.chat.completions.create({
      model: this.config.openai.model,
      messages: messages as Array<OpenAI.Chat.ChatCompletionMessageParam>,
      temperature: options.temperature,
      max_tokens: options.maxTokens,
      stream: true,
    });

    const encoder = new TextEncoder();
    return new ReadableStream({
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
  }

  private async createAnthropicStream(
    messages: AIMessage[],
    options: { temperature: number; maxTokens: number; stream: boolean }
  ): Promise<ReadableStream<Uint8Array>> {
    if (!this.anthropicClient) {
      throw new Error('Anthropic client not initialized');
    }

    // Convert messages format for Anthropic
    const systemMessage = messages.find(m => m.role === 'system')?.content || '';
    const conversationMessages = messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      }));

    const stream = await this.anthropicClient.messages.create({
      model: this.config.anthropic.model,
      max_tokens: options.maxTokens,
      temperature: options.temperature,
      system: systemMessage,
      messages: conversationMessages,
      stream: true,
    });

    const encoder = new TextEncoder();
    return new ReadableStream({
      async start(controller) {
        let responseText = '';
        
        for await (const chunk of stream) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            const content = chunk.delta.text;
            responseText += content;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
          }
        }
        
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, fullContent: responseText })}\n\n`));
        controller.close();
      }
    });
  }

  getProviderInfo(): { provider: string; model: string } {
    if (this.config.provider === 'openai') {
      return { provider: 'OpenAI', model: this.config.openai.model };
    } else if (this.config.provider === 'anthropic') {
      return { provider: 'Anthropic', model: this.config.anthropic.model };
    }
    return { provider: 'Unknown', model: 'Unknown' };
  }
} 