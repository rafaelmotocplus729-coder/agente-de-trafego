/**
 * Pedido 19: Banco de Dados Local no Navegador (IndexedDB)
 * Persistência offline de metadados de contas Zernio, rascunhos de campanhas,
 * biblioteca de roteiros/briefings criativos, histórico de métricas e fila resiliente.
 */

const DB_NAME = 'agente_trafego_zernio_db';
const DB_VERSION = 1;

export type StoreName =
  | 'accounts'
  | 'drafts'
  | 'creatives'
  | 'metricsHistory'
  | 'requestQueue'
  | 'settings';

export interface ZernioAccountMetadata {
  id: string;
  name: string;
  platform: 'meta' | 'instagram' | 'google';
  currency: string;
  timezone: string;
  pixelId: string;
  pixelName: string;
  catalogId?: string;
  fbPageId: string;
  fbPageName: string;
  igProfileId: string;
  igHandle: string;
  customAudiences: {
    id: string;
    name: string;
    level: '00' | '01' | '02' | '03' | '04' | '05';
    size: number;
  }[];
  syncedAt: string;
}

export interface QueuedZernioRequest {
  id: string;
  endpoint: string;
  method: 'POST' | 'GET';
  payload: Record<string, unknown>;
  status: 'pending' | 'retrying' | 'failed' | 'completed';
  attempts: number;
  lastError?: string;
  createdAt: string;
}

export interface PolicySettings {
  id: 'default';
  minDailyBudgetPerSet: number;
  maxDailyBudgetTotal: number;
  zernioBaseUrl: string;
  simulationMode: boolean;
}

const DEFAULT_SETTINGS: PolicySettings = {
  id: 'default',
  minDailyBudgetPerSet: 10,
  maxDailyBudgetTotal: 2500,
  zernioBaseUrl: 'https://zernio.com/api/v1',
  simulationMode: true,
};

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB não suportado neste navegador.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      const stores: StoreName[] = [
        'accounts',
        'drafts',
        'creatives',
        'metricsHistory',
        'requestQueue',
        'settings',
      ];
      for (const store of stores) {
        if (!db.objectStoreNames.contains(store)) {
          db.createObjectStore(store, { keyPath: 'id' });
        }
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function dbPut<T extends { id: string }>(
  storeName: StoreName,
  value: T
): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).put(value);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

export async function dbGetAll<T>(storeName: StoreName): Promise<T[]> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const req = tx.objectStore(storeName).getAll();
    req.onsuccess = () => {
      db.close();
      resolve((req.result || []) as T[]);
    };
    req.onerror = () => {
      db.close();
      reject(req.error);
    };
  });
}

export async function dbGet<T>(storeName: StoreName, id: string): Promise<T | null> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const req = tx.objectStore(storeName).get(id);
    req.onsuccess = () => {
      db.close();
      resolve((req.result as T) ?? null);
    };
    req.onerror = () => {
      db.close();
      reject(req.error);
    };
  });
}

export async function dbDelete(storeName: StoreName, id: string): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).delete(id);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

export async function loadPolicySettings(): Promise<PolicySettings> {
  try {
    const stored = await dbGet<PolicySettings>('settings', 'default');
    return stored ?? DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function savePolicySettings(
  partial: Partial<Omit<PolicySettings, 'id'>>
): Promise<PolicySettings> {
  const current = await loadPolicySettings();
  const next: PolicySettings = { ...current, ...partial, id: 'default' };
  await dbPut('settings', next);
  return next;
}
