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

  // Auto-resize textarea
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
        // Default behavior: send to API
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

        // Handle response - could open a chat modal or show inline
        const data = await response.json();
        console.log('Chat response:', data);
        
        // For now, just alert the response
        // TODO: Implement proper chat UI
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
    <div className="flex items-end gap-2">
      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask Eden anything..."
          disabled={isSending}
          rows={1}
          className="
            w-full px-4 py-3 
            bg-background-secondary border border-default rounded-xl
            text-foreground placeholder:text-foreground-subtle
            resize-none overflow-hidden
            focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/20
            disabled:opacity-50
          "
          style={{ minHeight: '48px', maxHeight: '120px' }}
        />
      </div>
      
      <button
        onClick={handleSend}
        disabled={!message.trim() || isSending}
        className="
          w-12 h-12 rounded-xl
          bg-green-500 hover:bg-green-600
          disabled:bg-background-tertiary disabled:text-foreground-subtle
          text-background font-medium
          transition-colors duration-200
          flex items-center justify-center
          flex-shrink-0
        "
        aria-label="Send message"
      >
        {isSending ? (
          <span className="animate-pulse-soft">•</span>
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

