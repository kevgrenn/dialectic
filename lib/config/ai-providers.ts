export type AIProvider = 'openai' | 'anthropic';

export interface AIConfig {
  provider: AIProvider;
  openai: {
    apiKey: string;
    model: string;
  };
  anthropic: {
    apiKey: string;
    model: string;
  };
}

export const getAIConfig = (): AIConfig => {
  // Default to Anthropic (Claude Sonnet) as requested, but allow override via env var
  const provider = (process.env.AI_PROVIDER as AIProvider) || 'anthropic';
  
  return {
    provider,
    openai: {
      apiKey: process.env.OPENAI_API_KEY || '',
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    },
    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY || '',
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',
    },
  };
};

export const validateAIConfig = (config: AIConfig): string | null => {
  if (config.provider === 'openai' && !config.openai.apiKey) {
    return 'OpenAI API key not configured. Please set the OPENAI_API_KEY environment variable.';
  }
  
  if (config.provider === 'anthropic' && !config.anthropic.apiKey) {
    return 'Anthropic API key not configured. Please set the ANTHROPIC_API_KEY environment variable.';
  }
  
  return null;
}; 