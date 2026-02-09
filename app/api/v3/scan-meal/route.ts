import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import OpenAI from 'openai';
import { getWeekStart } from '@/lib/v3/coreFive';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface MealAnalysis {
  onPlan: boolean;
  summary: string;
  foods: string[];
  reasoning: string;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { imageBase64 } = body;

    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return NextResponse.json({ error: 'Image data required' }, { status: 400 });
    }

    // Call OpenAI Vision API
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a meal analyzer for a health app. Analyze the food in the photo and determine if the meal is "on-plan" or "off-plan".

On-plan means: protein-forward, mostly whole foods, minimal processed/junk food. Think grilled meats, fish, vegetables, whole grains, legumes, fruits, nuts.

Off-plan means: heavily processed, high sugar, fast food, fried food, excessive refined carbs. Think pizza, fries, soda, candy, pastries.

Mixed meals: if the meal is mostly on-plan with minor off-plan elements, call it on-plan. Only call it off-plan if the majority of the meal is processed/junk.

Be concise and non-judgmental. No guilt. Just clarity.

Respond in JSON:
{
  "onPlan": true/false,
  "summary": "Brief 5-10 word description of the meal",
  "foods": ["food1", "food2", "food3"],
  "reasoning": "One sentence explaining why on-plan or off-plan"
}`
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Analyze this meal. Is it on-plan or off-plan?'
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`,
                detail: 'low',
              }
            }
          ]
        }
      ],
      max_tokens: 300,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from Vision API');
    }

    const analysis: MealAnalysis = JSON.parse(content);

    // Auto-log if on-plan
    let logId: string | null = null;
    if (analysis.onPlan) {
      const weekStart = getWeekStart(new Date());
      const { data: logData, error: logError } = await supabase
        .from('core_five_logs')
        .insert({
          user_id: user.id,
          pillar: 'clean_eating',
          value: 1,
          details: {
            type: 'meal_scan',
            foods: analysis.foods,
            summary: analysis.summary,
          },
          week_start: weekStart,
        })
        .select()
        .single();

      if (!logError && logData) {
        logId = logData.id;
      }
    }

    return NextResponse.json({
      analysis,
      logged: analysis.onPlan,
      logId,
    });
  } catch (error) {
    console.error('Meal scan error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze meal' },
      { status: 500 }
    );
  }
}
