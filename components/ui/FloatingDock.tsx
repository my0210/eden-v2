"use client";

import { motion } from "framer-motion";
import { Home, MessageCircle, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

interface FloatingDockProps {
  onChatClick: () => void;
  onHomeClick?: () => void;
  onSettingsClick?: () => void;
}

export function FloatingDock({ onChatClick, onHomeClick, onSettingsClick }: FloatingDockProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Hide on scroll down, show on scroll up
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  return (
    <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center pointer-events-none">
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ 
          y: isVisible ? 0 : 100, 
          opacity: isVisible ? 1 : 0 
        }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="pointer-events-auto flex items-center gap-1 p-1.5 rounded-full glass-panel backdrop-blur-2xl bg-black/40 border-white/10 shadow-2xl"
      >
        <DockItem 
          icon={Home} 
          label="Home" 
          onClick={onHomeClick} 
          isActive={true} 
        />
        
        <div className="w-px h-8 bg-white/10 mx-1" />
        
        <DockItem 
          icon={MessageCircle} 
          label="Chat" 
          onClick={onChatClick} 
          isActive={false}
        />
        
        <div className="w-px h-8 bg-white/10 mx-1" />
        
        <DockItem 
          icon={Settings} 
          label="Settings" 
          onClick={onSettingsClick} 
        />
      </motion.div>
    </div>
  );
}

function DockItem({ 
  icon: Icon, 
  label, 
  onClick, 
  isActive 
}: { 
  icon: React.ElementType; 
  label: string; 
  onClick?: () => void;
  isActive?: boolean;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.1, backgroundColor: "rgba(255,255,255,0.1)" }}
      onClick={onClick}
      className={cn(
        "relative w-12 h-12 rounded-full flex items-center justify-center transition-colors",
        isActive ? "text-white" : "text-white/60 hover:text-white"
      )}
    >
      <Icon className="w-6 h-6" strokeWidth={1.5} />
      <span className="sr-only">{label}</span>
      
      {isActive && (
        <motion.div 
          layoutId="dock-active"
          className="absolute -bottom-1 w-1 h-1 bg-white rounded-full"
        />
      )}
    </motion.button>
  );
}
