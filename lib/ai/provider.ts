import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Model configuration - easy to swap providers later
export const MODELS = {
  // GPT-5.2 models
  thinking: 'gpt-5.2-thinking', // For complex reasoning (plan generation)
  instant: 'gpt-5.2-instant',   // For fast responses (chat)
  // Fallback models if needed
  fallback: 'gpt-4o',
} as const;

export type ModelType = keyof typeof MODELS;

export interface CompletionOptions {
  model?: ModelType;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: 'text' | 'json';
}

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Generate a completion from the LLM
 * Abstracted to allow easy provider switching in the future
 */
export async function generateCompletion(
  messages: Message[],
  options: CompletionOptions = {}
): Promise<string> {
  const {
    model = 'thinking',
    temperature = 0.7,
    maxTokens = 4096,
    responseFormat = 'text',
  } = options;

  try {
    const response = await openai.chat.completions.create({
      model: MODELS[model],
      messages,
      temperature,
      max_tokens: maxTokens,
      response_format: responseFormat === 'json' 
        ? { type: 'json_object' } 
        : { type: 'text' },
    });

    return response.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('LLM completion error:', error);
    throw new Error('Failed to generate AI response');
  }
}

/**
 * Generate a JSON response from the LLM
 */
export async function generateJSON<T>(
  messages: Message[],
  options: Omit<CompletionOptions, 'responseFormat'> = {}
): Promise<T> {
  const response = await generateCompletion(messages, {
    ...options,
    responseFormat: 'json',
  });

  try {
    return JSON.parse(response) as T;
  } catch (error) {
    console.error('Failed to parse JSON response:', response);
    throw new Error('Failed to parse AI response as JSON');
  }
}

/**
 * Stream a completion from the LLM
 * Useful for chat responses
 */
export async function* streamCompletion(
  messages: Message[],
  options: CompletionOptions = {}
): AsyncGenerator<string> {
  const {
    model = 'instant',
    temperature = 0.7,
    maxTokens = 2048,
  } = options;

  const stream = await openai.chat.completions.create({
    model: MODELS[model],
    messages,
    temperature,
    max_tokens: maxTokens,
    stream: true,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) {
      yield content;
    }
  }
}

