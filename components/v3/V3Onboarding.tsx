'use client';

import { useState } from 'react';
import { PILLARS, PILLAR_CONFIGS } from '@/lib/v3/coreFive';
import { iconComponents } from './CoreFiveCard';

interface V3OnboardingProps {
  onComplete: () => void;
}

const PILLAR_WHY: Record<string, string> = {
  cardio: '150 min/week of moderate cardio is the WHO minimum for cardiovascular health and the #1 lever for longevity.',
  strength: '3 sessions/week builds the muscle mass and bone density that protect against frailty as you age.',
  sleep: '7+ hours per night (49/week) is when your body repairs tissue, consolidates memory, and regulates hormones.',
  clean_eating: '5 on-plan days gives you consistency while allowing flexibility. Protein-forward, whole foods, minimal junk.',
  mindfulness: '60 min/week of breathwork, meditation, or journaling reduces cortisol and improves emotional regulation.',
};

export function V3Onboarding({ onComplete }: V3OnboardingProps) {
  const [step, setStep] = useState(0);

  const totalSteps = 3;

  const handleNext = () => {
    if (step < totalSteps - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-background flex flex-col">
      {/* Ambient gradient */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative w-[600px] h-[600px]">
          <div 
            className="absolute inset-0 rounded-full opacity-20 blur-[120px]"
            style={{
              background: 'radial-gradient(circle, rgba(34,197,94,0.4) 0%, rgba(16,185,129,0.2) 40%, transparent 70%)',
            }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 max-w-lg mx-auto w-full">
        
        {/* Step 0: Welcome */}
        {step === 0 && (
          <div className="text-center animate-fade-in-up">
            <h1 className="text-4xl font-light tracking-tight mb-4">
              huuman
            </h1>
            <p className="text-foreground/60 text-lg mb-10 leading-relaxed">
              Track five pillars of health every week.<br />
              Hit all five to stay in your prime.
            </p>

            {/* Pillar icons row */}
            <div className="flex justify-center gap-5 mb-12">
              {PILLARS.map(pillar => {
                const config = PILLAR_CONFIGS[pillar];
                const IconComponent = iconComponents[config.icon];
                return (
                  <div key={pillar} className="flex flex-col items-center gap-2">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${config.color}20` }}
                    >
                      {IconComponent && <IconComponent className="w-6 h-6" style={{ color: config.color }} />}
                    </div>
                    <span className="text-xs text-foreground/50">{config.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 1: Your Weekly Targets */}
        {step === 1 && (
          <div className="w-full animate-fade-in-up">
            <h2 className="text-2xl font-medium text-center mb-2">
              Your Weekly Targets
            </h2>
            <p className="text-foreground/50 text-center text-sm mb-8">
              Evidence-based minimums for staying in your prime.
            </p>

            <div className="space-y-3">
              {PILLARS.map(pillar => {
                const config = PILLAR_CONFIGS[pillar];
                const IconComponent = iconComponents[config.icon];
                return (
                  <div 
                    key={pillar} 
                    className="flex items-start gap-3 p-3 rounded-xl"
                    style={{ backgroundColor: `${config.color}08`, border: `1px solid ${config.color}20` }}
                  >
                    <div 
                      className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ backgroundColor: `${config.color}20` }}
                    >
                      {IconComponent && <IconComponent className="w-4.5 h-4.5" style={{ color: config.color }} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between mb-0.5">
                        <span className="text-sm font-medium text-foreground/90">{config.name}</span>
                        <span 
                          className="text-sm font-semibold tabular-nums"
                          style={{ color: config.color }}
                        >
                          {config.weeklyTarget} {config.unit}
                        </span>
                      </div>
                      <p className="text-xs text-foreground/40 leading-relaxed">
                        {PILLAR_WHY[pillar]}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 2: Log as you go */}
        {step === 2 && (
          <div className="w-full animate-fade-in-up text-center">
            <h2 className="text-2xl font-medium mb-2">
              Log as you go
            </h2>
            <p className="text-foreground/50 text-sm mb-10">
              Tap a pillar card to see details. Use the log button to record activity.
            </p>

            {/* Mock card */}
            <div className="max-w-sm mx-auto">
              <div 
                className="rounded-2xl p-4 text-left"
                style={{ 
                  backgroundColor: '#ef444410',
                  border: '1px solid #ef444430',
                }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: '#ef444420' }}
                  >
                    {iconComponents.heart && (
                      <span style={{ color: '#ef4444' }}>
                        {(() => { const H = iconComponents.heart; return <H className="w-5 h-5" style={{ color: '#ef4444' }} />; })()}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-base font-medium text-foreground/90">Cardio</h3>
                    <p className="text-xs text-foreground/50">Zone 2, walking, running, cycling</p>
                  </div>
                </div>
                <div className="mb-3">
                  <div className="flex items-baseline justify-between mb-1.5">
                    <span className="text-2xl font-semibold tabular-nums">30</span>
                    <span className="text-sm text-foreground/40">/ 150 min</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#ef444415' }}>
                    <div className="h-full rounded-full" style={{ width: '20%', backgroundColor: '#ef4444', opacity: 0.7 }} />
                  </div>
                </div>
                {/* Highlighted log button */}
                <div className="relative">
                  <div 
                    className="w-full py-2.5 rounded-xl text-sm font-medium text-center"
                    style={{ backgroundColor: '#ef444420', color: '#ef4444' }}
                  >
                    + Log Cardio
                  </div>
                  {/* Pulse ring to draw attention */}
                  <div className="absolute -inset-1 rounded-2xl border-2 border-dashed animate-pulse-soft" style={{ borderColor: '#ef444440' }} />
                </div>
              </div>
            </div>

            <p className="text-foreground/40 text-xs mt-8">
              Your weekly progress resets every Monday.
            </p>
          </div>
        )}
      </div>

      {/* Bottom area */}
      <div className="relative z-10 px-6 pb-8 pt-4 max-w-lg mx-auto w-full">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-6">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: i === step ? '24px' : '8px',
                backgroundColor: i === step ? '#22c55e' : 'rgba(255,255,255,0.15)',
              }}
            />
          ))}
        </div>

        {/* Action button */}
        <button
          onClick={handleNext}
          className="w-full py-4 rounded-xl font-medium transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
          style={{
            backgroundColor: step === totalSteps - 1 ? '#22c55e' : 'rgba(255,255,255,0.1)',
            color: step === totalSteps - 1 ? '#000' : 'rgba(255,255,255,0.8)',
            border: step === totalSteps - 1 ? 'none' : '1px solid rgba(255,255,255,0.1)',
          }}
        >
          {step === totalSteps - 1 ? 'Get Started' : 'Next'}
        </button>

        {/* Skip link */}
        {step < totalSteps - 1 && (
          <button
            onClick={onComplete}
            className="w-full mt-3 py-2 text-sm text-foreground/30 hover:text-foreground/50 transition-colors"
          >
            Skip intro
          </button>
        )}
      </div>
    </div>
  );
}
