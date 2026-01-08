import { generateJSON, Message } from './provider';
import { getSystemPrompt, getPlanGenerationPrompt } from './prompts';
import { UserProfile, WeeklyPlan, PlanItem, Domain } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

interface GeneratedPlanItem {
  domain: Domain;
  dayOfWeek: number;
  title: string;
  durationMinutes?: number;
  personalizationContext: string;
  reasoning: string;
  sortOrder: number;
}

interface GeneratedPlan {
  edenIntro: string;
  items: GeneratedPlanItem[];
}

/**
 * Generate a weekly plan for a user
 */
export async function generateWeeklyPlan(
  profile: UserProfile,
  weekStartDate: string,
  previousWeekContext?: string
): Promise<{
  edenIntro: string;
  items: Omit<PlanItem, 'id' | 'weeklyPlanId' | 'createdAt'>[];
}> {
  const systemPrompt = getSystemPrompt(profile);
  const planPrompt = getPlanGenerationPrompt(profile, weekStartDate, previousWeekContext);

  const messages: Message[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: planPrompt },
  ];

  try {
    const result = await generateJSON<GeneratedPlan>(messages, {
      model: 'thinking', // Use reasoning model for plan generation
      temperature: 0.7,
      maxTokens: 8192,
    });

    // Transform items to match our schema
    const items = result.items.map((item, index) => ({
      domain: item.domain,
      dayOfWeek: item.dayOfWeek,
      title: item.title,
      durationMinutes: item.durationMinutes || null,
      personalizationContext: item.personalizationContext,
      reasoning: item.reasoning,
      status: 'pending' as const,
      sortOrder: item.sortOrder ?? index,
    }));

    return {
      edenIntro: result.edenIntro,
      items,
    };
  } catch (error) {
    console.error('Error generating plan:', error);
    
    // Return a fallback plan structure
    return {
      edenIntro: "I'm having trouble generating your personalized plan right now. Here's a basic structure to get you started. We'll refine it as I learn more about you.",
      items: getDefaultPlanItems(),
    };
  }
}

/**
 * Get default plan items as fallback
 */
function getDefaultPlanItems(): Omit<PlanItem, 'id' | 'weeklyPlanId' | 'createdAt'>[] {
  return [
    // Monday
    {
      domain: 'heart',
      dayOfWeek: 1,
      title: 'Zone 2 cardio - 30 minutes',
      durationMinutes: 30,
      personalizationContext: 'Starting your week with aerobic base building',
      reasoning: 'Zone 2 training improves mitochondrial efficiency and cardiovascular health.',
      status: 'pending',
      sortOrder: 0,
    },
    {
      domain: 'sleep',
      dayOfWeek: 1,
      title: 'Wind down routine by 10pm',
      durationMinutes: null,
      personalizationContext: 'Setting a consistent sleep schedule',
      reasoning: 'Consistent sleep timing helps regulate circadian rhythm.',
      status: 'pending',
      sortOrder: 1,
    },
    // Tuesday
    {
      domain: 'muscle',
      dayOfWeek: 2,
      title: 'Strength training - Upper body',
      durationMinutes: 45,
      personalizationContext: 'Building strength foundation',
      reasoning: 'Resistance training maintains muscle mass and metabolic health.',
      status: 'pending',
      sortOrder: 0,
    },
    {
      domain: 'metabolism',
      dayOfWeek: 2,
      title: 'Post-lunch walk - 10 minutes',
      durationMinutes: 10,
      personalizationContext: 'Supporting glucose management',
      reasoning: 'Light walking after meals improves blood sugar response.',
      status: 'pending',
      sortOrder: 1,
    },
    // Wednesday
    {
      domain: 'heart',
      dayOfWeek: 3,
      title: 'Zone 2 cardio - 35 minutes',
      durationMinutes: 35,
      personalizationContext: 'Building aerobic base',
      reasoning: 'Consistent zone 2 work builds cardiovascular efficiency.',
      status: 'pending',
      sortOrder: 0,
    },
    {
      domain: 'mind',
      dayOfWeek: 3,
      title: 'Breathing practice - 5 minutes',
      durationMinutes: 5,
      personalizationContext: 'Midweek stress management',
      reasoning: 'Breathing exercises activate parasympathetic nervous system.',
      status: 'pending',
      sortOrder: 1,
    },
    // Thursday
    {
      domain: 'muscle',
      dayOfWeek: 4,
      title: 'Strength training - Lower body',
      durationMinutes: 45,
      personalizationContext: 'Balanced strength development',
      reasoning: 'Lower body training builds functional strength and bone density.',
      status: 'pending',
      sortOrder: 0,
    },
    {
      domain: 'sleep',
      dayOfWeek: 4,
      title: 'No screens 30 min before bed',
      durationMinutes: null,
      personalizationContext: 'Improving sleep quality',
      reasoning: 'Blue light from screens suppresses melatonin production.',
      status: 'pending',
      sortOrder: 1,
    },
    // Friday
    {
      domain: 'heart',
      dayOfWeek: 5,
      title: 'Zone 2 cardio - 30 minutes',
      durationMinutes: 30,
      personalizationContext: 'Maintaining aerobic consistency',
      reasoning: 'Regular zone 2 work compounds cardiovascular benefits.',
      status: 'pending',
      sortOrder: 0,
    },
    {
      domain: 'metabolism',
      dayOfWeek: 5,
      title: 'Protein focus today',
      durationMinutes: null,
      personalizationContext: 'Supporting muscle recovery',
      reasoning: 'Adequate protein supports muscle protein synthesis.',
      status: 'pending',
      sortOrder: 1,
    },
    // Saturday
    {
      domain: 'heart',
      dayOfWeek: 6,
      title: 'Longer Zone 2 session - 45 minutes',
      durationMinutes: 45,
      personalizationContext: 'Weekend extended aerobic work',
      reasoning: 'Longer sessions provide additional aerobic adaptation.',
      status: 'pending',
      sortOrder: 0,
    },
    {
      domain: 'mind',
      dayOfWeek: 6,
      title: 'Mindfulness or meditation - 10 minutes',
      durationMinutes: 10,
      personalizationContext: 'Weekend recovery focus',
      reasoning: 'Mindfulness supports cognitive health and stress resilience.',
      status: 'pending',
      sortOrder: 1,
    },
    // Sunday
    {
      domain: 'sleep',
      dayOfWeek: 0,
      title: 'Recovery day - Extra sleep if needed',
      durationMinutes: null,
      personalizationContext: 'Weekly recovery',
      reasoning: 'Recovery days allow for adaptation and restoration.',
      status: 'pending',
      sortOrder: 0,
    },
    {
      domain: 'mind',
      dayOfWeek: 0,
      title: 'Week reflection and next week planning',
      durationMinutes: 15,
      personalizationContext: 'Intentional week transition',
      reasoning: 'Reflection reinforces positive habits and identifies improvements.',
      status: 'pending',
      sortOrder: 1,
    },
  ];
}

