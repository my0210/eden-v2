import { generateJSON, Message } from './provider';
import { getSystemPrompt, getPlanGenerationPrompt } from './prompts';
import { UserProfile, WeeklyPlan, PlanItem, Domain, DayOfWeek } from '@/lib/types';
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
  domainIntros: {
    heart?: string;
    frame?: string;
    recovery?: string;
    metabolism?: string;
    mind?: string;
  };
  items: GeneratedPlanItem[];
}

/**
 * Generate a weekly plan for a user
 * @param startFromDay - Current day of week (0=Sunday, 1=Monday, etc.) to only generate items from today onwards
 */
export async function generateWeeklyPlan(
  profile: UserProfile,
  weekStartDate: string,
  previousWeekContext?: string,
  startFromDay?: number
): Promise<{
  edenIntro: string;
  domainIntros: Partial<Record<Domain, string>>;
  items: Omit<PlanItem, 'id' | 'weeklyPlanId' | 'createdAt'>[];
}> {
  const systemPrompt = getSystemPrompt(profile);
  const planPrompt = getPlanGenerationPrompt(profile, weekStartDate, previousWeekContext, startFromDay);

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

    // #region agent log
    console.log('[DEBUG] Raw AI result', JSON.stringify({hasItems:!!result.items,itemCount:result.items?.length,rawDomains:result.items?.map(i=>i.domain),rawDays:result.items?.map(i=>i.dayOfWeek)}));
    // #endregion

    // Transform and filter items to only include today and future days
    let items = result.items.map((item, index) => ({
      domain: item.domain,
      dayOfWeek: item.dayOfWeek as DayOfWeek,
      title: item.title,
      durationMinutes: item.durationMinutes || undefined,
      personalizationContext: item.personalizationContext,
      reasoning: item.reasoning,
      status: 'pending' as const,
      sortOrder: item.sortOrder ?? index,
    }));

    // Filter out past days if startFromDay is specified
    // #region agent log
    console.log('[DEBUG] Before filter', JSON.stringify({startFromDay,itemCountBefore:items.length}));
    // #endregion
    if (startFromDay !== undefined) {
      items = items.filter(item => {
        // Handle week wrapping (e.g., if today is Friday (5), include Sat (6), Sun (0))
        if (startFromDay === 0) {
          return item.dayOfWeek === 0; // Only Sunday
        }
        return item.dayOfWeek >= startFromDay || item.dayOfWeek === 0;
      });
    }
    // #region agent log
    console.log('[DEBUG] After filter', JSON.stringify({itemCountAfter:items.length,remainingDays:items.map(i=>i.dayOfWeek)}));
    // #endregion

    return {
      edenIntro: result.edenIntro,
      domainIntros: result.domainIntros || {},
      items,
    };
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error generating plan:', err.message);
    
    // Return a fallback plan structure with error info
    return {
      edenIntro: `I'm having trouble generating your personalized plan right now (${err.message}). Here's a basic structure to get you started. We'll refine it as I learn more about you.`,
      domainIntros: {},
      items: getDefaultPlanItems(startFromDay),
    };
  }
}

/**
 * Get default plan items as fallback
 * @param startFromDay - Filter to only include this day and future days
 */
