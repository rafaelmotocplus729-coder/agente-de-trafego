/**
 * Pedido 19 & 23: Zernio Ads API Client (Browser-Native Gateway)
 * Traduz comandos estruturados em mutações na API oficial do Zernio,
 * com sincronização em IndexedDB, fila resiliente offline e trava PAUSED.
 */

import { loadDecryptedToken } from './cryptoStore';
import {
  QueuedZernioRequest,
  ZernioAccountMetadata,
  dbDelete,
  dbGetAll,
  dbPut,
  loadPolicySettings,
} from './indexedDbStore';

export interface ZernioConnectionStatus {
  connected: boolean;
  mode: 'live' | 'sandbox';
  latencyMs: number;
  message: string;
  accountsCount: number;
}

export interface ZernioDispatchPayload {
  accountId: string;
  campaignName: string;
  objective: string;
  buyingMode: 'ABO' | 'CBO';
  dailyBudget: number;
  status: 'PAUSED';
  adSets: {
    name: string;
    ladderLevel: string;
    dailyBudget: number;
    exclusions: string[];
    ads: {
      name: string;
      format: '1:1' | '4:5' | '9:16';
      destinationUrlWithUtm: string;
      hookCode: string;
    }[];
  }[];
}

export interface ZernioDispatchResult {
  ok: boolean;
  mode: 'live' | 'sandbox';
  queued: boolean;
  campaignId?: string;
  adSetIds: string[];
  adIds: string[];
  status: 'PAUSED';
  timestamp: string;
  message: string;
}

const SANDBOX_ACCOUNTS: ZernioAccountMetadata[] = [
  {
    id: 'act_29481039481',
    name: 'Conta Principal · Tráfego Pago BR',
    platform: 'meta',
    currency: 'BRL',
    timezone: 'America/Sao_Paulo',
    pixelId: 'px_994812039411',
    pixelName: 'Pixel Principal + CAPI Deduplicada',
    catalogId: 'cat_481029384',
    fbPageId: 'pg_1102938475',
    fbPageName: 'Página Oficial da Marca',
    igProfileId: 'ig_8839201928',
    igHandle: '@marca.oficial',
    customAudiences: [
      { id: 'aud_00', name: 'Checkout Iniciado & Carrinho 7D', level: '00', size: 1850 },
      { id: 'aud_01', name: 'Envolvimento Instagram 30D + Site', level: '01', size: 6400 },
      { id: 'aud_02', name: 'Video View 75% 60D + Envolvimento 365D', level: '02', size: 28500 },
      { id: 'aud_03', name: 'Lookalike 1% Compradores 180D', level: '03', size: 1450000 },
      { id: 'aud_04', name: 'Interesses Específicos Validados', level: '04', size: 2800000 },
      { id: 'aud_05', name: 'Aberto / Advantage+ Segmentado pela Copy', level: '05', size: 42000000 },
    ],
    syncedAt: new Date().toISOString(),
  },
  {
    id: 'act_77492018374',
    name: 'Conta Backup · Lançamentos & Testes ABO',
    platform: 'instagram',
    currency: 'BRL',
    timezone: 'America/Sao_Paulo',
    pixelId: 'px_550192837465',
    pixelName: 'Pixel Captação & Lead CAPI',
    fbPageId: 'pg_3392019283',
    fbPageName: 'Projeto Educacional',
    igProfileId: 'ig_9920192837',
    igHandle: '@projeto.edu',
    customAudiences: [
      { id: 'aud_b00', name: 'Checkout 7D', level: '00', size: 920 },
      { id: 'aud_b01', name: 'Engajamento IG 30D', level: '01', size: 14200 },
      { id: 'aud_b02', name: 'VV 75% 60D', level: '02', size: 41000 },
      { id: 'aud_b03', name: 'LAL 1% Leads Qualificados', level: '03', size: 1450000 },
      { id: 'aud_b04', name: 'Interesses Nicho', level: '04', size: 1900000 },
      { id: 'aud_b05', name: 'Aberto Brasil 24-54', level: '05', size: 38000000 },
    ],
    syncedAt: new Date().toISOString(),
  },
];

async function zernioFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const settings = await loadPolicySettings();
  const token = await loadDecryptedToken();
  const url = `${settings.zernioBaseUrl.replace(/\/$/, '')}${endpoint}`;

  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return fetch(url, { ...options, headers });
}

