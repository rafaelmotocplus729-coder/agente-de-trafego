/**
 * Pedido 19: Runtime de Skills Nativas no Navegador
 * Orquestrador modular em TypeScript que executa regras analíticas, cálculos de funil
 * e validações taxonômicas em Web Worker (com fallback transparente na main thread).
 */

import { hasStoredToken, loadDecryptedToken } from './cryptoStore';
import { buildAudienceLadder, AudienceInputNode } from './audienceEngine';
import { generateBriefing, scriptVideo, CreativeBriefInput } from './creativeEngine';
import { generatePlan, PlannerInput } from './trafficEngine';
import type { SkillWorkerRequest, SkillWorkerResponse } from '../workers/skillWorker';

export interface RuntimeStatus {
  initialized: boolean;
  workerActive: boolean;
  hasEncryptedToken: boolean;
  skillsLoaded: string[];
  lastExecutionMs: number;
}

let workerInstance: Worker | null = null;
let runtimeState: RuntimeStatus = {
  initialized: false,
  workerActive: false,
  hasEncryptedToken: false,
  skillsLoaded: [
    'traffic-planner',
    'creative-director',
    'audience-ladder',
    'policy-engine',
    'zernio-connector',
  ],
  lastExecutionMs: 0,
};

export async function initRuntime(): Promise<RuntimeStatus> {
  if (typeof Worker !== 'undefined' && !workerInstance) {
    try {
      workerInstance = new Worker(new URL('../workers/skillWorker.ts', import.meta.url), {
        type: 'module',
      });
    } catch {
      workerInstance = null;
    }
  }

  const tokenOk = await loadTokens();
  runtimeState = {
    ...runtimeState,
    initialized: true,
    workerActive: Boolean(workerInstance),
    hasEncryptedToken: tokenOk,
  };
  return runtimeState;
}

export async function loadTokens(): Promise<boolean> {
  if (!hasStoredToken()) return false;
  const decrypted = await loadDecryptedToken();
  return Boolean(decrypted);
}

export function getRuntimeStatus(): RuntimeStatus {
  return runtimeState;
}

export async function executeSkill<T>(
  skill: SkillWorkerRequest['skill'],
  payload: unknown
): Promise<{ result: T; durationMs: number; viaWorker: boolean }> {
  const start = performance.now();

  if (workerInstance) {
    try {
      const id = `sk_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const response = await new Promise<SkillWorkerResponse>((resolve, reject) => {
        if (!workerInstance) {
          reject(new Error('Worker não inicializado'));
          return;
        }
        const onMsg = (ev: MessageEvent<SkillWorkerResponse>) => {
          if (ev.data.id === id) {
            workerInstance?.removeEventListener('message', onMsg);
            resolve(ev.data);
          }
        };
        workerInstance.addEventListener('message', onMsg);
        workerInstance.postMessage({ id, skill, payload } as SkillWorkerRequest);
      });

      if (response.ok) {
        runtimeState.lastExecutionMs = response.durationMs;
        return {
          result: response.result as T,
          durationMs: response.durationMs,
          viaWorker: true,
        };
      }
    } catch {
      // Fallback para execução local síncrona
    }
  }

  let result: unknown;
  switch (skill) {
    case 'plan_campaign':
      result = generatePlan(payload as PlannerInput);
      break;
    case 'generate_briefing':
      result = generateBriefing(payload as CreativeBriefInput);
      break;
    case 'script_video':
      result = scriptVideo(payload as CreativeBriefInput);
      break;
    case 'build_audience_ladder':
      result = buildAudienceLadder(payload as AudienceInputNode[]);
      break;
  }

  const durationMs = Math.max(1, Math.round(performance.now() - start));
  runtimeState.lastExecutionMs = durationMs;
  return { result: result as T, durationMs, viaWorker: false };
}
