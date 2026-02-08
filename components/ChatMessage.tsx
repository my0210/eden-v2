'use client';

import { Check, ExternalLink, Timer } from 'lucide-react';

export interface ChatAction {
  type: 'log' | 'deep_link' | 'timer';
  pillar?: string;
  value?: number;
  details?: Record<string, unknown>;
  url?: string;
  label?: string;
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

  return (
    <div className="flex justify-start">
      <div className="max-w-[95%] space-y-2">
        <div 
          className="rounded-2xl px-4 py-4"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
        >
          <p className="text-sm text-white/90 whitespace-pre-wrap leading-relaxed">
            {message.content}
          </p>
        </div>

        {/* Action rendering */}
        {message.action && (
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

  return null;
}
