import { useEffect, useState } from 'react';
import {
  BookmarkPlus,
  Check,
  Copy,
  Film,
  Image as ImageIcon,
  Layers,
  Palette,
  Trash2,
} from 'lucide-react';
import {
  CreativeAngle,
  CreativeBriefInput,
  CreativeMedium,
  GeneratedCreativePack,
} from '../lib/creativeEngine';
import { dbDelete, dbGetAll, dbPut } from '../lib/indexedDbStore';
import { executeSkill } from '../lib/skillRuntime';

interface CreativeStudioTabProps {
  defaultBusinessName: string;
  defaultProductName: string;
}

export function CreativeStudioTab({
  defaultBusinessName,
  defaultProductName,
}: CreativeStudioTabProps) {
  const [form, setForm] = useState<CreativeBriefInput>({
    businessName: defaultBusinessName || 'Clínica Exemplo',
    productName: defaultProductName || 'Avaliação + Procedimento',
    targetAudience: 'Pessoas da região buscando atendimento rápido',
    mainPain: 'gastar com soluções que não resolvem a raiz do problema',
    mainPromise: 'resultado visível com atendimento humanizado em 7 dias',
    ctaDestination: 'Chamar no WhatsApp',
    angle: 'dor-aguda',
    medium: 'video',
  });

  const [pack, setPack] = useState<GeneratedCreativePack | null>(null);
  const [selectedRatio, setSelectedRatio] = useState<'1:1' | '4:5' | '9:16'>('9:16');
  const [savedLibrary, setSavedLibrary] = useState<GeneratedCreativePack[]>([]);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  useEffect(() => {
    void runGenerate(form);
    void loadLibrary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function runGenerate(nextForm: CreativeBriefInput) {
    const { result } = await executeSkill<GeneratedCreativePack>(
      'generate_briefing',
      nextForm
    );
    setPack(result);
  }

  async function loadLibrary() {
    try {
      const items = await dbGetAll<GeneratedCreativePack>('creatives');
      setSavedLibrary(items.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    } catch {
      setSavedLibrary([]);
    }
  }

  async function handleSaveToLibrary() {
    if (!pack) return;
    await dbPut('creatives', pack);
    await loadLibrary();
  }

  async function handleDeleteSaved(id: string) {
    await dbDelete('creatives', id);
    await loadLibrary();
  }

  function updateField<K extends keyof CreativeBriefInput>(
    key: K,
    value: CreativeBriefInput[K]
  ) {
    const next = { ...form, [key]: value };
    setForm(next);
    void runGenerate(next);
  }

  function copyGoogleFlowPrompt() {
    if (!pack) return;
    navigator.clipboard.writeText(pack.googleFlow.googleFlowPrompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 1800);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">
            Estúdio de Direção Criativa (Google Flow &amp; Roteiros)
          </h2>
          <p className="text-xs text-zinc-400">
            Pedido 20 · O agente atua como Diretor de Arte e Roteirista — zero geração sintética,
            foco em autenticidade humana e áreas de segurança 1:1, 4:5 e 9:16 (250px).
          </p>
        </div>
        <button
          onClick={handleSaveToLibrary}
          disabled={!pack}
          className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3.5 py-2 text-xs font-semibold text-zinc-950 transition hover:bg-emerald-400 disabled:opacity-50"
        >
          <BookmarkPlus className="h-4 w-4" />
          Salvar na Biblioteca (IndexedDB)
        </button>
      </div>

      {/* Formulário Paramétrico */}
      <div className="grid grid-cols-1 gap-4 rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 md:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs text-zinc-400">Negócio / Marca</label>
          <input
            type="text"
            value={form.businessName}
            onChange={(e) => updateField('businessName', e.target.value)}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-zinc-400">Produto / Oferta</label>
          <input
            type="text"
            value={form.productName}
            onChange={(e) => updateField('productName', e.target.value)}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-zinc-400">CTA (Sem Surpresa)</label>
          <input
            type="text"
            value={form.ctaDestination}
            onChange={(e) => updateField('ctaDestination', e.target.value)}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-zinc-400">Dor Principal do Público</label>
          <input
            type="text"
            value={form.mainPain}
            onChange={(e) => updateField('mainPain', e.target.value)}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-zinc-400">Promessa / Benefício Final</label>
          <input
            type="text"
            value={form.mainPromise}
            onChange={(e) => updateField('mainPromise', e.target.value)}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="mb-1 block text-xs text-zinc-400">Ângulo</label>
            <select
              value={form.angle}
              onChange={(e) => updateField('angle', e.target.value as CreativeAngle)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-2 text-xs text-white outline-none focus:border-emerald-500"
            >
              <option value="dor-aguda">Dor Aguda</option>
              <option value="prova-social">Prova Social</option>
              <option value="contraintuitivo">Contraintuitivo</option>
              <option value="oferta-direta">Oferta Direta</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-400">Formato Principal</label>
            <select
              value={form.medium}
              onChange={(e) => updateField('medium', e.target.value as CreativeMedium)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-2 text-xs text-white outline-none focus:border-emerald-500"
            >
              <option value="video">Vídeo / Reels (4 Blocos)</option>
              <option value="static">Estático (Google Flow)</option>
              <option value="carousel">Carrossel (6 Lâminas)</option>
            </select>
          </div>
        </div>
      </div>

      {pack && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Coluna Esquerda: Visualizador de Safe-Zones 1:1, 4:5 e 9:16 */}
          <div className="space-y-4 lg:col-span-5">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-300">
                  <ImageIcon className="h-4 w-4 text-emerald-400" />
                  Protocolo de Dimensionamento
                </h3>
                <div className="flex gap-1">
                  {(['1:1', '4:5', '9:16'] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => setSelectedRatio(r)}
                      className={`rounded-md px-2.5 py-1 font-mono text-[11px] font-semibold transition ${
                        selectedRatio === r
                          ? 'bg-emerald-500 text-zinc-950'
                          : 'bg-zinc-950 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Wireframe Visual de Safe Zone */}
              <div className="mt-4 flex justify-center rounded-xl bg-zinc-950 p-4">
                <div
                  className="relative flex flex-col justify-between overflow-hidden rounded-lg border border-zinc-700 transition-all"
                  style={{
                    backgroundColor: pack.googleFlow.palette.backgroundHex,
                    width: selectedRatio === '1:1' ? '220px' : selectedRatio === '4:5' ? '200px' : '180px',
                    height: selectedRatio === '1:1' ? '220px' : selectedRatio === '4:5' ? '250px' : '320px',
                  }}
                >
                  {selectedRatio === '9:16' && (
                    <div className="flex h-[42px] items-center justify-center border-b border-dashed border-rose-500/60 bg-rose-500/20 px-2 text-center text-[9px] font-mono text-rose-200">
                      ZONA PROIBIDA 250px TOPO (Perfil / Ícones)
                    </div>
                  )}

                  <div className="flex flex-1 flex-col items-center justify-center p-3 text-center">
                    <span
                      className="rounded px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                      style={{
                        backgroundColor: pack.googleFlow.palette.accentHex,
                        color: '#09090B',
                      }}
                    >
                      Elemento Focal Único
                    </span>
                    <div
                      className="mt-2 text-xs font-extrabold leading-tight"
                      style={{ color: pack.googleFlow.palette.textHex }}
                    >
                      {pack.googleFlow.headlineWords}
                    </div>
                  </div>

                  {selectedRatio === '9:16' && (
                    <div className="flex h-[42px] items-center justify-center border-t border-dashed border-rose-500/60 bg-rose-500/20 px-2 text-center text-[9px] font-mono text-rose-200">
                      ZONA PROIBIDA 250px BASE (CTA / Legenda)
                    </div>
                  )}
                </div>
              </div>

              {/* Lista das 3 especificações */}
              <div className="mt-4 space-y-2">
                {pack.formats.map((fmt) => (
                  <div
                    key={fmt.ratio}
                    className={`rounded-lg border p-2.5 text-xs ${
                      selectedRatio === fmt.ratio
                        ? 'border-emerald-500/40 bg-emerald-500/5'
                        : 'border-zinc-800 bg-zinc-950/60'
                    }`}
                  >
                    <div className="flex items-center justify-between font-semibold text-white">
                      <span>
                        {fmt.ratio} · {fmt.dimensions}
                      </span>
                      <span className="text-[11px] text-emerald-400">{fmt.placement}</span>
                    </div>
                    <p className="mt-1 text-[11px] text-zinc-400">{fmt.safeZoneNote}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Ficha Paramétrica Google Flow */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-300">
                  <Palette className="h-4 w-4 text-emerald-400" />
                  Ficha Paramétrica Google Flow
                </h3>
                <button
                  onClick={copyGoogleFlowPrompt}
                  className="flex items-center gap-1 rounded-md border border-zinc-700 bg-zinc-950 px-2.5 py-1 text-[11px] text-zinc-200 hover:border-emerald-500"
                >
                  {copiedPrompt ? (
                    <Check className="h-3 w-3 text-emerald-400" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                  {copiedPrompt ? 'Copiado' : 'Copiar Prompt'}
                </button>
              </div>
              <div className="mt-3 flex items-center gap-2">
                {[
                  pack.googleFlow.palette.backgroundHex,
                  pack.googleFlow.palette.accentHex,
                  pack.googleFlow.palette.textHex,
                ].map((hex) => (
                  <div
                    key={hex}
                    className="flex items-center gap-1.5 rounded border border-zinc-800 bg-zinc-950 px-2 py-1 font-mono text-[10px] text-zinc-300"
                  >
                    <span
                      className="h-3 w-3 rounded-sm border border-white/20"
                      style={{ backgroundColor: hex }}
                    />
                    {hex}
                  </div>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-zinc-400">
                <strong className="text-zinc-200">Tipografia:</strong>{' '}
                {pack.googleFlow.typographySpec}
              </p>
              <p className="mt-1 text-[11px] text-zinc-400">
                <strong className="text-zinc-200">Elemento Focal:</strong>{' '}
                {pack.googleFlow.focalElement}
              </p>
              <pre className="mt-3 whitespace-pre-wrap rounded-lg border border-zinc-800 bg-zinc-950 p-3 font-mono text-[11px] text-emerald-300/90">
                {pack.googleFlow.googleFlowPrompt}
              </pre>
            </div>
          </div>

          {/* Coluna Direita: Roteiro Audiovisual 4 Blocos + 3 Ganchos + Carrossel */}
          <div className="space-y-5 lg:col-span-7">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
              <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-300">
                <Film className="h-4 w-4 text-emerald-400" />
                Roteiro Audiovisual (Gravação Humana · 4 Blocos)
              </h3>
              <div className="mt-3 space-y-3">
                {pack.videoScript.blocks.map((b) => (
                  <div
                    key={b.block}
                    className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-3.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-white">{b.block}</span>
                      <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 font-mono text-[10px] text-emerald-400">
                        {b.timeRange}
                      </span>
                    </div>
                    <div className="mt-1 text-[11px] text-zinc-400">
                      <strong>Objetivo:</strong> {b.psychologicalGoal}
                    </div>
                    <div className="mt-1 text-[11px] text-amber-300/90">
                      <strong>Direção de Câmera:</strong> {b.recordingDirection}
                    </div>
                    <div className="mt-2 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs italic text-zinc-100">
                      &ldquo;{b.spokenCopy}&rdquo;
                    </div>
                  </div>
                ))}
              </div>

              {/* 3 Variações de Gancho */}
              <div className="mt-5 border-t border-zinc-800 pt-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                  3 Variações de Gancho (0–3s) para 1 Corpo Gravado (3 Anúncios)
                </h4>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {pack.videoScript.hookVariations.map((h) => (
                    <div
                      key={h.code}
                      className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-xs"
                    >
                      <div className="font-mono text-[10px] text-emerald-400">{h.code}</div>
                      <div className="mt-0.5 font-semibold text-white">{h.label}</div>
                      <p className="mt-1.5 text-[11px] italic text-zinc-200">
                        &ldquo;{h.spokenLine}&rdquo;
                      </p>
                      <div className="mt-2 rounded bg-zinc-900 px-2 py-1 font-mono text-[10px] text-amber-300">
                        Tela: {h.onScreenText}
                      </div>
                      <div className="mt-1.5 text-[10px] text-zinc-400">{h.cameraNote}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Carrossel Didático (quando selecionado) */}
            {pack.googleFlow.carouselSlides && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
                <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-300">
                  <Layers className="h-4 w-4 text-emerald-400" />
                  Estrutura de Carrossel Didático (6 Lâminas)
                </h3>
                <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {pack.googleFlow.carouselSlides.map((s) => (
                    <div
                      key={s.slideNumber}
                      className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-xs"
                    >
                      <div className="font-mono text-[10px] text-emerald-400">
                        Lâmina {s.slideNumber} · {s.role}
                      </div>
                      <div className="mt-1 font-semibold text-white">{s.headline}</div>
                      <p className="mt-1 text-[11px] text-zinc-400">{s.visualDirection}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Biblioteca Salva no IndexedDB */}
            {savedLibrary.length > 0 && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                  Biblioteca Local Salva ({savedLibrary.length})
                </h3>
                <div className="mt-3 space-y-2">
                  {savedLibrary.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs"
                    >
                      <button
                        onClick={() => {
                          setForm(item.input);
                          setPack(item);
                        }}
                        className="text-left hover:text-emerald-400"
                      >
                        <span className="font-semibold text-white">
                          {item.input.productName}
                        </span>{' '}
                        <span className="text-zinc-400">
                          · {item.input.angle} · {item.input.medium}
                        </span>
                      </button>
                      <button
                        onClick={() => handleDeleteSaved(item.id)}
                        className="rounded p-1 text-zinc-500 hover:text-rose-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
