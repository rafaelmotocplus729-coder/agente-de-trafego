/**
 * Pedido 24: Documentação Técnica Integrada e Central de Aprendizagem de Tráfego
 * Banco de conhecimento 100% local (sem chamadas externas):
 * - Glossário Dinâmico de Métricas e Termos (com alertas e benchmarks)
 * - Guias Metodológicos Embutidos (Pixel/CAPI, Cores & Centavos, Checklist 5 Etapas)
 */

export interface GlossaryTerm {
  id: string;
  term: string;
  shortLabel: string;
  category: 'entrega' | 'criativo' | 'conversao' | 'escala';
  summary: string;
  benchmark: string;
  alertRule: string;
}

export interface MethodologicalGuide {
  id: string;
  title: string;
  subtitle: string;
  steps: {
    stepTitle: string;
    detail: string;
    tip?: string;
  }[];
}

export const GLOSSARY_TERMS: GlossaryTerm[] = [
  {
    id: 'cpm',
    term: 'CPM (Custo por Mil Impressões)',
    shortLabel: 'Termômetro de entrega',
    category: 'entrega',
    summary:
      'Quanto você paga para o anúncio aparecer 1.000 vezes. Reflete diretamente a concorrência do leilão, o tamanho do público e a pontuação de qualidade do criativo.',
    benchmark: 'BR 11/2026: R$ 15 a R$ 45 (Local/Info) · R$ 18 a R$ 55 (E-commerce)',
    alertRule:
      'CPM disparando acima de R$ 65 geralmente indica público muito pequeno (< 10k) ou criativo com rejeição/baixa relevância no leilão.',
  },
  {
    id: 'ctr',
    term: 'CTR no Link (Taxa de Cliques)',
    shortLabel: 'Atratividade do anúncio',
    category: 'criativo',
    summary:
      'Percentual de impressões que resultaram em clique no link de destino. Mede se a combinação de gancho visual, promessa e CTA despertou curiosidade real.',
    benchmark: 'Saudável: ≥ 1,0% (Ideal ≥ 1,5% em públicos frios)',
    alertRule:
      'Taxas abaixo de 1,0% sinalizam perda de interesse no gancho ou imagem genérica demais para interromper a rolagem.',
  },
  {
    id: 'hook-rate',
    term: 'Hook Rate (Taxa de Gancho 3s)',
    shortLabel: 'Retenção inicial (0–3s)',
    category: 'criativo',
    summary:
      'Calculado como (Visualizações de 3s ÷ Impressões) × 100. Mostra quantas pessoas realmente pararam o dedo nos 3 primeiros segundos do vídeo.',
    benchmark: 'Meta mínima: ≥ 25% (Excelente ≥ 35%)',
    alertRule:
      'Abaixo de 20%: não descarte o vídeo inteiro — regrave apenas 3 novas aberturas de 3 segundos mantendo o mesmo corpo.',
  },
  {
    id: 'hold-rate',
    term: 'Hold Rate (Taxa de Retenção ThruPlay)',
    shortLabel: 'Força do meio do vídeo',
    category: 'criativo',
    summary:
      'Calculado como (ThruPlays ÷ Visualizações de 3s) × 100. Revela se o desenvolvimento do vídeo segura a atenção até a oferta e o CTA.',
    benchmark: 'Meta mínima: ≥ 25% (ou ≥ 15% em vídeos > 45s)',
    alertRule:
      'CTR bom + Hold Rate baixo (< 25%) significa que a abertura prometeu bem, mas o corpo está lento ou sem cortes de respiro a cada 3s.',
  },
  {
    id: 'frequency',
    term: 'Frequência e Saturação',
    shortLabel: 'Controle de fadiga',
    category: 'escala',
    summary:
      'Número médio de vezes que a mesma pessoa viu seu anúncio na janela analisada. Em públicos frios, frequência alta corrói o CTR e encarece o CPA.',
    benchmark: 'Frio: 1,2 a 2,8 · Remarketing Quente: até 6,0',
    alertRule:
      'ALERTA DE FADIGA: Ultrapassou 3,5 em públicos frios → rotacione novos conceitos criativos imediatamente antes que o CPA exploda.',
  },
  {
    id: 'cpa',
    term: 'CPA (Custo por Aquisição / Resultado)',
    shortLabel: 'Custo unitário da meta',
    category: 'conversao',
    summary:
      'Investimento total dividido pelo número de resultados (compra, lead ou conversa). Deve sempre ser comparado ao CPA de Equilíbrio e ao CPA Alvo.',
    benchmark: 'Regra de corte: pausar se gastar ≥ 2× o CPA Alvo sem resultado',
    alertRule:
      'Nunca pause antes de atingir 1× a 2× o teto alvo ou antes de completar 72 horas da fase de aprendizado.',
  },
  {
    id: 'emq',
    term: 'EMQ (Event Match Quality)',
    shortLabel: 'Qualidade de correspondência CAPI',
    category: 'conversao',
    summary:
      'Nota de 0 a 10 da Meta para a qualidade dos dados enviados via API de Conversões (e-mail, telefone, fbp, fbc, IP, User-Agent) com deduplicação via event_id.',
    benchmark: 'Ideal: ≥ 7,0 para Purchase e ≥ 6,0 para Lead',
    alertRule:
      'EMQ abaixo de 5,0 faz o algoritmo perder atribuição e otimizar no escuro. Envie parâmetros hashed (SHA-256) no servidor.',
  },
];

