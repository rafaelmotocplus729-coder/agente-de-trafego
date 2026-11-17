/**
 * Pedido 22: Motor de Segmentação Dinâmica e Escada de Exclusão de Públicos (00 a 05)
 * Regra de ouro: nenhuma pessoa é impactada simultaneamente por temperaturas diferentes.
 * - Critério de União (Condensação): públicos quentes < 10.000 usuários ou orçamento < R$ 10/dia
 *   são consolidados em um único conjunto de remarketing agrupado.
 * - Critério de Separação: públicos frios > 500.000 usuários são mantidos estritamente isolados.
 */

export type LadderLevelCode = '00' | '01' | '02' | '03' | '04' | '05';

export interface AudienceInputNode {
  level: LadderLevelCode;
  label: string;
  temperature: 'Super Quente' | 'Quente' | 'Morno' | 'Frio Qualificado' | 'Frio Interesse' | 'Frio Aberto';
  sourceDescription: string;
  windowDays: number;
  estimatedSize: number;
  allocatedBudget: number;
  enabled: boolean;
}

export interface LadderAdSetResult {
  id: string;
  levelTag: string;
  includedLevels: LadderLevelCode[];
  adSetName: string;
  temperature: string;
  estimatedSize: number;
  dailyBudget: number;
  exclusions: string[];
  ruleApplied: 'CONDENSADO (<10k ou <R$10/dia)' | 'ISOLADO (>500k)' | 'PADRÃO';
  rationale: string;
}

export const DEFAULT_AUDIENCE_NODES: AudienceInputNode[] = [
  {
    level: '00',
    label: 'Checkout Iniciado & Carrinho',
    temperature: 'Super Quente',
    sourceDescription: 'InitiateCheckout + AddToCart',
    windowDays: 7,
    estimatedSize: 1850,
    allocatedBudget: 15,
    enabled: true,
  },
  {
    level: '01',
    label: 'Envolvimento IG / Visitas Site',
    temperature: 'Quente',
    sourceDescription: 'IG Engagers + PageView',
    windowDays: 30,
    estimatedSize: 6400,
    allocatedBudget: 15,
    enabled: true,
  },
  {
    level: '02',
    label: 'Video View 75% / Engajamento 365D',
    temperature: 'Morno',
    sourceDescription: 'VV75% 60D + IG 365D',
    windowDays: 60,
    estimatedSize: 28500,
    allocatedBudget: 20,
    enabled: true,
  },
  {
    level: '03',
    label: 'Lookalike 1% Compradores',
    temperature: 'Frio Qualificado',
    sourceDescription: 'LAL 1% Purchase 180D',
    windowDays: 180,
    estimatedSize: 1450000,
    allocatedBudget: 35,
    enabled: true,
  },
  {
    level: '04',
    label: 'Interesses Específicos',
    temperature: 'Frio Interesse',
    sourceDescription: 'Interesses Óbvios do Nicho',
    windowDays: 0,
    estimatedSize: 2800000,
    allocatedBudget: 35,
    enabled: true,
  },
  {
    level: '05',
    label: 'Aberto / Advantage+ (Copy)',
    temperature: 'Frio Aberto',
    sourceDescription: 'Sem interesses · Direcionado pela Copy',
    windowDays: 0,
    estimatedSize: 42000000,
    allocatedBudget: 50,
    enabled: true,
  },
];

