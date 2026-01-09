'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { OnboardingAnswers, CoachingStyle, FitnessLevel } from '@/lib/types';

const TOTAL_STEPS = 6;

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [answers, setAnswers] = useState<OnboardingAnswers>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const updateAnswers = (updates: Partial<OnboardingAnswers>) => {
    setAnswers(prev => ({ ...prev, ...updates }));
  };

  const nextStep = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const profile = {
        goals: {
          primary: answers.primaryGoals || [],
          primeSpanMeaning: answers.primeSpanMeaning || '',
        },
        constraints: {
          schedule: {
            workHours: answers.workSchedule || '9-5 Mon-Fri',
            blockedTimes: answers.blockedTimes || [],
            preferredWorkoutTimes: answers.preferredWorkoutTimes || ['morning'],
          },
          equipment: {
            gymAccess: answers.gymAccess ?? false,
            homeEquipment: answers.homeEquipment || [],
            outdoorAccess: answers.outdoorAccess ?? true,
          },
          limitations: {
            injuries: [],
            medical: answers.healthConditions || [],
          },
          capacity: {
            maxWorkoutDays: answers.maxWorkoutDays || 4,
            maxDailyHealthMinutes: answers.maxDailyHealthMinutes || 60,
          },
        },
        coaching_style: {
          tone: answers.coachingTone || 'supportive',
          density: answers.coachingDensity || 'balanced',
          formality: answers.coachingFormality || 'professional',
        },
        current_fitness_level: answers.currentActivityLevel || 'moderate',
        onboarding_completed: true,
      };

      const { error } = await supabase
        .from('user_profiles')
        .update(profile)
        .eq('id', user.id);

      if (error) throw error;

      // Redirect to generation page for personalized loading experience
      router.push('/generating');
      router.refresh();
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Ambient gradient orb */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative w-[600px] h-[600px]">
          <div 
            className="absolute inset-0 rounded-full opacity-15 blur-[120px] animate-breathe"
            style={{
              background: 'radial-gradient(circle, rgba(34,197,94,0.5) 0%, rgba(16,185,129,0.2) 40%, transparent 70%)',
            }}
          />
        </div>
      </div>

      {/* Header */}
      <header className="relative z-10 px-6 py-6 flex items-center justify-between">
        <span className="text-xl font-light tracking-tight text-foreground/60">eden</span>
        <div className="flex items-center gap-3">
          <span className="text-sm text-foreground/40">{currentStep}/{TOTAL_STEPS}</span>
          <div className="w-16 h-1 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white/40 transition-all duration-500"
              style={{ width: `${(currentStep / TOTAL_STEPS) * 100}%` }}
            />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="relative z-10 flex-1 flex flex-col px-6 py-8 overflow-y-auto">
        <div className="max-w-md mx-auto w-full">
          {currentStep === 1 && <GoalsStep answers={answers} updateAnswers={updateAnswers} />}
          {currentStep === 2 && <CurrentStateStep answers={answers} updateAnswers={updateAnswers} />}
          {currentStep === 3 && <ScheduleStep answers={answers} updateAnswers={updateAnswers} />}
          {currentStep === 4 && <EquipmentStep answers={answers} updateAnswers={updateAnswers} />}
          {currentStep === 5 && <CapacityStep answers={answers} updateAnswers={updateAnswers} />}
          {currentStep === 6 && <CoachingStyleStep answers={answers} updateAnswers={updateAnswers} />}
        </div>
      </main>

      {/* Navigation */}
      <footer className="relative z-10 px-6 pt-4 pb-6 safe-area-bottom bg-[#0a0a0a]">
        <div className="max-w-md mx-auto flex gap-3">
          {currentStep > 1 && (
            <button
              onClick={prevStep}
              className="
                flex-1 py-4 rounded-xl
                bg-white/5 border border-white/10
                text-foreground/60
                hover:bg-white/10 hover:border-white/20
                transition-all duration-300
              "
            >
              Back
            </button>
          )}
          
          {currentStep < TOTAL_STEPS ? (
            <button
              onClick={nextStep}
              className="
                flex-1 py-4 rounded-xl
                bg-white/10 border border-white/10
                text-foreground/80 font-medium
                hover:bg-white/15 hover:border-white/20
                transition-all duration-300
              "
            >
              Continue
            </button>
          ) : (
            <button
              onClick={handleComplete}
              disabled={isSubmitting}
              className="
                flex-1 py-4 rounded-xl
                bg-white/10 border border-white/10
                text-foreground/80 font-medium
                hover:bg-white/15 hover:border-white/20
                disabled:opacity-50
                transition-all duration-300
              "
            >
              {isSubmitting ? 'Starting...' : 'Begin'}
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}

// Step Components

function GoalsStep({ answers, updateAnswers }: StepProps) {
  const goals = [
    { id: 'longevity', label: 'Live longer' },
    { id: 'performance', label: 'Perform better' },
    { id: 'weight', label: 'Healthy weight' },
    { id: 'energy', label: 'More energy' },
    { id: 'sleep', label: 'Better sleep' },
    { id: 'stress', label: 'Less stress' },
    { id: 'strength', label: 'Build strength' },
    { id: 'cardio', label: 'Cardio fitness' },
  ];

  const selectedGoals = answers.primaryGoals || [];

  const toggleGoal = (goalId: string) => {
    const newGoals = selectedGoals.includes(goalId)
      ? selectedGoals.filter(g => g !== goalId)
      : [...selectedGoals, goalId];
    updateAnswers({ primaryGoals: newGoals });
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-light mb-2">What matters to you?</h1>
        <p className="text-foreground/40 text-sm">Select all that apply</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {goals.map(goal => (
          <button
            key={goal.id}
            onClick={() => toggleGoal(goal.id)}
            className={`
              p-4 rounded-xl text-left transition-all duration-300
              ${selectedGoals.includes(goal.id)
                ? 'bg-white/15 border border-white/30 text-foreground'
                : 'bg-white/5 border border-white/10 text-foreground/60 hover:bg-white/10'
              }
            `}
          >
            {goal.label}
          </button>
        ))}
      </div>

      <div>
        <textarea
          value={answers.primeSpanMeaning || ''}
          onChange={(e) => updateAnswers({ primeSpanMeaning: e.target.value })}
          placeholder="What does 'being in your prime' mean to you?"
          className="
            w-full px-4 py-4 min-h-[100px]
            bg-white/5 border border-white/10 rounded-xl
            text-foreground placeholder:text-foreground/30
            focus:outline-none focus:border-white/20
            transition-colors resize-none
          "
        />
      </div>
    </div>
  );
}

function CurrentStateStep({ answers, updateAnswers }: StepProps) {
  const levels: { id: FitnessLevel; label: string }[] = [
    { id: 'sedentary', label: 'Sedentary' },
    { id: 'light', label: 'Light activity' },
    { id: 'moderate', label: 'Moderate' },
    { id: 'active', label: 'Active' },
    { id: 'very_active', label: 'Very active' },
  ];

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-light mb-2">Current activity level</h1>
        <p className="text-foreground/40 text-sm">Be honest — this helps Eden start you right</p>
      </div>

      <div className="space-y-3">
        {levels.map(level => (
          <button
            key={level.id}
            onClick={() => updateAnswers({ currentActivityLevel: level.id })}
            className={`
              w-full p-4 rounded-xl text-left transition-all duration-300
              ${answers.currentActivityLevel === level.id
                ? 'bg-white/15 border border-white/30 text-foreground'
                : 'bg-white/5 border border-white/10 text-foreground/60 hover:bg-white/10'
              }
            `}
          >
            {level.label}
          </button>
        ))}
      </div>

      <div>
        <input
          type="text"
          value={answers.healthConditionsRaw ?? (answers.healthConditions || []).join(', ')}
          onChange={(e) => updateAnswers({ 
            healthConditionsRaw: e.target.value,
            healthConditions: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
          })}
          placeholder="Any health conditions? (optional)"
          className="
            w-full px-4 py-4
            bg-white/5 border border-white/10 rounded-xl
            text-foreground placeholder:text-foreground/30
            focus:outline-none focus:border-green-500/50
            transition-colors
          "
        />
      </div>
    </div>
  );
}

