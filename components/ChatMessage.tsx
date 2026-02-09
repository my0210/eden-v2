'use client';

import { useState, useEffect, useRef } from 'react';
import { Check, ExternalLink, Timer, Dumbbell, ShoppingCart } from 'lucide-react';

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

export interface GroceryCategory {
  name: string;
  items: string[];
}

export interface GroceryListData {
  title: string;
  categories: GroceryCategory[];
}

export interface ChatAction {
  type: 'log' | 'deep_link' | 'timer' | 'generate_workout' | 'generate_grocery_list';
  pillar?: string;
  value?: number;
  details?: Record<string, unknown>;
  url?: string;
  label?: string;
  workout?: WorkoutData;
  groceryList?: GroceryListData;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  action?: ChatAction | null;
}

interface ChatMessageProps {
  message: Message;
  onTimerStart?: (minutes: number) => void;
}

const PILLAR_COLORS: Record<string, string> = {
  cardio: '#ef4444',
  strength: '#f97316',
  sleep: '#8b5cf6',
  clean_eating: '#22c55e',
  mindfulness: '#06b6d4',
};

/**
 * Typewriter effect: reveals text in chunks for assistant messages.
 * Fast and smooth -- reveals 2-3 words per tick at 20ms intervals.
 */
function useTypewriter(text: string): { displayText: string; done: boolean } {
  const [displayText, setDisplayText] = useState('');
  const [done, setDone] = useState(false);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (hasAnimated.current || !text) {
      setDisplayText(text);
      setDone(true);
      return;
    }

    hasAnimated.current = true;
    const words = text.split(' ');
    let shown = 0;
    setDisplayText('');
    setDone(false);

    // Reveal 2-3 words per tick for a fast but visible effect
    const wordsPerTick = words.length > 20 ? 3 : 2;

    const interval = setInterval(() => {
      shown = Math.min(shown + wordsPerTick, words.length);
      setDisplayText(words.slice(0, shown).join(' '));
      if (shown >= words.length) {
        clearInterval(interval);
        setDone(true);
      }
    }, 20);

    return () => clearInterval(interval);
  }, [text]);

  return { displayText, done };
}

export function ChatMessage({ message, onTimerStart }: ChatMessageProps) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div 
          className="max-w-[85%] px-4 py-3 rounded-2xl"
          style={{ backgroundColor: 'rgba(52, 199, 89, 0.25)' }}
        >
          <p className="text-sm text-white/90 whitespace-pre-wrap leading-relaxed">
            {message.content}
          </p>
        </div>
      </div>
    );
  }

  return <AssistantMessage message={message} onTimerStart={onTimerStart} />;
}

function AssistantMessage({ message, onTimerStart }: ChatMessageProps) {
  const { displayText, done } = useTypewriter(message.content);

  return (
    <div className="flex justify-start">
      <div className="max-w-[95%] space-y-2">
        {message.content && (
          <div 
            className="rounded-2xl px-4 py-4"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
          >
            <p className="text-sm text-white/90 whitespace-pre-wrap leading-relaxed">
              {displayText}
            </p>
          </div>
        )}

        {/* Action rendering - show after typewriter finishes */}
        {done && message.action && (
          <ActionCard action={message.action} onTimerStart={onTimerStart} />
        )}
      </div>
    </div>
  );
}

