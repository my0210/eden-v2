'use client';

import { useState, useCallback, useEffect } from 'react';
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
} from '@/lib/ai/activityCatalogue';

// ============================================================================
// Types
// ============================================================================

interface ActivityLogData {
  activityId: string;
  domain: Domain;
  date: string;
  value: number;
  unit: string;
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
  const [value, setValue] = useState<string>('');
  const [unit, setUnit] = useState<string>('min');
  const [notes, setNotes] = useState('');
  const [selectedDate, setSelectedDate] = useState<'today' | 'yesterday'>('today');

  // Reset when domain prop changes
  useEffect(() => {
    if (domain) {
      setSelectedDomain(domain);
    }
  }, [domain]);

  const handleActivitySelect = useCallback((activity: ActivityDefinition) => {
    setSelectedActivity(activity);
    // Set default unit based on activity type
    const defaultUnit = activity.logging.required.includes('duration_min') 
      ? 'min' 
      : activity.logging.required.includes('sets')
        ? 'sessions'
        : 'min';
    setUnit(defaultUnit);
    setStep('log');
  }, []);

  const handleSubmit = useCallback(() => {
    if (!selectedActivity || !selectedDomain || !value) return;

    const date = selectedDate === 'today' 
      ? new Date().toISOString().split('T')[0]
      : new Date(Date.now() - 86400000).toISOString().split('T')[0];

    onLog({
      activityId: selectedActivity.id,
      domain: selectedDomain,
      date,
      value: parseFloat(value),
      unit,
      notes: notes || undefined,
    });

    // Reset state
    handleClose();
  }, [selectedActivity, selectedDomain, value, unit, notes, selectedDate, onLog]);

