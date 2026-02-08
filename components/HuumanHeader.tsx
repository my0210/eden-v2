"use client";

import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";
import { ArrowRight } from "lucide-react";

interface HuumanHeaderProps {
  message: string;
  showProtocolLink?: boolean;
}

export function HuumanHeader({ message, showProtocolLink = true }: HuumanHeaderProps) {
  // Split message into lines (context line + guidance line)
  const lines = message.split("\n").filter((line) => line.trim());
  const contextLine = lines[0] || "";
  const guidanceLine = lines[1] || "";

  return (
    <div className="px-6 space-y-4">
      {/* Dynamic Huuman Message */}
      <GlassCard variant="subtle" className="p-5 flex flex-col gap-2">
        {/* Context line - week info and theme */}
        <p className="text-base text-white/90 font-medium leading-snug">
          {contextLine}
        </p>
        
        {/* Guidance line - actionable/motivational */}
        {guidanceLine && (
          <p className="text-sm text-white/60 leading-relaxed">
            {guidanceLine}
          </p>
        )}
      </GlassCard>
      
      {/* Protocol Link */}
      {showProtocolLink && (
        <div className="flex justify-end">
          <Link 
            href="/protocol"
            className="group flex items-center gap-1.5 text-xs font-medium text-white/40 hover:text-white/80 transition-colors"
          >
            View protocol
            <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      )}
    </div>
  );
}
