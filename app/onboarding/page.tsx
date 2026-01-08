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

      // Build profile from answers
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

      // Save to Supabase
      const { error } = await supabase
        .from('user_profiles')
        .update(profile)
        .eq('id', user.id);

      if (error) throw error;

      // Redirect to main app
      router.push('/week');
      router.refresh();
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="px-6 py-4 border-b border-default">
        <div className="flex items-center justify-between">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
            <span className="text-xl font-bold text-white">E</span>
          </div>
          
          {/* Progress indicator */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-foreground-muted">
              {currentStep} of {TOTAL_STEPS}
            </span>
            <div className="w-24 h-1.5 bg-background-tertiary rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 transition-all duration-300"
                style={{ width: `${(currentStep / TOTAL_STEPS) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex flex-col px-6 py-8 overflow-y-auto">
        <div className="max-w-md mx-auto w-full">
          {currentStep === 1 && (
            <GoalsStep 
              answers={answers} 
              updateAnswers={updateAnswers} 
            />
          )}
          
          {currentStep === 2 && (
            <CurrentStateStep 
              answers={answers} 
              updateAnswers={updateAnswers} 
            />
          )}
          
          {currentStep === 3 && (
            <ScheduleStep 
              answers={answers} 
              updateAnswers={updateAnswers} 
            />
          )}
          
          {currentStep === 4 && (
            <EquipmentStep 
              answers={answers} 
              updateAnswers={updateAnswers} 
            />
          )}
          
          {currentStep === 5 && (
            <CapacityStep 
              answers={answers} 
              updateAnswers={updateAnswers} 
            />
          )}
          
          {currentStep === 6 && (
            <CoachingStyleStep 
              answers={answers} 
              updateAnswers={updateAnswers} 
            />
          )}
        </div>
      </main>

      {/* Navigation */}
      <footer className="px-6 py-4 border-t border-default safe-area-bottom">
        <div className="max-w-md mx-auto flex gap-3">
          {currentStep > 1 && (
            <button
              onClick={prevStep}
              className="btn btn-secondary flex-1 py-3"
            >
              Back
            </button>
          )}
          
          {currentStep < TOTAL_STEPS ? (
            <button
              onClick={nextStep}
              className="btn btn-primary flex-1 py-3"
            >
              Continue
            </button>
          ) : (
            <button
              onClick={handleComplete}
              disabled={isSubmitting}
              className="btn btn-primary flex-1 py-3 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Start My Journey'}
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
    { id: 'longevity', label: 'Live longer and healthier' },
    { id: 'performance', label: 'Improve physical performance' },
    { id: 'weight', label: 'Reach a healthy weight' },
    { id: 'energy', label: 'Have more energy' },
    { id: 'sleep', label: 'Sleep better' },
    { id: 'stress', label: 'Manage stress' },
    { id: 'strength', label: 'Build strength and muscle' },
    { id: 'cardio', label: 'Improve cardiovascular fitness' },
  ];

  const selectedGoals = answers.primaryGoals || [];

  const toggleGoal = (goalId: string) => {
    const newGoals = selectedGoals.includes(goalId)
      ? selectedGoals.filter(g => g !== goalId)
      : [...selectedGoals, goalId];
    updateAnswers({ primaryGoals: newGoals });
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h1 className="text-2xl font-bold mb-2">What are your health goals?</h1>
        <p className="text-foreground-muted">
          Select all that apply. These help Eden prioritize your weekly plans.
        </p>
      </div>

      <div className="grid gap-3">
        {goals.map(goal => (
          <button
            key={goal.id}
            onClick={() => toggleGoal(goal.id)}
            className={`
              p-4 rounded-xl text-left transition-all duration-200
              ${selectedGoals.includes(goal.id)
                ? 'bg-green-500/10 border-2 border-green-500/50 text-foreground'
                : 'bg-background-secondary border border-default text-foreground-muted hover:border-foreground-subtle'
              }
            `}
          >
            {goal.label}
          </button>
        ))}
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          What does &quot;being in your prime&quot; mean to you?
        </label>
        <textarea
          value={answers.primeSpanMeaning || ''}
          onChange={(e) => updateAnswers({ primeSpanMeaning: e.target.value })}
          placeholder="e.g., Having energy to play with my kids, feeling strong at 60, running a marathon..."
          className="input min-h-[100px]"
        />
      </div>
    </div>
  );
}

function CurrentStateStep({ answers, updateAnswers }: StepProps) {
  const activityLevels: { id: FitnessLevel; label: string; description: string }[] = [
    { id: 'sedentary', label: 'Sedentary', description: 'Little to no regular exercise' },
    { id: 'light', label: 'Light Activity', description: 'Light exercise 1-2 times/week' },
    { id: 'moderate', label: 'Moderate', description: 'Moderate exercise 3-4 times/week' },
    { id: 'active', label: 'Active', description: 'Hard exercise 5-6 times/week' },
    { id: 'very_active', label: 'Very Active', description: 'Daily intense exercise' },
  ];

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h1 className="text-2xl font-bold mb-2">Your current activity level</h1>
        <p className="text-foreground-muted">
          Be honest - this helps Eden start you at the right level.
        </p>
      </div>

      <div className="space-y-3">
        {activityLevels.map(level => (
          <button
            key={level.id}
            onClick={() => updateAnswers({ currentActivityLevel: level.id })}
            className={`
              w-full p-4 rounded-xl text-left transition-all duration-200
              ${answers.currentActivityLevel === level.id
                ? 'bg-green-500/10 border-2 border-green-500/50'
                : 'bg-background-secondary border border-default hover:border-foreground-subtle'
              }
            `}
          >
            <div className="font-medium">{level.label}</div>
            <div className="text-sm text-foreground-muted">{level.description}</div>
          </button>
        ))}
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Any health conditions to consider? (optional)
        </label>
        <input
          type="text"
          value={(answers.healthConditions || []).join(', ')}
          onChange={(e) => updateAnswers({ 
            healthConditions: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
          })}
          placeholder="e.g., lower back issues, high blood pressure"
          className="input"
        />
      </div>
    </div>
  );
}

function ScheduleStep({ answers, updateAnswers }: StepProps) {
  const workoutTimes = [
    { id: 'morning', label: 'Morning', description: 'Before work' },
    { id: 'lunch', label: 'Lunch', description: 'Midday break' },
    { id: 'afternoon', label: 'Afternoon', description: 'After work' },
    { id: 'evening', label: 'Evening', description: 'Before dinner' },
  ];

  const selectedTimes = answers.preferredWorkoutTimes || [];

  const toggleTime = (timeId: string) => {
    const newTimes = selectedTimes.includes(timeId)
      ? selectedTimes.filter(t => t !== timeId)
      : [...selectedTimes, timeId];
    updateAnswers({ preferredWorkoutTimes: newTimes });
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h1 className="text-2xl font-bold mb-2">When can you work out?</h1>
        <p className="text-foreground-muted">
          Select your preferred times. Eden will schedule around these.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {workoutTimes.map(time => (
          <button
            key={time.id}
            onClick={() => toggleTime(time.id)}
            className={`
              p-4 rounded-xl text-center transition-all duration-200
              ${selectedTimes.includes(time.id)
                ? 'bg-green-500/10 border-2 border-green-500/50'
                : 'bg-background-secondary border border-default hover:border-foreground-subtle'
              }
            `}
          >
            <div className="font-medium">{time.label}</div>
            <div className="text-xs text-foreground-muted">{time.description}</div>
          </button>
        ))}
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Your typical work schedule
        </label>
        <input
          type="text"
          value={answers.workSchedule || ''}
          onChange={(e) => updateAnswers({ workSchedule: e.target.value })}
          placeholder="e.g., 9-5 Mon-Fri, shift work, flexible"
          className="input"
        />
      </div>
    </div>
  );
}

function EquipmentStep({ answers, updateAnswers }: StepProps) {
  const equipment = [
    'Dumbbells',
    'Barbell',
    'Kettlebell',
    'Resistance bands',
    'Pull-up bar',
    'Yoga mat',
    'Treadmill',
    'Stationary bike',
  ];

  const selectedEquipment = answers.homeEquipment || [];

  const toggleEquipment = (item: string) => {
    const newEquipment = selectedEquipment.includes(item)
      ? selectedEquipment.filter(e => e !== item)
      : [...selectedEquipment, item];
    updateAnswers({ homeEquipment: newEquipment });
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h1 className="text-2xl font-bold mb-2">Your equipment access</h1>
        <p className="text-foreground-muted">
          Eden will tailor workouts to what you have available.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex gap-4">
          <button
            onClick={() => updateAnswers({ gymAccess: true })}
            className={`
              flex-1 p-4 rounded-xl text-center transition-all duration-200
              ${answers.gymAccess === true
                ? 'bg-green-500/10 border-2 border-green-500/50'
                : 'bg-background-secondary border border-default hover:border-foreground-subtle'
              }
            `}
          >
            <div className="text-2xl mb-1">🏋️</div>
            <div className="font-medium">Gym Access</div>
          </button>
          
          <button
            onClick={() => updateAnswers({ gymAccess: false })}
            className={`
              flex-1 p-4 rounded-xl text-center transition-all duration-200
              ${answers.gymAccess === false
                ? 'bg-green-500/10 border-2 border-green-500/50'
                : 'bg-background-secondary border border-default hover:border-foreground-subtle'
              }
            `}
          >
            <div className="text-2xl mb-1">🏠</div>
            <div className="font-medium">Home Only</div>
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium mb-3">
            Home equipment (select all you have)
          </label>
          <div className="flex flex-wrap gap-2">
            {equipment.map(item => (
              <button
                key={item}
                onClick={() => toggleEquipment(item)}
                className={`
                  px-3 py-1.5 rounded-full text-sm transition-all duration-200
                  ${selectedEquipment.includes(item)
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-background-tertiary text-foreground-muted border border-transparent hover:border-foreground-subtle'
                  }
                `}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="outdoorAccess"
            checked={answers.outdoorAccess ?? true}
            onChange={(e) => updateAnswers({ outdoorAccess: e.target.checked })}
            className="w-5 h-5 rounded border-default bg-background-secondary"
          />
          <label htmlFor="outdoorAccess" className="text-foreground-muted">
            I have outdoor space for walks/runs
          </label>
        </div>
      </div>
    </div>
  );
}

function CapacityStep({ answers, updateAnswers }: StepProps) {
  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h1 className="text-2xl font-bold mb-2">Your time and capacity</h1>
        <p className="text-foreground-muted">
          Be realistic - Eden won&apos;t overwhelm you.
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-3">
            Max workout days per week
          </label>
          <div className="flex gap-2">
            {[2, 3, 4, 5, 6].map(days => (
              <button
                key={days}
                onClick={() => updateAnswers({ maxWorkoutDays: days })}
                className={`
                  flex-1 py-3 rounded-xl font-medium transition-all duration-200
                  ${answers.maxWorkoutDays === days
                    ? 'bg-green-500/20 text-green-400 border-2 border-green-500/50'
                    : 'bg-background-secondary border border-default hover:border-foreground-subtle'
                  }
                `}
              >
                {days}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-3">
            Max daily time for health activities (minutes)
          </label>
          <div className="flex gap-2">
            {[30, 45, 60, 90, 120].map(mins => (
              <button
                key={mins}
                onClick={() => updateAnswers({ maxDailyHealthMinutes: mins })}
                className={`
                  flex-1 py-3 rounded-xl font-medium text-sm transition-all duration-200
                  ${answers.maxDailyHealthMinutes === mins
                    ? 'bg-green-500/20 text-green-400 border-2 border-green-500/50'
                    : 'bg-background-secondary border border-default hover:border-foreground-subtle'
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
  const tones: { id: CoachingStyle['tone']; label: string; emoji: string }[] = [
    { id: 'supportive', label: 'Supportive', emoji: '💚' },
    { id: 'neutral', label: 'Balanced', emoji: '⚖️' },
    { id: 'tough', label: 'Tough Love', emoji: '💪' },
  ];

  const densities: { id: CoachingStyle['density']; label: string }[] = [
    { id: 'minimal', label: 'Just tell me what to do' },
    { id: 'balanced', label: 'Some explanation' },
    { id: 'detailed', label: 'Full reasoning' },
  ];

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h1 className="text-2xl font-bold mb-2">How should Eden coach you?</h1>
        <p className="text-foreground-muted">
          Customize Eden&apos;s communication style.
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-3">Tone</label>
          <div className="flex gap-3">
            {tones.map(tone => (
              <button
                key={tone.id}
                onClick={() => updateAnswers({ coachingTone: tone.id })}
                className={`
                  flex-1 py-4 rounded-xl text-center transition-all duration-200
                  ${answers.coachingTone === tone.id
                    ? 'bg-green-500/10 border-2 border-green-500/50'
                    : 'bg-background-secondary border border-default hover:border-foreground-subtle'
                  }
                `}
              >
                <div className="text-2xl mb-1">{tone.emoji}</div>
                <div className="text-sm font-medium">{tone.label}</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-3">Detail Level</label>
          <div className="space-y-2">
            {densities.map(density => (
              <button
                key={density.id}
                onClick={() => updateAnswers({ coachingDensity: density.id })}
                className={`
                  w-full p-4 rounded-xl text-left transition-all duration-200
                  ${answers.coachingDensity === density.id
                    ? 'bg-green-500/10 border-2 border-green-500/50'
                    : 'bg-background-secondary border border-default hover:border-foreground-subtle'
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

