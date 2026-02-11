'use client';

import { useState } from 'react';
import { Drawer } from 'vaul';
import { 
  Pillar, 
  PillarConfig, 
  CoreFiveLog,
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
        return <CardioFields value={value} setValue={setValue} details={details} setDetails={setDetails} color={config.color} />;
      case 'strength':
        return <StrengthFields value={value} setValue={setValue} details={details} setDetails={setDetails} color={config.color} />;
      case 'sleep':
        return <SleepFields value={value} setValue={setValue} details={details} setDetails={setDetails} color={config.color} />;
      case 'clean_eating':
        return <CleanEatingFields value={value} setValue={setValue} details={details} setDetails={setDetails} color={config.color} />;
      case 'mindfulness':
        return <MindfulnessFields value={value} setValue={setValue} details={details} setDetails={setDetails} color={config.color} />;
      default:
        return null;
    }
  };

  return (
    <Drawer.Root open onOpenChange={(open) => { if (!open) onClose(); }}>
      <Drawer.Portal>
        <Drawer.Overlay
          className="fixed inset-0 z-[100]"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
        />

        <Drawer.Content
          className="fixed bottom-0 left-0 right-0 z-[101] flex flex-col outline-none"
          style={{
            maxHeight: '85vh',
            backgroundColor: 'rgba(28, 28, 30, 0.98)',
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
          <div className="flex items-center justify-between px-5 pb-4 flex-shrink-0">
            <Drawer.Title>
              <h2
                className="text-lg font-semibold"
                style={{ color: config.color }}
              >
                Log {config.name}
              </h2>
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
          <div className="h-px mx-5 flex-shrink-0" style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)' }} />

          {/* Content */}
          <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5">
            <p className="text-sm text-white/40 mb-5">{config.description}</p>

            <div className="space-y-5">
              {renderFields()}
            </div>
          </div>

          {/* Save button + safe area */}
          <div className="flex-shrink-0 px-5 pt-3 pb-4 safe-area-bottom">
            <button
              onClick={handleSave}
              disabled={!value || saving}
              className="w-full py-3.5 rounded-xl font-medium text-[15px] transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.98]"
              style={{
                backgroundColor: config.color,
                color: '#000',
              }}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

// ============================================================================
// Field components
// ============================================================================

interface FieldProps {
  value: string;
  setValue: (v: string) => void;
  details: Record<string, string>;
  setDetails: (d: Record<string, string>) => void;
  color: string;
}

function ChipGroup({
  options,
  selected,
  onSelect,
  color,
}: {
  options: string[];
  selected: string | undefined;
  onSelect: (v: string) => void;
  color: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onSelect(opt)}
          className="px-3.5 py-2 rounded-xl text-sm font-medium transition-colors"
          style={
            selected === opt
              ? { backgroundColor: `${color}20`, color, border: `1px solid ${color}30` }
              : { backgroundColor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', border: '1px solid transparent' }
          }
        >
          {opt.charAt(0).toUpperCase() + opt.slice(1)}
        </button>
      ))}
    </div>
  );
}

function CardioFields({ value, setValue, details, setDetails, color }: FieldProps) {
  return (
    <>
      <div>
        <label className="block text-xs font-medium text-white/40 uppercase tracking-wider mb-2">
          Duration (minutes)
        </label>
        <input
          type="number"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="30"
          className="w-full px-4 py-3 rounded-xl text-white placeholder:text-white/25 focus:outline-none focus:ring-1"
          style={{
            backgroundColor: 'rgba(255,255,255,0.06)',
          }}
          autoFocus
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-white/40 uppercase tracking-wider mb-2">
          Type
        </label>
        <ChipGroup
          options={['walk', 'run', 'bike', 'swim', 'row', 'other']}
          selected={details.type}
          onSelect={(type) => setDetails({ ...details, type })}
          color={color}
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-white/40 uppercase tracking-wider mb-2">
          Intensity
        </label>
        <ChipGroup
          options={['easy', 'moderate', 'hard']}
          selected={details.intensity}
          onSelect={(intensity) => setDetails({ ...details, intensity })}
          color={color}
        />
      </div>
    </>
  );
}

