'use client';

import { useState, useEffect } from 'react';
import { Drawer } from 'vaul';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UnitSystem, GlucoseUnit, LipidsUnit } from '@/lib/types';

interface CoachingStyle {
  tone: 'supportive' | 'neutral' | 'tough';
  density: 'minimal' | 'balanced' | 'detailed';
  formality: 'casual' | 'professional' | 'clinical';
}

interface SettingsOverlayProps {
  trigger?: React.ReactNode;
  isOpen?: boolean;
  onClose?: () => void;
  initialCoachingStyle?: CoachingStyle;
  initialUnitSystem?: UnitSystem;
  initialGlucoseUnit?: GlucoseUnit;
  initialLipidsUnit?: LipidsUnit;
  isAdmin?: boolean;
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
  { value: 'casual', label: 'Friendly' },
  { value: 'professional', label: 'Coach' },
  { value: 'clinical', label: 'Medical' },
] as const;

const UNIT_SYSTEM_OPTIONS = [
  { value: 'metric', label: 'Metric' },
  { value: 'imperial', label: 'Imperial' },
] as const;

const GLUCOSE_UNIT_OPTIONS = [
  { value: 'mg/dL', label: 'mg/dL' },
  { value: 'mmol/L', label: 'mmol/L' },
] as const;

const LIPIDS_UNIT_OPTIONS = [
  { value: 'mg/dL', label: 'mg/dL' },
  { value: 'mmol/L', label: 'mmol/L' },
] as const;

const RATING_EMOJIS = [
  { value: 1, emoji: '😠', label: 'Very unhappy' },
  { value: 2, emoji: '😕', label: 'Unhappy' },
  { value: 3, emoji: '😐', label: 'Neutral' },
  { value: 4, emoji: '🙂', label: 'Happy' },
  { value: 5, emoji: '😍', label: 'Love it' },
] as const;

type ViewState = 'settings' | 'feedback';
type FeedbackState = 'idle' | 'loading' | 'success' | 'error';

