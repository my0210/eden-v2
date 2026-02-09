'use client';

interface SuggestedPromptsProps {
  prompts: string[];
  onSelect: (prompt: string) => void;
}

export function SuggestedPrompts({ prompts, onSelect }: SuggestedPromptsProps) {
  if (prompts.length === 0) return null;

  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5 -mx-1 px-1">
      {prompts.map((prompt, index) => (
        <button
          key={index}
          onClick={() => onSelect(prompt)}
          className="flex-shrink-0 px-3.5 py-2 rounded-full text-xs text-white/60 hover:text-white/90 border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all duration-200 active:scale-[0.97] whitespace-nowrap"
        >
          {prompt}
        </button>
      ))}
    </div>
  );
}
