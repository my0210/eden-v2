/**
 * Tool Registry for the huuman agentic chat.
 * Each tool has an Anthropic tool definition and an executor function.
 */

import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';
import { Pillar, PILLARS, PILLAR_CONFIGS, CoreFiveLog, getPillarProgress, getPrimeCoverage, getWeekStart } from '@/lib/v3/coreFive';

// ============================================================================
// Types
// ============================================================================

export interface ToolContext {
  userId: string;
  weekStart: string;
  logs: CoreFiveLog[];
}

export interface ToolResult {
  success: boolean;
  data: unknown;
  /** What to display in the chat UI */
  display?: {
    type: 'log_confirmation' | 'progress_summary' | 'workout' | 'grocery_list' | 'deep_link' | 'timer' | 'scanner' | 'week_plan' | 'next_action';
    content: unknown;
    /** If true, the frontend should auto-trigger this action (e.g., open timer/scanner immediately) */
    autoTrigger?: boolean;
  };
}

interface ToolDefinition {
  definition: Anthropic.Tool;
  execute: (args: Record<string, unknown>, context: ToolContext) => Promise<ToolResult>;
}

// ============================================================================
// Tool Definitions
// ============================================================================

const logActivity: ToolDefinition = {
  definition: {
    name: 'log_activity',
    description: 'Log an activity for a Core Five pillar. Use this when the user wants to record cardio minutes, strength sessions, sleep hours, clean eating days, or mindfulness minutes.',
    input_schema: {
      type: 'object' as const,
      properties: {
        pillar: {
          type: 'string',
          enum: ['cardio', 'strength', 'sleep', 'clean_eating', 'mindfulness'],
          description: 'The Core Five pillar to log',
        },
        value: {
          type: 'number',
          description: 'The value to log: minutes for cardio/mindfulness, sessions for strength, hours for sleep, days for clean_eating',
        },
        details: {
          type: 'object',
          description: 'Optional details (e.g., { type: "run" } for cardio, { quality: 4 } for sleep)',
        },
      },
      required: ['pillar', 'value'],
    },
  },
  execute: async (args, context) => {
    const pillar = args.pillar as Pillar;
    const value = args.value as number;
    const details = args.details as Record<string, unknown> | undefined;

    if (!PILLARS.includes(pillar) || typeof value !== 'number' || value <= 0) {
      return { success: false, data: { error: 'Invalid pillar or value' } };
    }

    const supabase = await createClient();
    const { data: logData, error } = await supabase
      .from('core_five_logs')
      .insert({
        user_id: context.userId,
        pillar,
        value,
        details: details || null,
        week_start: context.weekStart,
      })
      .select()
      .single();

    if (error) {
      return { success: false, data: { error: error.message } };
    }

    const config = PILLAR_CONFIGS[pillar];
    const newTotal = getPillarProgress(context.logs, pillar) + value;
    const isMet = newTotal >= config.weeklyTarget;

    return {
      success: true,
      data: {
        logId: logData.id,
        pillar,
        value,
        newTotal,
        target: config.weeklyTarget,
        unit: config.unit,
        isMet,
      },
      display: {
        type: 'log_confirmation',
        content: {
          pillar,
          value,
          unit: config.unit,
          label: `Logged ${value} ${config.unit} of ${config.name}`,
          newTotal,
          target: config.weeklyTarget,
          isMet,
        },
      },
    };
  },
};