  const handleClose = useCallback(() => {
    setSelectedActivity(null);
    setValue('');
    setUnit('min');
    setNotes('');
    setStep('select');
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Sheet */}
      <div className="relative w-full max-w-lg bg-[#0a0a0a] rounded-t-2xl border-t border-white/10 animate-in slide-in-from-bottom duration-300">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="px-6 pb-4 flex items-center justify-between border-b border-white/5">
          <h2 className="text-lg font-medium text-foreground/80">
            {step === 'select' ? 'Log Activity' : selectedActivity?.name}
          </h2>
          <button
            onClick={handleClose}
            className="p-2 text-foreground/40 hover:text-foreground/60"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
          {step === 'select' ? (
            <ActivityPicker
              selectedDomain={selectedDomain}
              onSelectDomain={setSelectedDomain}
              onSelectActivity={handleActivitySelect}
            />
          ) : (
            <LogForm
              activity={selectedActivity!}
              value={value}
              unit={unit}
              notes={notes}
              selectedDate={selectedDate}
              onValueChange={setValue}
              onUnitChange={setUnit}
              onNotesChange={setNotes}
              onDateChange={setSelectedDate}
              onBack={() => {
                setSelectedActivity(null);
                setStep('select');
              }}
              onSubmit={handleSubmit}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Activity Picker
// ============================================================================

interface ActivityPickerProps {
  selectedDomain: Domain | null;
  onSelectDomain: (domain: Domain) => void;
  onSelectActivity: (activity: ActivityDefinition) => void;
}

function ActivityPicker({ selectedDomain, onSelectDomain, onSelectActivity }: ActivityPickerProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Get activities for selected domain or all if none selected
  const activities = selectedDomain 
    ? getActivitiesByDomain(selectedDomain)
    : ACTIVITY_CATALOGUE;

  // Filter by search
  const filteredActivities = searchTerm
    ? activities.filter(a => 
        a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.aliases.some(alias => alias.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : activities;

  return (
    <div className="space-y-4">
      {/* Domain Pills */}
      <div className="flex flex-wrap gap-2">
        {DOMAINS.map(domain => (
          <button
            key={domain}
            onClick={() => onSelectDomain(domain)}
            className={`
              px-3 py-1.5 rounded-full text-sm transition-all
              ${selectedDomain === domain 
                ? 'text-white' 
                : 'text-foreground/50 hover:text-foreground/70'
              }
            `}
            style={{
              backgroundColor: selectedDomain === domain 
                ? `${DOMAIN_COLORS[domain]}30` 
                : 'rgba(255,255,255,0.05)',
              borderColor: selectedDomain === domain 
                ? DOMAIN_COLORS[domain] 
                : 'transparent',
              borderWidth: '1px',
            }}
          >
            {DOMAIN_EMOJI[domain]} {DOMAIN_LABELS[domain]}
          </button>
        ))}
      </div>

      {/* Search */}
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search activities..."
        className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-foreground/80 placeholder-foreground/30 focus:outline-none focus:ring-1 focus:ring-green-500/50"
      />

      {/* Activity List */}
      <div className="space-y-1 max-h-64 overflow-y-auto">
        {filteredActivities.slice(0, 15).map(activity => {
          const primaryDomain = Object.keys(activity.domains)[0] as Domain;
          const color = DOMAIN_COLORS[primaryDomain];
          
          return (
            <button
              key={activity.id}
              onClick={() => onSelectActivity(activity)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors text-left"
            >
              <div 
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: color }}
              />
              <span className="text-sm text-foreground/70">{activity.name}</span>
            </button>
          );
        })}
        
        {filteredActivities.length === 0 && (
          <p className="text-center text-foreground/30 py-4">No activities found</p>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Log Form
// ============================================================================

interface LogFormProps {
  activity: ActivityDefinition;
  value: string;
  unit: string;
  notes: string;
  selectedDate: 'today' | 'yesterday';
  onValueChange: (value: string) => void;
  onUnitChange: (unit: string) => void;
  onNotesChange: (notes: string) => void;
  onDateChange: (date: 'today' | 'yesterday') => void;
  onBack: () => void;
  onSubmit: () => void;
}

function LogForm({
  activity,
  value,
  unit,
  notes,
  selectedDate,
  onValueChange,
  onUnitChange,
  onNotesChange,
  onDateChange,
  onBack,
  onSubmit,
}: LogFormProps) {
  const primaryDomain = Object.keys(activity.domains)[0] as Domain;
  const color = DOMAIN_COLORS[primaryDomain];

  // Determine unit options based on activity
  const unitOptions = getUnitOptions(activity);

  return (
    <div className="space-y-5">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-foreground/40 hover:text-foreground/60"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      {/* Value + Unit Input */}
      <div>
        <label className="block text-xs text-foreground/40 mb-2 uppercase tracking-wider">
          Amount
        </label>
        <div className="flex gap-2">
          <input
            type="number"
            value={value}
            onChange={(e) => onValueChange(e.target.value)}
            placeholder="0"
            className="flex-1 px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-foreground/80 text-lg text-center focus:outline-none focus:ring-1 focus:ring-green-500/50"
            style={{ borderColor: `${color}30` }}
          />
          <select
            value={unit}
            onChange={(e) => onUnitChange(e.target.value)}
            className="px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-foreground/60 focus:outline-none"
          >
            {unitOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Date Selection */}
      <div>
        <label className="block text-xs text-foreground/40 mb-2 uppercase tracking-wider">
          When
        </label>
        <div className="flex gap-2">
          <button
            onClick={() => onDateChange('today')}
            className={`flex-1 py-2.5 rounded-lg text-sm transition-all ${
              selectedDate === 'today'
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-white/5 text-foreground/50 border border-white/10'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => onDateChange('yesterday')}
            className={`flex-1 py-2.5 rounded-lg text-sm transition-all ${
              selectedDate === 'yesterday'
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-white/5 text-foreground/50 border border-white/10'
            }`}
          >
            Yesterday
          </button>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-xs text-foreground/40 mb-2 uppercase tracking-wider">
          Notes (optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Any notes..."
          rows={2}
          className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-foreground/80 placeholder-foreground/30 resize-none focus:outline-none focus:ring-1 focus:ring-green-500/50"
        />
      </div>

      {/* Submit */}
      <button
        onClick={onSubmit}
        disabled={!value}
        className="w-full py-3.5 rounded-xl bg-green-500/20 border border-green-500/30 text-green-400 font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-green-500/30 transition-all"
      >
        Log Activity
      </button>
    </div>
  );
}

// ============================================================================
// Helpers
// ============================================================================

function getUnitOptions(activity: ActivityDefinition): { value: string; label: string }[] {
  const required = activity.logging.required;
  
  if (required.includes('duration_min')) {
    return [
      { value: 'min', label: 'minutes' },
      { value: 'hours', label: 'hours' },
    ];
  }
  
  if (required.includes('sets')) {
    return [
      { value: 'sessions', label: 'sessions' },
      { value: 'sets', label: 'sets' },
    ];
  }
  
  if (required.includes('meal_type') || required.includes('protein_g')) {
    return [
      { value: 'meals', label: 'meals' },
      { value: 'days', label: 'days' },
    ];
  }
  
  if (required.includes('bed_time') || required.includes('sleep_duration_min')) {
    return [
      { value: 'hours', label: 'hours' },
      { value: 'min', label: 'minutes' },
    ];
  }
  
  // Default
  return [
    { value: 'min', label: 'minutes' },
    { value: 'sessions', label: 'sessions' },
    { value: 'days', label: 'days' },
  ];
}
