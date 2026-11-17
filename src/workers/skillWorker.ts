import { buildAudienceLadder, AudienceInputNode } from '../lib/audienceEngine';
import { generateBriefing, scriptVideo, CreativeBriefInput } from '../lib/creativeEngine';
import { generatePlan, PlannerInput } from '../lib/trafficEngine';

export type SkillWorkerRequest =
  | { id: string; skill: 'plan_campaign'; payload: PlannerInput }
  | { id: string; skill: 'generate_briefing'; payload: CreativeBriefInput }
  | { id: string; skill: 'script_video'; payload: CreativeBriefInput }
  | { id: string; skill: 'build_audience_ladder'; payload: AudienceInputNode[] };

export interface SkillWorkerResponse {
  id: string;
  ok: boolean;
  durationMs: number;
  result?: unknown;
  error?: string;
}

self.onmessage = (event: MessageEvent<SkillWorkerRequest>) => {
  const start = performance.now();
  const { id, skill, payload } = event.data;

  try {
    let result: unknown;
    switch (skill) {
      case 'plan_campaign':
        result = generatePlan(payload);
        break;
      case 'generate_briefing':
        result = generateBriefing(payload);
        break;
      case 'script_video':
        result = scriptVideo(payload);
        break;
      case 'build_audience_ladder':
        result = buildAudienceLadder(payload);
        break;
    }

    const res: SkillWorkerResponse = {
      id,
      ok: true,
      durationMs: Math.round(performance.now() - start),
      result,
    };
    self.postMessage(res);
  } catch (err) {
    const res: SkillWorkerResponse = {
      id,
      ok: false,
      durationMs: Math.round(performance.now() - start),
      error: err instanceof Error ? err.message : 'Erro no Web Worker',
    };
    self.postMessage(res);
  }
};
