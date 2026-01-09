'use client';

import { useState, useRef, useEffect } from 'react';

interface ChatInputProps {
  userId: string;
  onSend?: (message: string) => void;
}

export function ChatInput({ userId, onSend }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [message]);

  const handleSend = async () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || isSending) return;

    setIsSending(true);
    
    try {
      if (onSend) {
        onSend(trimmedMessage);
      } else {
        const response = await fetch('/api/chat/message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            message: trimmedMessage,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to send message');
        }

        const data = await response.json();
        console.log('Chat response:', data);
        alert(data.message || 'Message sent!');
      }

      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex items-end gap-3">
      <div className="flex-1">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask Eden..."
          disabled={isSending}
          rows={1}
          className="
            w-full px-4 py-3 
            bg-white/5 border border-white/10 rounded-xl
            text-foreground placeholder:text-foreground/30
            resize-none overflow-hidden
            focus:outline-none focus:border-white/20
            disabled:opacity-50
            transition-colors
          "
          style={{ minHeight: '48px', maxHeight: '120px' }}
        />
      </div>
      
      <button
        onClick={handleSend}
        disabled={!message.trim() || isSending}
        className="
          w-12 h-12 rounded-xl
          bg-white/10 border border-white/10
          hover:bg-white/15 hover:border-white/20
          disabled:opacity-30
          text-foreground/60
          transition-all duration-300
          flex items-center justify-center
          flex-shrink-0
        "
        aria-label="Send message"
      >
        {isSending ? (
          <span className="animate-pulse">•</span>
        ) : (
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="currentColor" 
            className="w-5 h-5"
          >
            <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
          </svg>
        )}
      </button>
    </div>
  );
}
