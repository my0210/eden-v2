'use client';

import { useState, useEffect } from 'react';
import { Drawer } from 'vaul';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface CoachingStyle {
  tone: 'supportive' | 'neutral' | 'tough';
  density: 'minimal' | 'balanced' | 'detailed';
  formality: 'casual' | 'professional' | 'clinical';
}

interface SettingsOverlayProps {
  trigger: React.ReactNode;
  initialCoachingStyle?: CoachingStyle;
}

const TONE_OPTIONS = [
  { value: 'supportive', label: 'Supportive', desc: 'Warm and encouraging' },
  { value: 'neutral', label: 'Neutral', desc: 'Balanced and objective' },
  { value: 'tough', label: 'Tough', desc: 'Direct and challenging' },
] as const;

const DENSITY_OPTIONS = [
  { value: 'minimal', label: 'Minimal', desc: 'Just the essentials' },
  { value: 'balanced', label: 'Balanced', desc: 'Moderate detail' },
  { value: 'detailed', label: 'Detailed', desc: 'Full explanations' },
] as const;

const FORMALITY_OPTIONS = [
  { value: 'casual', label: 'Casual', desc: 'Like a friend' },
  { value: 'professional', label: 'Professional', desc: 'Like a trainer' },
  { value: 'clinical', label: 'Clinical', desc: 'Like a doctor' },
] as const;

export function SettingsOverlay({ trigger, initialCoachingStyle }: SettingsOverlayProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [coachingStyle, setCoachingStyle] = useState<CoachingStyle>(
    initialCoachingStyle || { tone: 'supportive', density: 'balanced', formality: 'professional' }
  );
  const [hasChanges, setHasChanges] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    if (initialCoachingStyle) {
      setCoachingStyle(initialCoachingStyle);
    }
  }, [initialCoachingStyle]);

  const handleStyleChange = <K extends keyof CoachingStyle>(key: K, value: CoachingStyle[K]) => {
    setCoachingStyle(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setLoading('save');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('user_profiles')
        .update({ coaching_style: coachingStyle })
        .eq('id', user.id);

      setHasChanges(false);
      setIsOpen(false);
      router.refresh();
    } finally {
      setLoading(null);
    }
  };

  const handleReset = async () => {
    if (!confirm('Reset all your data? You will go through onboarding again.')) return;
    
    setLoading('reset');
    try {
      const res = await fetch('/api/dev/reset', { method: 'POST' });
      if (res.ok) {
        setIsOpen(false);
        router.push('/onboarding');
        router.refresh();
      }
    } finally {
      setLoading(null);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <Drawer.Root open={isOpen} onOpenChange={setIsOpen}>
      <Drawer.Trigger asChild>
        {trigger}
      </Drawer.Trigger>

      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-xl z-[100]" />
        
        <Drawer.Content className="fixed inset-0 z-[101] flex flex-col pointer-events-none">
          {/* Header - floating */}
          <div className="flex items-center justify-between px-4 py-4 pointer-events-auto">
            <Drawer.Close asChild>
              <button
                className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-foreground/70 hover:bg-black/60 transition-colors"
                aria-label="Close settings"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </Drawer.Close>
            
            <Drawer.Title className="text-lg font-light text-foreground/70">
              Settings
            </Drawer.Title>
            
            <div className="w-10" />
          </div>

          {/* Content - scrollable glass container */}
          <div className="flex-1 overflow-y-auto px-4 py-4 pointer-events-auto">
            <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 space-y-6">
              
              {/* Coaching Style Section */}
              <section>
                <h3 className="text-sm font-medium text-foreground/50 uppercase tracking-wider mb-4">
                  Coaching Style
                </h3>
                
                {/* Tone */}
                <div className="mb-5">
                  <label className="text-sm text-foreground/60 mb-3 block">Tone</label>
                  <div className="space-y-2">
                    {TONE_OPTIONS.map(option => (
                      <button
                        key={option.value}
                        onClick={() => handleStyleChange('tone', option.value)}
                        className={`
                          w-full px-4 py-3 rounded-xl text-left transition-all
                          ${coachingStyle.tone === option.value 
                            ? 'bg-green-500/20 border border-green-500/40' 
                            : 'bg-white/5 border border-white/10 hover:bg-white/10'
                          }
                        `}
                      >
                        <span className="text-sm text-foreground/80">{option.label}</span>
                        <span className="text-xs text-foreground/40 ml-2">· {option.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Density */}
                <div className="mb-5">
                  <label className="text-sm text-foreground/60 mb-3 block">Detail Level</label>
                  <div className="space-y-2">
                    {DENSITY_OPTIONS.map(option => (
                      <button
                        key={option.value}
                        onClick={() => handleStyleChange('density', option.value)}
                        className={`
                          w-full px-4 py-3 rounded-xl text-left transition-all
                          ${coachingStyle.density === option.value 
                            ? 'bg-green-500/20 border border-green-500/40' 
                            : 'bg-white/5 border border-white/10 hover:bg-white/10'
                          }
                        `}
                      >
                        <span className="text-sm text-foreground/80">{option.label}</span>
                        <span className="text-xs text-foreground/40 ml-2">· {option.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Formality */}
                <div>
                  <label className="text-sm text-foreground/60 mb-3 block">Communication Style</label>
                  <div className="space-y-2">
                    {FORMALITY_OPTIONS.map(option => (
                      <button
                        key={option.value}
                        onClick={() => handleStyleChange('formality', option.value)}
                        className={`
                          w-full px-4 py-3 rounded-xl text-left transition-all
                          ${coachingStyle.formality === option.value 
                            ? 'bg-green-500/20 border border-green-500/40' 
                            : 'bg-white/5 border border-white/10 hover:bg-white/10'
                          }
                        `}
                      >
                        <span className="text-sm text-foreground/80">{option.label}</span>
                        <span className="text-xs text-foreground/40 ml-2">· {option.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </section>

              <div className="border-t border-white/10" />

              {/* Account Section */}
              <section>
                <h3 className="text-sm font-medium text-foreground/50 uppercase tracking-wider mb-4">
                  Account
                </h3>
                
                <button
                  onClick={handleSignOut}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-left text-sm text-foreground/60 hover:bg-white/10 transition-all"
                >
                  Sign Out
                </button>
              </section>

              <div className="border-t border-white/10" />

              {/* Dev Section */}
              <section>
                <h3 className="text-sm font-medium text-foreground/50 uppercase tracking-wider mb-4">
                  Developer
                </h3>
                
                <button
                  onClick={handleReset}
                  disabled={loading !== null}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-left text-sm text-yellow-400/70 hover:text-yellow-400 hover:bg-white/10 transition-all disabled:opacity-50"
                >
                  {loading === 'reset' ? 'Resetting...' : '↺ Reset All Data'}
                </button>
              </section>
            </div>
          </div>

          {/* Save Button - floating */}
          {hasChanges && (
            <div className="px-4 pb-4 safe-area-bottom pointer-events-auto">
              <button
                onClick={handleSave}
                disabled={loading !== null}
                className="w-full py-3 rounded-xl bg-green-500/30 backdrop-blur-md border border-green-500/40 text-green-400 font-medium hover:bg-green-500/40 transition-all disabled:opacity-50"
              >
                {loading === 'save' ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

