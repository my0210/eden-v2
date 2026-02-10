'use client';

import { useState } from 'react';
import { 
  Pillar, 
  PillarConfig, 
  CoreFiveLog,
  CardioDetails,
  StrengthDetails,
  SleepDetails,
  MindfulnessDetails,
} from '@/lib/v3/coreFive';

interface QuickLogModalProps {
  pillar: Pillar;
  config: PillarConfig;
  weekStart: string;
  onClose: () => void;
  onSave: (log: CoreFiveLog) => void;
}

export function QuickLogModal({ pillar, config, weekStart, onClose, onSave }: QuickLogModalProps) {
  const [value, setValue] = useState<string>('');
  const [details, setDetails] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue <= 0) return;

    setSaving(true);
    try {
      const res = await fetch('/api/v3/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pillar,
          value: numValue,
          details: Object.keys(details).length > 0 ? details : undefined,
          weekStart,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        onSave(data.log);
        // Dispatch toast event
        window.dispatchEvent(
          new CustomEvent("huuman:logToast", {
            detail: {
              message: `${config.name}: ${numValue} ${config.unit} logged`,
              color: config.color,
            },
          })
        );
      }
    } catch (error) {
      console.error('Failed to save log:', error);
    } finally {
      setSaving(false);
    }
  };

  const renderFields = () => {
    switch (pillar) {
      case 'cardio':
        return <CardioFields value={value} setValue={setValue} details={details} setDetails={setDetails} />;
      case 'strength':
        return <StrengthFields value={value} setValue={setValue} details={details} setDetails={setDetails} />;
      case 'sleep':
        return <SleepFields value={value} setValue={setValue} details={details} setDetails={setDetails} />;
      case 'clean_eating':
        return <CleanEatingFields value={value} setValue={setValue} details={details} setDetails={setDetails} />;
      case 'mindfulness':
        return <MindfulnessFields value={value} setValue={setValue} details={details} setDetails={setDetails} />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
      />

        {/* Modal */}
        <div 
          className="relative w-full sm:max-w-md bg-background rounded-t-3xl sm:rounded-2xl p-6 pb-8 sm:pb-6 animate-in slide-in-from-bottom-4 duration-300 border border-t-0 sm:border-t"
          style={{
            borderColor: `${config.color}30`,
            boxShadow: `0 -10px 40px -10px ${config.color}10`,
          }}
        >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-foreground/5 flex items-center justify-center text-foreground/40 hover:text-foreground/60 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="mb-6">
          <h2 
            className="text-xl font-semibold mb-1"
            style={{ color: config.color }}
          >
            Log {config.name}
          </h2>
          <p className="text-sm text-foreground/50">{config.description}</p>
        </div>

        {/* Fields */}
        <div className="space-y-4 mb-6">
          {renderFields()}
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={!value || saving}
          className="w-full py-3 rounded-xl font-medium transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            backgroundColor: config.color,
            color: '#000',
          }}
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
}

// Field components for each pillar
interface FieldProps {
  value: string;
  setValue: (v: string) => void;
  details: Record<string, string>;
  setDetails: (d: Record<string, string>) => void;
}

