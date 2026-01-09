'use client';

interface SuggestedPromptsProps {
  prompts: string[];
  onSelect: (prompt: string) => void;
}

export function SuggestedPrompts({ prompts, onSelect }: SuggestedPromptsProps) {
  if (prompts.length === 0) return null;

  return (
    <div className="px-4 py-3 border-t border-white/5">
      <div className="flex flex-col gap-2">
        {prompts.map((prompt, index) => (
          <button
            key={index}
            onClick={() => onSelect(prompt)}
            className="
              w-full px-4 py-3 
              bg-white/5 border border-white/10 rounded-xl
              text-left text-sm text-foreground/60
              hover:bg-white/10 hover:border-white/15 hover:text-foreground/80
              transition-all duration-200
              flex items-center justify-between gap-3
            "
          >
            <span className="line-clamp-2">{prompt}</span>
            <svg 
              className="w-4 h-4 flex-shrink-0 text-foreground/30" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75" />
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
}