export const METHODOLOGICAL_GUIDES: MethodologicalGuide[] = [
  {
    id: 'pixel-capi',
    title: '1. Guia de Configuração e Validação de Pixel e CAPI',
    subtitle: 'Eventos padrão, deduplicação obrigatória e Event Match Quality (EMQ)',
    steps: [
      {
        stepTitle: 'Etapa 1 · Eventos Obrigatórios do Funil',
        detail:
          'Configure PageView em todas as páginas, ViewContent na página de oferta, InitiateCheckout ao abrir o checkout, Lead no envio de formulário e Purchase exclusivamente na página de obrigado/webhook confirmado.',
        tip: 'Nunca dispare Purchase no clique do botão de compra — apenas após confirmação real.',
      },
      {
        stepTitle: 'Etapa 2 · Deduplicação Pixel + CAPI (event_id)',
        detail:
          'Todo evento disparado simultaneamente no navegador (Pixel) e no servidor (Conversions API) precisa compartilhar exatamente o mesmo `event_name` e `event_id` único por transação.',
        tip: 'No Gerenciador de Eventos, valide se a coluna "Deduplicado" está ativa sem contagem dupla.',
      },
      {
        stepTitle: 'Etapa 3 · Elevação de EMQ (≥ 7,0)',
        detail:
          'Envie `em` (e-mail), `ph` (telefone com DDI 55), `fn`/`ln` em SHA-256 além dos cookies `_fbp` e `_fbc` intactos.',
      },
    ],
  },
  {
    id: 'cores-centavos',
    title: '2. Manual do Sistema de Cores e Centavos',
    subtitle: 'Protocolo cirúrgico de ajuste de verba (+20% / -20%) com rastreabilidade nos centavos',
    steps: [
      {
        stepTitle: 'Regra dos Centavos Marcadores',
        detail:
          'Use os centavos do orçamento diário para identificar a rodada de escala sem precisar abrir o histórico: .01 = base inicial, .03 = +20% (1ª escala), .05 = +20% (2ª escala), .07 = redução cirúrgica (-20%).',
        tip: 'Ex.: Conjunto em R$ 50,01 que venceu após 72h sobe para R$ 60,03 (+20%).',
      },
      {
        stepTitle: 'Regra de Ouro das 72h e +20%',
        detail:
          'Nunca altere o orçamento antes de 72 horas contínuas e nunca aumente mais que 20% a cada 3–4 dias no mesmo conjunto, evitando resetar a fase de aprendizado.',
      },
      {
        stepTitle: 'Código de Cores Operacional',
        detail:
          'VERDE (Escalar): CPR ≤ Alvo com ≥ 5 resultados. AMARELO (Observar): em aprendizado ou Hook < 20%. VERMELHO (Pausar): gastou ≥ 2× Teto sem resultado ou Frequência Fria > 3,5 com queda de CTR.',
      },
    ],
  },
  {
    id: 'checklist-5-etapas',
    title: '3. Checklist Pré-Publicação em 5 Etapas',
    subtitle: 'Validação obrigatória antes de tirar qualquer campanha do estado PAUSED',
    steps: [
      {
        stepTitle: '1. Verificação de Página & HTTP 200',
        detail:
          'Abra a URL final com os parâmetros UTM no celular (4G) e confirme carregamento rápido (< 3s), botão de CTA visível acima da dobra e Pixel Helper disparando PageView.',
      },
      {
        stepTitle: '2. Auditoria da Escada de Exclusões (00–05)',
        detail:
          'Confirme que nenhum conjunto frio está atingindo compradores ou envolvidos recentes e que públicos quentes < 10.000 estão condensados.',
      },
      {
        stepTitle: '3. Conferência de Formatos & Safe Zone 250px',
        detail:
          'Verifique se o anúncio tem as 3 versões (1:1, 4:5 e 9:16) e se no 9:16 não há texto ou legenda dentro dos 250px superiores ou 250px inferiores.',
      },
      {
        stepTitle: '4. Rastreamento UTM Inviolável',
        detail:
          'Valide a presença de `utm_source=instagram&utm_medium=cpc&utm_campaign={{campaign.name}}&utm_content={{adset.name}}&utm_term={{ad.name}}` em todos os anúncios.',
      },
      {
        stepTitle: '5. Trava PAUSED e Ativação Programada',
        detail:
          'Suba via Zernio em PAUSED, revise o Sumário Executivo de custo diário e ative preferencialmente às 00:00 do dia seguinte para distribuição cheia de orçamento.',
      },
    ],
  },
];

export function searchDocs(query: string): {
  glossary: GlossaryTerm[];
  guides: MethodologicalGuide[];
} {
  const q = query.trim().toLowerCase();
  if (!q) {
    return { glossary: GLOSSARY_TERMS, guides: METHODOLOGICAL_GUIDES };
  }

  const glossary = GLOSSARY_TERMS.filter(
    (g) =>
      g.term.toLowerCase().includes(q) ||
      g.summary.toLowerCase().includes(q) ||
      g.alertRule.toLowerCase().includes(q) ||
      g.shortLabel.toLowerCase().includes(q)
  );

  const guides = METHODOLOGICAL_GUIDES.filter(
    (guide) =>
      guide.title.toLowerCase().includes(q) ||
      guide.subtitle.toLowerCase().includes(q) ||
      guide.steps.some(
        (s) =>
          s.stepTitle.toLowerCase().includes(q) ||
          s.detail.toLowerCase().includes(q) ||
          (s.tip && s.tip.toLowerCase().includes(q))
      )
  );

  return { glossary, guides };
}