function ScheduleStep({ answers, updateAnswers }: StepProps) {
  const times = ['Morning', 'Lunch', 'Afternoon', 'Evening'];
  const selectedTimes = answers.preferredWorkoutTimes || [];

  const toggleTime = (time: string) => {
    const timeId = time.toLowerCase();
    const newTimes = selectedTimes.includes(timeId)
      ? selectedTimes.filter(t => t !== timeId)
      : [...selectedTimes, timeId];
    updateAnswers({ preferredWorkoutTimes: newTimes });
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-light mb-2">When can you train?</h1>
        <p className="text-foreground/40 text-sm">Select your preferred times</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {times.map(time => (
          <button
            key={time}
            onClick={() => toggleTime(time)}
            className={`
              p-4 rounded-xl text-center transition-all duration-300
              ${selectedTimes.includes(time.toLowerCase())
                ? 'bg-white/15 border border-white/30 text-foreground'
                : 'bg-white/5 border border-white/10 text-foreground/60 hover:bg-white/10'
              }
            `}
          >
            {time}
          </button>
        ))}
      </div>

      <div>
        <input
          type="text"
          value={answers.workSchedule || ''}
          onChange={(e) => updateAnswers({ workSchedule: e.target.value })}
          placeholder="Work schedule (e.g., 9-5 Mon-Fri)"
          className="
            w-full px-4 py-4
            bg-white/5 border border-white/10 rounded-xl
            text-foreground placeholder:text-foreground/30
            focus:outline-none focus:border-white/20
            transition-colors
          "
        />
      </div>
    </div>
  );
}

