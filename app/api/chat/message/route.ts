import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { generateJSON, Message } from '@/lib/ai/provider';
import { getCoreFiveSystemPrompt, getChatPrompt } from '@/lib/ai/prompts';
import { ChatMessage } from '@/lib/types';
import { startOfWeek, format, subWeeks } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { Pillar, PILLARS, PILLAR_CONFIGS, CoreFiveLog, getPillarProgress, getPrimeCoverage, getWeekStart } from '@/lib/v3/coreFive';

interface ChatAction {
  type: 'log' | 'deep_link' | 'timer' | 'generate_workout' | 'generate_grocery_list';
  pillar?: Pillar;
  value?: number;
  details?: Record<string, unknown>;
  url?: string;
  label?: string;
  workout?: {
    title: string;
    duration: string;
    exercises: { name: string; sets: number; reps: string }[];
  };
  groceryList?: {
    title: string;
    categories: { name: string; items: string[] }[];
  };
}

interface ChatResponse {
  response: string;
  suggestedPrompts: string[];
  action?: ChatAction | null;
  actions?: ChatAction[];
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

    // Fetch last 4 weeks of logs for pattern detection
    const fourWeeksAgo = getWeekStart(subWeeks(new Date(), 4));
    const { data: historyData } = await supabase
      .from('core_five_logs')
      .select('pillar, value, week_start')
      .eq('user_id', user.id)
      .gte('week_start', fourWeeksAgo);

    const historyLogs = (historyData || []).map(row => ({
      pillar: row.pillar as Pillar,
      value: row.value,
      weekStart: row.week_start,
    }));

    // Compute per-pillar pattern summary
    const patternSummary = computePatternSummary(historyLogs, weekStartStr);

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
    const systemPrompt = getCoreFiveSystemPrompt(coachingStyle, patternSummary);
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

    // Collect all actions (support both single action and actions array)
    const rawActions: ChatAction[] = [];
    if (chatResponse.actions && Array.isArray(chatResponse.actions)) {
      rawActions.push(...chatResponse.actions);
    } else if (chatResponse.action) {
      rawActions.push(chatResponse.action);
    }

    // Execute actions and collect results
    const executedActions: ChatAction[] = [];
    for (const action of rawActions) {
      if (action.type === 'log' && action.pillar && action.value) {
        const { pillar, value, details } = action;
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
            executedActions.push({
              type: 'log',
              pillar,
              value,
              details,
              label: `Logged ${value} ${PILLAR_CONFIGS[pillar].unit} of ${PILLAR_CONFIGS[pillar].name}`,
            });
          }
        }
      } else {
        // Pass through non-log actions for the frontend
        executedActions.push(action);
      }
    }

    // For backward compat, set action to first executed action
    const executedAction = executedActions.length > 0 ? executedActions[0] : null;

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
      actions: executedActions.length > 1 ? executedActions : undefined,
      success: true,
    });
  } catch (error) {
    console.error('Error in chat:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Compute a human-readable pattern summary from the last 4 weeks of logs.
 */
function computePatternSummary(
  historyLogs: { pillar: Pillar; value: number; weekStart: string }[],
  currentWeekStart: string
): string {
  if (historyLogs.length === 0) return '';

  // Get unique week starts (excluding current week)
  const pastWeeks = [...new Set(historyLogs.map(l => l.weekStart))]
    .filter(ws => ws !== currentWeekStart)
    .sort()
    .slice(-4);

  if (pastWeeks.length === 0) return '';

  const lines: string[] = [];

  for (const pillar of PILLARS) {
    const config = PILLAR_CONFIGS[pillar];
    let metCount = 0;

    for (const ws of pastWeeks) {
      const weekLogs = historyLogs.filter(l => l.pillar === pillar && l.weekStart === ws);
      const total = weekLogs.reduce((sum, l) => sum + l.value, 0);
      if (total >= config.weeklyTarget) metCount++;
    }

    if (metCount === pastWeeks.length) {
      lines.push(`${config.name}: hit target every week (strong)`);
    } else if (metCount === 0) {
      lines.push(`${config.name}: missed target every week (needs attention)`);
    } else {
      lines.push(`${config.name}: hit ${metCount}/${pastWeeks.length} weeks`);
    }
  }

  return lines.join('\n');
}
