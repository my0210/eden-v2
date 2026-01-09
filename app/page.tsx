import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function LandingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('onboarding_completed')
      .eq('id', user.id)
      .single();

    if (profile?.onboarding_completed) {
      redirect('/week');
    } else {
      redirect('/onboarding');
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      {/* Ambient gradient orb */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative w-[600px] h-[600px]">
          {/* Primary orb */}
          <div 
            className="absolute inset-0 rounded-full opacity-30 blur-[100px] animate-breathe"
            style={{
              background: 'radial-gradient(circle, rgba(34,197,94,0.4) 0%, rgba(16,185,129,0.2) 40%, transparent 70%)',
            }}
          />
          {/* Secondary pulse */}
          <div 
            className="absolute inset-12 rounded-full opacity-20 blur-[80px] animate-breathe-delayed"
            style={{
              background: 'radial-gradient(circle, rgba(52,211,153,0.5) 0%, transparent 60%)',
            }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center px-6 max-w-lg text-center">
        {/* Wordmark */}
        <h1 className="text-5xl md:text-6xl font-light tracking-tight mb-6 animate-fade-in-up">
          eden
        </h1>

        {/* Single line */}
        <p className="text-foreground-muted text-lg md:text-xl mb-12 animate-fade-in-up-delayed">
          Your longevity, personalized
        </p>

        {/* CTA */}
        <Link 
          href="/login" 
          className="
            px-8 py-4 rounded-full
            bg-white/10 backdrop-blur-sm
            border border-white/10
            text-white text-base font-medium
            hover:bg-white/15 hover:border-white/20
            transition-all duration-300
            animate-fade-in-up-delayed-2
          "
        >
          Begin
        </Link>
      </div>

      {/* Minimal footer */}
      <footer className="absolute bottom-8 text-foreground-subtle text-xs tracking-wider animate-fade-in">
        AI-powered health coaching
      </footer>
    </main>
  );
}
