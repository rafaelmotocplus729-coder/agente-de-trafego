import { useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  BookOpen,
  Check,
  CheckCircle2,
  Copy,
  Download,
  Layers,
  MapPin,
  Plus,
  Rocket,
  ShoppingBag,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import {
  AdMetricInput,
  BusinessPath,
  PATH_META,
  PlannerInput,
  analyzeAdMetrics,
  formatBRL,
  generatePlan,
} from './lib/trafficEngine';

type Tab = 'planner' | 'analyzer' | 'playbooks';

const PATH_ICONS: Record<BusinessPath, typeof MapPin> = {
  local: MapPin,
  infoproduto: Sparkles,
  ecommerce: ShoppingBag,
  lancamento: Rocket,
};

const INITIAL_ADS: AdMetricInput[] = [
  {
    id: 'ad-1',
    name: 'Conceito 1 · Dor Direta · v1',
    spend: 120,
    impressions: 6200,
    views3s: 1980,
    thruPlays: 560,
    linkClicks: 92,
    results: 8,
    targetCostPerResult: 18,
  },
  {
    id: 'ad-2',
    name: 'Conceito 2 · Institucional · v1',
    spend: 42,
    impressions: 2100,
    views3s: 310,
    thruPlays: 60,
    linkClicks: 14,
    results: 0,
    targetCostPerResult: 18,
  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('planner');
  const [copiedType, setCopiedType] = useState<'plan' | 'json' | null>(null);

  const [input, setInput] = useState<PlannerInput>({
    path: 'local',
    businessName: 'Clínica Exemplo',
    productName: 'Avaliação + Procedimento',
    ticket: PATH_META.local.defaultTicket,
    marginPct: PATH_META.local.defaultMargin,
    dailyBudget: PATH_META.local.defaultBudget,
    creativesCount: 4,
    alreadyRunsAds: false,
    bumpRatePct: 15,
    bumpTicket: 47,
    convRatePct: PATH_META.local.defaultConvRate,
    city: 'Campinas',
    radiusKm: 6,
    launchGoalSales: 30,
    hasCatalog: true,
    isBlackFriday: false,
  });

  const [ads, setAds] = useState<AdMetricInput[]>(INITIAL_ADS);

  const plan = useMemo(() => generatePlan(input), [input]);

  function handleSelectPath(path: BusinessPath) {
    const meta = PATH_META[path];
    setInput((prev) => ({
      ...prev,
      path,
      ticket: meta.defaultTicket,
      marginPct: meta.defaultMargin,
      dailyBudget: meta.defaultBudget,
      convRatePct: meta.defaultConvRate,
    }));
  }

  function copyPlanText() {
    const lines = [
      plan.header,
      `Objetivo e evento: ${plan.objectiveLine}`,
      `Conta da verba: ${plan.budgetMathLine}`,
      `Teto por ${plan.unidadeLabel}: ${formatBRL(plan.tetoUnidade)} (corte em 2x = ${formatBRL(plan.tetoUnidade * 2)} sem resultado)`,
      '',
      ...plan.structure.flatMap((block) => [
        block.title,
        `  Público: ${block.audience} · Exclusões: ${block.exclusions}`,
        ...block.sets.map((s) => `  - ${s.name} (${formatBRL(s.budgetPerDay)}/dia): ${s.note}`),
      ]),
      '',
      `Metas de referência (11/2026): CPM ${plan.benchmarks.cpm} · CTR ${plan.benchmarks.ctr} · Resultado: ${plan.benchmarks.resultCost}`,
      'Regras de corte e escala:',
      ...plan.cutAndScaleRules.map((r) => `  - ${r}`),
      '',
      'Cronograma:',
      ...plan.weeks.map((w) => `  - ${w.week}: ${w.focus}`),
      '',
      'Checklist antes de ligar:',
      ...plan.checklist.map((c) => `  [ ] ${c}`),
    ].join('\n');

    navigator.clipboard.writeText(lines);
    setCopiedType('plan');
    setTimeout(() => setCopiedType(null), 2000);
  }

  function downloadZernioJson() {
    const blob = new Blob([JSON.stringify(plan.zernioPlanJson, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `plano-${input.path}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setCopiedType('json');
    setTimeout(() => setCopiedType(null), 2000);
  }

  function addAdRow() {
    setAds((prev) => [
      ...prev,
      {
        id: `ad-${Date.now()}`,
        name: `Conceito ${prev.length + 1} · Novo · v1`,
        spend: 50,
        impressions: 2500,
        views3s: 700,
        thruPlays: 180,
        linkClicks: 30,
        results: 2,
        targetCostPerResult: Math.round(plan.tetoUnidade),
      },
    ]);
  }

  function updateAd(id: string, field: keyof AdMetricInput, value: string | number) {
    setAds((prev) =>
      prev.map((ad) => (ad.id === id ? { ...ad, [field]: value } : ad)),
    );
  }

  function removeAd(id: string) {
    setAds((prev) => prev.filter((ad) => ad.id !== id));
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 border-b border-zinc-800/80 bg-zinc-950/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-semibold tracking-tight text-white">
                  Agente de Tráfego
                </h1>
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 font-mono text-[11px] font-medium text-emerald-400 ring-1 ring-emerald-500/25">
                  Meta Ads 11/2026 · Pós-Andromeda
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Planejamento, conta da verba, análise de criativos e playbooks BR
              </p>
            </div>
          </div>

          <nav className="flex items-center gap-1 rounded-lg bg-zinc-900/90 p-1 ring-1 ring-zinc-800">
            <button
              onClick={() => setActiveTab('planner')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
                activeTab === 'planner'
                  ? 'bg-emerald-500 text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-100'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              Planejador
            </button>
            <button
              onClick={() => setActiveTab('analyzer')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
                activeTab === 'analyzer'
                  ? 'bg-emerald-500 text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-100'
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              Analisador de Métricas
            </button>
            <button
              onClick={() => setActiveTab('playbooks')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
                activeTab === 'playbooks'
                  ? 'bg-emerald-500 text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-100'
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" />
              Playbooks 2026
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
        {activeTab === 'planner' && (
          <div className="space-y-6">
            {/* Step 1: Path Selector */}
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
                  1. Escolha o tipo de negócio
                </h2>
                <span className="text-xs text-zinc-500">
                  O playbook do caminho define a estrutura
                </span>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {(Object.keys(PATH_META) as BusinessPath[]).map((key) => {
                  const meta = PATH_META[key];
                  const Icon = PATH_ICONS[key];
                  const selected = input.path === key;
                  return (
                    <button
                      key={key}
                      onClick={() => handleSelectPath(key)}
                      className={`group flex flex-col justify-between rounded-xl border p-4 text-left transition ${
                        selected
                          ? 'border-emerald-500/70 bg-emerald-500/10 ring-1 ring-emerald-500/30'
                          : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 hover:bg-zinc-900'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div
                          className={`rounded-lg p-2 ${
                            selected
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-zinc-800 text-zinc-400 group-hover:text-zinc-200'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <span className="rounded bg-zinc-800/80 px-2 py-0.5 font-mono text-[10px] text-zinc-300">
                          {meta.badge}
                        </span>
                      </div>
                      <div className="mt-3">
                        <div className="font-semibold text-white">{meta.label}</div>
                        <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                          {meta.shortDesc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Step 2 + Step 3 Grid */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              {/* Left Column: Inputs */}
              <section className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 lg:col-span-4">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
                  2. Diagnóstico rápido
                </h2>

                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-zinc-300">
                      Nome do negócio
                    </label>
                    <input
                      type="text"
                      value={input.businessName}
                      onChange={(e) =>
                        setInput((p) => ({ ...p, businessName: e.target.value }))
                      }
                      className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-zinc-300">
                        Ticket médio (R$)
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={input.ticket}
                        onChange={(e) =>
                          setInput((p) => ({ ...p, ticket: Number(e.target.value) || 0 }))
                        }
                        className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 font-mono text-sm text-white outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-zinc-300">
                        Margem líquida (%)
                      </label>
                      <input
                        type="number"
                        min={5}
                        max={95}
                        value={input.marginPct}
                        onChange={(e) =>
                          setInput((p) => ({ ...p, marginPct: Number(e.target.value) || 0 }))
                        }
                        className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 font-mono text-sm text-white outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-zinc-300">
                        Verba diária (R$)
                      </label>
                      <input
                        type="number"
                        min={10}
                        value={input.dailyBudget}
                        onChange={(e) =>
                          setInput((p) => ({
                            ...p,
                            dailyBudget: Number(e.target.value) || 0,
                          }))
                        }
                        className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 font-mono text-sm text-white outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-zinc-300">
                        Criativos distintos
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={input.creativesCount}
                        onChange={(e) =>
                          setInput((p) => ({
                            ...p,
                            creativesCount: Number(e.target.value) || 1,
                          }))
                        }
                        className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 font-mono text-sm text-white outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Path specific fields */}
                  {input.path === 'local' && (
                    <div className="grid grid-cols-2 gap-3 rounded-lg border border-zinc-800/80 bg-zinc-950/60 p-3">
                      <div>
                        <label className="mb-1 block text-xs text-zinc-400">
                          Cidade / Bairro
                        </label>
                        <input
                          type="text"
                          value={input.city}
                          onChange={(e) =>
                            setInput((p) => ({ ...p, city: e.target.value }))
                          }
                          className="w-full rounded border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs text-white outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-zinc-400">
                          Raio (km)
                        </label>
                        <input
                          type="number"
                          min={2}
                          max={30}
                          value={input.radiusKm}
                          onChange={(e) =>
                            setInput((p) => ({
                              ...p,
                              radiusKm: Number(e.target.value) || 5,
                            }))
                          }
                          className="w-full rounded border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 font-mono text-xs text-white outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="mb-1 block text-xs text-zinc-400">
                          Taxa conversa → venda (% · hipótese padrão 30%)
                        </label>
                        <input
                          type="number"
                          min={5}
                          max={100}
                          value={input.convRatePct}
                          onChange={(e) =>
                            setInput((p) => ({
                              ...p,
                              convRatePct: Number(e.target.value) || 30,
                            }))
                          }
                          className="w-full rounded border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 font-mono text-xs text-white outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  )}

                  {input.path === 'infoproduto' && (
                    <div className="grid grid-cols-2 gap-3 rounded-lg border border-zinc-800/80 bg-zinc-950/60 p-3">
                      <div>
                        <label className="mb-1 block text-xs text-zinc-400">
                          Order Bump (R$)
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={input.bumpTicket}
                          onChange={(e) =>
                            setInput((p) => ({
                              ...p,
                              bumpTicket: Number(e.target.value) || 0,
                            }))
                          }
                          className="w-full rounded border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 font-mono text-xs text-white outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-zinc-400">
                          Aceite Bump (%)
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={input.bumpRatePct}
                          onChange={(e) =>
                            setInput((p) => ({
                              ...p,
                              bumpRatePct: Number(e.target.value) || 0,
                            }))
                          }
                          className="w-full rounded border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 font-mono text-xs text-white outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  )}

                  {input.path === 'lancamento' && (
                    <div className="grid grid-cols-2 gap-3 rounded-lg border border-zinc-800/80 bg-zinc-950/60 p-3">
                      <div>
                        <label className="mb-1 block text-xs text-zinc-400">
                          Meta de vendas
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={input.launchGoalSales}
                          onChange={(e) =>
                            setInput((p) => ({
                              ...p,
                              launchGoalSales: Number(e.target.value) || 1,
                            }))
                          }
                          className="w-full rounded border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 font-mono text-xs text-white outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-zinc-400">
                          Conv. lead → venda (%)
                        </label>
                        <input
                          type="number"
                          min={0.5}
                          max={20}
                          step={0.5}
                          value={input.convRatePct}
                          onChange={(e) =>
                            setInput((p) => ({
                              ...p,
                              convRatePct: Number(e.target.value) || 2,
                            }))
                          }
                          className="w-full rounded border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 font-mono text-xs text-white outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  )}

                  {input.path === 'ecommerce' && (
                    <div className="space-y-2 rounded-lg border border-zinc-800/80 bg-zinc-950/60 p-3">
                      <label className="flex items-center gap-2 text-xs text-zinc-300">
                        <input
                          type="checkbox"
                          checked={input.hasCatalog}
                          onChange={(e) =>
                            setInput((p) => ({ ...p, hasCatalog: e.target.checked }))
                          }
                          className="rounded border-zinc-700 accent-emerald-500"
                        />
                        Catálogo conectado e sem erros de feed
                      </label>
                      <label className="flex items-center gap-2 text-xs text-zinc-300">
                        <input
                          type="checkbox"
                          checked={input.isBlackFriday}
                          onChange={(e) =>
                            setInput((p) => ({ ...p, isBlackFriday: e.target.checked }))
                          }
                          className="rounded border-zinc-700 accent-emerald-500"
                        />
                        Modo Black Friday (CPM +40–70%)
                      </label>
                    </div>
                  )}

                  {input.path !== 'local' && input.path !== 'lancamento' && (
                    <label className="flex items-center gap-2 pt-1 text-xs text-zinc-300">
                      <input
                        type="checkbox"
                        checked={input.alreadyRunsAds}
                        onChange={(e) =>
                          setInput((p) => ({ ...p, alreadyRunsAds: e.target.checked }))
                        }
                        className="rounded border-zinc-700 accent-emerald-500"
                      />
                      Já tenho anúncios vencedores (ativar divisão 80% Escala / 20% Teste)
                    </label>
                  )}
                </div>
              </section>

              {/* Right Column: Generated Plan */}
              <section className="space-y-5 lg:col-span-8">
                {/* Action Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 px-5 py-3.5">
                  <div>
                    <div className="font-mono text-xs text-emerald-400">
                      {plan.header}
                    </div>
                    <p className="mt-0.5 text-xs text-zinc-300">{plan.objectiveLine}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={copyPlanText}
                      className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-100 transition hover:bg-zinc-700"
                    >
                      {copiedType === 'plan' ? (
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      {copiedType === 'plan' ? 'Copiado!' : 'Copiar Plano'}
                    </button>
                    <button
                      onClick={downloadZernioJson}
                      className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-zinc-950 transition hover:bg-emerald-400"
                    >
                      <Download className="h-3.5 w-3.5" />
                      plano.json (Zernio)
                    </button>
                  </div>
                </div>

                {plan.budgetWarning && (
                  <div className="flex items-start gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-xs text-amber-200">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                    <div>
                      <span className="font-semibold">Atenção na verba: </span>
                      {plan.budgetWarning}
                    </div>
                  </div>
                )}

                {/* Budget Math KPIs */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3.5">
                    <div className="text-[11px] text-zinc-400">CPA de Equilíbrio</div>
                    <div className="mt-1 font-mono text-lg font-semibold text-white">
                      {formatBRL(plan.cpaEquilibrio)}
                    </div>
                    <div className="mt-0.5 text-[10px] text-zinc-500">Lucro zero</div>
                  </div>
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3.5">
                    <div className="text-[11px] text-emerald-300">CPA Alvo (0,7×)</div>
                    <div className="mt-1 font-mono text-lg font-semibold text-emerald-400">
                      {formatBRL(plan.cpaAlvo)}
                    </div>
                    <div className="mt-0.5 text-[10px] text-zinc-400">Régua de escala</div>
                  </div>
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3.5">
                    <div className="text-[11px] text-zinc-400">ROAS de Equilíbrio</div>
                    <div className="mt-1 font-mono text-lg font-semibold text-white">
                      {plan.roasEquilibrio.toFixed(2)}x
                    </div>
                    <div className="mt-0.5 text-[10px] text-zinc-500">1 ÷ margem</div>
                  </div>
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3.5">
                    <div className="text-[11px] text-amber-300">
                      Teto ({plan.unidadeLabel.split(' ')[0]})
                    </div>
                    <div className="mt-1 font-mono text-lg font-semibold text-amber-400">
                      {formatBRL(plan.tetoUnidade)}
                    </div>
                    <div className="mt-0.5 text-[10px] text-zinc-400">
                      Corte 2×: {formatBRL(plan.tetoUnidade * 2)}
                    </div>
                  </div>
                </div>

                {/* Campaign Structure */}
                <div className="space-y-3">
                  {plan.structure.map((camp, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="font-mono text-sm font-semibold text-white">
                          {camp.title}
                        </h3>
                      </div>
                      <p className="mt-1 text-xs text-zinc-400">{camp.subtitle}</p>
                      <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                        <span className="rounded bg-zinc-800 px-2 py-1 text-zinc-300">
                          <strong className="text-zinc-100">Público:</strong> {camp.audience}
                        </span>
                        <span className="rounded bg-zinc-800 px-2 py-1 text-zinc-300">
                          <strong className="text-zinc-100">Exclusões:</strong>{' '}
                          {camp.exclusions}
                        </span>
                      </div>
                      <div className="mt-3 space-y-2">
                        {camp.sets.map((s, sIdx) => (
                          <div
                            key={sIdx}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-800/80 bg-zinc-950/70 px-3 py-2"
                          >
                            <div>
                              <div className="text-xs font-medium text-zinc-100">
                                {s.name}
                              </div>
                              <div className="text-[11px] text-zinc-400">{s.note}</div>
                            </div>
                            <span className="rounded bg-emerald-500/15 px-2 py-0.5 font-mono text-xs font-medium text-emerald-400">
                              {formatBRL(s.budgetPerDay)}/dia
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Benchmarks + Rules + Timeline */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
                    <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-300">
                      <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                      Regras de Corte & Escala
                    </h3>
                    <ul className="mt-3 space-y-2 text-xs text-zinc-300">
                      {plan.cutAndScaleRules.map((rule, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                          <span>{rule}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-4 rounded-lg border border-zinc-800 bg-zinc-950/70 p-3 text-[11px] text-zinc-400">
                      <div>
                        <strong className="text-zinc-200">CPM ref.:</strong>{' '}
                        {plan.benchmarks.cpm}
                      </div>
                      <div className="mt-1">
                        <strong className="text-zinc-200">CTR ref.:</strong>{' '}
                        {plan.benchmarks.ctr}
                      </div>
                      <div className="mt-1">
                        <strong className="text-zinc-200">Meta:</strong>{' '}
                        {plan.benchmarks.resultCost}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
                    <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-300">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                      Primeiras 4 Semanas & Checklist
                    </h3>
                    <div className="mt-3 space-y-2">
                      {plan.weeks.map((w, i) => (
                        <div key={i} className="text-xs">
                          <span className="font-mono font-semibold text-emerald-400">
                            {w.week}:{' '}
                          </span>
                          <span className="text-zinc-300">{w.focus}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 border-t border-zinc-800 pt-3">
                      <div className="mb-1.5 text-[11px] font-semibold text-zinc-400">
                        Antes de apertar o play:
                      </div>
                      <ul className="space-y-1 text-[11px] text-zinc-300">
                        {plan.checklist.map((item, i) => (
                          <li key={i} className="flex items-center gap-1.5">
                            <span className="text-emerald-400">✓</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        )}

        {activeTab === 'analyzer' && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Analisador de Métricas (Hook, Hold, CTR e Corte/Escala)
                </h2>
                <p className="text-xs text-zinc-400">
                  Cole os números do Gerenciador após 72h+ para saber exatamente o que pausar,
                  otimizar ou escalar (+20%).
                </p>
              </div>
              <button
                onClick={addAdRow}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3.5 py-2 text-xs font-semibold text-zinc-950 transition hover:bg-emerald-400"
              >
                <Plus className="h-4 w-4" />
                Adicionar Anúncio
              </button>
            </div>

            <div className="space-y-4">
              {ads.map((ad) => {
                const analysis = analyzeAdMetrics(ad);
                const badgeStyles = {
                  emerald: 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/30',
                  amber: 'bg-amber-500/15 text-amber-400 ring-amber-500/30',
                  rose: 'bg-rose-500/15 text-rose-400 ring-rose-500/30',
                  sky: 'bg-sky-500/15 text-sky-400 ring-sky-500/30',
                }[analysis.badgeColor];

                return (
                  <div
                    key={ad.id}
                    className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-3">
                      <input
                        type="text"
                        value={ad.name}
                        onChange={(e) => updateAd(ad.id, 'name', e.target.value)}
                        className="w-full max-w-md rounded bg-transparent text-sm font-semibold text-white outline-none focus:bg-zinc-950 focus:px-2"
                      />
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-3 py-1 font-mono text-xs font-semibold ring-1 ${badgeStyles}`}
                        >
                          {analysis.verdict}
                        </span>
                        <button
                          onClick={() => removeAd(ad.id)}
                          className="rounded p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-rose-400"
                          title="Remover"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
                      {[
                        { label: 'Gasto (R$)', key: 'spend' as const },
                        { label: 'Impressões', key: 'impressions' as const },
                        { label: 'Views 3s', key: 'views3s' as const },
                        { label: 'ThruPlay', key: 'thruPlays' as const },
                        { label: 'Cliques Link', key: 'linkClicks' as const },
                        { label: 'Resultados', key: 'results' as const },
                        { label: 'Teto Alvo (R$)', key: 'targetCostPerResult' as const },
                      ].map((f) => (
                        <div key={f.key}>
                          <label className="mb-1 block text-[11px] text-zinc-400">
                            {f.label}
                          </label>
                          <input
                            type="number"
                            min={0}
                            value={ad[f.key]}
                            onChange={(e) =>
                              updateAd(ad.id, f.key, Number(e.target.value) || 0)
                            }
                            className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 font-mono text-xs text-white outline-none focus:border-emerald-500"
                          />
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 rounded-lg bg-zinc-950/70 p-3 sm:grid-cols-5">
                      <div>
                        <div className="text-[10px] text-zinc-500">Hook Rate (≥25%)</div>
                        <div
                          className={`font-mono text-sm font-semibold ${
                            analysis.hookRate >= 25
                              ? 'text-emerald-400'
                              : analysis.hookRate < 20
                                ? 'text-rose-400'
                                : 'text-amber-400'
                          }`}
                        >
                          {analysis.hookRate.toFixed(1)}%
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-zinc-500">Hold Rate (≥25%)</div>
                        <div
                          className={`font-mono text-sm font-semibold ${
                            analysis.holdRate >= 25 ? 'text-emerald-400' : 'text-amber-400'
                          }`}
                        >
                          {analysis.holdRate.toFixed(1)}%
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-zinc-500">CTR Link (≥1%)</div>
                        <div className="font-mono text-sm font-semibold text-white">
                          {analysis.ctr.toFixed(2)}%
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-zinc-500">CPM</div>
                        <div className="font-mono text-sm font-semibold text-white">
                          {formatBRL(analysis.cpm)}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-zinc-500">Custo / Resultado</div>
                        <div className="font-mono text-sm font-semibold text-white">
                          {analysis.cpr !== null ? formatBRL(analysis.cpr) : '—'}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-col gap-1 text-xs text-zinc-300">
                      <div>
                        <strong className="text-zinc-100">Diagnóstico:</strong>{' '}
                        {analysis.reason}
                      </div>
                      <div className="text-emerald-300/90">
                        <strong>Próximo passo:</strong> {analysis.nextAction}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'playbooks' && (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
              <div className="flex items-center gap-2 text-emerald-400">
                <Activity className="h-4 w-4" />
                <h3 className="text-sm font-semibold text-white">
                  O que mudou no Meta Ads (Pós-Andromeda 11/2026)
                </h3>
              </div>
              <ul className="mt-3 space-y-2.5 text-xs leading-relaxed text-zinc-300">
                <li>
                  <strong>Andromeda:</strong> anúncios parecidos demais contam como um só.
                  20 variações de texto do mesmo vídeo = 1 conceito. Varie ângulo, formato ou
                  persona.
                </li>
                <li>
                  <strong>O criativo faz a segmentação:</strong> Advantage+ Sales e público
                  aberto são o padrão. Interesses viraram sugestão, não trava.
                </li>
                <li>
                  <strong>ABO pra testar, CBO/Advantage+ pra escalar:</strong> leve vencedores
                  pelo ID do post para manter prova social.
                </li>
                <li>
                  <strong>Pixel + CAPI obrigatórios:</strong> sem API de Conversões com
                  deduplicação, o algoritmo otimiza no escuro.
                </li>
              </ul>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
              <div className="flex items-center gap-2 text-rose-400">
                <AlertTriangle className="h-4 w-4" />
                <h3 className="text-sm font-semibold text-white">
                  Erros que queimam verba
                </h3>
              </div>
              <ul className="mt-3 space-y-2.5 text-xs leading-relaxed text-zinc-300">
                <li>
                  Muitos conjuntos que nunca chegam a ~50 eventos/semana (fragmentação).
                </li>
                <li>
                  Mexer nas primeiras 72h ou dobrar o orçamento de uma vez (reinicia o
                  aprendizado).
                </li>
                <li>
                  Usar o botão &quot;Impulsionar&quot; do Instagram em vez do Gerenciador.
                </li>
                <li>
                  Não excluir compradores/leads ou demorar para responder no WhatsApp.
                </li>
                <li>
                  Matar criativo cedo demais (antes de 1–3× o CPA) ou tarde demais (sem teto).
                </li>
              </ul>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 md:col-span-2">
              <h3 className="text-sm font-semibold text-white">
                Integração opcional com Zernio (ads.py)
              </h3>
              <p className="mt-1 text-xs text-zinc-400">
                Exporte o <code className="text-emerald-400">plano.json</code> no Planejador
                para criar campanhas <strong>PAUSADAS</strong> via API oficial da Zernio:
              </p>
              <pre className="mt-3 overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950 p-3 font-mono text-xs text-zinc-300">
{`python3 scripts/ads.py contas
python3 scripts/ads.py criar plano.json --simular
python3 scripts/ads.py criar plano.json
python3 scripts/ads.py metricas --conta ID --anuncio act_... --dias 7`}
              </pre>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
