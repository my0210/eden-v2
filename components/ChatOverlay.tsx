'use client';

import { useState, useRef, useEffect } from 'react';
import { Drawer } from 'vaul';
import { ChatMessage, Message } from './ChatMessage';
import { SuggestedPrompts } from './SuggestedPrompts';

interface ChatOverlayProps {
  trigger: React.ReactNode;
}

export function ChatOverlay({ trigger }: ChatOverlayProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = inputRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [input]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const handleSend = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || isLoading) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setSuggestedPrompts([]);

    try {
      const response = await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();

      // Add Eden's response
      const edenMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
      };
      setMessages(prev => [...prev, edenMessage]);

      // Set suggested prompts if available
      if (data.suggestedPrompts) {
        setSuggestedPrompts(data.suggestedPrompts);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I had trouble responding. Please try again.',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handlePromptClick = (prompt: string) => {
    handleSend(prompt);
  };

  return (
    <Drawer.Root open={isOpen} onOpenChange={setIsOpen}>
      <Drawer.Trigger asChild>
        {trigger}
      </Drawer.Trigger>

      <Drawer.Portal>
        {/* Blurred backdrop - you can see through it */}
        <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-xl z-[100]" />
        
        <Drawer.Content className="fixed inset-0 z-[101] flex flex-col pointer-events-none">
          {/* Header - floating */}
          <div className="flex items-center justify-between px-4 py-4 pointer-events-auto">
            <Drawer.Close asChild>
              <button
                className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-foreground/70 hover:bg-black/60 transition-colors"
                aria-label="Close chat"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </Drawer.Close>
            
            <Drawer.Title className="sr-only">Chat with Eden</Drawer.Title>
            
            {/* History button placeholder */}
            <button
              className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-foreground/70 hover:bg-black/60 transition-colors"
              aria-label="Chat history"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
          </div>

          {/* Messages Area - scrollable, floating cards */}
          <div className="flex-1 overflow-y-auto px-4 py-4 pointer-events-auto">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-6">
                {/* Empty state - subtle */}
                <p className="text-foreground/30 text-sm">
                  Ask Eden anything about your plan
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map(message => (
                  <ChatMessage key={message.id} message={message} />
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-3">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Suggested Prompts - floating above input */}
          {suggestedPrompts.length > 0 && !isLoading && (
            <div className="px-4 pb-2 pointer-events-auto">
              <SuggestedPrompts 
                prompts={suggestedPrompts} 
                onSelect={handlePromptClick} 
              />
            </div>
          )}

          {/* Input Area - floating at bottom */}
          <div className="px-4 pt-2 pb-4 safe-area-bottom pointer-events-auto">
            <div className="flex items-end gap-3">
              {/* Plus button like Bevel */}
              <button
                className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-foreground/50 hover:bg-black/60 transition-colors flex-shrink-0"
                aria-label="Add attachment"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </button>
              
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask Eden..."
                  disabled={isLoading}
                  rows={1}
                  className="
                    w-full px-4 py-3 pr-12
                    bg-black/40 backdrop-blur-md border border-white/10 rounded-full
                    text-foreground placeholder:text-foreground/30
                    resize-none overflow-hidden
                    focus:outline-none focus:border-white/20
                    disabled:opacity-50
                    transition-colors
                  "
                  style={{ minHeight: '48px', maxHeight: '120px' }}
                />
                
                {/* Send button inside input */}
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isLoading}
                  className="
                    absolute right-2 top-1/2 -translate-y-1/2
                    w-8 h-8 rounded-full
                    bg-white/10
                    hover:bg-white/20
                    disabled:opacity-0
                    text-foreground/60
                    transition-all duration-200
                    flex items-center justify-center
                  "
                  aria-label="Send message"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