const editLog: ToolDefinition = {
  definition: {
    name: 'edit_log',
    description: 'Edit or delete a recent log entry. Use when the user says something like "that was actually 20 min not 30", "undo that", "delete that log", or "change my last log". You can update the value or delete the entry entirely.',
    input_schema: {
      type: 'object' as const,
      properties: {
        action: {
          type: 'string',
          enum: ['update', 'delete'],
          description: 'Whether to update the value or delete the entry',
        },
        pillar: {
          type: 'string',
          enum: ['cardio', 'strength', 'sleep', 'clean_eating', 'mindfulness'],
          description: 'The pillar of the log to edit (used to find the most recent matching entry)',
        },
        new_value: {
          type: 'number',
          description: 'The corrected value (only for update action)',
        },
      },
      required: ['action', 'pillar'],
    },
  },
  execute: async (args, context) => {
    const action = args.action as 'update' | 'delete';
    const pillar = args.pillar as Pillar;
    const newValue = args.new_value as number | undefined;

    // Find the most recent log for this pillar
    const recentLog = [...context.logs]
      .filter(l => l.pillar === pillar)
      .sort((a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime())[0];

    if (!recentLog) {
      return { success: false, data: { error: `No recent ${pillar} log found to ${action}` } };
    }

    const supabase = await createClient();
    const config = PILLAR_CONFIGS[pillar];

    if (action === 'delete') {
      const { error } = await supabase
        .from('core_five_logs')
        .delete()
        .eq('id', recentLog.id)
        .eq('user_id', context.userId);

      if (error) {
        return { success: false, data: { error: error.message } };
      }

      const newTotal = getPillarProgress(context.logs, pillar) - recentLog.value;

      return {
        success: true,
        data: {
          action: 'deleted',
          pillar,
          deletedValue: recentLog.value,
          newTotal: Math.max(0, newTotal),
          target: config.weeklyTarget,
          unit: config.unit,
        },
        display: {
          type: 'log_confirmation',
          content: {
            pillar,
            value: -recentLog.value,
            unit: config.unit,
            label: `Removed ${recentLog.value} ${config.unit} of ${config.name}`,
            newTotal: Math.max(0, newTotal),
            target: config.weeklyTarget,
            isMet: Math.max(0, newTotal) >= config.weeklyTarget,
          },
        },
      };
    }

    // Update
    if (typeof newValue !== 'number' || newValue < 0) {
      return { success: false, data: { error: 'new_value is required for update' } };
    }

    const { error } = await supabase
      .from('core_five_logs')
      .update({ value: newValue })
      .eq('id', recentLog.id)
      .eq('user_id', context.userId);

    if (error) {
      return { success: false, data: { error: error.message } };
    }

    const diff = newValue - recentLog.value;
    const newTotal = getPillarProgress(context.logs, pillar) + diff;

    return {
      success: true,
      data: {
        action: 'updated',
        pillar,
        oldValue: recentLog.value,
        newValue,
        newTotal,
        target: config.weeklyTarget,
        unit: config.unit,
      },
      display: {
        type: 'log_confirmation',
        content: {
          pillar,
          value: newValue,
          unit: config.unit,
          label: `Updated ${config.name}: ${recentLog.value} → ${newValue} ${config.unit}`,
          newTotal,
          target: config.weeklyTarget,
          isMet: newTotal >= config.weeklyTarget,
        },
      },
    };
  },
};

const getWeeklyProgress: ToolDefinition = {
  definition: {
    name: 'get_weekly_progress',
    description: 'Get the current Core Five progress for this week. Returns each pillar\'s current value, target, and whether it\'s met. Use this to understand where the user stands before making recommendations.',
    input_schema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  },
  execute: async (_args, context) => {
    const progress = PILLARS.map(pillar => {
      const config = PILLAR_CONFIGS[pillar];
      const current = getPillarProgress(context.logs, pillar);
      return {
        pillar,
        name: config.name,
        current,
        target: config.weeklyTarget,
        unit: config.unit,
        met: current >= config.weeklyTarget,
        remaining: Math.max(0, config.weeklyTarget - current),
      };
    });

    const coverage = getPrimeCoverage(context.logs);
    const daysLeft = getDaysLeftInWeek();

    return {
      success: true,
      data: {
        progress,
        coverage,
        totalPillars: 5,
        inPrime: coverage === 5,
        daysLeftInWeek: daysLeft,
      },
      display: {
        type: 'progress_summary',
        content: { progress, coverage, daysLeft },
      },
    };
  },
};

const getRecentLogs: ToolDefinition = {
  definition: {
    name: 'get_recent_logs',
    description: 'Get individual log entries for the current week. Returns the actual log entries (not just totals) so you can reference specific activities: "you logged a 45 min run yesterday." Use when you need to see what the user actually did, not just their totals.',
    input_schema: {
      type: 'object' as const,
      properties: {
        pillar: {
          type: 'string',
          enum: ['cardio', 'strength', 'sleep', 'clean_eating', 'mindfulness'],
          description: 'Optional: filter to a specific pillar. Omit to get all logs.',
        },
      },
      required: [],
    },
  },
  execute: async (args, context) => {
    const pillarFilter = args.pillar as Pillar | undefined;

    let filteredLogs = context.logs;
    if (pillarFilter && PILLARS.includes(pillarFilter)) {
      filteredLogs = context.logs.filter(l => l.pillar === pillarFilter);
    }

    // Sort by date, most recent first
    const sorted = [...filteredLogs].sort(
      (a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime()
    );

    // Format for readability
    const entries = sorted.map(log => {
      const config = PILLAR_CONFIGS[log.pillar];
      const date = new Date(log.loggedAt);
      const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()];
      const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
      return {
        id: log.id,
        pillar: log.pillar,
        pillarName: config.name,
        value: log.value,
        unit: config.unit,
        details: log.details,
        day: dayName,
        time: timeStr,
        loggedAt: log.loggedAt,
      };
    });

    return {
      success: true,
      data: {
        entries,
        count: entries.length,
      },
    };
  },
};

const planRemainingWeek: ToolDefinition = {
  definition: {
    name: 'plan_remaining_week',
    description: 'Create a day-by-day plan for hitting remaining pillar targets this week. Use when the user says "help me hit cardio", "plan my week", "what should I do to get to prime", etc. Takes the gaps and creates a specific actionable plan.',
    input_schema: {
      type: 'object' as const,
      properties: {
        focus_pillars: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['cardio', 'strength', 'sleep', 'clean_eating', 'mindfulness'],
          },
          description: 'Which pillars to plan for. Omit to plan for all pillars with remaining gaps.',
        },
        plan: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              day: { type: 'string', description: 'Day name (e.g., "Tuesday", "Wednesday")' },
              activities: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    pillar: { type: 'string' },
                    activity: { type: 'string', description: 'Specific activity (e.g., "30 min run", "Upper body session")' },
                    value: { type: 'number', description: 'Value that would be logged' },
                    unit: { type: 'string' },
                  },
                  required: ['pillar', 'activity', 'value', 'unit'],
                },
              },
            },
            required: ['day', 'activities'],
          },
          description: 'Day-by-day plan with specific activities',
        },
        summary: {
          type: 'string',
          description: 'Brief summary of the plan (e.g., "3 cardio sessions across Tue/Thu/Sat to close the 90 min gap")',
        },
      },
      required: ['plan', 'summary'],
    },
  },
  execute: async (args) => {
    const plan = args.plan as Array<{
      day: string;
      activities: Array<{ pillar: string; activity: string; value: number; unit: string }>;
    }>;
    const summary = args.summary as string;

    return {
      success: true,
      data: { plan, summary },
      display: {
        type: 'week_plan',
        content: { plan, summary },
      },
    };
  },
};

