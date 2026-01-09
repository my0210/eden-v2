import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Model configuration - easy to swap providers later
export const MODELS = {
  // GPT-5.2 models (released Dec 11, 2025)
  thinking: 'gpt-5.2',           // For complex reasoning (plan generation)
  instant: 'gpt-5.2-chat-latest', // For fast responses (chat)
  pro: 'gpt-5.2-pro',            // For high-accuracy professional tasks
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
    console.log(`[AI] Calling model: ${MODELS[model]}`);
    
    // gpt-5.2-chat-latest doesn't support custom temperature
    const useTemperature = model !== 'instant';
    
    const response = await openai.chat.completions.create({
      model: MODELS[model],
      messages,
      ...(useTemperature ? { temperature } : {}),
      max_completion_tokens: maxTokens, // GPT-5.2 uses max_completion_tokens
      response_format: responseFormat === 'json' 
        ? { type: 'json_object' } 
        : { type: 'text' },
    });

    console.log(`[AI] Success - received ${response.choices[0]?.message?.content?.length || 0} chars`);
    return response.choices[0]?.message?.content || '';
  } catch (error: unknown) {
    const err = error as Error & { status?: number; code?: string };
    console.error('[AI] Error details:', {
      message: err.message,
      status: err.status,
      code: err.code,
      model: MODELS[model],
    });
    throw new Error(`AI error: ${err.message}`);
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
    max_completion_tokens: maxTokens, // GPT-5.2 uses max_completion_tokens
    stream: true,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) {
      yield content;
    }
  }
}