function CardioFields({ value, setValue, details, setDetails }: FieldProps) {
  return (
    <>
      <div>
        <label className="block text-sm font-medium text-foreground/70 mb-2">
          Duration (minutes)
        </label>
        <input
          type="number"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="30"
          className="w-full px-4 py-3 rounded-xl bg-foreground/5 border border-foreground/10 text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-[#ef4444]/50"
          autoFocus
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground/70 mb-2">
          Type (optional)
        </label>
        <div className="flex flex-wrap gap-2">
          {['walk', 'run', 'bike', 'swim', 'row', 'other'].map((type) => (
            <button
              key={type}
              onClick={() => setDetails({ ...details, type })}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                details.type === type
                  ? 'bg-[#ef4444]/20 text-[#ef4444] border border-[#ef4444]/30'
                  : 'bg-foreground/5 text-foreground/60 border border-transparent hover:bg-foreground/10'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground/70 mb-2">
          Intensity (optional)
        </label>
        <div className="flex gap-2">
          {['easy', 'moderate', 'hard'].map((intensity) => (
            <button
              key={intensity}
              onClick={() => setDetails({ ...details, intensity })}
              className={`flex-1 px-3 py-2 rounded-lg text-sm transition-colors ${
                details.intensity === intensity
                  ? 'bg-[#ef4444]/20 text-[#ef4444] border border-[#ef4444]/30'
                  : 'bg-foreground/5 text-foreground/60 border border-transparent hover:bg-foreground/10'
              }`}
            >
              {intensity.charAt(0).toUpperCase() + intensity.slice(1)}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

function StrengthFields({ value, setValue, details, setDetails }: FieldProps) {
  // Default to 1 session
  if (!value) setValue('1');
  
  return (
    <>
      <div>
        <label className="block text-sm font-medium text-foreground/70 mb-2">
          Sessions
        </label>
        <div className="flex gap-2">
          {['1', '2'].map((sessions) => (
            <button
              key={sessions}
              onClick={() => setValue(sessions)}
              className={`flex-1 px-4 py-3 rounded-xl text-lg font-medium transition-colors ${
                value === sessions
                  ? 'bg-[#f97316]/20 text-[#f97316] border border-[#f97316]/30'
                  : 'bg-foreground/5 text-foreground/60 border border-transparent hover:bg-foreground/10'
              }`}
            >
              {sessions}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground/70 mb-2">
          Type (optional)
        </label>
        <div className="flex gap-2">
          {['gym', 'home', 'bodyweight'].map((type) => (
            <button
              key={type}
              onClick={() => setDetails({ ...details, type })}
              className={`flex-1 px-3 py-2 rounded-lg text-sm transition-colors ${
                details.type === type
                  ? 'bg-[#f97316]/20 text-[#f97316] border border-[#f97316]/30'
                  : 'bg-foreground/5 text-foreground/60 border border-transparent hover:bg-foreground/10'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground/70 mb-2">
          Focus (optional)
        </label>
        <div className="flex flex-wrap gap-2">
          {['upper', 'lower', 'full', 'other'].map((focus) => (
            <button
              key={focus}
              onClick={() => setDetails({ ...details, focus })}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                details.focus === focus
                  ? 'bg-[#f97316]/20 text-[#f97316] border border-[#f97316]/30'
                  : 'bg-foreground/5 text-foreground/60 border border-transparent hover:bg-foreground/10'
              }`}
            >
              {focus.charAt(0).toUpperCase() + focus.slice(1)}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

function SleepFields({ value, setValue, details, setDetails }: FieldProps) {
  return (
    <>
      <div>
        <label className="block text-sm font-medium text-foreground/70 mb-2">
          Hours slept last night
        </label>
        <input
          type="number"
          step="0.5"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="7.5"
          className="w-full px-4 py-3 rounded-xl bg-foreground/5 border border-foreground/10 text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-[#8b5cf6]/50"
          autoFocus
        />
        <p className="text-xs text-foreground/40 mt-1">Target: 7+ hours per night</p>
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground/70 mb-2">
          Quality (optional)
        </label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((q) => (
            <button
              key={q}
              onClick={() => setDetails({ ...details, quality: String(q) })}
              className={`flex-1 px-3 py-2 rounded-lg text-sm transition-colors ${
                details.quality === String(q)
                  ? 'bg-[#8b5cf6]/20 text-[#8b5cf6] border border-[#8b5cf6]/30'
                  : 'bg-foreground/5 text-foreground/60 border border-transparent hover:bg-foreground/10'
              }`}
            >
              {q}
            </button>
          ))}
        </div>
        <p className="text-xs text-foreground/40 mt-1 text-center">Poor → Excellent</p>
      </div>
    </>
  );
}

function CleanEatingFields({ value, setValue, details, setDetails }: FieldProps) {
  // Clean eating is 1 day = on-plan
  if (!value) setValue('1');
  
  return (
    <>
      <div>
        <label className="block text-sm font-medium text-foreground/70 mb-2">
          Was today on-plan?
        </label>
        <div className="flex gap-2">
          <button
            onClick={() => setValue('1')}
            className={`flex-1 px-4 py-4 rounded-xl text-base font-medium transition-colors ${
              value === '1'
                ? 'bg-[#22c55e]/20 text-[#22c55e] border border-[#22c55e]/30'
                : 'bg-foreground/5 text-foreground/60 border border-transparent hover:bg-foreground/10'
            }`}
          >
            ✓ On-plan
          </button>
          <button
            onClick={() => setValue('0')}
            className={`flex-1 px-4 py-4 rounded-xl text-base font-medium transition-colors ${
              value === '0'
                ? 'bg-foreground/10 text-foreground/60 border border-foreground/20'
                : 'bg-foreground/5 text-foreground/60 border border-transparent hover:bg-foreground/10'
            }`}
          >
            Off-plan
          </button>
        </div>
        <p className="text-xs text-foreground/40 mt-2 text-center">
          On-plan = protein-forward, mostly whole foods, minimal junk
        </p>
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground/70 mb-2">
          Notes (optional)
        </label>
        <input
          type="text"
          value={details.notes || ''}
          onChange={(e) => setDetails({ ...details, notes: e.target.value })}
          placeholder="What did you eat?"
          className="w-full px-4 py-3 rounded-xl bg-foreground/5 border border-foreground/10 text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-[#22c55e]/50"
        />
      </div>
    </>
  );
}

function MindfulnessFields({ value, setValue, details, setDetails }: FieldProps) {
  return (
    <>
      <div>
        <label className="block text-sm font-medium text-foreground/70 mb-2">
          Duration (minutes)
        </label>
        <input
          type="number"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="10"
          className="w-full px-4 py-3 rounded-xl bg-foreground/5 border border-foreground/10 text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-[#06b6d4]/50"
          autoFocus
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground/70 mb-2">
          Type (optional)
        </label>
        <div className="flex gap-2">
          {['breathwork', 'meditation', 'journaling', 'other'].map((type) => (
            <button
              key={type}
              onClick={() => setDetails({ ...details, type })}
              className={`flex-1 px-3 py-2 rounded-lg text-sm transition-colors ${
                details.type === type
                  ? 'bg-[#06b6d4]/20 text-[#06b6d4] border border-[#06b6d4]/30'
                  : 'bg-foreground/5 text-foreground/60 border border-transparent hover:bg-foreground/10'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
