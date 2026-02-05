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
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([
    "What's my plan for today?",
    "Help me adjust my protocol",
    "Why this routine for me?",
  ]);
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

  // Listen for "Ask Eden about item" events
  useEffect(() => {
    const handleAskAboutItem = (e: CustomEvent<{ question: string }>) => {
      setIsOpen(true);
      // Send the question after a short delay for the drawer to open
      setTimeout(() => {
        handleSend(e.detail.question);
      }, 400);
    };

    window.addEventListener('huuman:askAboutItem', handleAskAboutItem as EventListener);
    return () => {
      window.removeEventListener('huuman:askAboutItem', handleAskAboutItem as EventListener);
    };
  }, []);

  const handleSend = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || isLoading) return;

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

      const edenMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
      };
      setMessages(prev => [...prev, edenMessage]);

      if (data.suggestedPrompts) {
        setSuggestedPrompts(data.suggestedPrompts);
      }
    } catch (error) {
      console.error('Error sending message:', error);
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

  const snapPoints = [0.5, 1];
  const [snap, setSnap] = useState<number | string | null>(1);

  return (
    <Drawer.Root 
      open={isOpen} 
      onOpenChange={setIsOpen}
      shouldScaleBackground={false}
      snapPoints={snapPoints}
      activeSnapPoint={snap}
      setActiveSnapPoint={setSnap}
      fadeFromIndex={0}
    >
      <Drawer.Trigger asChild>
        {trigger}
      </Drawer.Trigger>

      <Drawer.Portal>
        {/* Backdrop with blur */}
        <Drawer.Overlay 
          className="fixed inset-0 z-[100]"
          style={{ 
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}
        />
        
        {/* Sheet content */}
        <Drawer.Content 
          className="fixed bottom-0 left-0 right-0 z-[101] flex flex-col outline-none max-h-[97vh]"
          style={{ 
            backgroundColor: 'rgba(28, 28, 30, 0.92)',
            backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)',
            borderTopLeftRadius: '12px',
            borderTopRightRadius: '12px',
          }}
        >
          {/* Drag handle - Apple style */}
          <div className="flex justify-center pt-3 pb-2">
            <div 
              className="w-9 h-1 rounded-full"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.3)' }}
            />
          </div>

          {/* Header with close button */}
          <div className="flex items-center justify-between px-4 pb-2">
            <Drawer.Title className="text-white/90 text-lg font-medium">
              Huuman
            </Drawer.Title>
            <Drawer.Close asChild>
              <button
                className="w-8 h-8 rounded-full flex items-center justify-center text-white/60 hover:text-white transition-colors"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                aria-label="Close"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </Drawer.Close>
          </div>

          {/* Divider */}
          <div className="h-px mx-4" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <p className="text-white/30 text-sm">Ask Huuman anything</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map(message => (
                  <ChatMessage key={message.id} message={message} />
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div 
                      className="rounded-2xl px-4 py-3"
                      style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
                    >
                      <div className="flex gap-1.5">
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

          {/* Suggested Prompts */}
          {suggestedPrompts.length > 0 && !isLoading && (
            <div className="px-4 pb-3">
              <SuggestedPrompts prompts={suggestedPrompts} onSelect={(p) => handleSend(p)} />
            </div>
          )}

          {/* Input area */}
          <div 
            className="px-4 pt-3 pb-4 safe-area-bottom"
            style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}
          >
            <div className="relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Huuman..."
                disabled={isLoading}
                rows={1}
                className="w-full px-4 py-3 pr-12 rounded-2xl text-white placeholder:text-white/30 resize-none overflow-hidden focus:outline-none focus:ring-2 focus:ring-white/20 disabled:opacity-50"
                style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  minHeight: '48px', 
                  maxHeight: '120px' 
                }}
              />
              
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center text-white disabled:opacity-30 transition-all"
                style={{ backgroundColor: input.trim() ? 'rgba(52, 199, 89, 0.9)' : 'transparent' }}
                aria-label="Send"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75" />
                </svg>
              </button>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
