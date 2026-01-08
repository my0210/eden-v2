import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { generateCompletion, Message } from '@/lib/ai/provider';
import { getSystemPrompt, getChatPrompt } from '@/lib/ai/prompts';
import { UserProfile, WeeklyPlan, ChatMessage } from '@/lib/types';
import { startOfWeek, format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { message, context } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message required' }, { status: 400 });
    }

    // Get user profile
    const { data: profileData } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!profileData) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const profile: UserProfile = {
      id: profileData.id,
      email: profileData.email,
      goals: profileData.goals,
      constraints: profileData.constraints,
      coachingStyle: profileData.coaching_style,
      currentFitnessLevel: profileData.current_fitness_level,
      onboardingCompleted: profileData.onboarding_completed,
      createdAt: profileData.created_at,
      updatedAt: profileData.updated_at,
    };

    // Get current week's plan
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const weekStartStr = format(weekStart, 'yyyy-MM-dd');

    const { data: planData } = await supabase
      .from('weekly_plans')
      .select('*, plan_items(*)')
      .eq('user_id', user.id)
      .eq('week_start_date', weekStartStr)
      .single();

    const currentPlan: WeeklyPlan | null = planData ? {
      id: planData.id,
      userId: planData.user_id,
      weekStartDate: planData.week_start_date,
      edenIntro: planData.eden_intro,
      generationContext: planData.generation_context,
      items: planData.plan_items || [],
      createdAt: planData.created_at,
    } : null;

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
    const systemPrompt = getSystemPrompt(profile);
    const chatPrompt = getChatPrompt(profile, currentPlan, conversationHistory, message);

    const messages: Message[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: chatPrompt },
    ];

    // Generate response
    const response = await generateCompletion(messages, {
      model: 'instant', // Use fast model for chat
      temperature: 0.7,
    });

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
        content: response,
        timestamp: new Date().toISOString(),
      },
    ];

    if (conversationData) {
      // Update existing conversation
      await supabase
        .from('conversations')
        .update({ messages: newMessages })
        .eq('user_id', user.id);
    } else {
      // Create new conversation
      await supabase
        .from('conversations')
        .insert({
          user_id: user.id,
          messages: newMessages,
          context: context || {},
        });
    }

    return NextResponse.json({ 
      message: response,
      success: true,
    });
  } catch (error) {
    console.error('Error in chat:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