export function SettingsOverlay({ trigger, isOpen: controlledIsOpen, onClose, initialCoachingStyle, initialUnitSystem, initialGlucoseUnit, initialLipidsUnit, isAdmin }: SettingsOverlayProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  
  // Use controlled mode if isOpen prop is provided
  const isControlled = controlledIsOpen !== undefined;
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;
  const setIsOpen = isControlled 
    ? (open: boolean) => { if (!open && onClose) onClose(); }
    : setInternalIsOpen;
  const [view, setView] = useState<ViewState>('settings');
  const [loading, setLoading] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [coachingStyle, setCoachingStyle] = useState<CoachingStyle>(
    initialCoachingStyle || { tone: 'supportive', density: 'balanced', formality: 'professional' }
  );
  const [unitSystem, setUnitSystem] = useState<UnitSystem>(initialUnitSystem || 'metric');
  const [glucoseUnit, setGlucoseUnit] = useState<GlucoseUnit>(initialGlucoseUnit || 'mg/dL');
  const [lipidsUnit, setLipidsUnit] = useState<LipidsUnit>(initialLipidsUnit || 'mg/dL');
  
  // Feedback state
  const [feedbackRating, setFeedbackRating] = useState<number | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackState, setFeedbackState] = useState<FeedbackState>('idle');
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  
  const router = useRouter();
  const supabase = createClient();

  // Reset view when drawer closes
  useEffect(() => {
    if (!isOpen) {
      // Small delay to let close animation finish
      setTimeout(() => {
        setView('settings');
        setFeedbackRating(null);
        setFeedbackMessage('');
        setFeedbackState('idle');
        setFeedbackError(null);
      }, 300);
    }
  }, [isOpen]);

  useEffect(() => {
    if (initialCoachingStyle) {
      setCoachingStyle(initialCoachingStyle);
    }
  }, [initialCoachingStyle]);

  useEffect(() => {
    if (initialUnitSystem) {
      setUnitSystem(initialUnitSystem);
    }
  }, [initialUnitSystem]);

  useEffect(() => {
    if (initialGlucoseUnit) {
      setGlucoseUnit(initialGlucoseUnit);
    }
  }, [initialGlucoseUnit]);

  useEffect(() => {
    if (initialLipidsUnit) {
      setLipidsUnit(initialLipidsUnit);
    }
  }, [initialLipidsUnit]);

  const handleStyleChange = <K extends keyof CoachingStyle>(key: K, value: CoachingStyle[K]) => {
    setCoachingStyle(prev => ({ ...prev, [key]: value }));
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
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } catch (e) {
      console.error('Failed to save style:', e);
    }
  };

  const handleUnitSystemChange = async (value: UnitSystem) => {
    setUnitSystem(value);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase
        .from('user_profiles')
        .update({ unit_system: value })
        .eq('id', user.id);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } catch (e) {
      console.error('Failed to save unit system:', e);
    }
  };

  const handleGlucoseUnitChange = async (value: GlucoseUnit) => {
    setGlucoseUnit(value);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase
        .from('user_profiles')
        .update({ glucose_unit: value })
        .eq('id', user.id);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } catch (e) {
      console.error('Failed to save glucose unit:', e);
    }
  };

  const handleLipidsUnitChange = async (value: LipidsUnit) => {
    setLipidsUnit(value);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase
        .from('user_profiles')
        .update({ lipids_unit: value })
        .eq('id', user.id);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } catch (e) {
      console.error('Failed to save lipids unit:', e);
    }
  };

  const handleSubmitFeedback = async () => {
    if (feedbackRating === null) return;

    setFeedbackState('loading');
    setFeedbackError(null);

    try {
      const response = await fetch('/api/user-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          rating: feedbackRating, 
          message: feedbackMessage.trim() || null 
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit feedback');
      }

      setFeedbackState('success');
      // Auto-close after success
      setTimeout(() => setIsOpen(false), 1500);
    } catch (err) {
      setFeedbackState('error');
      setFeedbackError(err instanceof Error ? err.message : 'Something went wrong');
    }
  };

  const handleResetCoaching = async () => {
    if (!confirm('Reset coaching data? You will go through onboarding again but keep your account.')) return;
    
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

  const handleDeleteAccount = async () => {
    if (!confirm('Delete your entire account? This cannot be undone.')) return;
    if (!confirm('Are you really sure? All your data will be permanently deleted.')) return;
    
    setLoading('delete');
    try {
      const res = await fetch('/api/dev/delete', { method: 'POST' });
      if (res.ok) {
        setIsOpen(false);
        router.push('/');
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

  const handleRegeneratePlan = async () => {
    if (!confirm('Regenerate your weekly plan? This will replace your current plan for this week.')) return;
    
    setIsOpen(false);
    router.push('/generating?regenerate=true');
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
      className="flex rounded-lg p-1 gap-0.5"
      style={{ backgroundColor: 'rgba(255, 255, 255, 0.06)' }}
    >
      {options.map(option => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`
            flex-1 py-2 px-2 rounded-md text-xs font-medium transition-all
            ${value === option.value 
              ? 'text-white' 
              : 'text-white/40 hover:text-white/60'
            }
          `}
          style={value === option.value ? { backgroundColor: 'rgba(255, 255, 255, 0.15)' } : {}}
        >
          {option.label}
        </button>
      ))}
    </div>
  );

  return (
    <Drawer.Root open={isOpen} onOpenChange={setIsOpen}>
      {trigger && (
        <Drawer.Trigger asChild>
          {trigger}
        </Drawer.Trigger>
      )}

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
          className="fixed bottom-0 left-0 right-0 z-[101] flex flex-col outline-none"
          style={{ 
            maxHeight: '80vh',
            backgroundColor: 'rgba(28, 28, 30, 0.98)',
            backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)',
            borderTopLeftRadius: '12px',
            borderTopRightRadius: '12px',
          }}
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
            <div 
              className="w-9 h-1 rounded-full"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.3)' }}
            />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-4 pb-3 flex-shrink-0">
            {view === 'feedback' ? (
              <button
                onClick={() => setView('settings')}
                className="flex items-center gap-1.5 text-white/60 hover:text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="text-sm">Back</span>
              </button>
            ) : (
              <Drawer.Title className="text-white/90 text-lg font-medium">
                Settings
              </Drawer.Title>
            )}
            
            {view === 'feedback' && (
              <span className="text-white/90 text-lg font-medium">Send Feedback</span>
            )}
            
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
          <div className="h-px mx-4 flex-shrink-0" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />

          {/* Content */}
          <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4">
            {view === 'settings' ? (
              /* Settings View */
              <div className="space-y-5">
                {/* Coaching Style */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-medium text-white/40 uppercase tracking-wider">
                      Coaching Style
                    </h3>
                    {saved && (
                      <span className="text-xs text-green-400/80 animate-pulse">
                        Saved
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs text-white/50 mb-1.5 block">Tone</label>
                      <SegmentedControl 
                        options={TONE_OPTIONS} 
                        value={coachingStyle.tone}
                        onChange={(v) => handleStyleChange('tone', v as CoachingStyle['tone'])}
                      />
                    </div>
                    
                    <div>
                      <label className="text-xs text-white/50 mb-1.5 block">Detail</label>
                      <SegmentedControl 
                        options={DENSITY_OPTIONS} 
                        value={coachingStyle.density}
                        onChange={(v) => handleStyleChange('density', v as CoachingStyle['density'])}
                      />
                    </div>
                    
                    <div>
                      <label className="text-xs text-white/50 mb-1.5 block">Voice</label>
                      <SegmentedControl 
                        options={FORMALITY_OPTIONS} 
                        value={coachingStyle.formality}
                        onChange={(v) => handleStyleChange('formality', v as CoachingStyle['formality'])}
                      />
                    </div>
                  </div>
                </div>

                <div className="h-px" style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)' }} />

                {/* Unit System */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-medium text-white/40 uppercase tracking-wider">
                      Units
                    </h3>
                    {saved && (
                      <span className="text-xs text-green-400/80 animate-pulse">
                        Saved
                      </span>
                    )}
                  </div>
                  <SegmentedControl
                    options={UNIT_SYSTEM_OPTIONS}
                    value={unitSystem}
                    onChange={(v) => handleUnitSystemChange(v as UnitSystem)}
                  />
                </div>

                <div className="h-px" style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)' }} />

                {/* Lab Units */}
                <div className="space-y-3">
                  <h3 className="text-xs font-medium text-white/40 uppercase tracking-wider">
                    Lab Units
                  </h3>
                  <div>
                    <label className="text-xs text-white/50 mb-1.5 block">Glucose</label>
                    <SegmentedControl
                      options={GLUCOSE_UNIT_OPTIONS}
                      value={glucoseUnit}
                      onChange={(v) => handleGlucoseUnitChange(v as GlucoseUnit)}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-white/50 mb-1.5 block">Lipids</label>
                    <SegmentedControl
                      options={LIPIDS_UNIT_OPTIONS}
                      value={lipidsUnit}
                      onChange={(v) => handleLipidsUnitChange(v as LipidsUnit)}
                    />
                  </div>
                </div>

                <div className="h-px" style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)' }} />

                {/* Account */}
                <div className="space-y-2">
                  <h3 className="text-xs font-medium text-white/40 uppercase tracking-wider">
                    Account
                  </h3>
                  
                  <button
                    onClick={() => setView('feedback')}
                    className="w-full py-2.5 rounded-lg text-sm text-white/60 hover:text-white transition-colors text-left px-3 flex items-center justify-between"
                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.06)' }}
                  >
                    <span>Send Feedback</span>
                    <svg className="w-4 h-4 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>

                  <button
                    onClick={handleSignOut}
                    className="w-full py-2.5 rounded-lg text-sm text-white/60 hover:text-white transition-colors text-left px-3"
                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.06)' }}
                  >
                    Sign Out
                  </button>
                </div>

                {/* Admin Section */}
                {isAdmin && (
                  <>
                    <div className="h-px" style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)' }} />
                    
                    <div className="space-y-2">
                      <h3 className="text-xs font-medium text-white/40 uppercase tracking-wider">
                        Admin
                      </h3>
                      
                      <Link
                        href="/admin/user-feedback"
                        onClick={() => setIsOpen(false)}
                        className="w-full py-2.5 rounded-lg text-sm text-purple-400/80 hover:text-purple-400 transition-colors text-left px-3 block"
                        style={{ backgroundColor: 'rgba(139, 92, 246, 0.08)' }}
                      >
                        View User Feedback
                      </Link>
                    </div>
                  </>
                )}

                <div className="h-px" style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)' }} />

                {/* Developer */}
                <div className="space-y-2 pb-4">
                  <h3 className="text-xs font-medium text-white/40 uppercase tracking-wider">
                    Developer
                  </h3>

                  <button
                    onClick={handleRegeneratePlan}
                    disabled={loading !== null}
                    className="w-full py-2.5 rounded-lg text-sm text-blue-400/80 hover:text-blue-400 transition-colors text-left px-3 disabled:opacity-50"
                    style={{ backgroundColor: 'rgba(59, 130, 246, 0.08)' }}
                  >
                    {loading === 'regenerate' ? 'Regenerating...' : 'Regenerate Week Plan'}
                  </button>
                  
                  <button
                    onClick={handleResetCoaching}
                    disabled={loading !== null}
                    className="w-full py-2.5 rounded-lg text-sm text-orange-400/80 hover:text-orange-400 transition-colors text-left px-3 disabled:opacity-50"
                    style={{ backgroundColor: 'rgba(255, 165, 0, 0.08)' }}
                  >
                    {loading === 'reset' ? 'Resetting...' : 'Reset Coaching & Onboarding'}
                  </button>

                  <button
                    onClick={handleDeleteAccount}
                    disabled={loading !== null}
                    className="w-full py-2.5 rounded-lg text-sm text-red-400/80 hover:text-red-400 transition-colors text-left px-3 disabled:opacity-50"
                    style={{ backgroundColor: 'rgba(255, 59, 48, 0.08)' }}
                  >
                    {loading === 'delete' ? 'Deleting...' : 'Delete Account'}
                  </button>
                </div>
              </div>
            ) : (
              /* Feedback View */
              <div className="py-2">
                {feedbackState === 'success' ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-3">✓</div>
                    <p className="text-white/80">Thanks for your feedback!</p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {/* Rating */}
                    <div>
                      <label className="text-sm text-white/60 mb-3 block">
                        How&apos;s your experience with Eden?
                      </label>
                      <div className="flex justify-between gap-2">
                        {RATING_EMOJIS.map(({ value, emoji, label }) => (
                          <button
                            key={value}
                            onClick={() => setFeedbackRating(value)}
                            className={`
                              flex-1 py-3 rounded-xl text-2xl flex items-center justify-center
                              transition-all duration-150 active:scale-[0.95]
                              ${feedbackRating === value 
                                ? 'bg-white/20 scale-105' 
                                : 'bg-white/5 hover:bg-white/10'
                              }
                            `}
                            aria-label={label}
                            title={label}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Message */}
                    <div>
                      <label className="text-sm text-white/60 mb-2 block">
                        Tell us more (optional)
                      </label>
                      <textarea
                        value={feedbackMessage}
                        onChange={(e) => setFeedbackMessage(e.target.value)}
                        placeholder="What could we improve?"
                        className="w-full h-24 px-4 py-3 rounded-xl text-sm text-white/90 placeholder-white/30 resize-none focus:outline-none focus:ring-1 focus:ring-white/20"
                        style={{ backgroundColor: 'rgba(255, 255, 255, 0.06)' }}
                      />
                    </div>

                    {/* Error */}
                    {feedbackError && (
                      <p className="text-red-400/80 text-sm">{feedbackError}</p>
                    )}

                    {/* Submit */}
                    <button
                      onClick={handleSubmitFeedback}
                      disabled={feedbackRating === null || feedbackState === 'loading'}
                      className={`
                        w-full py-3 rounded-xl text-sm font-medium
                        transition-all duration-150 active:scale-[0.98]
                        ${feedbackRating !== null 
                          ? 'bg-white/15 text-white hover:bg-white/20' 
                          : 'bg-white/5 text-white/30 cursor-not-allowed'
                        }
                      `}
                    >
                      {feedbackState === 'loading' ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Sending...
                        </span>
                      ) : (
                        'Send Feedback'
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Safe area */}
          <div className="h-4 flex-shrink-0 safe-area-bottom" />
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
