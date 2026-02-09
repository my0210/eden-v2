'use client';

import { useState, useEffect, useRef } from 'react';
import { Check, ExternalLink, Timer, Dumbbell, ShoppingCart, Camera, Activity, ChevronDown, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================================================
// Types
// ============================================================================

export interface ToolDisplay {
  type: 'log_confirmation' | 'progress_summary' | 'workout' | 'grocery_list' | 'deep_link' | 'timer' | 'scanner';
  content: unknown;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolResults?: ToolDisplay[];
  isStreaming?: boolean;
}

interface ChatMessageProps {
  message: Message;
  onTimerStart?: (minutes: number) => void;
  onScannerOpen?: () => void;
}

const PILLAR_COLORS: Record<string, string> = {
  cardio: '#ef4444',
  strength: '#f97316',
  sleep: '#8b5cf6',
  clean_eating: '#22c55e',
  mindfulness: '#06b6d4',
};

// ============================================================================
// Main Component
// ============================================================================

export function ChatMessage({ message, onTimerStart, onScannerOpen }: ChatMessageProps) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end mb-4">
        <div 
          className="max-w-[85%] px-4 py-3 rounded-3xl rounded-br-lg"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
        >
          <p className="text-[15px] text-white/90 whitespace-pre-wrap leading-relaxed">
            {message.content}
          </p>
        </div>
      </div>
    );
  }

  return <AssistantMessage message={message} onTimerStart={onTimerStart} onScannerOpen={onScannerOpen} />;
}

// ============================================================================
// Assistant Message
// ============================================================================

