import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Globe,
  Link2,
  Lock,
  Rocket,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { AudienceInputNode, buildAudienceLadder } from '../lib/audienceEngine';
import { ZernioAccountMetadata, loadPolicySettings } from '../lib/indexedDbStore';
import {
  buildAdName,
  buildCampaignName,
  injectDynamicUtms,
} from '../lib/namingAndUtm';
import {
  PolicyCheckResult,
  checkUrlReachability,
  runClientPolicyEngine,
} from '../lib/policyEngine';
import { formatBRL } from '../lib/trafficEngine';
import {
  ZernioDispatchResult,
  dispatchCampaignToZernio,
  zernio_list_accounts,
} from '../lib/zernioClient';

interface PreFlightCockpitTabProps {
  businessName: string;
  productName: string;
  buyingMode: 'ABO' | 'CBO';
  dailyBudget: number;
  audienceNodes: AudienceInputNode[];
  onOpenSettings: () => void;
}

export function PreFlightCockpitTab({
  businessName,
  productName,
  buyingMode,
  dailyBudget,
  audienceNodes,
  onOpenSettings,
}: PreFlightCockpitTabProps) {
  const [accounts, setAccounts] = useState<ZernioAccountMetadata[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [objectiveCode, setObjectiveCode] = useState('CONV-VENDAS');
  const [channel, setChannel] = useState('INSTAGRAM');
  const [actionName, setActionName] = useState(productName || 'OFERTA-PRINCIPAL-NOV26');
  const [destinationUrl, setDestinationUrl] = useState('https://seusite.com.br/oferta');
  const [adFormat, setAdFormat] = useState<'1:1' | '4:5' | '9:16'>('4:5');
  const [hookTag, setHookTag] = useState('DOR-TEMPO');
  const [copyVariant, setCopyVariant] = useState('CP01-TT01');

  const [urlCheck, setUrlCheck] = useState<{
    checking: boolean;
    reachable?: boolean;
    statusText?: string;
  }>({ checking: false });

  const [policyResults, setPolicyResults] = useState<PolicyCheckResult[]>([]);
  const [confirmedPauseAck, setConfirmedPauseAck] = useState(false);
  const [dispatching, setDispatching] = useState(false);
  const [dispatchResult, setDispatchResult] = useState<ZernioDispatchResult | null>(null);

  const ladder = useMemo(() => buildAudienceLadder(audienceNodes), [audienceNodes]);

  const campaignName = useMemo(
    () =>
      buildCampaignName({
        objectiveCode,
        channel,
        strategy: buyingMode,
        actionName,
      }),
    [objectiveCode, channel, buyingMode, actionName]
  );

  const sampleAdName = useMemo(
    () =>
      buildAdName({
        adCode: 'AD01',
        format: adFormat,
        hookTag,
        copyVariant,
      }),
    [adFormat, hookTag, copyVariant]
  );

  const finalUrlWithUtm = useMemo(
    () => injectDynamicUtms(destinationUrl),
    [destinationUrl]
  );

  useEffect(() => {
    void (async () => {
      const accs = await zernio_list_accounts(false);
      setAccounts(accs);
      if (accs.length > 0 && !selectedAccountId) {
        setSelectedAccountId(accs[0].id);
      }
    })();
  }, [selectedAccountId]);

  useEffect(() => {
    void (async () => {
      const settings = await loadPolicySettings();
      const hasExclusions = ladder.every((set) => set.exclusions.length > 0);
      const res = runClientPolicyEngine({
        dailyBudget,
        adSetCount: ladder.length,
        buyingMode,
        destinationUrl,
        hasAllLadderExclusions: hasExclusions,
        statusFlag: 'PAUSED',
        settings,
      });
      setPolicyResults(res);
    })();
  }, [dailyBudget, ladder, buyingMode, destinationUrl]);

  const hasPolicyFail = policyResults.some((r) => r.status === 'fail');

  async function handleTestUrl() {
    setUrlCheck({ checking: true });
    const res = await checkUrlReachability(destinationUrl);
    setUrlCheck({ checking: false, ...res });
  }

  async function handleDispatch() {
    if (hasPolicyFail || !confirmedPauseAck) return;
    setDispatching(true);
    try {
      const accountId = selectedAccountId || accounts[0]?.id || 'act_sandbox';
      const result = await dispatchCampaignToZernio({
        accountId,
        campaignName,
        objective: objectiveCode,
        buyingMode,
        dailyBudget,
        status: 'PAUSED',
        adSets: ladder.map((set, idx) => ({
          name: set.adSetName,
          ladderLevel: set.levelTag,
          dailyBudget: set.dailyBudget,
          exclusions: set.exclusions,
          ads: [
            {
              name: buildAdName({
                adCode: `AD0${idx + 1}`,
                format: adFormat,
                hookTag,
                copyVariant,
              }),
              format: adFormat,
              destinationUrlWithUtm: finalUrlWithUtm,
              hookCode: hookTag,
            },
          ],
        })),
      });
      setDispatchResult(result);
    } finally {
      setDispatching(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">
            Cockpit de Revisão Pré-Voo &amp; Despacho Zero-Gerenciador (Zernio)
          </h2>
          <p className="text-xs text-zinc-400">
            Pedido 23 · Nomenclatura padronizada automática, UTMs dinâmicas invioláveis e criação
            exclusivamente em estado <code className="text-amber-300">status: PAUSED</code>.
          </p>
        </div>
        <button
          onClick={onOpenSettings}
          className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:border-emerald-500/50"
        >
          Configurar Zernio &amp; Travas
        </button>
      </div>

      {/* Configuração de Nomenclatura & Conta */}
      <div className="grid grid-cols-1 gap-4 rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 md:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs text-zinc-400">Conta de Anúncios (Zernio)</label>
          <select
            value={selectedAccountId}
            onChange={(e) => setSelectedAccountId(e.target.value)}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
          >
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name} ({acc.id})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs text-zinc-400">Objetivo</label>
          <select
            value={objectiveCode}
            onChange={(e) => setObjectiveCode(e.target.value)}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
          >
            <option value="CONV-VENDAS">CONV-VENDAS</option>
            <option value="MSG-WPP">MSG-WPP</option>
            <option value="CAP-LEADS">CAP-LEADS</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs text-zinc-400">Canal &amp; Ação</label>
          <div className="flex gap-2">
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              className="w-32 rounded-lg border border-zinc-800 bg-zinc-950 px-2 py-2 text-xs text-white outline-none focus:border-emerald-500"
            >
              <option value="INSTAGRAM">INSTAGRAM</option>
              <option value="META">META</option>
            </select>
            <input
              type="text"
              value={actionName}
              onChange={(e) => setActionName(e.target.value)}
              className="flex-1 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs text-zinc-400">Formato &amp; Gancho do Ad</label>
          <div className="flex gap-2">
            <select
              value={adFormat}
              onChange={(e) => setAdFormat(e.target.value as '1:1' | '4:5' | '9:16')}
              className="w-24 rounded-lg border border-zinc-800 bg-zinc-950 px-2 py-2 text-xs text-white outline-none focus:border-emerald-500"
            >
              <option value="4:5">4:5</option>
              <option value="9:16">9:16</option>
              <option value="1:1">1:1</option>
            </select>
            <input
              type="text"
              value={hookTag}
              onChange={(e) => setHookTag(e.target.value)}
              placeholder="DOR-TEMPO"
              className="flex-1 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
            />
            <input
              type="text"
              value={copyVariant}
              onChange={(e) => setCopyVariant(e.target.value)}
              placeholder="CP01-TT01"
              className="w-28 rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-2 text-xs text-white outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="mb-1 block text-xs text-zinc-400">
            URL de Destino (verificação HTTP + injeção automática de UTMs)
          </label>
          <div className="flex gap-2">
            <input
              type="url"
              value={destinationUrl}
              onChange={(e) => setDestinationUrl(e.target.value)}
              className="flex-1 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 font-mono text-xs text-white outline-none focus:border-emerald-500"
            />
            <button
              onClick={handleTestUrl}
              disabled={urlCheck.checking}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-medium text-zinc-200 hover:border-emerald-500"
            >
              <Globe className="h-3.5 w-3.5" />
              {urlCheck.checking ? 'Testando...' : 'Testar URL'}
            </button>
          </div>
          {urlCheck.statusText && (
            <div
              className={`mt-1 text-[11px] ${
                urlCheck.reachable ? 'text-emerald-400' : 'text-amber-300'
              }`}
            >
              {urlCheck.statusText}
            </div>
          )}
        </div>
      </div>

      {/* Taxonomia + UTM Preview */}
      <div className="grid grid-cols-1 gap-4 rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 md:grid-cols-2">
        <div className="space-y-2.5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
            Nomenclatura Estruturada Automática
          </h3>
          <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-xs">
            <div className="text-[10px] text-zinc-500">CAMPANHA</div>
            <div className="mt-0.5 font-mono text-emerald-400">{campaignName}</div>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-xs">
            <div className="text-[10px] text-zinc-500">CONJUNTO EXEMPLO (ESCADA 00–05)</div>
            <div className="mt-0.5 font-mono text-zinc-200">
              {ladder[0]?.adSetName ?? '[01-QUENTE]_[IG-ENVOLVIMENTO]_[30D]_[EXC-00]'}
            </div>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-xs">
            <div className="text-[10px] text-zinc-500">ANÚNCIO PADRÃO</div>
            <div className="mt-0.5 font-mono text-zinc-200">{sampleAdName}</div>
          </div>
        </div>

        <div className="space-y-2.5">
          <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-300">
            <Link2 className="h-3.5 w-3.5 text-emerald-400" />
            Rastreamento Dinâmico Inviolável (UTM)
          </h3>
          <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
            <div className="text-[10px] text-zinc-500">URL FINAL CONCATENADA</div>
            <p className="mt-1 break-all font-mono text-[11px] text-emerald-300">
              {finalUrlWithUtm || 'Informe uma URL válida acima'}
            </p>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-400">
            <strong className="text-zinc-200">Resumo Executivo ({businessName}):</strong>{' '}
            Modo <span className="font-mono text-white">{buyingMode}</span> ·{' '}
            <span className="font-mono text-white">{ladder.length}</span> conjuntos ·{' '}
            <span className="font-mono text-emerald-400">{formatBRL(dailyBudget)}/dia</span> ·{' '}
            Status inicial <span className="font-mono text-amber-300">PAUSED</span>.
          </div>
        </div>
      </div>

      {/* Client-Side Policy Engine */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-300">
            {hasPolicyFail ? (
              <ShieldAlert className="h-4 w-4 text-rose-400" />
            ) : (
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
            )}
            Client-Side Policy Engine (Travas Pré-Envio)
          </h3>
          <span
            className={`rounded-full px-2.5 py-0.5 font-mono text-[10px] font-semibold ${
              hasPolicyFail
                ? 'bg-rose-500/15 text-rose-400'
                : 'bg-emerald-500/15 text-emerald-400'
            }`}
          >
            {hasPolicyFail ? 'BLOQUEADO POR POLÍTICA' : 'APROVADO PARA DESPACHO'}
          </span>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-2.5 md:grid-cols-2">
          {policyResults.map((check) => (
            <div
              key={check.id}
              className="flex items-start gap-2.5 rounded-lg border border-zinc-800 bg-zinc-950/70 p-3 text-xs"
            >
              {check.status === 'pass' ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
              ) : check.status === 'warn' ? (
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
              ) : (
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
              )}
              <div>
                <div className="font-semibold text-white">{check.rule}</div>
                <div className="mt-0.5 text-[11px] text-zinc-400">{check.detail}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Confirmação & Despacho */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-zinc-800 pt-4">
          <label className="flex cursor-pointer items-center gap-2 text-xs text-zinc-300">
            <input
              type="checkbox"
              checked={confirmedPauseAck}
              onChange={(e) => setConfirmedPauseAck(e.target.checked)}
              className="h-4 w-4 accent-emerald-500"
            />
            <span>
              Confirmo o Sumário Executivo e que a campanha nascerá{' '}
              <strong className="text-amber-300">PAUSADA (status: PAUSED)</strong>.
            </span>
          </label>

          <button
            onClick={handleDispatch}
            disabled={hasPolicyFail || !confirmedPauseAck || dispatching}
            className="flex items-center gap-2 rounded-lg bg-emerald-500 px-5 py-2.5 text-xs font-semibold text-zinc-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Lock className="h-3.5 w-3.5" />
            <Rocket className="h-4 w-4" />
            {dispatching ? 'Despachando via Zernio...' : 'Criar Campanha PAUSED via Zernio'}
          </button>
        </div>

        {dispatchResult && (
          <div
            className={`mt-4 rounded-xl border p-4 text-xs ${
              dispatchResult.ok
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                : 'border-amber-500/30 bg-amber-500/10 text-amber-200'
            }`}
          >
            <div className="font-semibold">{dispatchResult.message}</div>
            {dispatchResult.campaignId && (
              <div className="mt-1.5 font-mono text-[11px]">
                Campaign ID: {dispatchResult.campaignId} · Status: {dispatchResult.status} ·
                Conjuntos: {dispatchResult.adSetIds.length} · Anúncios:{' '}
                {dispatchResult.adIds.length}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
