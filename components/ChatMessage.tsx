'use client';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div 
        className={`
          w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
          ${isUser 
            ? 'bg-white/10 border border-white/20' 
            : 'bg-green-500/20 border border-green-500/30'
          }
        `}
      >
        <span className={`text-xs ${isUser ? 'text-foreground/60' : 'text-green-400'}`}>
          {isUser ? 'Y' : 'E'}
        </span>
      </div>

      {/* Message Bubble */}
      <div 
        className={`
          max-w-[80%] px-4 py-3 rounded-2xl
          ${isUser 
            ? 'bg-white/10 border border-white/10 rounded-tr-sm' 
            : 'bg-white/5 border border-white/10 rounded-tl-sm'
          }
        `}
      >
        <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">
          {message.content}
        </p>
      </div>
    </div>
  );
}

