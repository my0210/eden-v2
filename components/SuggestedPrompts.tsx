'use client';

interface SuggestedPromptsProps {
  prompts: string[];
  onSelect: (prompt: string) => void;
}

export function SuggestedPrompts({ prompts, onSelect }: SuggestedPromptsProps) {
  if (prompts.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {prompts.map((prompt, index) => (
        <button
          key={index}
          onClick={() => onSelect(prompt)}
          className="w-full px-4 py-3 rounded-xl text-left text-sm text-white/80 hover:text-white transition-all duration-200 flex items-center justify-between gap-3 active:scale-[0.98]"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
        >
          <span className="line-clamp-2">{prompt}</span>
          <svg 
            className="w-4 h-4 flex-shrink-0 text-white/40" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75" />
          </svg>
        </button>
      ))}
    </div>
  );
}
