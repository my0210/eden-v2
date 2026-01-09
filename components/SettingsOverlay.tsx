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
  { value: 'supportive', label: 'Supportive' },
  { value: 'neutral', label: 'Neutral' },
  { value: 'tough', label: 'Tough' },
] as const;

const DENSITY_OPTIONS = [
  { value: 'minimal', label: 'Minimal' },
  { value: 'balanced', label: 'Balanced' },
  { value: 'detailed', label: 'Detailed' },
] as const;

const FORMALITY_OPTIONS = [
  { value: 'casual', label: 'Casual' },
  { value: 'professional', label: 'Professional' },
  { value: 'clinical', label: 'Clinical' },
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
    // Auto-save
    saveStyle({ ...coachingStyle, [key]: value });
  };

  const saveStyle = async (style: CoachingStyle) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase
        .from('user_profiles')
        .update({ coaching_style: style })
        .eq('id', user.id);
    } catch (e) {
      console.error('Failed to save style:', e);
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

  const SegmentedControl = ({ 
    options, 
    value, 
    onChange 
  }: { 
    options: readonly { value: string; label: string }[];
    value: string;
    onChange: (value: string) => void;
  }) => (
    <div 
      className="flex rounded-lg p-1 gap-1"
      style={{ backgroundColor: 'rgba(255, 255, 255, 0.06)' }}
    >
      {options.map(option => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`
            flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all
            ${value === option.value 
              ? 'text-white' 
              : 'text-white/50 hover:text-white/70'
            }
          `}
          style={value === option.value ? { backgroundColor: 'rgba(255, 255, 255, 0.12)' } : {}}
        >
          {option.label}
        </button>
      ))}
    </div>
  );

  return (
    <Drawer.Root open={isOpen} onOpenChange={setIsOpen}>
      <Drawer.Trigger asChild>
        {trigger}
      </Drawer.Trigger>

      <Drawer.Portal>
        <Drawer.Overlay 
          className="fixed inset-0 z-[100]"
          style={{ 
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}
        />
        
        <Drawer.Content 
          className="fixed bottom-0 left-0 right-0 z-[101] flex flex-col outline-none max-h-[85vh]"
          style={{ 
            backgroundColor: 'rgba(28, 28, 30, 0.95)',
            backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)',
            borderTopLeftRadius: '12px',
            borderTopRightRadius: '12px',
          }}
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div 
              className="w-9 h-1 rounded-full"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.3)' }}
            />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-4 pb-3">
            <Drawer.Title className="text-white/90 text-lg font-medium">
              Settings
            </Drawer.Title>
            <Drawer.Close asChild>
              <button
                className="w-8 h-8 rounded-full flex items-center justify-center text-white/60 hover:text-white transition-colors"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                aria-label="Close"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </Drawer.Close>
          </div>

          {/* Divider */}
          <div className="h-px mx-4" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
            
            {/* Coaching Style */}
            <div className="space-y-4">
              <h3 className="text-xs font-medium text-white/40 uppercase tracking-wider">
                Coaching Style
              </h3>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-white/60 mb-2 block">Tone</label>
                  <SegmentedControl 
                    options={TONE_OPTIONS} 
                    value={coachingStyle.tone}
                    onChange={(v) => handleStyleChange('tone', v as CoachingStyle['tone'])}
                  />
                </div>
                
                <div>
                  <label className="text-sm text-white/60 mb-2 block">Detail Level</label>
                  <SegmentedControl 
                    options={DENSITY_OPTIONS} 
                    value={coachingStyle.density}
                    onChange={(v) => handleStyleChange('density', v as CoachingStyle['density'])}
                  />
                </div>
                
                <div>
                  <label className="text-sm text-white/60 mb-2 block">Communication</label>
                  <SegmentedControl 
                    options={FORMALITY_OPTIONS} 
                    value={coachingStyle.formality}
                    onChange={(v) => handleStyleChange('formality', v as CoachingStyle['formality'])}
                  />
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px" style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)' }} />

            {/* Account */}
            <div className="space-y-3">
              <h3 className="text-xs font-medium text-white/40 uppercase tracking-wider">
                Account
              </h3>
              
              <button
                onClick={handleSignOut}
                className="w-full py-3 rounded-xl text-sm text-white/70 hover:text-white transition-colors text-left"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.06)' }}
              >
                <span className="px-4">Sign Out</span>
              </button>
            </div>

            {/* Divider */}
            <div className="h-px" style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)' }} />

            {/* Developer */}
            <div className="space-y-3 pb-4">
              <h3 className="text-xs font-medium text-white/40 uppercase tracking-wider">
                Developer
              </h3>
              
              <button
                onClick={handleReset}
                disabled={loading !== null}
                className="w-full py-3 rounded-xl text-sm text-orange-400/70 hover:text-orange-400 transition-colors text-left disabled:opacity-50"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.06)' }}
              >
                <span className="px-4">{loading === 'reset' ? 'Resetting...' : 'Reset All Data'}</span>
              </button>
            </div>
          </div>

          {/* Safe area padding */}
          <div className="safe-area-bottom" />
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
