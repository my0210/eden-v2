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
    type: 'log_confirmation' | 'progress_summary' | 'workout' | 'grocery_list' | 'deep_link' | 'timer' | 'scanner';
    content: unknown;
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
    description: 'Start the built-in breathwork/meditation timer. Use when the user wants to do breathwork, meditation, or a timed mindfulness session.',
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
        content: { minutes, label: `Start ${minutes} min breathwork` },
      },
    };
  },
};

const scanMeal: ToolDefinition = {
  definition: {
    name: 'scan_meal',
    description: 'Open the camera to scan a meal and determine if it\'s on-plan. Use when the user mentions scanning food, taking a meal photo, or checking if a meal is healthy.',
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
        content: { label: 'Open meal scanner' },
      },
    };
  },
};

// ============================================================================
// Registry
// ============================================================================

export const TOOL_REGISTRY: Record<string, ToolDefinition> = {
  log_activity: logActivity,
  get_weekly_progress: getWeeklyProgress,
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
