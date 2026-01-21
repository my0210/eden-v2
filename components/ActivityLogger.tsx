'use client';

import { useState, useCallback } from 'react';
import { 
  Domain, 
  DOMAINS, 
  DOMAIN_LABELS, 
  DOMAIN_EMOJI,
  DOMAIN_COLORS 
} from '@/lib/types';
import {
  ActivityDefinition,
  ACTIVITY_CATALOGUE,
  getActivitiesByDomain,
  getTierLabel,
  LOCATION_OPTIONS,
  HR_ZONE_OPTIONS,
  EQUIPMENT_OPTIONS,
  MEAL_TYPE_OPTIONS,
} from '@/lib/ai/activityCatalogue';

// ============================================================================
// Types
// ============================================================================

interface ActivityLogData {
  activityId: string;
  domain: Domain;
  date: string;
  data: Record<string, unknown>;
  notes?: string;
}

interface ActivityLoggerProps {
  domain?: Domain;
  isOpen: boolean;
  onClose: () => void;
  onLog: (data: ActivityLogData) => void;
}

// ============================================================================
// Main Component
// ============================================================================

export function ActivityLogger({ domain, isOpen, onClose, onLog }: ActivityLoggerProps) {
  const [step, setStep] = useState<'select' | 'log'>('select');
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(domain || null);
  const [selectedActivity, setSelectedActivity] = useState<ActivityDefinition | null>(null);
  const [logData, setLogData] = useState<Record<string, unknown>>({});
  const [notes, setNotes] = useState('');
  const [selectedDate, setSelectedDate] = useState<'today' | 'yesterday' | string>('today');

  const handleActivitySelect = useCallback((activity: ActivityDefinition) => {
    setSelectedActivity(activity);
    setLogData({});
    setStep('log');
  }, []);

  const handleBackToSelect = useCallback(() => {
    setSelectedActivity(null);
    setStep('select');
  }, []);

  const handleSubmit = useCallback(() => {
    if (!selectedActivity || !selectedDomain) return;

    const date = selectedDate === 'today' 
      ? new Date().toISOString().split('T')[0]
      : selectedDate === 'yesterday'
      ? new Date(Date.now() - 86400000).toISOString().split('T')[0]
      : selectedDate;

    onLog({
      activityId: selectedActivity.id,
      domain: selectedDomain,
      date,
      data: logData,
      notes: notes || undefined,
    });

    // Reset state
    setSelectedActivity(null);
    setLogData({});
    setNotes('');
    setSelectedDate('today');
    setStep('select');
    onClose();
  }, [selectedActivity, selectedDomain, logData, notes, selectedDate, onLog, onClose]);

  const handleClose = useCallback(() => {
    setSelectedActivity(null);
    setLogData({});
    setNotes('');
    setStep('select');
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg max-h-[85vh] bg-background border border-white/10 rounded-t-2xl sm:rounded-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            {step === 'log' && (
              <button
                onClick={handleBackToSelect}
                className="p-1 text-foreground/40 hover:text-foreground/60 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <h2 className="text-lg font-medium">
              {step === 'select' 
                ? `Add Activity${selectedDomain ? ` · ${DOMAIN_LABELS[selectedDomain]}` : ''}`
                : `Log: ${selectedActivity?.name}`
              }
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1 text-foreground/40 hover:text-foreground/60 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {step === 'select' ? (
            <ActivitySelector
              domain={selectedDomain}
              onSelectDomain={setSelectedDomain}
              onSelectActivity={handleActivitySelect}
            />
          ) : (
            <LoggingForm
              activity={selectedActivity!}
              logData={logData}
              setLogData={setLogData}
              notes={notes}
              setNotes={setNotes}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
            />
          )}
        </div>

        {/* Footer */}
        {step === 'log' && (
          <div className="p-4 border-t border-white/5">
            <button
              onClick={handleSubmit}
              className="w-full py-3 px-4 rounded-xl bg-green-500/20 border border-green-500/30 text-green-400 font-medium hover:bg-green-500/30 transition-colors"
            >
              Log Activity
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Activity Selector
// ============================================================================

interface ActivitySelectorProps {
  domain: Domain | null;
  onSelectDomain: (domain: Domain) => void;
  onSelectActivity: (activity: ActivityDefinition) => void;
}

function ActivitySelector({ domain, onSelectDomain, onSelectActivity }: ActivitySelectorProps) {
  if (!domain) {
    // Show domain picker
    return (
      <div className="p-4 space-y-4">
        <p className="text-sm text-foreground/50">Select a domain</p>
        <div className="grid grid-cols-2 gap-3">
          {DOMAINS.map(d => (
            <button
              key={d}
              onClick={() => onSelectDomain(d)}
              className="p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-colors text-left"
            >
              <span className="text-2xl">{DOMAIN_EMOJI[d]}</span>
              <p className="mt-2 font-medium text-foreground/80">{DOMAIN_LABELS[d]}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Show activities for domain
  const activities = getActivitiesByDomain(domain);
  const tier0 = activities.filter(a => a.domains[domain]?.tier === 0);
  const tier1 = activities.filter(a => a.domains[domain]?.tier === 1);
  const tier2 = activities.filter(a => a.domains[domain]?.tier === 2);

  return (
    <div className="p-4 space-y-6">
      {/* Tier 0 */}
      {tier0.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-foreground/40 uppercase tracking-wider">
            {getTierLabel(0)} · Tier 0
          </h3>
          <div className="space-y-2">
            {tier0.map(activity => (
              <ActivityOption
                key={activity.id}
                activity={activity}
                domain={domain}
                onSelect={onSelectActivity}
              />
            ))}
          </div>
        </div>
      )}

      {/* Tier 1 */}
      {tier1.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-foreground/40 uppercase tracking-wider">
            {getTierLabel(1)} · Tier 1
          </h3>
          <div className="space-y-2">
            {tier1.map(activity => (
              <ActivityOption
                key={activity.id}
                activity={activity}
                domain={domain}
                onSelect={onSelectActivity}
              />
            ))}
          </div>
        </div>
      )}

      {/* Tier 2 */}
      {tier2.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-foreground/40 uppercase tracking-wider">
            {getTierLabel(2)} · Tier 2
          </h3>
          <div className="space-y-2">
            {tier2.map(activity => (
              <ActivityOption
                key={activity.id}
                activity={activity}
                domain={domain}
                onSelect={onSelectActivity}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface ActivityOptionProps {
  activity: ActivityDefinition;
  domain: Domain;
  onSelect: (activity: ActivityDefinition) => void;
}

function ActivityOption({ activity, domain, onSelect }: ActivityOptionProps) {
  const color = DOMAIN_COLORS[domain];
  const tier = activity.domains[domain]?.tier;

  return (
    <button
      onClick={() => onSelect(activity)}
      className="w-full p-3 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-colors text-left"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground/80">{activity.name}</p>
          <p className="text-xs text-foreground/40 mt-1 line-clamp-2">
            {activity.evidenceRationale.slice(0, 100)}...
          </p>
        </div>
        <span 
          className="text-xs px-2 py-0.5 rounded-full"
          style={{ backgroundColor: `${color}20`, color }}
        >
          T{tier}
        </span>
      </div>
    </button>
  );
}

// ============================================================================
// Logging Form
// ============================================================================

interface LoggingFormProps {
  activity: ActivityDefinition;
  logData: Record<string, unknown>;
  setLogData: (data: Record<string, unknown>) => void;
  notes: string;
  setNotes: (notes: string) => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
}

function LoggingForm({ 
  activity, 
  logData, 
  setLogData, 
  notes, 
  setNotes,
  selectedDate,
  setSelectedDate 
}: LoggingFormProps) {
  const handleFieldChange = (field: string, value: unknown) => {
    setLogData({ ...logData, [field]: value });
  };

  return (
    <div className="p-4 space-y-6">
      {/* Required Fields */}
      <div className="space-y-4">
        <h3 className="text-xs font-medium text-foreground/40 uppercase tracking-wider">
          Required
        </h3>
        {activity.logging.required.map(field => (
          <LogField
            key={field}
            field={field}
            value={logData[field]}
            onChange={(v) => handleFieldChange(field, v)}
            required
          />
        ))}
      </div>

      {/* Date Selection */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-foreground/40 uppercase tracking-wider">
          When
        </label>
        <div className="flex gap-2">
          {['today', 'yesterday'].map(opt => (
            <button
              key={opt}
              onClick={() => setSelectedDate(opt)}
              className={`px-4 py-2 rounded-lg border transition-colors ${
                selectedDate === opt
                  ? 'border-green-500/30 bg-green-500/10 text-green-400'
                  : 'border-white/5 bg-white/[0.02] text-foreground/50 hover:bg-white/[0.05]'
              }`}
            >
              {opt.charAt(0).toUpperCase() + opt.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Optional Fields */}
      {activity.logging.optional.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xs font-medium text-foreground/40 uppercase tracking-wider">
            Optional
          </h3>
          {activity.logging.optional.filter(f => f !== 'notes').map(field => (
            <LogField
              key={field}
              field={field}
              value={logData[field]}
              onChange={(v) => handleFieldChange(field, v)}
            />
          ))}
        </div>
      )}

      {/* Notes */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-foreground/40 uppercase tracking-wider">
          Notes (optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="How did it feel?"
          className="w-full px-3 py-2 rounded-lg border border-white/5 bg-white/[0.02] text-foreground/80 placeholder:text-foreground/30 focus:outline-none focus:border-white/10 resize-none"
          rows={2}
        />
      </div>
    </div>
  );
}

// ============================================================================
// Log Field
// ============================================================================

interface LogFieldProps {
  field: string;
  value: unknown;
  onChange: (value: unknown) => void;
  required?: boolean;
}

function LogField({ field, value, onChange, required }: LogFieldProps) {
  const label = formatFieldLabel(field);
  const fieldType = getFieldType(field);

  switch (fieldType) {
    case 'duration':
      return (
        <div className="space-y-2">
          <label className="text-sm text-foreground/60">
            {label} {required && <span className="text-red-400">*</span>}
          </label>
          <DurationPicker value={value as number} onChange={onChange} />
        </div>
      );

    case 'select':
      return (
        <div className="space-y-2">
          <label className="text-sm text-foreground/60">
            {label} {required && <span className="text-red-400">*</span>}
          </label>
          <SelectField field={field} value={value as string} onChange={onChange} />
        </div>
      );

    case 'number':
      return (
        <div className="space-y-2">
          <label className="text-sm text-foreground/60">
            {label} {required && <span className="text-red-400">*</span>}
          </label>
          <input
            type="number"
            value={(value as number) || ''}
            onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
            className="w-full px-3 py-2 rounded-lg border border-white/5 bg-white/[0.02] text-foreground/80 focus:outline-none focus:border-white/10"
            placeholder={`Enter ${label.toLowerCase()}`}
          />
        </div>
      );

    case 'time':
      return (
        <div className="space-y-2">
          <label className="text-sm text-foreground/60">
            {label} {required && <span className="text-red-400">*</span>}
          </label>
          <input
            type="time"
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-white/5 bg-white/[0.02] text-foreground/80 focus:outline-none focus:border-white/10"
          />
        </div>
      );

    default:
      return (
        <div className="space-y-2">
          <label className="text-sm text-foreground/60">
            {label} {required && <span className="text-red-400">*</span>}
          </label>
          <input
            type="text"
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-white/5 bg-white/[0.02] text-foreground/80 focus:outline-none focus:border-white/10"
            placeholder={`Enter ${label.toLowerCase()}`}
          />
        </div>
      );
  }
}

// ============================================================================
// Sub-components
// ============================================================================

function DurationPicker({ value, onChange }: { value?: number; onChange: (v: number) => void }) {
  const presets = [15, 20, 30, 45, 60, 90];

  return (
    <div className="flex flex-wrap gap-2">
      {presets.map(preset => (
        <button
          key={preset}
          onClick={() => onChange(preset)}
          className={`px-3 py-2 rounded-lg border transition-colors ${
            value === preset
              ? 'border-green-500/30 bg-green-500/10 text-green-400'
              : 'border-white/5 bg-white/[0.02] text-foreground/50 hover:bg-white/[0.05]'
          }`}
        >
          {preset}m
        </button>
      ))}
      <input
        type="number"
        value={value && !presets.includes(value) ? value : ''}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-20 px-3 py-2 rounded-lg border border-white/5 bg-white/[0.02] text-foreground/80 focus:outline-none focus:border-white/10"
        placeholder="Custom"
      />
    </div>
  );
}

function SelectField({ 
  field, 
  value, 
  onChange 
}: { 
  field: string; 
  value?: string; 
  onChange: (v: string) => void;
}) {
  const options = getFieldOptions(field);

  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`px-3 py-2 rounded-lg border transition-colors ${
            value === opt
              ? 'border-green-500/30 bg-green-500/10 text-green-400'
              : 'border-white/5 bg-white/[0.02] text-foreground/50 hover:bg-white/[0.05]'
          }`}
        >
          {formatOptionLabel(opt)}
        </button>
      ))}
    </div>
  );
}

// ============================================================================
// Helpers
// ============================================================================

function formatFieldLabel(field: string): string {
  return field
    .replace(/_/g, ' ')
    .replace(/(\d+)/g, ' $1')
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function formatOptionLabel(option: string): string {
  return option
    .replace(/_/g, ' ')
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function getFieldType(field: string): 'duration' | 'select' | 'number' | 'time' | 'text' {
  if (field.includes('duration') || field === 'duration_min') return 'duration';
  if (field.includes('time') && field !== 'timing') return 'time';
  if (field === 'location' || field === 'hr_zone' || field === 'equipment' || 
      field === 'meal_type' || field === 'diet_pattern' || field === 'supplement' ||
      field === 'timing') return 'select';
  if (field.includes('_g') || field.includes('_kg') || field.includes('_l') ||
      field.includes('_min') || field.includes('_sec') || field.includes('_bpm') ||
      field.includes('_10') || field === 'sets' || field === 'reps' ||
      field === 'steps' || field === 'water_l' || field === 'protein_g') return 'number';
  return 'text';
}

function getFieldOptions(field: string): readonly string[] {
  switch (field) {
    case 'location': return LOCATION_OPTIONS;
    case 'hr_zone': return HR_ZONE_OPTIONS;
    case 'equipment': return EQUIPMENT_OPTIONS;
    case 'meal_type': return MEAL_TYPE_OPTIONS;
    default: return [];
  }
}
