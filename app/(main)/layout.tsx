import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { V3_FOCUSED } from '@/lib/featureFlags';

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Skip onboarding check in V3 focused mode
  if (!V3_FOCUSED) {
    // Check onboarding status
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('onboarding_completed')
      .eq('id', user.id)
      .single();

    if (!profile?.onboarding_completed) {
      redirect('/onboarding');
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
}