function StrengthFields({ value, setValue, details, setDetails, color }: FieldProps) {
  if (!value) setValue('1');

  return (
    <>
      <div>
        <label className="block text-xs font-medium text-white/40 uppercase tracking-wider mb-2">
          Sessions
        </label>
        <div className="flex gap-2">
          {['1', '2'].map((sessions) => (
            <button
              key={sessions}
              onClick={() => setValue(sessions)}
              className="flex-1 px-4 py-3.5 rounded-xl text-lg font-medium transition-colors"
              style={
                value === sessions
                  ? { backgroundColor: `${color}20`, color, border: `1px solid ${color}30` }
                  : { backgroundColor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', border: '1px solid transparent' }
              }
            >
              {sessions}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-white/40 uppercase tracking-wider mb-2">
          Type
        </label>
        <ChipGroup
          options={['gym', 'home', 'bodyweight']}
          selected={details.type}
          onSelect={(type) => setDetails({ ...details, type })}
          color={color}
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-white/40 uppercase tracking-wider mb-2">
          Focus
        </label>
        <ChipGroup
          options={['upper', 'lower', 'full', 'other']}
          selected={details.focus}
          onSelect={(focus) => setDetails({ ...details, focus })}
          color={color}
        />
      </div>
    </>
  );
}

function SleepFields({ value, setValue, details, setDetails, color }: FieldProps) {
  return (
    <>
      <div>
        <label className="block text-xs font-medium text-white/40 uppercase tracking-wider mb-2">
          Hours slept
        </label>
        <input
          type="number"
          step="0.5"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="7.5"
          className="w-full px-4 py-3 rounded-xl text-white placeholder:text-white/25 focus:outline-none focus:ring-1"
          style={{
            backgroundColor: 'rgba(255,255,255,0.06)',
          }}
          autoFocus
        />
        <p className="text-xs text-white/25 mt-1.5">Target: 7+ hours per night</p>
      </div>
      <div>
        <label className="block text-xs font-medium text-white/40 uppercase tracking-wider mb-2">
          Quality
        </label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((q) => (
            <button
              key={q}
              onClick={() => setDetails({ ...details, quality: String(q) })}
              className="flex-1 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
              style={
                details.quality === String(q)
                  ? { backgroundColor: `${color}20`, color, border: `1px solid ${color}30` }
                  : { backgroundColor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', border: '1px solid transparent' }
              }
            >
              {q}
            </button>
          ))}
        </div>
        <p className="text-xs text-white/25 mt-1.5 text-center">Poor → Excellent</p>
      </div>
    </>
  );
}

function CleanEatingFields({ value, setValue, details, setDetails, color }: FieldProps) {
  if (!value) setValue('1');

  return (
    <>
      <div>
        <label className="block text-xs font-medium text-white/40 uppercase tracking-wider mb-2">
          Was today on-plan?
        </label>
        <div className="flex gap-2">
          <button
            onClick={() => setValue('1')}
            className="flex-1 px-4 py-4 rounded-xl text-base font-medium transition-colors"
            style={
              value === '1'
                ? { backgroundColor: `${color}20`, color, border: `1px solid ${color}30` }
                : { backgroundColor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', border: '1px solid transparent' }
            }
          >
            ✓ On-plan
          </button>
          <button
            onClick={() => setValue('0')}
            className="flex-1 px-4 py-4 rounded-xl text-base font-medium transition-colors"
            style={
              value === '0'
                ? { backgroundColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.2)' }
                : { backgroundColor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', border: '1px solid transparent' }
            }
          >
            Off-plan
          </button>
        </div>
        <p className="text-xs text-white/25 mt-2 text-center">
          On-plan = protein-forward, mostly whole foods, minimal junk
        </p>
      </div>
      <div>
        <label className="block text-xs font-medium text-white/40 uppercase tracking-wider mb-2">
          Notes
        </label>
        <input
          type="text"
          value={details.notes || ''}
          onChange={(e) => setDetails({ ...details, notes: e.target.value })}
          placeholder="What did you eat?"
          className="w-full px-4 py-3 rounded-xl text-white placeholder:text-white/25 focus:outline-none focus:ring-1"
          style={{
            backgroundColor: 'rgba(255,255,255,0.06)',
          }}
        />
      </div>
    </>
  );
}

function MindfulnessFields({ value, setValue, details, setDetails, color }: FieldProps) {
  return (
    <>
      <div>
        <label className="block text-xs font-medium text-white/40 uppercase tracking-wider mb-2">
          Duration (minutes)
        </label>
        <input
          type="number"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="10"
          className="w-full px-4 py-3 rounded-xl text-white placeholder:text-white/25 focus:outline-none focus:ring-1"
          style={{
            backgroundColor: 'rgba(255,255,255,0.06)',
          }}
          autoFocus
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-white/40 uppercase tracking-wider mb-2">
          Type
        </label>
        <ChipGroup
          options={['breathwork', 'meditation', 'journaling', 'other']}
          selected={details.type}
          onSelect={(type) => setDetails({ ...details, type })}
          color={color}
        />
      </div>
    </>
  );
}
