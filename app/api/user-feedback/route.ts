import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { rating, message } = body;

    // Validate rating
    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be a number between 1 and 5' },
        { status: 400 }
      );
    }

    // Validate message (optional but must be string if provided)
    if (message !== null && message !== undefined && typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message must be a string' },
        { status: 400 }
      );
    }

    // Insert feedback
    const { error: insertError } = await supabase
      .from('user_feedback')
      .insert({
        user_id: user.id,
        rating,
        message: message || null,
        status: 'new',
      });

    if (insertError) {
      console.error('Failed to insert feedback:', insertError);
      return NextResponse.json(
        { error: 'Failed to submit feedback' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing feedback:', error);
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}