const suggestNextAction: ToolDefinition = {
  definition: {
    name: 'suggest_next_action',
    description: 'Evaluate the user\'s current state (time of day, progress gaps, patterns) and determine the single highest-leverage action they should take right now. Use after checking progress to give a specific, actionable recommendation.',
    input_schema: {
      type: 'object' as const,
      properties: {
        suggestion: {
          type: 'string',
          description: 'The specific suggested action (e.g., "Go for a 25 min walk", "Do 10 min breathwork before bed")',
        },
        pillar: {
          type: 'string',
          enum: ['cardio', 'strength', 'sleep', 'clean_eating', 'mindfulness'],
          description: 'Which pillar this action targets',
        },
        reasoning: {
          type: 'string',
          description: 'Brief reason why this is the highest-leverage action right now',
        },
        value: {
          type: 'number',
          description: 'How much this would log if completed',
        },
        unit: {
          type: 'string',
          description: 'Unit for the value (min, sessions, hrs, days)',
        },
      },
      required: ['suggestion', 'pillar', 'reasoning'],
    },
  },
  execute: async (args) => {
    return {
      success: true,
      data: {
        suggestion: args.suggestion,
        pillar: args.pillar,
        reasoning: args.reasoning,
        value: args.value,
        unit: args.unit,
      },
      display: {
        type: 'next_action',
        content: {
          suggestion: args.suggestion as string,
          pillar: args.pillar as string,
          reasoning: args.reasoning as string,
          value: args.value as number | undefined,
          unit: args.unit as string | undefined,
        },
      },
    };
  },
};

const generateWorkout: ToolDefinition = {
  definition: {
    name: 'generate_workout',
    description: 'Generate a structured strength workout routine. Use this when the user asks for a workout, exercise plan, or strength session.',
    input_schema: {
      type: 'object' as const,
      properties: {
        focus: {
          type: 'string',
          enum: ['upper', 'lower', 'full', 'push', 'pull', 'core'],
          description: 'Workout focus area',
        },
        duration: {
          type: 'string',
          description: 'Target duration (e.g., "30 min", "45 min")',
        },
        equipment: {
          type: 'string',
          description: 'Available equipment (e.g., "gym", "home", "bodyweight", "dumbbells")',
        },
        title: {
          type: 'string',
          description: 'Workout title',
        },
        exercises: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              sets: { type: 'number' },
              reps: { type: 'string' },
            },
            required: ['name', 'sets', 'reps'],
          },
          description: 'Array of exercises with name, sets, and reps',
        },
      },
      required: ['title', 'duration', 'exercises'],
    },
  },
  execute: async (args) => {
    const workout = {
      title: args.title as string,
      duration: args.duration as string,
      exercises: args.exercises as { name: string; sets: number; reps: string }[],
    };

    return {
      success: true,
      data: workout,
      display: {
        type: 'workout',
        content: workout,
      },
    };
  },
};

