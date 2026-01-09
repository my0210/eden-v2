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
      <div 
        className="max-w-[95%] rounded-2xl px-4 py-4"
        style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
      >
        <p className="text-sm text-white/90 whitespace-pre-wrap leading-relaxed">
          {message.content}
        </p>
      </div>
    </div>
  );
}
