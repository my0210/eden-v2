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
        <Drawer.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" />
        
        <Drawer.Content className="fixed inset-0 z-[101] flex flex-col bg-[#0a0a0a]">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
            <Drawer.Close asChild>
              <button
                className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-foreground/60 hover:bg-white/10 transition-colors"
                aria-label="Close chat"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </Drawer.Close>
            
            <Drawer.Title className="text-lg font-light text-foreground/60">
              eden
            </Drawer.Title>
            
            <div className="w-10" /> {/* Spacer */}
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto px-4 py-6">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-6">
                <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6">
                  <span className="text-2xl text-foreground/40">✦</span>
                </div>
                <h3 className="text-lg font-light text-foreground/60 mb-2">
                  Ask Eden anything
                </h3>
                <p className="text-sm text-foreground/30 max-w-xs">
                  Questions about your plan, adjustments, or health guidance
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map(message => (
                  <ChatMessage key={message.id} message={message} />
                ))}
                
                {isLoading && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs text-green-400">E</span>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-sm px-4 py-3">
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

          {/* Suggested Prompts */}
          {suggestedPrompts.length > 0 && !isLoading && (
            <SuggestedPrompts 
              prompts={suggestedPrompts} 
              onSelect={handlePromptClick} 
            />
          )}

          {/* Input Area */}
          <div className="px-4 py-4 border-t border-white/10 safe-area-bottom bg-[#0a0a0a]">
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask Eden..."
                  disabled={isLoading}
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
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
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
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 24 24" 
                  fill="currentColor" 
                  className="w-5 h-5"
                >
                  <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                </svg>
              </button>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