export async function zernio_verify_connection(): Promise<ZernioConnectionStatus> {
  const start = performance.now();
  const settings = await loadPolicySettings();
  const token = await loadDecryptedToken();

  if (settings.simulationMode || !token) {
    const accounts = await zernio_list_accounts();
    return {
      connected: true,
      mode: 'sandbox',
      latencyMs: Math.max(12, Math.round(performance.now() - start)),
      message: token
        ? 'Modo Sandbox ativo (simulação segura sem mutações reais).'
        : 'Modo Sandbox local ativo. Configure um Zernio Token para mutações reais.',
      accountsCount: accounts.length,
    };
  }

  try {
    const res = await zernioFetch('/accounts', { method: 'GET' });
    const latencyMs = Math.round(performance.now() - start);
    if (!res.ok) {
      return {
        connected: false,
        mode: 'live',
        latencyMs,
        message: `Falha na API Zernio (HTTP ${res.status}). Verifique o token.`,
        accountsCount: 0,
      };
    }
    const data = (await res.json()) as { accounts?: unknown[] };
    return {
      connected: true,
      mode: 'live',
      latencyMs,
      message: `Conectado à API oficial do Zernio em ${latencyMs}ms.`,
      accountsCount: Array.isArray(data.accounts) ? data.accounts.length : 1,
    };
  } catch {
    return {
      connected: false,
      mode: 'live',
      latencyMs: Math.round(performance.now() - start),
      message: 'Sem conexão com o gateway Zernio. Requisições serão retidas na fila local.',
      accountsCount: 0,
    };
  }
}

export async function zernio_list_accounts(
  forceRefresh = false
): Promise<ZernioAccountMetadata[]> {
  if (!forceRefresh) {
    try {
      const cached = await dbGetAll<ZernioAccountMetadata>('accounts');
      if (cached.length > 0) return cached;
    } catch {
      // Fallback to sync
    }
  }

  const settings = await loadPolicySettings();
  const token = await loadDecryptedToken();

  if (!settings.simulationMode && token) {
    try {
      const res = await zernioFetch('/ads/accounts', { method: 'GET' });
      if (res.ok) {
        const json = (await res.json()) as { accounts?: ZernioAccountMetadata[] };
        if (Array.isArray(json.accounts) && json.accounts.length > 0) {
          for (const acc of json.accounts) {
            await dbPut('accounts', { ...acc, syncedAt: new Date().toISOString() });
          }
          return json.accounts;
        }
      }
    } catch {
      // Fallback to cached or sandbox
    }
  }

  const synced = SANDBOX_ACCOUNTS.map((acc) => ({
    ...acc,
    syncedAt: new Date().toISOString(),
  }));
  for (const acc of synced) {
    try {
      await dbPut('accounts', acc);
    } catch {
      // Ignore IndexedDB error in restricted contexts
    }
  }
  return synced;
}

export async function zernio_get_custom_audiences(accountId: string) {
  const accounts = await zernio_list_accounts();
  const found = accounts.find((a) => a.id === accountId) ?? accounts[0];
  return found?.customAudiences ?? [];
}

async function enqueueOfflineRequest(
  endpoint: string,
  payload: Record<string, unknown>,
  errorMsg: string
): Promise<QueuedZernioRequest> {
  const item: QueuedZernioRequest = {
    id: `req_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    endpoint,
    method: 'POST',
    payload,
    status: 'pending',
    attempts: 1,
    lastError: errorMsg,
    createdAt: new Date().toISOString(),
  };
  await dbPut('requestQueue', item);
  return item;
}

export async function zernio_create_campaign(payload: {
  accountId: string;
  name: string;
  objective: string;
  buyingMode: 'ABO' | 'CBO';
  dailyBudget: number;
}): Promise<{ id: string; status: 'PAUSED' }> {
  const settings = await loadPolicySettings();
  const token = await loadDecryptedToken();

  const body = {
    ...payload,
    status: 'PAUSED' as const,
  };

  if (settings.simulationMode || !token) {
    return {
      id: `cmp_sim_${Date.now().toString(36)}`,
      status: 'PAUSED',
    };
  }

  const res = await zernioFetch('/ads/campaigns', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ao criar campanha no Zernio`);
  }
  const data = (await res.json()) as { id: string };
  return { id: data.id, status: 'PAUSED' };
}