export function buildAudienceLadder(nodes: AudienceInputNode[]): LadderAdSetResult[] {
  const active = nodes.filter((n) => n.enabled).sort((a, b) => a.level.localeCompare(b.level));

  const results: LadderAdSetResult[] = [];
  const hotLevels: LadderLevelCode[] = ['00', '01', '02'];

  const hotToCondense: AudienceInputNode[] = [];
  const standaloneHot: AudienceInputNode[] = [];
  const coldNodes: AudienceInputNode[] = [];

  for (const node of active) {
    if (hotLevels.includes(node.level)) {
      if (node.estimatedSize < 10000 || node.allocatedBudget < 10) {
        hotToCondense.push(node);
      } else {
        standaloneHot.push(node);
      }
    } else {
      coldNodes.push(node);
    }
  }

  // 1. Se houver mais de 1 público quente abaixo de 10k ou < R$10/dia, consolida em conjunto único
  if (hotToCondense.length > 1) {
    const levels = hotToCondense.map((n) => n.level);
    const totalBudget = hotToCondense.reduce((acc, n) => acc + n.allocatedBudget, 0);
    const totalSize = hotToCondense.reduce((acc, n) => acc + n.estimatedSize, 0);
    const maxWindow = Math.max(...hotToCondense.map((n) => n.windowDays));
    const levelTag = `${levels[0]}-${levels[levels.length - 1]}-RMKT-AGRUPADO`;

    results.push({
      id: `ladder_${levels.join('_')}`,
      levelTag,
      includedLevels: levels,
      adSetName: `[${levelTag}]_[${hotToCondense.map((n) => n.label.split(' ')[0].toUpperCase()).join('+')}]_[${maxWindow}D]_[EXC-COMPRADORES]`,
      temperature: 'Remarketing Consolidado (Quente)',
      estimatedSize: totalSize,
      dailyBudget: totalBudget,
      exclusions: ['Compradores 180D'],
      ruleApplied: 'CONDENSADO (<10k ou <R$10/dia)',
      rationale: `${hotToCondense.length} públicos quentes (< 10.000 pessoas ou < R$ 10/dia) unidos automaticamente para evitar fragmentação de entrega.`,
    });
  } else {
    standaloneHot.push(...hotToCondense);
  }

  // 2. Públicos quentes individuais
  const allActiveHot = [...standaloneHot].sort((a, b) => a.level.localeCompare(b.level));
  for (const node of allActiveHot) {
    const priorLevels = active
      .filter((other) => other.level < node.level)
      .map((other) => `Nível ${other.level} (${other.label})`);
    const excTag =
      priorLevels.length > 0
        ? `EXC-${active
            .filter((o) => o.level < node.level)
            .map((o) => o.level)
            .join('-')}`
        : 'EXC-COMPRADORES';

    results.push({
      id: `ladder_${node.level}`,
      levelTag: `${node.level}-${node.temperature.toUpperCase().replace(/\s+/g, '-')}`,
      includedLevels: [node.level],
      adSetName: `[${node.level}-${node.temperature.toUpperCase().replace(/\s+/g, '-')}]_[${node.label.slice(0, 16).toUpperCase().replace(/\s+/g, '-')}]_[${node.windowDays}D]_[${excTag}]`,
      temperature: node.temperature,
      estimatedSize: node.estimatedSize,
      dailyBudget: node.allocatedBudget,
      exclusions: priorLevels.length > 0 ? priorLevels : ['Compradores 180D'],
      ruleApplied: 'PADRÃO',
      rationale:
        priorLevels.length > 0
          ? `Exclui estritamente os níveis anteriores (${priorLevels.map((p) => p.slice(0, 8)).join(', ')}) para impedir sobreposição.`
          : 'Topo máximo da escada de intenção (exclui apenas compradores recentes).',
    });
  }

  // 3. Públicos frios (> 500k estritamente isolados)
  for (const node of coldNodes) {
    const priorLevels = active
      .filter((other) => other.level < node.level)
      .map((other) => `Nível ${other.level} (${other.label})`);
    const excTag =
      priorLevels.length > 0
        ? `EXC-${active
            .filter((o) => o.level < node.level)
            .map((o) => o.level)
            .join('-')}`
        : 'EXC-00-01-02';

    const isLargeCold = node.estimatedSize > 500000;

    results.push({
      id: `ladder_${node.level}`,
      levelTag: `${node.level}-${node.temperature.toUpperCase().replace(/\s+/g, '-')}`,
      includedLevels: [node.level],
      adSetName: `[${node.level}-${node.temperature.toUpperCase().replace(/\s+/g, '-')}]_[${node.label.slice(0, 18).toUpperCase().replace(/\s+/g, '-')}]_[${node.windowDays > 0 ? `${node.windowDays}D` : 'ABERTO'}]_[${excTag}]`,
      temperature: node.temperature,
      estimatedSize: node.estimatedSize,
      dailyBudget: node.allocatedBudget,
      exclusions: priorLevels.length > 0 ? priorLevels : ['Níveis 00, 01 e 02'],
      ruleApplied: isLargeCold ? 'ISOLADO (>500k)' : 'PADRÃO',
      rationale: isLargeCold
        ? `Público frio de grande escala (${node.estimatedSize.toLocaleString('pt-BR')} pessoas) mantido estritamente isolado para leitura limpa de CPA.`
        : `Público frio com exclusão completa dos níveis quentes (${excTag}).`,
    });
  }

  return results.sort((a, b) => a.includedLevels[0].localeCompare(b.includedLevels[0]));
}