function AssistantMessage({ message, onTimerStart, onScannerOpen }: ChatMessageProps) {
  return (
    <div className="mb-5">
      {/* Tool Trail -- shown above the text response */}
      {message.toolResults && message.toolResults.length > 0 && (
        <div className="mb-3 space-y-2">
          {message.toolResults.map((result, i) => (
            <ToolCard 
              key={i} 
              result={result} 
              onTimerStart={onTimerStart}
              onScannerOpen={onScannerOpen}
            />
          ))}
        </div>
      )}

      {/* Text response */}
      {message.content && (
        <div className="max-w-[95%]">
          <p className="text-[15px] text-white/85 whitespace-pre-wrap leading-relaxed">
            {message.content}
            {message.isStreaming && (
              <span className="inline-block w-0.5 h-4 bg-white/40 ml-0.5 animate-pulse" />
            )}
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Tool Cards
// ============================================================================

function ToolCard({ result, onTimerStart, onScannerOpen }: { 
  result: ToolDisplay; 
  onTimerStart?: (minutes: number) => void;
  onScannerOpen?: () => void;
}) {
  switch (result.type) {
    case 'log_confirmation':
      return <LogConfirmationCard content={result.content as LogContent} />;
    case 'progress_summary':
      return <ProgressSummaryCard content={result.content as ProgressContent} />;
    case 'workout':
      return <WorkoutCard workout={result.content as WorkoutData} />;
    case 'grocery_list':
      return <GroceryListCard groceryList={result.content as GroceryListData} />;
    case 'deep_link':
      return <DeepLinkCard content={result.content as { url: string; label: string }} />;
    case 'timer':
      return <TimerCard content={result.content as { minutes: number; label: string }} onStart={onTimerStart} />;
    case 'scanner':
      return <ScannerCard onOpen={onScannerOpen} />;
    default:
      return null;
  }
}

// --- Log Confirmation ---

interface LogContent {
  pillar: string;
  value: number;
  unit: string;
  label: string;
  newTotal: number;
  target: number;
  isMet: boolean;
}

function LogConfirmationCard({ content }: { content: LogContent }) {
  const color = PILLAR_COLORS[content.pillar] || '#22c55e';
  
  return (
    <div 
      className="flex items-center gap-3 px-4 py-3 rounded-2xl border"
      style={{ 
        backgroundColor: `${color}10`,
        borderColor: `${color}25`,
      }}
    >
      <div 
        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${color}25` }}
      >
        <Check className="w-4 h-4" style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-sm text-white/80">{content.label}</span>
        <div className="text-xs text-white/40 mt-0.5">
          {content.newTotal}/{content.target} {content.unit}
          {content.isMet && ' — target met!'}
        </div>
      </div>
    </div>
  );
}

// --- Progress Summary ---

interface ProgressContent {
  progress: { pillar: string; name: string; current: number; target: number; unit: string; met: boolean; remaining: number }[];
  coverage: number;
  daysLeft: number;
}

function ProgressSummaryCard({ content }: { content: ProgressContent }) {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <div className="rounded-2xl border border-white/8 overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-white/3 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-white/40" />
          <span className="text-sm text-white/70">
            {content.coverage}/5 pillars met — {content.daysLeft} days left
          </span>
        </div>
        {expanded ? (
          <ChevronDown className="w-4 h-4 text-white/30" />
        ) : (
          <ChevronRight className="w-4 h-4 text-white/30" />
        )}
      </button>
      
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 space-y-2">
              {content.progress.map(p => {
                const color = PILLAR_COLORS[p.pillar] || '#22c55e';
                const pct = Math.min((p.current / p.target) * 100, 100);
                return (
                  <div key={p.pillar} className="flex items-center gap-3">
                    <span className="text-xs text-white/50 w-20 truncate">{p.name}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${pct}%`, backgroundColor: color }}
                      />
                    </div>
                    <span className="text-xs text-white/40 w-16 text-right tabular-nums">
                      {p.current}/{p.target}
                    </span>
                    {p.met && <Check className="w-3 h-3 flex-shrink-0" style={{ color }} />}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Deep Link ---

function DeepLinkCard({ content }: { content: { url: string; label: string } }) {
  return (
    <a
      href={content.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-white/8 hover:bg-white/5 transition-colors"
      style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
    >
      <ExternalLink className="w-4 h-4 text-white/40 flex-shrink-0" />
      <span className="text-sm text-white/70">{content.label}</span>
    </a>
  );
}

// --- Timer ---

function TimerCard({ content, onStart }: { content: { minutes: number; label: string }; onStart?: (min: number) => void }) {
  return (
    <button
      onClick={() => onStart?.(content.minutes)}
      className="flex items-center gap-3 px-4 py-3 rounded-2xl border transition-colors hover:brightness-110 w-full text-left"
      style={{
        backgroundColor: `${PILLAR_COLORS.mindfulness}10`,
        borderColor: `${PILLAR_COLORS.mindfulness}25`,
      }}
    >
      <Timer className="w-4 h-4 flex-shrink-0" style={{ color: PILLAR_COLORS.mindfulness }} />
      <span className="text-sm text-white/70">{content.label}</span>
    </button>
  );
}

// --- Scanner ---

function ScannerCard({ onOpen }: { onOpen?: () => void }) {
  return (
    <button
      onClick={() => onOpen?.()}
      className="flex items-center gap-3 px-4 py-3 rounded-2xl border transition-colors hover:brightness-110 w-full text-left"
      style={{
        backgroundColor: `${PILLAR_COLORS.clean_eating}10`,
        borderColor: `${PILLAR_COLORS.clean_eating}25`,
      }}
    >
      <Camera className="w-4 h-4 flex-shrink-0" style={{ color: PILLAR_COLORS.clean_eating }} />
      <span className="text-sm text-white/70">Open meal scanner</span>
    </button>
  );
}

// --- Workout ---

export interface WorkoutExercise {
  name: string;
  sets: number;
  reps: string;
}

export interface WorkoutData {
  title: string;
  duration: string;
  exercises: WorkoutExercise[];
}

function WorkoutCard({ workout }: { workout: WorkoutData }) {
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [logged, setLogged] = useState(false);
  const [logging, setLogging] = useState(false);
  const color = PILLAR_COLORS.strength;
  const allDone = completed.size === workout.exercises.length;

  const handleLogSession = async () => {
    if (logging || logged) return;
    setLogging(true);
    try {
      const { getWeekStart } = await import('@/lib/v3/coreFive');
      const weekStart = getWeekStart(new Date());
      const res = await fetch('/api/v3/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pillar: 'strength',
          value: 1,
          details: { type: 'workout', notes: workout.title },
          weekStart,
        }),
      });
      if (res.ok) {
        setLogged(true);
        window.dispatchEvent(new CustomEvent('huuman:logCreated'));
      }
    } catch {
      // ignore
    } finally {
      setLogging(false);
    }
  };

  const toggleExercise = (index: number) => {
    setCompleted(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  return (
    <div 
      className="rounded-2xl border overflow-hidden"
      style={{ backgroundColor: `${color}06`, borderColor: `${color}18` }}
    >
      <div className="px-4 py-3 flex items-center justify-between border-b" style={{ borderColor: `${color}12` }}>
        <div className="flex items-center gap-2">
          <Dumbbell className="w-4 h-4" style={{ color }} />
          <span className="text-sm font-medium text-white/80">{workout.title}</span>
        </div>
        <span className="text-xs text-white/40">{workout.duration}</span>
      </div>

      <div className="divide-y" style={{ borderColor: `${color}08` }}>
        {workout.exercises.map((exercise, i) => (
          <button
            key={i}
            onClick={() => toggleExercise(i)}
            className="w-full px-4 py-2.5 flex items-center justify-between text-left hover:bg-white/3 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div 
                className="w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-colors"
                style={{
                  borderColor: completed.has(i) ? color : 'rgba(255,255,255,0.12)',
                  backgroundColor: completed.has(i) ? `${color}25` : 'transparent',
                }}
              >
                {completed.has(i) && <Check className="w-3 h-3" style={{ color }} />}
              </div>
              <span className={`text-sm ${completed.has(i) ? 'text-white/35 line-through' : 'text-white/75'} transition-colors`}>
                {exercise.name}
              </span>
            </div>
            <span className="text-xs text-white/30">{exercise.sets} x {exercise.reps}</span>
          </button>
        ))}
      </div>

      {allDone && (
        <div className="px-4 py-2.5 border-t flex items-center justify-between" style={{ borderColor: `${color}12` }}>
          <div className="flex items-center gap-2">
            <Check className="w-3.5 h-3.5" style={{ color }} />
            <span className="text-xs" style={{ color }}>
              {logged ? 'Session logged!' : 'Workout complete!'}
            </span>
          </div>
          {!logged && (
            <button
              onClick={handleLogSession}
              disabled={logging}
              className="px-3 py-1 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
              style={{ backgroundColor: `${color}18`, color }}
            >
              {logging ? '...' : 'Log session'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// --- Grocery List ---

export interface GroceryCategory {
  name: string;
  items: string[];
}

export interface GroceryListData {
  title: string;
  categories: GroceryCategory[];
}

function GroceryListCard({ groceryList }: { groceryList: GroceryListData }) {
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const color = PILLAR_COLORS.clean_eating;

  const toggleItem = (key: string) => {
    setChecked(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: `${color}06`, borderColor: `${color}18` }}>
      <div className="px-4 py-3 flex items-center gap-2 border-b" style={{ borderColor: `${color}12` }}>
        <ShoppingCart className="w-4 h-4" style={{ color }} />
        <span className="text-sm font-medium text-white/80">{groceryList.title}</span>
      </div>

      <div className="divide-y" style={{ borderColor: `${color}06` }}>
        {groceryList.categories.map((cat) => (
          <div key={cat.name} className="px-4 py-3">
            <h4 className="text-xs font-medium text-white/40 uppercase tracking-wider mb-2">{cat.name}</h4>
            <div className="space-y-1.5">
              {cat.items.map((item) => {
                const key = `${cat.name}-${item}`;
                const isDone = checked.has(key);
                return (
                  <button
                    key={key}
                    onClick={() => toggleItem(key)}
                    className="w-full flex items-center gap-2.5 text-left py-0.5 group"
                  >
                    <div
                      className="w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors"
                      style={{
                        borderColor: isDone ? color : 'rgba(255,255,255,0.12)',
                        backgroundColor: isDone ? `${color}25` : 'transparent',
                      }}
                    >
                      {isDone && <Check className="w-2.5 h-2.5" style={{ color }} />}
                    </div>
                    <span className={`text-sm ${isDone ? 'text-white/30 line-through' : 'text-white/65'} transition-colors`}>
                      {item}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
