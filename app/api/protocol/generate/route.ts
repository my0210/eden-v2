import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateProtocol } from '@/lib/ai/protocolGeneration';
import { startOfWeek, addDays } from 'date-fns';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Check for existing active protocol
    const { data: existingProtocol } = await supabase
      .from('protocols')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (existingProtocol) {
      return NextResponse.json(
        { error: 'Active protocol already exists. Complete or pause it first.' },
        { status: 400 }
      );
    }

    // Parse optional start date from request body
    let startDate: Date;
    try {
      const body = await request.json();
      startDate = body.startDate ? new Date(body.startDate) : new Date();
    } catch {
      startDate = new Date();
    }

    // Align to Monday
    const weekStart = startOfWeek(startDate, { weekStartsOn: 1 });
    // If today is before Monday, use next Monday
    const protocolStart = startDate < weekStart ? addDays(weekStart, 7) : weekStart;

    // Transform profile to match UserProfile type
    const userProfile = {
      id: profile.id,
      email: profile.email || '',
      goals: profile.goals || { primary: [], primeSpanMeaning: '' },
      constraints: profile.constraints || {
        schedule: { workHours: '', blockedTimes: [], preferredWorkoutTimes: [] },
        equipment: { gymAccess: false, homeEquipment: [], outdoorAccess: false },
        limitations: { injuries: [], medical: [] },
        capacity: { maxWorkoutDays: 3, maxDailyHealthMinutes: 30 },
      },
      coachingStyle: profile.coaching_style || { tone: 'supportive', density: 'balanced', formality: 'casual' },
      currentFitnessLevel: profile.current_fitness_level || 'moderate',
      onboardingCompleted: profile.onboarding_completed || false,
      isAdmin: profile.is_admin || false,
      unitSystem: profile.unit_system || 'metric',
      createdAt: profile.created_at,
      updatedAt: profile.updated_at,
    };

    // Generate protocol
    const protocol = await generateProtocol(userProfile, protocolStart);

    // Insert into database (simplified schema)
    const { data: newProtocol, error: insertError } = await supabase
      .from('protocols')
      .insert({
        user_id: user.id,
        start_date: protocol.startDate,
        end_date: protocol.endDate,
        status: protocol.status,
        goal_summary: protocol.goalSummary,
        narrative: protocol.narrative,
        recommended_activities: protocol.recommendedActivities,
        weeks: protocol.weeks,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting protocol:', insertError);
      return NextResponse.json({ error: 'Failed to save protocol' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      protocol: {
        id: newProtocol.id,
        userId: newProtocol.user_id,
        startDate: newProtocol.start_date,
        endDate: newProtocol.end_date,
        status: newProtocol.status,
        goalSummary: newProtocol.goal_summary,
        narrative: newProtocol.narrative,
        recommendedActivities: newProtocol.recommended_activities,
        weeks: newProtocol.weeks,
        createdAt: newProtocol.created_at,
        updatedAt: newProtocol.updated_at,
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Protocol generation error:', err.message);
    return NextResponse.json(
      { error: 'Failed to generate protocol', details: err.message },
      { status: 500 }
    );
  }
}
