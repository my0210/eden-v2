import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { generateJSON, Message } from '@/lib/ai/provider';
import { getCoreFiveSystemPrompt, getChatPrompt } from '@/lib/ai/prompts';
import { ChatMessage } from '@/lib/types';
import { startOfWeek, format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { Pillar, PILLARS, PILLAR_CONFIGS, CoreFiveLog, getPillarProgress, getWeekStart } from '@/lib/v3/coreFive';

interface ChatAction {
  type: 'log' | 'deep_link' | 'timer';
  pillar?: Pillar;
  value?: number;
  details?: Record<string, unknown>;
  url?: string;
  label?: string;
}

interface ChatResponse {
  response: string;
  suggestedPrompts: string[];
  action?: ChatAction | null;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { message } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message required' }, { status: 400 });
    }

    // Get user profile (for coaching style)
    const { data: profileData } = await supabase
      .from('user_profiles')
      .select('coaching_style')
      .eq('id', user.id)
      .single();

    const coachingStyle = profileData?.coaching_style || {
      tone: 'supportive',
      density: 'balanced',
      formality: 'casual',
    };

    // Get this week's Core Five logs
    const weekStartStr = getWeekStart(new Date());

    const { data: logsData } = await supabase
      .from('core_five_logs')
      .select('*')
      .eq('user_id', user.id)
      .eq('week_start', weekStartStr)
      .order('logged_at', { ascending: false });

    const logs: CoreFiveLog[] = (logsData || []).map(row => ({
      id: row.id,
      userId: row.user_id,
      pillar: row.pillar as Pillar,
      value: row.value,
      details: row.details,
      loggedAt: row.logged_at,
      weekStart: row.week_start,
      createdAt: row.created_at,
    }));

    // Build per-pillar progress
    const coreFiveProgress = PILLARS.map(pillar => {
      const config = PILLAR_CONFIGS[pillar];
      const current = getPillarProgress(logs, pillar);
      return {
        pillar,
        current,
        target: config.weeklyTarget,
        unit: config.unit,
        met: current >= config.weeklyTarget,
      };
    });

    // Get recent conversation history
    const { data: conversationData } = await supabase
      .from('conversations')
      .select('messages')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const recentMessages: ChatMessage[] = conversationData?.messages || [];
    const conversationHistory = recentMessages.slice(-10).map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    // Build messages for LLM
    const systemPrompt = getCoreFiveSystemPrompt(coachingStyle);
    const chatPrompt = getChatPrompt(coreFiveProgress, conversationHistory, message);

    const messages: Message[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: chatPrompt },
    ];

    // Generate response
    let chatResponse: ChatResponse;
    try {
      chatResponse = await generateJSON<ChatResponse>(messages, {
        model: 'instant',
        temperature: 0.7,
        maxTokens: 2048,
      });
      
      if (!chatResponse.response || typeof chatResponse.response !== 'string') {
        throw new Error('Invalid response structure');
      }
    } catch (err) {
      console.error('[Chat] JSON generation failed:', err);
      
      // Fallback: try plain text completion
      try {
        const { generateCompletion } = await import('@/lib/ai/provider');
        const plainResponse = await generateCompletion(messages, {
          model: 'instant',
          temperature: 0.7,
          maxTokens: 1024,
        });
        
        chatResponse = {
          response: plainResponse,
          suggestedPrompts: [
            "How's my week looking?",
            "What should I focus on today?",
          ],
          action: null,
        };
      } catch (fallbackErr) {
        console.error('[Chat] Fallback also failed:', fallbackErr);
        chatResponse = {
          response: "I'm having trouble responding right now. Please try again.",
          suggestedPrompts: [
            "How's my week looking?",
            "What should I focus on today?",
          ],
          action: null,
        };
      }
    }

    // Execute log action if present
    let executedAction: ChatAction | null = null;
    if (chatResponse.action && chatResponse.action.type === 'log' && chatResponse.action.pillar && chatResponse.action.value) {
      const { pillar, value, details } = chatResponse.action;
      
      if (PILLARS.includes(pillar) && typeof value === 'number' && value > 0) {
        const { data: logData, error: logError } = await supabase
          .from('core_five_logs')
          .insert({
            user_id: user.id,
            pillar,
            value,
            details: details || null,
            week_start: weekStartStr,
          })
          .select()
          .single();

        if (!logError && logData) {
          executedAction = {
            type: 'log',
            pillar,
            value,
            details,
            label: `Logged ${value} ${PILLAR_CONFIGS[pillar].unit} of ${PILLAR_CONFIGS[pillar].name}`,
          };
        }
      }
    } else if (chatResponse.action && chatResponse.action.type !== 'log') {
      // Pass through deep_link and timer actions for the frontend to handle
      executedAction = chatResponse.action;
    }

    // Save conversation
    const newMessages: ChatMessage[] = [
      ...recentMessages,
      {
        id: uuidv4(),
        role: 'user',
        content: message,
        timestamp: new Date().toISOString(),
      },
      {
        id: uuidv4(),
        role: 'assistant',
        content: chatResponse.response,
        timestamp: new Date().toISOString(),
      },
    ];

    if (conversationData) {
      await supabase
        .from('conversations')
        .update({ messages: newMessages })
        .eq('user_id', user.id);
    } else {
      await supabase
        .from('conversations')
        .insert({
          user_id: user.id,
          messages: newMessages,
          context: {},
        });
    }

    return NextResponse.json({ 
      message: chatResponse.response,
      suggestedPrompts: chatResponse.suggestedPrompts || [],
      action: executedAction,
      success: true,
    });
  } catch (error) {
    console.error('Error in chat:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
