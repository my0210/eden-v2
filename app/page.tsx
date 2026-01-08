import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function LandingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // If user is logged in, redirect to main app
  if (user) {
    // Check if onboarding is completed
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
    <main className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Logo */}
        <div className="mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
            <span className="text-3xl font-bold text-white">E</span>
          </div>
        </div>

        {/* Headline */}
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-4 font-[family-name:var(--font-space-grotesk)]">
          Your AI
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500"> Longevity </span>
          Coach
        </h1>

        {/* Subheadline */}
        <p className="text-foreground-muted text-lg md:text-xl text-center max-w-md mb-8">
          Evidence-based protocols. Personalized for you. 
          <br />
          One clear priority at a time.
        </p>

        {/* Domain Pills */}
        <div className="flex flex-wrap gap-2 justify-center mb-12 max-w-md">
          <DomainPill domain="heart" label="Heart" />
          <DomainPill domain="muscle" label="Muscle" />
          <DomainPill domain="sleep" label="Sleep" />
          <DomainPill domain="metabolism" label="Metabolism" />
          <DomainPill domain="mind" label="Mind" />
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
          <Link 
            href="/signup" 
            className="btn btn-primary flex-1 py-4 text-lg font-semibold"
          >
            Get Started
          </Link>
          <Link 
            href="/login" 
            className="btn btn-secondary flex-1 py-4 text-lg"
          >
            Sign In
          </Link>
        </div>
      </div>

      {/* Value Props */}
      <div className="bg-background-secondary border-t border-default px-6 py-12">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-xl font-semibold text-center mb-8">
            Why Eden?
          </h2>
          
          <div className="grid gap-6">
            <ValueProp 
              icon="🎯"
              title="Know what matters most"
              description="Stop wondering what to focus on. Eden tells you exactly what to do today, this week."
            />
            <ValueProp 
              icon="🧠"
              title="Personalized to your reality"
              description="Your schedule, your constraints, your goals. Every recommendation shows why it's for you."
            />
            <ValueProp 
              icon="🔄"
              title="Adapts when life happens"
              description="Miss a workout? Eden adjusts. No guilt, no broken streaks. Just smart adaptation."
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="px-6 py-8 text-center text-foreground-subtle text-sm">
        <p>Eden v2 • Evidence-based longevity coaching</p>
      </footer>
    </main>
  );
}

function DomainPill({ domain, label }: { domain: string; label: string }) {
  const colors: Record<string, string> = {
    heart: 'bg-red-500/10 text-red-400 border-red-500/20',
    muscle: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    sleep: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    metabolism: 'bg-green-500/10 text-green-400 border-green-500/20',
    mind: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-sm border ${colors[domain]}`}>
      {label}
    </span>
  );
}

function ValueProp({ icon, title, description }: { 
  icon: string; 
  title: string; 
  description: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="text-2xl">{icon}</div>
      <div>
        <h3 className="font-medium mb-1">{title}</h3>
        <p className="text-foreground-muted text-sm">{description}</p>
      </div>
    </div>
  );
}
