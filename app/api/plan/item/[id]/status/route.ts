import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { logAdaptation } from '@/lib/adaptation';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, skipReason } = body;

    if (!['pending', 'done', 'skipped'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Get the item first to log adaptation
    const { data: existingItem } = await supabase
      .from('plan_items')
      .select('*, weekly_plans!inner(id, user_id)')
      .eq('id', id)
      .single();

    // Update the item status
    const { data, error } = await supabase
      .from('plan_items')
      .update({
        status,
        completed_at: status === 'done' ? new Date().toISOString() : null,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating item status:', error);
      return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
    }

    // Log adaptation if item was skipped
    if (status === 'skipped' && existingItem) {
      await logAdaptation({
        userId: user.id,
        weeklyPlanId: existingItem.weekly_plan_id,
        triggerType: 'missed_items',
        description: `Skipped: ${existingItem.title}${skipReason ? ` - Reason: ${skipReason}` : ''}`,
        changesMade: {
          itemId: id,
          domain: existingItem.domain,
          dayOfWeek: existingItem.day_of_week,
          reason: skipReason,
        },
      });
    }

    return NextResponse.json({ success: true, item: data });
  } catch (error) {
    console.error('Error in status update:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

