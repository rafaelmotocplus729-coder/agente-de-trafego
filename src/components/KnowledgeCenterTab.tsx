import { useMemo, useState } from 'react';
import { BookOpen, CheckSquare, Search, Sparkles } from 'lucide-react';
import { searchDocs } from '../lib/knowledgeBase';

export function KnowledgeCenterTab() {
  const [query, setQuery] = useState('');
  const [checkedSteps, setCheckedSteps] = useState<Record<string, boolean>>({});

  const { glossary, guides } = useMemo(() => searchDocs(query), [query]);

  function toggleStep(key: string) {
    setCheckedSteps((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">
            Central de Conhecimento &amp; Documentação Técnica Integrada
          </h2>
          <p className="text-xs text-zinc-400">
            Pedido 24 · Glossário dinâmico de métricas, Guia de Pixel/CAPI, Sistema de Cores e
            Centavos e Checklist Pré-Publicação (100% offline no navegador).
          </p>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar métrica, EMQ, centavos, CAPI..."
            className="w-full rounded-lg border border-zinc-800 bg-zinc-950 py-2 pl-9 pr-3 text-xs text-white outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Glossário Dinâmico */}
      <div>
        <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
          <Sparkles className="h-4 w-4" />
          Glossário Dinâmico de Métricas ({glossary.length})
        </h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {glossary.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 text-xs"
            >
              <div className="font-semibold text-white">{item.term}</div>
              <div className="mt-0.5 text-[11px] text-emerald-400">{item.shortLabel}</div>
              <p className="mt-2 leading-relaxed text-zinc-300">{item.summary}</p>
              <div className="mt-2.5 rounded bg-zinc-950 px-2.5 py-1.5 font-mono text-[10px] text-zinc-200">
                {item.benchmark}
              </div>
              <div className="mt-2 text-[11px] text-amber-300/90">{item.alertRule}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Guias Metodológicos Embutidos */}
      <div className="space-y-4">
        <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
          <BookOpen className="h-4 w-4" />
          Guias Metodológicos Embutidos ({guides.length})
        </h3>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {guides.map((guide) => (
            <div
              key={guide.id}
              className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5"
            >
              <h4 className="text-sm font-semibold text-white">{guide.title}</h4>
              <p className="mt-1 text-[11px] text-zinc-400">{guide.subtitle}</p>

              <div className="mt-4 space-y-3">
                {guide.steps.map((step, idx) => {
                  const key = `${guide.id}_${idx}`;
                  const isChecklist = guide.id === 'checklist-5-etapas';
                  const checked = Boolean(checkedSteps[key]);

                  return (
                    <div
                      key={key}
                      className={`rounded-lg border p-3 text-xs ${
                        checked
                          ? 'border-emerald-500/40 bg-emerald-500/10'
                          : 'border-zinc-800 bg-zinc-950/70'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {isChecklist && (
                          <button
                            type="button"
                            onClick={() => toggleStep(key)}
                            className={`mt-0.5 shrink-0 ${
                              checked ? 'text-emerald-400' : 'text-zinc-500 hover:text-white'
                            }`}
                          >
                            <CheckSquare className="h-4 w-4" />
                          </button>
                        )}
                        <div>
                          <div className="font-semibold text-zinc-100">{step.stepTitle}</div>
                          <p className="mt-1 text-[11px] leading-relaxed text-zinc-400">
                            {step.detail}
                          </p>
                          {step.tip && (
                            <div className="mt-1.5 text-[10px] text-emerald-300/90">
                              Dica: {step.tip}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
