import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { anthropic, MODELS } from '@/lib/ai/provider';
import { getCoreFiveSystemPrompt } from '@/lib/ai/prompts';
import { TOOL_DEFINITIONS, executeTool, ToolContext, ToolResult } from '@/lib/ai/tools';
import { ChatMessage } from '@/lib/types';
import { subWeeks } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { Pillar, PILLARS, PILLAR_CONFIGS, CoreFiveLog, getPillarProgress, getPrimeCoverage, getWeekStart } from '@/lib/v3/coreFive';
import Anthropic from '@anthropic-ai/sdk';

const MAX_TOOL_ITERATIONS = 5;

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

    // Build context for the system prompt
    const coreFiveContext = buildCoreFiveContext(logs);
    const systemPrompt = getCoreFiveSystemPrompt(coachingStyle, patternSummary, coreFiveContext);

    // Build conversation messages for Anthropic
    const conversationHistory = recentMessages.slice(-10).map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    const anthropicMessages: Anthropic.MessageParam[] = [
      ...conversationHistory,
      { role: 'user', content: message },
    ];

    // Tool execution context
    const toolContext: ToolContext = {
      userId: user.id,
      weekStart: weekStartStr,
      logs,
    };

    // ====================================================================
    // Agentic Loop: call Claude, execute tools, feed results back, repeat
    // ====================================================================
    const toolResults: ToolResult[] = [];
    let iterations = 0;

    let response = await anthropic.messages.create({
      model: MODELS.instant,
      system: systemPrompt,
      messages: anthropicMessages,
      tools: TOOL_DEFINITIONS,
      max_tokens: 4096,
    });

    console.log(`[Agent] Initial response - stop_reason: ${response.stop_reason}, content blocks: ${response.content.map(b => b.type).join(', ')}`);

    while (response.stop_reason === 'tool_use' && iterations < MAX_TOOL_ITERATIONS) {
      iterations++;

      // Extract tool_use blocks from response content
      const toolUseBlocks = response.content.filter(
        (block) => block.type === 'tool_use'
      ) as Array<{ type: 'tool_use'; id: string; name: string; input: Record<string, unknown> }>;

      console.log(`[Agent] Iteration ${iterations} - ${toolUseBlocks.length} tool calls: ${toolUseBlocks.map(b => b.name).join(', ')}`);

      // Execute each tool
      const toolResultBlocks: Anthropic.ToolResultBlockParam[] = [];
      for (const block of toolUseBlocks) {
        console.log(`[Agent] Executing tool: ${block.name}`, JSON.stringify(block.input));
        const result = await executeTool(block.name, block.input, toolContext);
        console.log(`[Agent] Tool result: ${block.name} success=${result.success}`, result.display?.type);
        toolResults.push(result);

        // Update logs context if a log was created
        if (result.success && block.name === 'log_activity') {
          const logData = result.data as { logId: string; pillar: Pillar; value: number };
          toolContext.logs = [...toolContext.logs, {
            id: logData.logId,
            userId: user.id,
            pillar: logData.pillar,
            value: logData.value,
            loggedAt: new Date().toISOString(),
            weekStart: weekStartStr,
            createdAt: new Date().toISOString(),
          }];
        }

        toolResultBlocks.push({
          type: 'tool_result',
          tool_use_id: block.id,
          content: JSON.stringify(result.data),
        });
      }

      // Append assistant message + tool results, call again
      anthropicMessages.push({
        role: 'assistant',
        content: response.content.map(block => {
          if (block.type === 'text') {
            return { type: 'text' as const, text: block.text };
          }
          if (block.type === 'tool_use') {
            return {
              type: 'tool_use' as const,
              id: block.id,
              name: block.name,
              input: block.input,
            };
          }
          return block;
        }),
      });
      anthropicMessages.push({ role: 'user', content: toolResultBlocks });

      response = await anthropic.messages.create({
        model: MODELS.instant,
        system: systemPrompt,
        messages: anthropicMessages,
        tools: TOOL_DEFINITIONS,
        max_tokens: 4096,
      });

      console.log(`[Agent] Follow-up response - stop_reason: ${response.stop_reason}, content blocks: ${response.content.map(b => b.type).join(', ')}`);
    }

    console.log(`[Agent] Final - ${iterations} tool iterations, ${toolResults.length} tool results`);

    // Extract final text from response
    const finalText = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map(block => block.text)
      .join('\n');

    // Build display actions from tool results
    const displayActions = toolResults
      .filter(r => r.success && r.display)
      .map(r => r.display!);

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
        content: finalText,
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

    // Check if any logs were created
    const hasLogs = toolResults.some(r =>
      r.success && r.display?.type === 'log_confirmation'
    );

    return NextResponse.json({
      message: finalText,
      toolResults: displayActions,
      hasLogs,
      success: true,
    });
  } catch (error) {
    console.error('Error in chat:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================================================
// Helpers
// ============================================================================

function buildCoreFiveContext(logs: CoreFiveLog[]): string {
  const lines = PILLARS.map(pillar => {
    const config = PILLAR_CONFIGS[pillar];
    const current = getPillarProgress(logs, pillar);
    const status = current >= config.weeklyTarget ? 'met' : `${config.weeklyTarget - current} ${config.unit} to go`;
    return `${config.name}: ${current}/${config.weeklyTarget} ${config.unit} (${status})`;
  });

  const coverage = getPrimeCoverage(logs);
  lines.push(`\nPrime Coverage: ${coverage}/5 pillars met`);

  const dow = new Date().getDay();
  const daysLeft = dow === 0 ? 1 : 8 - dow;
  lines.push(`Days left in week: ${daysLeft}`);

  return lines.join('\n');
}

function computePatternSummary(
  historyLogs: { pillar: Pillar; value: number; weekStart: string }[],
  currentWeekStart: string
): string {
  if (historyLogs.length === 0) return '';

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
