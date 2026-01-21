import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Deactivate all active protocols for this user
    const { error: updateError } = await supabase
      .from('protocols')
      .update({ status: 'paused' })
      .eq('user_id', user.id)
      .eq('status', 'active');

    if (updateError) {
      console.error('Error deactivating protocol:', updateError);
      return NextResponse.json({ error: 'Failed to deactivate protocol' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Protocol deactivation error:', err.message);
    return NextResponse.json(
      { error: 'Failed to deactivate protocol', details: err.message },
      { status: 500 }
    );
  }
}