export async function zernio_create_adset(payload: {
  accountId: string;
  campaignId: string;
  name: string;
  dailyBudget?: number;
  exclusions: string[];
}): Promise<{ id: string; status: 'PAUSED' }> {
  const settings = await loadPolicySettings();
  const token = await loadDecryptedToken();

  const body = { ...payload, status: 'PAUSED' as const };

  if (settings.simulationMode || !token) {
    return {
      id: `adset_sim_${Math.random().toString(36).slice(2, 8)}`,
      status: 'PAUSED',
    };
  }

  const res = await zernioFetch('/ads/adsets', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ao criar conjunto ${payload.name}`);
  }
  const data = (await res.json()) as { id: string };
  return { id: data.id, status: 'PAUSED' };
}

export async function zernio_create_ad(payload: {
  accountId: string;
  adSetId: string;
  name: string;
  destinationUrlWithUtm: string;
  format: string;
}): Promise<{ id: string; status: 'PAUSED' }> {
  const settings = await loadPolicySettings();
  const token = await loadDecryptedToken();

  const body = { ...payload, status: 'PAUSED' as const };

  if (settings.simulationMode || !token) {
    return {
      id: `ad_sim_${Math.random().toString(36).slice(2, 8)}`,
      status: 'PAUSED',
    };
  }

  const res = await zernioFetch('/ads/ads', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ao criar anúncio ${payload.name}`);
  }
  const data = (await res.json()) as { id: string };
  return { id: data.id, status: 'PAUSED' };
}

export async function dispatchCampaignToZernio(
  plan: ZernioDispatchPayload
): Promise<ZernioDispatchResult> {
  const settings = await loadPolicySettings();
  const token = await loadDecryptedToken();
  const mode: 'live' | 'sandbox' = !settings.simulationMode && token ? 'live' : 'sandbox';

  try {
    const campaign = await zernio_create_campaign({
      accountId: plan.accountId,
      name: plan.campaignName,
      objective: plan.objective,
      buyingMode: plan.buyingMode,
      dailyBudget: plan.dailyBudget,
    });

    const adSetIds: string[] = [];
    const adIds: string[] = [];

    for (const adSet of plan.adSets) {
      const createdSet = await zernio_create_adset({
        accountId: plan.accountId,
        campaignId: campaign.id,
        name: adSet.name,
        dailyBudget: plan.buyingMode === 'ABO' ? adSet.dailyBudget : undefined,
        exclusions: adSet.exclusions,
      });
      adSetIds.push(createdSet.id);

      for (const ad of adSet.ads) {
        const createdAd = await zernio_create_ad({
          accountId: plan.accountId,
          adSetId: createdSet.id,
          name: ad.name,
          destinationUrlWithUtm: ad.destinationUrlWithUtm,
          format: ad.format,
        });
        adIds.push(createdAd.id);
      }
    }

    return {
      ok: true,
      mode,
      queued: false,
      campaignId: campaign.id,
      adSetIds,
      adIds,
      status: 'PAUSED',
      timestamp: new Date().toISOString(),
      message:
        mode === 'sandbox'
          ? `Campanha simulada criada em estado PAUSED (${adSetIds.length} conjuntos, ${adIds.length} anúncios).`
          : `Campanha publicada na API do Zernio em estado PAUSED (${adSetIds.length} conjuntos, ${adIds.length} anúncios).`,
    };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Erro de rede ao conectar ao Zernio';
    await enqueueOfflineRequest(
      '/ads/dispatch',
      plan as unknown as Record<string, unknown>,
      errMsg
    );
    return {
      ok: false,
      mode,
      queued: true,
      adSetIds: [],
      adIds: [],
      status: 'PAUSED',
      timestamp: new Date().toISOString(),
      message: `Instabilidade detectada (${errMsg}). Comando retido com segurança na fila offline do IndexedDB.`,
    };
  }
}

export async function getQueuedRequests(): Promise<QueuedZernioRequest[]> {
  try {
    return await dbGetAll<QueuedZernioRequest>('requestQueue');
  } catch {
    return [];
  }
}

export async function removeQueuedRequest(id: string): Promise<void> {
  await dbDelete('requestQueue', id);
}
