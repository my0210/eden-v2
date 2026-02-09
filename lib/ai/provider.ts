import Anthropic from '@anthropic-ai/sdk';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export { anthropic };

// Model configuration
export const MODELS = {
  thinking: 'claude-sonnet-4-20250514',
  instant: 'claude-sonnet-4-20250514',
  pro: 'claude-sonnet-4-20250514',
  fallback: 'claude-sonnet-4-20250514',
} as const;

export type ModelType = keyof typeof MODELS;

export interface CompletionOptions {
  model?: ModelType;
  temperature?: number;
  maxTokens?: number;
}

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Generate a text completion from Claude.
 * Extracts system message and sends remaining as conversation.
 */
export async function generateCompletion(
  messages: Message[],
  options: CompletionOptions = {}
): Promise<string> {
  const {
    model = 'thinking',
    temperature = 0.7,
    maxTokens = 4096,
  } = options;

  // Extract system message
  const systemMsg = messages.find(m => m.role === 'system');
  const conversationMessages = messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

  try {
    console.log(`[AI] Calling model: ${MODELS[model]}`);

    const response = await anthropic.messages.create({
      model: MODELS[model],
      system: systemMsg?.content || '',
      messages: conversationMessages,
      temperature,
      max_tokens: maxTokens,
    });

    const text = response.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('');

    console.log(`[AI] Success - received ${text.length} chars`);
    return text;
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
 * Generate a JSON response from Claude.
 * Instructs Claude to respond in JSON and parses the result.
 */
export async function generateJSON<T>(
  messages: Message[],
  options: Omit<CompletionOptions, 'responseFormat'> = {}
): Promise<T> {
  // Add JSON instruction to the last user message
  const enhancedMessages = messages.map((m, i) => {
    if (i === messages.length - 1 && m.role === 'user') {
      return {
        ...m,
        content: m.content + '\n\nRespond with valid JSON only. No markdown, no code fences, just the JSON object.',
      };
    }
    return m;
  });

  const response = await generateCompletion(enhancedMessages, options);

  try {
    // Strip any markdown code fences if present
    const cleaned = response.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    return JSON.parse(cleaned) as T;
  } catch (error) {
    console.error('Failed to parse JSON response:', response);
    throw new Error('Failed to parse AI response as JSON');
  }
}
