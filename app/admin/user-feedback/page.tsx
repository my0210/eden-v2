import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { UserFeedbackDashboard } from './UserFeedbackDashboard';

export default async function AdminUserFeedbackPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) {
    redirect('/');
  }

  return <UserFeedbackDashboard />;
}