function ActionCard({ action, onTimerStart }: { action: ChatAction; onTimerStart?: (minutes: number) => void }) {
  const color = action.pillar ? PILLAR_COLORS[action.pillar] || '#22c55e' : '#22c55e';

  if (action.type === 'log') {
    return (
      <div 
        className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border"
        style={{ 
          backgroundColor: `${color}15`,
          borderColor: `${color}30`,
        }}
      >
        <div 
          className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${color}30` }}
        >
          <Check className="w-3.5 h-3.5" style={{ color }} />
        </div>
        <span className="text-xs text-white/70">
          {action.label || 'Logged'}
        </span>
      </div>
    );
  }

  if (action.type === 'deep_link' && action.url) {
    return (
      <a
        href={action.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
      >
        <ExternalLink className="w-4 h-4 text-white/50 flex-shrink-0" />
        <span className="text-xs text-white/70">
          {action.label || 'Open link'}
        </span>
      </a>
    );
  }

  if (action.type === 'timer' && action.value) {
    return (
      <button
        onClick={() => onTimerStart?.(action.value!)}
        className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border transition-colors"
        style={{ 
          backgroundColor: `${PILLAR_COLORS.mindfulness}15`,
          borderColor: `${PILLAR_COLORS.mindfulness}30`,
        }}
      >
        <Timer className="w-4 h-4 flex-shrink-0" style={{ color: PILLAR_COLORS.mindfulness }} />
        <span className="text-xs text-white/70">
          {action.label || `Start ${action.value} min timer`}
        </span>
      </button>
    );
  }

  if (action.type === 'generate_workout' && action.workout) {
    return <WorkoutCard workout={action.workout} />;
  }

  if (action.type === 'generate_grocery_list' && action.groceryList) {
    return <GroceryListCard groceryList={action.groceryList} />;
  }

  return null;
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
      if (res.ok) setLogged(true);
    } catch {
      // ignore
    } finally {
      setLogging(false);
    }
  };

  const toggleExercise = (index: number) => {
    setCompleted(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  return (
    <div 
      className="rounded-xl border overflow-hidden"
      style={{ 
        backgroundColor: `${color}08`,
        borderColor: `${color}20`,
      }}
    >
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b" style={{ borderColor: `${color}15` }}>
        <div className="flex items-center gap-2">
          <Dumbbell className="w-4 h-4" style={{ color }} />
          <span className="text-sm font-medium text-white/80">{workout.title}</span>
        </div>
        <span className="text-xs text-white/40">{workout.duration}</span>
      </div>

      {/* Exercises */}
      <div className="divide-y" style={{ borderColor: `${color}10` }}>
        {workout.exercises.map((exercise, i) => (
          <button
            key={i}
            onClick={() => toggleExercise(i)}
            className="w-full px-4 py-2.5 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div 
                className="w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-colors"
                style={{
                  borderColor: completed.has(i) ? color : 'rgba(255,255,255,0.15)',
                  backgroundColor: completed.has(i) ? `${color}30` : 'transparent',
                }}
              >
                {completed.has(i) && <Check className="w-3 h-3" style={{ color }} />}
              </div>
              <span className={`text-sm ${completed.has(i) ? 'text-white/40 line-through' : 'text-white/80'} transition-colors`}>
                {exercise.name}
              </span>
            </div>
            <span className="text-xs text-white/30">
              {exercise.sets} x {exercise.reps}
            </span>
          </button>
        ))}
      </div>

      {/* Footer */}
      {allDone && (
        <div className="px-4 py-2.5 border-t flex items-center justify-between" style={{ borderColor: `${color}15` }}>
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
              style={{ backgroundColor: `${color}20`, color }}
            >
              {logging ? '...' : 'Log session'}
            </button>
          )}
        </div>
      )}
    </div>
  );
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
    <div
      className="rounded-xl border overflow-hidden"
      style={{
        backgroundColor: `${color}08`,
        borderColor: `${color}20`,
      }}
    >
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-2 border-b" style={{ borderColor: `${color}15` }}>
        <ShoppingCart className="w-4 h-4" style={{ color }} />
        <span className="text-sm font-medium text-white/80">{groceryList.title}</span>
      </div>

      {/* Categories */}
      <div className="divide-y" style={{ borderColor: `${color}08` }}>
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
                        borderColor: isDone ? color : 'rgba(255,255,255,0.15)',
                        backgroundColor: isDone ? `${color}30` : 'transparent',
                      }}
                    >
                      {isDone && <Check className="w-2.5 h-2.5" style={{ color }} />}
                    </div>
                    <span className={`text-sm ${isDone ? 'text-white/30 line-through' : 'text-white/70'} transition-colors`}>
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
