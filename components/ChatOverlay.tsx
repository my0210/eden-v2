"use client";

import { useState, useRef, useEffect } from "react";
import { Drawer } from "vaul";
import { ChatMessage, Message } from "./ChatMessage";
import { SuggestedPrompts } from "./SuggestedPrompts";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, Sparkles } from "lucide-react";

interface ChatOverlayProps {
  trigger: React.ReactNode;
  customTrigger?: (open: () => void) => React.ReactNode;
}

export function ChatOverlay({ trigger, customTrigger }: ChatOverlayProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
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
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = inputRef.current;
    if (textarea) {
      textarea.style.height = "auto";
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

    window.addEventListener("huuman:askAboutItem", handleAskAboutItem as EventListener);
    return () => {
      window.removeEventListener("huuman:askAboutItem", handleAskAboutItem as EventListener);
    };
  }, []);

  const handleSend = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setSuggestedPrompts([]);

    try {
      const response = await fetch("/api/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const data = await response.json();

      const edenMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.message,
      };
      setMessages((prev) => [...prev, edenMessage]);

      if (data.suggestedPrompts) {
        setSuggestedPrompts(data.suggestedPrompts);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I had trouble responding. Please try again.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Drawer.Root
      open={isOpen}
      onOpenChange={setIsOpen}
      shouldScaleBackground={true}
      scaleBackgroundValues={[1, 0.95]}
    >
      <Drawer.Trigger asChild>
        {customTrigger ? customTrigger(() => setIsOpen(true)) : trigger}
      </Drawer.Trigger>

      <Drawer.Portal>
        <Drawer.Overlay 
          className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm" 
        />
        
        <Drawer.Content 
          className="fixed bottom-0 left-0 right-0 z-[101] flex flex-col outline-none h-[96vh] glass-panel rounded-t-[20px] border-t border-white/10"
        >
          {/* Drag Handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-12 h-1.5 rounded-full bg-white/20" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-center py-2 border-b border-white/5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-white/60" />
              <span className="text-sm font-medium text-white/80 tracking-wide">ORACLE</span>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-0 animate-fade-in">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                  <Sparkles className="w-8 h-8 text-white/40" />
                </div>
                <p className="text-white/40 text-sm max-w-[200px]">
                  Ask me anything about your health, protocol, or progress.
                </p>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <ChatMessage key={message.id} message={message} />
                ))}
                
                {isLoading && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div className="rounded-2xl px-4 py-3 bg-white/5 border border-white/5">
                      <div className="flex gap-1.5">
                        <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" />
                      </div>
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 safe-area-bottom bg-black/40 backdrop-blur-xl border-t border-white/10">
            {/* Suggested Prompts */}
            <AnimatePresence>
              {suggestedPrompts.length > 0 && !isLoading && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4 overflow-hidden"
                >
                  <SuggestedPrompts prompts={suggestedPrompts} onSelect={handleSend} />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative flex items-end gap-2">
              <div className="relative flex-1 bg-white/10 rounded-[24px] border border-white/10 focus-within:border-white/30 focus-within:bg-white/15 transition-all duration-300">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask anything..."
                  disabled={isLoading}
                  rows={1}
                  className="w-full px-5 py-4 pr-12 bg-transparent text-white placeholder:text-white/30 resize-none focus:outline-none max-h-[120px] min-h-[56px]"
                />
                
                <AnimatePresence>
                  {input.trim() && (
                    <motion.button
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      onClick={() => handleSend()}
                      disabled={isLoading}
                      className="absolute right-2 bottom-2 w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:bg-white/90 active:scale-95 transition-all"
                    >
                      <ArrowUp className="w-5 h-5" strokeWidth={2.5} />
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