function EquipmentStep({ answers, updateAnswers }: StepProps) {
  const equipment = ['Dumbbells', 'Barbell', 'Kettlebell', 'Bands', 'Pull-up bar', 'Yoga mat'];
  const selectedEquipment = answers.homeEquipment || [];

  const toggleEquipment = (item: string) => {
    const newEquipment = selectedEquipment.includes(item)
      ? selectedEquipment.filter(e => e !== item)
      : [...selectedEquipment, item];
    updateAnswers({ homeEquipment: newEquipment });
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-light mb-2">Your equipment</h1>
        <p className="text-foreground/40 text-sm">Eden adapts to what you have</p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => updateAnswers({ gymAccess: true })}
          className={`
            flex-1 p-6 rounded-xl text-center transition-all duration-300
            ${answers.gymAccess === true
              ? 'bg-white/15 border border-white/30'
              : 'bg-white/5 border border-white/10 hover:bg-white/10'
            }
          `}
        >
          <div className="text-2xl mb-2">🏋️</div>
          <div className="text-sm text-foreground/60">Gym</div>
        </button>
        
        <button
          onClick={() => updateAnswers({ gymAccess: false })}
          className={`
            flex-1 p-6 rounded-xl text-center transition-all duration-300
            ${answers.gymAccess === false
              ? 'bg-white/15 border border-white/30'
              : 'bg-white/5 border border-white/10 hover:bg-white/10'
            }
          `}
        >
          <div className="text-2xl mb-2">🏠</div>
          <div className="text-sm text-foreground/60">Home</div>
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {equipment.map(item => (
          <button
            key={item}
            onClick={() => toggleEquipment(item)}
            className={`
              px-4 py-2 rounded-full text-sm transition-all duration-300
              ${selectedEquipment.includes(item)
                ? 'bg-white/15 border border-white/30 text-foreground'
                : 'bg-white/5 border border-white/10 text-foreground/50 hover:bg-white/10'
              }
            `}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}

function CapacityStep({ answers, updateAnswers }: StepProps) {
  return (
    <div className="space-y-8 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-light mb-2">Your capacity</h1>
        <p className="text-foreground/40 text-sm">Be realistic — Eden won't overwhelm you</p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm text-foreground/50 mb-3">Workout days per week</label>
          <div className="flex gap-2">
            {[2, 3, 4, 5, 6].map(days => (
              <button
                key={days}
                onClick={() => updateAnswers({ maxWorkoutDays: days })}
                className={`
                  flex-1 py-4 rounded-xl font-medium transition-all duration-300
                  ${answers.maxWorkoutDays === days
                    ? 'bg-white/15 border border-white/30 text-foreground'
                    : 'bg-white/5 border border-white/10 text-foreground/50 hover:bg-white/10'
                  }
                `}
              >
                {days}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm text-foreground/50 mb-3">Daily minutes available</label>
          <div className="flex gap-2">
            {[30, 45, 60, 90].map(mins => (
              <button
                key={mins}
                onClick={() => updateAnswers({ maxDailyHealthMinutes: mins })}
                className={`
                  flex-1 py-4 rounded-xl font-medium transition-all duration-300
                  ${answers.maxDailyHealthMinutes === mins
                    ? 'bg-white/15 border border-white/30 text-foreground'
                    : 'bg-white/5 border border-white/10 text-foreground/50 hover:bg-white/10'
                  }
                `}
              >
                {mins}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function CoachingStyleStep({ answers, updateAnswers }: StepProps) {
  const tones: { id: CoachingStyle['tone']; label: string }[] = [
    { id: 'supportive', label: 'Supportive' },
    { id: 'neutral', label: 'Balanced' },
    { id: 'tough', label: 'Tough love' },
  ];

  const densities: { id: CoachingStyle['density']; label: string }[] = [
    { id: 'minimal', label: 'Just tell me what to do' },
    { id: 'balanced', label: 'Some explanation' },
    { id: 'detailed', label: 'Full reasoning' },
  ];

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-light mb-2">How should Eden coach you?</h1>
        <p className="text-foreground/40 text-sm">Customize your experience</p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm text-foreground/50 mb-3">Tone</label>
          <div className="flex gap-3">
            {tones.map(tone => (
              <button
                key={tone.id}
                onClick={() => updateAnswers({ coachingTone: tone.id })}
                className={`
                  flex-1 py-4 rounded-xl text-center transition-all duration-300
                  ${answers.coachingTone === tone.id
                    ? 'bg-white/15 border border-white/30 text-foreground'
                    : 'bg-white/5 border border-white/10 text-foreground/50 hover:bg-white/10'
                  }
                `}
              >
                {tone.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm text-foreground/50 mb-3">Detail level</label>
          <div className="space-y-2">
            {densities.map(density => (
              <button
                key={density.id}
                onClick={() => updateAnswers({ coachingDensity: density.id })}
                className={`
                  w-full p-4 rounded-xl text-left transition-all duration-300
                  ${answers.coachingDensity === density.id
                    ? 'bg-white/15 border border-white/30 text-foreground'
                    : 'bg-white/5 border border-white/10 text-foreground/50 hover:bg-white/10'
                  }
                `}
              >
                {density.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

interface StepProps {
  answers: OnboardingAnswers;
  updateAnswers: (updates: Partial<OnboardingAnswers>) => void;
}
