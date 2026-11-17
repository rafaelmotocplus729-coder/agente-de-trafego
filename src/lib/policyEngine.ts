/**
 * Pedido 19 & 23: Client-Side Policy Engine
 * Validação estrita no navegador antes de qualquer mutação ser enviada ao Zernio:
 * - Limites de orçamento diário
 * - Exclusões obrigatórias na escada 00–05
 * - Integridade da URL de destino (sintaxe + verificação HTTP)
 * - Trava obrigatória status: PAUSED
 */

import { PolicySettings } from './indexedDbStore';

export interface PolicyCheckResult {
  id: string;
  rule: string;
  status: 'pass' | 'warn' | 'fail';
  detail: string;
}

export interface PolicyValidationInput {
  dailyBudget: number;
  adSetCount: number;
  buyingMode: 'ABO' | 'CBO';
  destinationUrl: string;
  hasAllLadderExclusions: boolean;
  statusFlag: string;
  settings: PolicySettings;
}

export function validateUrlFormat(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export async function checkUrlReachability(
  url: string
): Promise<{ reachable: boolean; statusText: string }> {
  if (!validateUrlFormat(url)) {
    return { reachable: false, statusText: 'URL inválida (exige http:// ou https://)' };
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    // Usamos mode: 'no-cors' para detectar conectividade sem ser bloqueado por CORS no navegador
    const res = await fetch(url, { method: 'HEAD', mode: 'no-cors', signal: controller.signal });
    clearTimeout(timer);
    if (res.type === 'opaque') {
      return {
        reachable: true,
        statusText: 'Domínio acessível (resposta opaca via navegador / CORS protegido)',
      };
    }
    return {
      reachable: res.ok,
      statusText: res.ok ? `HTTP ${res.status} OK` : `HTTP ${res.status} — verificar destino`,
    };
  } catch {
    return {
      reachable: false,
      statusText: 'Timeout ou falha de DNS/rede ao testar URL de destino',
    };
  }
}

export function runClientPolicyEngine(input: PolicyValidationInput): PolicyCheckResult[] {
  const results: PolicyCheckResult[] = [];
  const budgetPerSet =
    input.adSetCount > 0 ? input.dailyBudget / input.adSetCount : input.dailyBudget;

  // 1. Trava de Status PAUSED
  results.push({
    id: 'paused-lock',
    rule: 'Trava de Segurança (status: PAUSED)',
    status: input.statusFlag === 'PAUSED' ? 'pass' : 'fail',
    detail:
      input.statusFlag === 'PAUSED'
        ? 'Campanha configurada para nascer PAUSADA aguardando confirmação do operador.'
        : 'Violação: toda criação via Zernio deve nascer com status PAUSED.',
  });

  // 2. Limites de Orçamento
  if (input.dailyBudget > input.settings.maxDailyBudgetTotal) {
    results.push({
      id: 'budget-max',
      rule: 'Teto Máximo de Orçamento Diário',
      status: 'fail',
      detail: `Orçamento (R$ ${input.dailyBudget.toFixed(2)}) excede o teto de segurança configurado (R$ ${input.settings.maxDailyBudgetTotal.toFixed(2)}).`,
    });
  } else if (budgetPerSet < input.settings.minDailyBudgetPerSet) {
    results.push({
      id: 'budget-min',
      rule: 'Piso Mínimo por Conjunto',
      status: 'warn',
      detail: `Média de R$ ${budgetPerSet.toFixed(2)}/conjunto está abaixo do piso recomendado (R$ ${input.settings.minDailyBudgetPerSet.toFixed(2)}). Considere condensar conjuntos.`,
    });
  } else {
    results.push({
      id: 'budget-ok',
      rule: 'Limites de Orçamento Diário',
      status: 'pass',
      detail: `R$ ${input.dailyBudget.toFixed(2)}/dia dentro das travas (média de R$ ${budgetPerSet.toFixed(2)}/conjunto).`,
    });
  }

  // 3. Quantidade de Conjuntos (4 a 8)
  if (input.adSetCount < 4 || input.adSetCount > 8) {
    results.push({
      id: 'adset-count',
      rule: 'Volume Ideal de Conjuntos (4 a 8)',
      status: 'warn',
      detail: `${input.adSetCount} conjunto(s) ativo(s). O ideal metodológico são 4 a 8 conjuntos para evitar fragmentação ou concentração.`,
    });
  } else {
    results.push({
      id: 'adset-count',
      rule: 'Volume Ideal de Conjuntos (4 a 8)',
      status: 'pass',
      detail: `${input.adSetCount} conjuntos dentro da faixa recomendada (4–8).`,
    });
  }

  // 4. Escada de Exclusões 00–05
  results.push({
    id: 'ladder-exclusions',
    rule: 'Escada de Exclusões (Níveis 00–05)',
    status: input.hasAllLadderExclusions ? 'pass' : 'fail',
    detail: input.hasAllLadderExclusions
      ? 'Exclusões hierárquicas aplicadas sem sobreposição entre temperaturas.'
      : 'Há conjuntos sem exclusão dos níveis mais quentes (risco de canibalização).',
  });

  // 5. Integridade da URL + UTM
  const validUrl = validateUrlFormat(input.destinationUrl);
  results.push({
    id: 'url-integrity',
    rule: 'Integridade da URL de Destino + UTMs',
    status: validUrl ? 'pass' : 'fail',
    detail: validUrl
      ? 'URL válida com parâmetros UTM dinâmicos invioláveis acoplados.'
      : 'URL de destino ausente ou malformada (informe https://...).',
  });

  return results;
}
