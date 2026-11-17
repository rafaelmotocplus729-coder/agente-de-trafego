import { useMemo } from 'react';
import { Layers, ShieldCheck, Users } from 'lucide-react';
import {
  AudienceInputNode,
  buildAudienceLadder,
} from '../lib/audienceEngine';
import { formatBRL } from '../lib/trafficEngine';

interface AudienceLadderTabProps {
  nodes: AudienceInputNode[];
  onChangeNodes: (next: AudienceInputNode[]) => void;
}

export function AudienceLadderTab({
  nodes,
  onChangeNodes,
}: AudienceLadderTabProps) {
  const ladder = useMemo(() => buildAudienceLadder(nodes), [nodes]);

  function updateNode<K extends keyof AudienceInputNode>(
    level: AudienceInputNode['level'],
    key: K,
    value: AudienceInputNode[K]
  ) {
    onChangeNodes(
      nodes.map((n) => (n.level === level ? { ...n, [key]: value } : n))
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white">
          Matriz de Audiências &amp; Escada de Exclusão (Níveis 00 a 05)
        </h2>
        <p className="text-xs text-zinc-400">
          Pedido 22 · Regra de ouro: nenhuma pessoa é impactada por duas temperaturas ao mesmo
          tempo. Públicos quentes &lt; 10.000 ou &lt; R$ 10/dia são condensados automaticamente;
          frios &gt; 500.000 são estritamente isolados.
        </p>
      </div>

      {/* Editor dos Níveis 00 a 05 */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {nodes.map((node) => (
          <div
            key={node.level}
            className={`rounded-xl border p-4 transition ${
              node.enabled
                ? 'border-zinc-800 bg-zinc-900/50'
                : 'border-zinc-800/50 bg-zinc-950/50 opacity-60'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="rounded bg-emerald-500/15 px-2 py-0.5 font-mono text-[11px] font-semibold text-emerald-400">
                NÍVEL {node.level} · {node.temperature}
              </span>
              <input
                type="checkbox"
                checked={node.enabled}
                onChange={(e) => updateNode(node.level, 'enabled', e.target.checked)}
                className="h-4 w-4 accent-emerald-500"
              />
            </div>

            <div className="mt-2 text-sm font-semibold text-white">{node.label}</div>
            <div className="text-[11px] text-zinc-400">{node.sourceDescription}</div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-[10px] text-zinc-500">
                  Tamanho Estimado
                </label>
                <input
                  type="number"
                  min={100}
                  step={500}
                  value={node.estimatedSize}
                  onChange={(e) =>
                    updateNode(node.level, 'estimatedSize', Number(e.target.value) || 0)
                  }
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 font-mono text-xs text-white outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] text-zinc-500">
                  Verba/Dia (R$)
                </label>
                <input
                  type="number"
                  min={1}
                  value={node.allocatedBudget}
                  onChange={(e) =>
                    updateNode(node.level, 'allocatedBudget', Number(e.target.value) || 0)
                  }
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 font-mono text-xs text-white outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Resultado Automatizado da Escada */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-white">
              Conjuntos Provisionados sem Sobreposição ({ladder.length} conjuntos)
            </h3>
          </div>
          <span className="flex items-center gap-1.5 text-xs text-emerald-400">
            <ShieldCheck className="h-4 w-4" />
            Exclusões 00–05 aplicadas automaticamente
          </span>
        </div>

        <div className="mt-4 space-y-3">
          {ladder.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-mono text-xs font-semibold text-white">
                  {item.adSetName}
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-0.5 font-mono text-[10px] font-semibold ${
                      item.ruleApplied.startsWith('CONDENSADO')
                        ? 'bg-amber-500/15 text-amber-300'
                        : item.ruleApplied.startsWith('ISOLADO')
                          ? 'bg-sky-500/15 text-sky-300'
                          : 'bg-emerald-500/15 text-emerald-300'
                    }`}
                  >
                    {item.ruleApplied}
                  </span>
                  <span className="font-mono text-xs font-semibold text-emerald-400">
                    {formatBRL(item.dailyBudget)}/dia
                  </span>
                </div>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-4 text-[11px] text-zinc-400">
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5 text-zinc-500" />
                  Alcance: {item.estimatedSize.toLocaleString('pt-BR')}
                </span>
                <span>
                  <strong className="text-rose-300">Exclusões:</strong>{' '}
                  {item.exclusions.join(' · ')}
                </span>
              </div>

              <p className="mt-1.5 text-xs text-zinc-300">{item.rationale}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
