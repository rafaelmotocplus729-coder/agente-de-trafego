import { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { GLOSSARY_TERMS } from '../lib/knowledgeBase';

interface MetricTooltipProps {
  termId: string;
  label?: string;
}

export function MetricTooltip({ termId, label }: MetricTooltipProps) {
  const [open, setOpen] = useState(false);
  const entry = GLOSSARY_TERMS.find((t) => t.id === termId);

  if (!entry) return label ? <span>{label}</span> : null;

  return (
    <span className="relative inline-flex items-center gap-1">
      {label && <span>{label}</span>}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="text-zinc-500 transition hover:text-emerald-400 focus:outline-none"
        aria-label={`Explicação sobre ${entry.term}`}
      >
        <HelpCircle className="h-3.5 w-3.5" />
      </button>

      {open && (
        <div className="absolute bottom-full left-0 z-50 mb-2 w-72 rounded-xl border border-zinc-700 bg-zinc-900 p-3 text-left shadow-2xl">
          <div className="text-xs font-semibold text-white">{entry.term}</div>
          <p className="mt-1 text-[11px] leading-relaxed text-zinc-300">{entry.summary}</p>
          <div className="mt-2 rounded bg-zinc-950 px-2 py-1 text-[10px] font-mono text-emerald-400">
            {entry.benchmark}
          </div>
          <div className="mt-1.5 text-[10px] text-amber-300/90">{entry.alertRule}</div>
        </div>
      )}
    </span>
  );
}
