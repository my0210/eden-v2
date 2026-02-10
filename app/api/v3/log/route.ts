import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Pillar, PILLARS, CoreFiveLog } from '@/lib/v3/coreFive';

// GET: Fetch logs for a specific week
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const weekStart = searchParams.get('week_start');

  if (!weekStart) {
    return NextResponse.json({ error: 'week_start is required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('core_five_logs')
    .select('*')
    .eq('user_id', user.id)
    .eq('week_start', weekStart)
    .order('logged_at', { ascending: false });

  if (error) {
    console.error('Error fetching logs:', error);
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
  }

  const logs: CoreFiveLog[] = (data || []).map(row => ({
    id: row.id,
    userId: row.user_id,
    pillar: row.pillar as Pillar,
    value: row.value,
    details: row.details,
    loggedAt: row.logged_at,
    weekStart: row.week_start,
    createdAt: row.created_at,
  }));

  return NextResponse.json({ logs }, {
    headers: {
      'Cache-Control': 'private, max-age=5, stale-while-revalidate=30',
    },
  });
}

// POST: Create a new log entry
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { pillar, value, details, weekStart } = body;

  // Validate pillar
  if (!pillar || !PILLARS.includes(pillar as Pillar)) {
    return NextResponse.json({ error: 'Invalid pillar' }, { status: 400 });
  }

  // Validate value
  if (typeof value !== 'number' || value < 0) {
    return NextResponse.json({ error: 'Invalid value' }, { status: 400 });
  }

  // Validate weekStart
  if (!weekStart) {
    return NextResponse.json({ error: 'weekStart is required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('core_five_logs')
    .insert({
      user_id: user.id,
      pillar,
      value,
      details: details || null,
      week_start: weekStart,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating log:', error);
    return NextResponse.json({ error: 'Failed to create log' }, { status: 500 });
  }

  const log: CoreFiveLog = {
    id: data.id,
    userId: data.user_id,
    pillar: data.pillar as Pillar,
    value: data.value,
    details: data.details,
    loggedAt: data.logged_at,
    weekStart: data.week_start,
    createdAt: data.created_at,
  };

  return NextResponse.json({ log });
}

// PATCH: Update an existing log entry (value and/or details)
export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { id, value, details } = body;

  if (!id) {
    return NextResponse.json({ error: 'Log ID is required' }, { status: 400 });
  }

  // Build update object with only provided fields
  const updates: Record<string, unknown> = {};
  if (typeof value === 'number' && value >= 0) {
    updates.value = value;
  }
  if (details !== undefined) {
    updates.details = details || null;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('core_five_logs')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    console.error('Error updating log:', error);
    return NextResponse.json({ error: 'Failed to update log' }, { status: 500 });
  }

  const log: CoreFiveLog = {
    id: data.id,
    userId: data.user_id,
    pillar: data.pillar as Pillar,
    value: data.value,
    details: data.details,
    loggedAt: data.logged_at,
    weekStart: data.week_start,
    createdAt: data.created_at,
  };

  return NextResponse.json({ log });
}

// DELETE: Delete a log entry
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const logId = searchParams.get('id');

  if (!logId) {
    return NextResponse.json({ error: 'Log ID is required' }, { status: 400 });
  }

  const { error } = await supabase
    .from('core_five_logs')
    .delete()
    .eq('id', logId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error deleting log:', error);
    return NextResponse.json({ error: 'Failed to delete log' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