const generateGroceryList: ToolDefinition = {
  definition: {
    name: 'generate_grocery_list',
    description: 'Generate a protein-forward grocery shopping list. Use this when the user asks for meal prep help, grocery list, or shopping list.',
    input_schema: {
      type: 'object' as const,
      properties: {
        title: {
          type: 'string',
          description: 'List title (e.g., "Weekly Protein-Forward Shopping List")',
        },
        categories: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Category name (e.g., Proteins, Vegetables)' },
              items: { type: 'array', items: { type: 'string' }, description: 'Items in this category' },
            },
            required: ['name', 'items'],
          },
          description: 'Shopping categories with items',
        },
      },
      required: ['title', 'categories'],
    },
  },
  execute: async (args) => {
    const groceryList = {
      title: args.title as string,
      categories: args.categories as { name: string; items: string[] }[],
    };

    return {
      success: true,
      data: groceryList,
      display: {
        type: 'grocery_list',
        content: groceryList,
      },
    };
  },
};

const findNearby: ToolDefinition = {
  definition: {
    name: 'find_nearby',
    description: 'Generate a Google Maps search link for nearby places. Use for finding gyms, running trails, healthy restaurants, yoga studios, etc.',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: 'Search query (e.g., "gym near me", "running trail", "healthy restaurant")',
        },
        label: {
          type: 'string',
          description: 'Display label for the link (e.g., "Find a gym nearby")',
        },
      },
      required: ['query', 'label'],
    },
  },
  execute: async (args) => {
    const query = args.query as string;
    const label = args.label as string;
    const url = `https://www.google.com/maps/search/${encodeURIComponent(query)}`;

    return {
      success: true,
      data: { url, label, query },
      display: {
        type: 'deep_link',
        content: { url, label },
      },
    };
  },
};

const startTimer: ToolDefinition = {
  definition: {
    name: 'start_timer',
    description: 'Start the built-in breathwork/meditation timer immediately. The timer opens automatically — the user does not need to tap anything. Use when the user wants to do breathwork, meditation, or a timed mindfulness session.',
    input_schema: {
      type: 'object' as const,
      properties: {
        minutes: {
          type: 'number',
          description: 'Timer duration in minutes (default 5)',
        },
      },
      required: ['minutes'],
    },
  },
  execute: async (args) => {
    const minutes = (args.minutes as number) || 5;

    return {
      success: true,
      data: { minutes },
      display: {
        type: 'timer',
        content: { minutes, label: `Starting ${minutes} min breathwork...` },
        autoTrigger: true,
      },
    };
  },
};

const scanMeal: ToolDefinition = {
  definition: {
    name: 'scan_meal',
    description: 'Open the camera immediately to scan a meal and determine if it\'s on-plan. The camera opens automatically — the user does not need to tap anything. Use when the user mentions scanning food, taking a meal photo, or checking if a meal is healthy.',
    input_schema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  },
  execute: async () => {
    return {
      success: true,
      data: { action: 'open_scanner' },
      display: {
        type: 'scanner',
        content: { label: 'Opening meal scanner...' },
        autoTrigger: true,
      },
    };
  },
};

// ============================================================================
// Registry
// ============================================================================

export const TOOL_REGISTRY: Record<string, ToolDefinition> = {
  log_activity: logActivity,
  edit_log: editLog,
  get_weekly_progress: getWeeklyProgress,
  get_recent_logs: getRecentLogs,
  plan_remaining_week: planRemainingWeek,
  suggest_next_action: suggestNextAction,
  generate_workout: generateWorkout,
  generate_grocery_list: generateGroceryList,
  find_nearby: findNearby,
  start_timer: startTimer,
  scan_meal: scanMeal,
};

/** Tool definitions array for the Anthropic API */
export const TOOL_DEFINITIONS: Anthropic.Tool[] = Object.values(TOOL_REGISTRY).map(t => t.definition);

/** Execute a tool by name */
export async function executeTool(
  name: string,
  args: Record<string, unknown>,
  context: ToolContext
): Promise<ToolResult> {
  const tool = TOOL_REGISTRY[name];
  if (!tool) {
    return { success: false, data: { error: `Unknown tool: ${name}` } };
  }

  try {
    return await tool.execute(args, context);
  } catch (error) {
    console.error(`[Tool] Error executing ${name}:`, error);
    return { success: false, data: { error: `Tool execution failed: ${(error as Error).message}` } };
  }
}

// ============================================================================
// Helpers
// ============================================================================

function getDaysLeftInWeek(): number {
  const dow = new Date().getDay();
  if (dow === 0) return 1; // Sunday
  return 8 - dow;
}
