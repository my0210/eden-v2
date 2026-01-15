import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET - Fetch all user feedback (admin only)
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Fetch all feedback with user emails
  const { data: feedback, error } = await supabase
    .from('user_feedback')
    .select(`
      id,
      user_id,
      rating,
      message,
      status,
      created_at,
      user_profiles!inner(email)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch feedback:', error);
    return NextResponse.json({ error: 'Failed to fetch feedback' }, { status: 500 });
  }

  // Transform the data to include userEmail at top level
  const transformedFeedback = feedback?.map(item => ({
    id: item.id,
    userId: item.user_id,
    rating: item.rating,
    message: item.message,
    status: item.status,
    createdAt: item.created_at,
    userEmail: (item.user_profiles as { email: string })?.email,
  })) || [];

  return NextResponse.json({ feedback: transformedFeedback });
}

// PATCH - Update feedback status (admin only)
export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json(
        { error: 'Missing id or status' },
        { status: 400 }
      );
    }

    // Validate status
    if (!['new', 'reviewed', 'resolved'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be: new, reviewed, or resolved' },
        { status: 400 }
      );
    }

    const { error: updateError } = await supabase
      .from('user_feedback')
      .update({ status })
      .eq('id', id);

    if (updateError) {
      console.error('Failed to update feedback:', updateError);
      return NextResponse.json(
        { error: 'Failed to update feedback' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}
