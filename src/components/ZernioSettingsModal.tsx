import { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Database,
  KeyRound,
  RefreshCw,
  Shield,
  Trash2,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';
import {
  clearEncryptedToken,
  hasStoredToken,
  saveEncryptedToken,
} from '../lib/cryptoStore';
import {
  PolicySettings,
  QueuedZernioRequest,
  ZernioAccountMetadata,
  loadPolicySettings,
  savePolicySettings,
} from '../lib/indexedDbStore';
import {
  ZernioConnectionStatus,
  getQueuedRequests,
  removeQueuedRequest,
  zernio_list_accounts,
  zernio_verify_connection,
} from '../lib/zernioClient';

interface ZernioSettingsModalProps {
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

export function ZernioSettingsModal({
  open,
  onClose,
  onUpdated,
}: ZernioSettingsModalProps) {
  const [tokenInput, setTokenInput] = useState('');
  const [tokenSaved, setTokenSaved] = useState(hasStoredToken());
  const [settings, setSettings] = useState<PolicySettings | null>(null);
  const [connStatus, setConnStatus] = useState<ZernioConnectionStatus | null>(null);
  const [accounts, setAccounts] = useState<ZernioAccountMetadata[]>([]);
  const [queue, setQueue] = useState<QueuedZernioRequest[]>([]);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    void refreshAll();
  }, [open]);

  async function refreshAll() {
    setTokenSaved(hasStoredToken());
    const [st, accs, q, status] = await Promise.all([
      loadPolicySettings(),
      zernio_list_accounts(false),
      getQueuedRequests(),
      zernio_verify_connection(),
    ]);
    setSettings(st);
    setAccounts(accs);
    setQueue(q);
    setConnStatus(status);
  }

  async function handleSaveToken() {
    setBusy(true);
    try {
      await saveEncryptedToken(tokenInput);
      setTokenInput('');
      setTokenSaved(hasStoredToken());
      setFeedback('Token criptografado via Web Crypto API (AES-GCM) e salvo localmente.');
      await refreshAll();
      onUpdated();
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Erro ao criptografar token.');
    } finally {
      setBusy(false);
    }
  }

  async function handleClearToken() {
    clearEncryptedToken();
    setTokenSaved(false);
    setFeedback('Token removido do armazenamento local.');
    await refreshAll();
    onUpdated();
  }

  async function handleSyncAccounts() {
    setBusy(true);
    try {
      const synced = await zernio_list_accounts(true);
      setAccounts(synced);
      const status = await zernio_verify_connection();
      setConnStatus(status);
      setFeedback(`${synced.length} conta(s) sincronizada(s) no IndexedDB.`);
      onUpdated();
    } finally {
      setBusy(false);
    }
  }

  async function handleSavePolicy(partial: Partial<Omit<PolicySettings, 'id'>>) {
    const updated = await savePolicySettings(partial);
    setSettings(updated);
    onUpdated();
  }

  async function handleRemoveQueueItem(id: string) {
    await removeQueuedRequest(id);
    setQueue(await getQueuedRequests());
    onUpdated();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">
                Conector Zernio, Web Crypto &amp; Políticas Locais
              </h2>
              <p className="text-xs text-zinc-400">
                Pedido 19 · Credenciais criptografadas no navegador + cache IndexedDB
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {feedback && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{feedback}</span>
          </div>
        )}

        {/* Status de Conexão */}
        {connStatus && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
            <div className="flex items-center gap-2.5">
              {connStatus.connected ? (
                <Wifi className="h-4 w-4 text-emerald-400" />
              ) : (
                <WifiOff className="h-4 w-4 text-rose-400" />
              )}
              <div>
                <div className="text-xs font-semibold text-white">
                  {connStatus.mode === 'sandbox' ? 'Modo Sandbox Seguro' : 'Modo API Zernio Live'} ·{' '}
                  <span className="font-mono text-emerald-400">{connStatus.latencyMs}ms</span>
                </div>
                <div className="text-[11px] text-zinc-400">{connStatus.message}</div>
              </div>
            </div>
            <button
              onClick={handleSyncAccounts}
              disabled={busy}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:border-emerald-500/50 hover:text-white disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${busy ? 'animate-spin' : ''}`} />
              Sincronizar Contas
            </button>
          </div>
        )}

        {/* Web Crypto Token */}
        <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-300">
              <Shield className="h-3.5 w-3.5 text-emerald-400" />
              Zernio API Token (Criptografia AES-GCM Local)
            </h3>
            <span
              className={`rounded-full px-2.5 py-0.5 font-mono text-[10px] ${
                tokenSaved
                  ? 'bg-emerald-500/15 text-emerald-400'
                  : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              {tokenSaved ? 'Token Cifrado Ativo' : 'Sem Token (Sandbox)'}
            </span>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <input
              type="password"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="Cole seu Zernio Bearer Token (opcional para Sandbox)..."
              className="flex-1 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 font-mono text-xs text-white outline-none focus:border-emerald-500"
            />
            <button
              onClick={handleSaveToken}
              disabled={!tokenInput.trim() || busy}
              className="rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-zinc-950 hover:bg-emerald-400 disabled:opacity-40"
            >
              Criptografar &amp; Salvar
            </button>
            {tokenSaved && (
              <button
                onClick={handleClearToken}
                className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-300 hover:bg-rose-500/20"
              >
                Limpar
              </button>
            )}
          </div>
        </div>

        {/* Policy Engine Settings */}
        {settings && (
          <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
              Travas do Client-Side Policy Engine
            </h3>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-[11px] text-zinc-400">
                  Piso / Conjunto (R$/dia)
                </label>
                <input
                  type="number"
                  min={5}
                  value={settings.minDailyBudgetPerSet}
                  onChange={(e) =>
                    handleSavePolicy({ minDailyBudgetPerSet: Number(e.target.value) || 10 })
                  }
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 font-mono text-xs text-white outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] text-zinc-400">
                  Teto Máximo Diário (R$)
                </label>
                <input
                  type="number"
                  min={20}
                  value={settings.maxDailyBudgetTotal}
                  onChange={(e) =>
                    handleSavePolicy({ maxDailyBudgetTotal: Number(e.target.value) || 500 })
                  }
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 font-mono text-xs text-white outline-none focus:border-emerald-500"
                />
              </div>
              <div className="flex items-end">
                <label className="flex w-full cursor-pointer items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs text-zinc-200">
                  <span>Modo Simulação</span>
                  <input
                    type="checkbox"
                    checked={settings.simulationMode}
                    onChange={(e) => handleSavePolicy({ simulationMode: e.target.checked })}
                    className="h-4 w-4 accent-emerald-500"
                  />
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Contas Sincronizadas */}
        <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
          <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-300">
            <Database className="h-3.5 w-3.5 text-emerald-400" />
            Metadados em Cache (IndexedDB · {accounts.length} contas)
          </h3>
          <div className="mt-3 space-y-2">
            {accounts.map((acc) => (
              <div
                key={acc.id}
                className="rounded-lg border border-zinc-800 bg-zinc-950/80 p-3 text-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold text-white">{acc.name}</span>
                  <span className="font-mono text-[11px] text-emerald-400">{acc.id}</span>
                </div>
                <div className="mt-1.5 grid grid-cols-1 gap-1 text-[11px] text-zinc-400 sm:grid-cols-3">
                  <div>Pixel: <span className="font-mono text-zinc-300">{acc.pixelId}</span></div>
                  <div>IG: <span className="font-mono text-zinc-300">{acc.igHandle}</span></div>
                  <div>Públicos: <span className="font-mono text-zinc-300">{acc.customAudiences.length} mapeados</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Fila Resiliente Offline */}
        <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
            Fila de Resiliência Offline ({queue.length} pendente{queue.length === 1 ? '' : 's'})
          </h3>
          {queue.length === 0 ? (
            <p className="mt-2 text-xs text-zinc-500">
              Nenhuma requisição retida. Todas as operações estão sincronizadas.
            </p>
          ) : (
            <div className="mt-2 space-y-2">
              {queue.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs"
                >
                  <div>
                    <div className="font-mono text-amber-300">{item.endpoint}</div>
                    <div className="text-[11px] text-zinc-400">{item.lastError}</div>
                  </div>
                  <button
                    onClick={() => handleRemoveQueueItem(item.id)}
                    className="rounded p-1 text-zinc-400 hover:text-rose-400"
                    title="Descartar da fila"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