function getDefaultPlanItems(startFromDay?: number): Omit<PlanItem, 'id' | 'weeklyPlanId' | 'createdAt'>[] {
  const allItems: Omit<PlanItem, 'id' | 'weeklyPlanId' | 'createdAt'>[] = [
    // Monday
    {
      domain: 'heart',
      dayOfWeek: 1 as DayOfWeek,
      title: 'Zone 2 cardio - 30 minutes',
      durationMinutes: 30,
      personalizationContext: 'Starting your week with aerobic base building',
      reasoning: 'Zone 2 training improves mitochondrial efficiency and cardiovascular health.',
      status: 'pending',
      sortOrder: 0,
    },
    {
      domain: 'recovery',
      dayOfWeek: 1 as DayOfWeek,
      title: 'Wind down routine by 10pm',
      durationMinutes: undefined,
      personalizationContext: 'Setting a consistent sleep schedule',
      reasoning: 'Consistent sleep timing helps regulate circadian rhythm.',
      status: 'pending',
      sortOrder: 1,
    },
    // Tuesday
    {
      domain: 'frame',
      dayOfWeek: 2 as DayOfWeek,
      title: 'Strength training - Upper body',
      durationMinutes: 45,
      personalizationContext: 'Building strength foundation',
      reasoning: 'Resistance training maintains muscle mass and metabolic health.',
      status: 'pending',
      sortOrder: 0,
    },
    {
      domain: 'metabolism',
      dayOfWeek: 2 as DayOfWeek,
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
      dayOfWeek: 3 as DayOfWeek,
      title: 'Zone 2 cardio - 35 minutes',
      durationMinutes: 35,
      personalizationContext: 'Building aerobic base',
      reasoning: 'Consistent zone 2 work builds cardiovascular efficiency.',
      status: 'pending',
      sortOrder: 0,
    },
    {
      domain: 'mind',
      dayOfWeek: 3 as DayOfWeek,
      title: 'Breathing practice - 5 minutes',
      durationMinutes: 5,
      personalizationContext: 'Midweek stress management',
      reasoning: 'Breathing exercises activate parasympathetic nervous system.',
      status: 'pending',
      sortOrder: 1,
    },
    // Thursday
    {
      domain: 'frame',
      dayOfWeek: 4 as DayOfWeek,
      title: 'Strength training - Lower body',
      durationMinutes: 45,
      personalizationContext: 'Balanced strength development',
      reasoning: 'Lower body training builds functional strength and bone density.',
      status: 'pending',
      sortOrder: 0,
    },
    {
      domain: 'recovery',
      dayOfWeek: 4 as DayOfWeek,
      title: 'No screens 30 min before bed',
      durationMinutes: undefined,
      personalizationContext: 'Improving sleep quality',
      reasoning: 'Blue light from screens suppresses melatonin production.',
      status: 'pending',
      sortOrder: 1,
    },
    // Friday
    {
      domain: 'heart',
      dayOfWeek: 5 as DayOfWeek,
      title: 'Zone 2 cardio - 30 minutes',
      durationMinutes: 30,
      personalizationContext: 'Maintaining aerobic consistency',
      reasoning: 'Regular zone 2 work compounds cardiovascular benefits.',
      status: 'pending',
      sortOrder: 0,
    },
    {
      domain: 'metabolism',
      dayOfWeek: 5 as DayOfWeek,
      title: 'Protein focus today',
      durationMinutes: undefined,
      personalizationContext: 'Supporting muscle recovery',
      reasoning: 'Adequate protein supports muscle protein synthesis.',
      status: 'pending',
      sortOrder: 1,
    },
    // Saturday
    {
      domain: 'heart',
      dayOfWeek: 6 as DayOfWeek,
      title: 'Longer Zone 2 session - 45 minutes',
      durationMinutes: 45,
      personalizationContext: 'Weekend extended aerobic work',
      reasoning: 'Longer sessions provide additional aerobic adaptation.',
      status: 'pending',
      sortOrder: 0,
    },
    {
      domain: 'mind',
      dayOfWeek: 6 as DayOfWeek,
      title: 'Mindfulness or meditation - 10 minutes',
      durationMinutes: 10,
      personalizationContext: 'Weekend recovery focus',
      reasoning: 'Mindfulness supports cognitive health and stress resilience.',
      status: 'pending',
      sortOrder: 1,
    },
    // Sunday
    {
      domain: 'recovery',
      dayOfWeek: 0 as DayOfWeek,
      title: 'Recovery day - Extra sleep if needed',
      durationMinutes: undefined,
      personalizationContext: 'Weekly recovery',
      reasoning: 'Recovery days allow for adaptation and restoration.',
      status: 'pending',
      sortOrder: 0,
    },
    {
      domain: 'mind',
      dayOfWeek: 0 as DayOfWeek,
      title: 'Week reflection and next week planning',
      durationMinutes: 15,
      personalizationContext: 'Intentional week transition',
      reasoning: 'Reflection reinforces positive habits and identifies improvements.',
      status: 'pending',
      sortOrder: 1,
    },
  ];

  // Filter to only include today and future days
  if (startFromDay !== undefined) {
    return allItems.filter(item => {
      if (startFromDay === 0) {
        return item.dayOfWeek === 0; // Only Sunday
      }
      return item.dayOfWeek >= startFromDay || item.dayOfWeek === 0;
    });
  }

  return allItems;
}

