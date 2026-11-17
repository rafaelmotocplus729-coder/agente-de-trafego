/**
 * Pedido 23: Automação Total de Nomenclatura Estruturada e Rastreamento UTM Inviolável
 */

export function sanitizeSlug(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function buildCampaignName(params: {
  objectiveCode: string; // ex: CONV-VENDAS, MSG-WPP, CAP-LEADS
  channel: string; // ex: INSTAGRAM, META
  strategy: 'ABO' | 'CBO';
  actionName: string;
}): string {
  const obj = sanitizeSlug(params.objectiveCode || 'CONV-VENDAS');
  const ch = sanitizeSlug(params.channel || 'INSTAGRAM');
  const strat = params.strategy;
  const act = sanitizeSlug(params.actionName || 'OFERTA-PRINCIPAL');
  return `[${obj}]_[${ch}]_[${strat}]_[${act}]`;
}

export function buildAdSetName(params: {
  ladderLevel: string; // ex: 01-QUENTE
  audienceId: string; // ex: IG-ENVOLVIMENTO
  windowDays: string; // ex: 30D
  exclusions: string; // ex: EXC-00
}): string {
  return `[${sanitizeSlug(params.ladderLevel)}]_[${sanitizeSlug(params.audienceId)}]_[${sanitizeSlug(params.windowDays)}]_[${sanitizeSlug(params.exclusions)}]`;
}

export function buildAdName(params: {
  adCode: string; // ex: AD01
  format: '1:1' | '4:5' | '9:16';
  hookTag: string; // ex: DOR-TEMPO
  copyVariant: string; // ex: CP01-TT01
}): string {
  const fmt = params.format === '1:1' ? 'IMG-1X1' : params.format === '4:5' ? 'IMG-4X5' : 'VID-9X16';
  return `[${sanitizeSlug(params.adCode)}]_[${fmt}]_[${sanitizeSlug(params.hookTag)}]_[${sanitizeSlug(params.copyVariant)}]`;
}

export const INVIOLABLE_UTM_PARAMS =
  'utm_source=instagram&utm_medium=cpc&utm_campaign={{campaign.name}}&utm_content={{adset.name}}&utm_term={{ad.name}}';

export function injectDynamicUtms(baseUrl: string): string {
  const trimmed = baseUrl.trim();
  if (!trimmed) return '';

  // Remove parâmetros UTM anteriores se existirem para evitar duplicação
  const [cleanBase, existingQuery] = trimmed.split('?');
  const keptParams = (existingQuery || '')
    .split('&')
    .filter((p) => p && !p.toLowerCase().startsWith('utm_'));

  const queryPrefix = keptParams.length > 0 ? `?${keptParams.join('&')}&` : '?';
  return `${cleanBase}${queryPrefix}${INVIOLABLE_UTM_PARAMS}`;
}
