export type BusinessPath = 'local' | 'infoproduto' | 'ecommerce' | 'lancamento';

export interface PlannerInput {
  path: BusinessPath;
  businessName: string;
  productName: string;
  ticket: number;
  marginPct: number; // 0-100
  dailyBudget: number;
  creativesCount: number;
  alreadyRunsAds: boolean;
  // Path-specific
  bumpRatePct: number; // infoproduto conservative 15%
  bumpTicket: number;
  convRatePct: number; // local conversa->venda 30%, lancamento lead->venda 2%
  city: string;
  radiusKm: number;
  launchGoalSales: number;
  hasCatalog: boolean;
  isBlackFriday: boolean;
}

export interface CampaignPlan {
  header: string;
  objectiveLine: string;
  budgetMathLine: string;
  cpaEquilibrio: number;
  cpaAlvo: number;
  roasEquilibrio: number;
  tetoUnidade: number;
  unidadeLabel: string;
  budgetWarning: string | null;
  naming: {
    campaignTest: string;
    campaignScale: string | null;
    adSetPattern: string;
    adPattern: string;
  };
  structure: {
    title: string;
    subtitle: string;
    audience: string;
    exclusions: string;
    sets: { name: string; budgetPerDay: number; note: string }[];
  }[];
  benchmarks: {
    cpm: string;
    ctr: string;
    resultCost: string;
  };
  cutAndScaleRules: string[];
  weeks: { week: string; focus: string }[];
  checklist: string[];
  zernioPlanJson: Record<string, unknown>;
}

export const PATH_META: Record<
  BusinessPath,
  {
    label: string;
    shortDesc: string;
    badge: string;
    defaultTicket: number;
    defaultMargin: number;
    defaultBudget: number;
    defaultConvRate: number;
  }
> = {
  local: {
    label: 'Negócio Local',
    shortDesc: 'Pino no mapa + raio, foco em conversas no WhatsApp',
    badge: 'WhatsApp · Raio',
    defaultTicket: 120,
    defaultMargin: 60,
    defaultBudget: 40,
    defaultConvRate: 30,
  },
  infoproduto: {
    label: 'Infoproduto (Perpétuo)',
    shortDesc: 'Curso, mentoria ou low ticket com venda direta na página',
    badge: 'Vendas · CAPI',
    defaultTicket: 97,
    defaultMargin: 75,
    defaultBudget: 100,
    defaultConvRate: 100,
  },
  ecommerce: {
    label: 'E-commerce',
    shortDesc: 'Loja virtual com catálogo dinâmico + Advantage+ Sales',
    badge: 'Catálogo · MER',
    defaultTicket: 180,
    defaultMargin: 45,
    defaultBudget: 120,
    defaultConvRate: 100,
  },
  lancamento: {
    label: 'Lançamento',
    shortDesc: 'Captação de leads → aquecimento → carrinho aberto',
    badge: '3 Fases · Leads',
    defaultTicket: 497,
    defaultMargin: 70,
    defaultBudget: 150,
    defaultConvRate: 2,
  },
};

export function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 2,
  });
}

export function generatePlan(input: PlannerInput): CampaignPlan {
  const now = new Date();
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const margin = Math.max(0.05, Math.min(0.95, input.marginPct / 100));
  const biz = input.businessName.trim() || 'Seu Negócio';

  // Receita por comprador (inclui bump em infoproduto se aplicável)
  const effectiveRevenuePerBuyer =
    input.path === 'infoproduto'
      ? input.ticket + (input.bumpTicket * Math.max(0, input.bumpRatePct)) / 100
      : input.ticket;

  const cpaEquilibrio = effectiveRevenuePerBuyer * margin;
  const cpaAlvo = cpaEquilibrio * 0.7;
  const roasEquilibrio = 1 / margin;

  let tetoUnidade = cpaAlvo;
  let unidadeLabel = 'venda (Compra)';
  if (input.path === 'local') {
    const rate = Math.max(0.05, Math.min(1, input.convRatePct / 100));
    tetoUnidade = cpaAlvo * rate;
    unidadeLabel = 'conversa no WhatsApp';
  } else if (input.path === 'lancamento') {
    const rate = Math.max(0.005, Math.min(0.3, input.convRatePct / 100));
    tetoUnidade = cpaAlvo * rate;
    unidadeLabel = 'lead captado (CPL máximo)';
  }

  let budgetWarning: string | null = null;
  if (input.path === 'local' && input.dailyBudget < 30) {
    budgetWarning = `Verba de ${formatBRL(input.dailyBudget)}/dia está abaixo do mínimo realista (R$ 30–50/dia) para gerar 3–5 conversas/dia no WhatsApp.`;
  } else if (input.path === 'infoproduto' && input.dailyBudget < 50) {
    budgetWarning = `Verba de ${formatBRL(input.dailyBudget)}/dia está apertada para validar vendas em perpétuo (recomendado: R$ 50–100/dia). Não fragmente em vários conjuntos.`;
  } else if (input.path === 'lancamento' && input.dailyBudget < 50) {
    budgetWarning = `Com ${formatBRL(input.dailyBudget)}/dia, a captação de leads fica muito limitada. Considere um lançamento semente enxuto ou acumular verba antes de iniciar.`;
  }

  const conceitos = [
    { name: 'Conceito 1 · Dor Direta', note: 'Gancho 3s atacando a dor principal + CTA claro' },
    { name: 'Conceito 2 · Prova Social', note: 'Depoimento real / prints / avaliação do Google' },
    { name: 'Conceito 3 · Demonstração / Bastidor', note: 'Produto ou serviço em uso (UGC / 9:16)' },
    { name: 'Conceito 4 · Oferta / Comparação', note: 'Antes × Depois ou oferta concreta com prazo' },
  ];
  const activeConceptsCount = Math.max(2, Math.min(4, input.creativesCount || 3));

  const structure: CampaignPlan['structure'] = [];
  let objectiveLine = '';
  let benchmarks = { cpm: 'R$ 15–30', ctr: '1,0% – 1,5%', resultCost: formatBRL(tetoUnidade) };
  let weeks: { week: string; focus: string }[] = [];
  let checklist: string[] = [];
  let campaignTest = `${ym} · VENDAS · TESTE · ${input.path.toUpperCase()}`;
  let campaignScale: string | null = `${ym} · VENDAS · ESCALA · ${input.path.toUpperCase()}`;

  const testShare = input.alreadyRunsAds ? 0.2 : 1.0;
  const scaleShare = input.alreadyRunsAds ? 0.8 : 0.0;
  const testBudgetTotal = Math.round(input.dailyBudget * testShare);
  const scaleBudgetTotal = Math.round(input.dailyBudget * scaleShare);

  if (input.path === 'local') {
    campaignTest = `${ym} · MENSAGENS · LOCAL · ${biz.toUpperCase()}`;
    campaignScale = null;
    objectiveLine = 'Engajamento → Mensagens (WhatsApp), otimizando por conversa iniciada (a venda fecha no atendimento).';
    benchmarks = {
      cpm: 'R$ 10–22 (serviços) · R$ 28–50 (saúde)',
      ctr: '1,0% – 1,8% no link',
      resultCost: '< R$ 8 excelente · R$ 8–12 saudável · > R$ 20 revisar estrutura',
    };
    structure.push({
      title: `CAMPANHA ÚNICA (ABO) — ${formatBRL(input.dailyBudget)}/dia`,
      subtitle: 'No negócio local não se cria campanha de escala separada. A escala acontece subindo +20% neste mesmo conjunto.',
      audience: `Pino em ${input.city || 'sua cidade'} + raio de ${input.radiusKm || 6} km (expansão de localização DESLIGADA)`,
      exclusions: 'Clientes recentes (se houver lista) · Falar o bairro/cidade no anúncio',
      sets: [
        {
          name: `Conjunto Único · ${input.city || 'Local'} (${input.radiusKm || 6} km)`,
          budgetPerDay: input.dailyBudget,
          note: `${activeConceptsCount} anúncios de conceitos diferentes rodando juntos (oferta local concreta + prova social + bastidor)`,
        },
      ],
    });
    weeks = [
      { week: 'Semana 1', focus: 'Rodar 3–5 conceitos sem mexer por 72h. Anotar na planilha toda conversa → agendamento.' },
      { week: 'Semana 2', focus: 'Pausar o anúncio que gastou 2× o teto sem conversa. Medir taxa real de conversa → venda.' },
      { week: 'Semana 3', focus: 'Criar novos ângulos em cima do criativo vencedor e substituir os perdedores.' },
      { week: 'Semana 4', focus: 'Se custo por agendamento estiver dentro da meta, subir +20% de verba a cada 3–4 dias.' },
    ];
    checklist = [
      'WhatsApp Business conectado e com resposta rápida (< 5 min)',
      'Expansão de localização desligada e bairro citado no texto/vídeo',
      'Planilha de conversa → agendamento → venda pronta desde o dia 1',
      'Perfil da Empresa no Google atualizado (complemento obrigatório)',
    ];
  } else if (input.path === 'infoproduto') {
    objectiveLine = 'Vendas → Compra (com Pixel + API de Conversões/CAPI no checkout Hotmart/Kiwify/Eduzz).';
    benchmarks = {
      cpm: 'R$ 18–32',
      ctr: '1,0% – 1,5% em público frio',
      resultCost: `CPA alvo ≤ ${formatBRL(cpaAlvo)} · ROAS equilíbrio ${roasEquilibrio.toFixed(2)}x`,
    };
    const canFragment = testBudgetTotal >= 60 && testBudgetTotal / activeConceptsCount >= 20;
    if (canFragment) {
      const perSet = Math.floor(testBudgetTotal / activeConceptsCount);
      structure.push({
        title: `CAMPANHA 1 · TESTE (ABO) — ${formatBRL(testBudgetTotal)}/dia`,
        subtitle: `1 conceito por conjunto, mesmo orçamento (${formatBRL(perSet)}/dia cada).`,
        audience: 'Público aberto (Advantage+ Audience)',
        exclusions: 'Compradores (180 dias)',
        sets: conceitos.slice(0, activeConceptsCount).map((c) => ({
          name: c.name,
          budgetPerDay: perSet,
          note: c.note,
        })),
      });
    } else {
      structure.push({
        title: `CAMPANHA 1 · TESTE CONCENTRADO (ABO) — ${formatBRL(testBudgetTotal)}/dia`,
        subtitle: 'Verba por conjunto ficaria abaixo de R$ 20/dia — não fragmente. Use 1 conjunto aberto com teste nativo.',
        audience: 'Público aberto (Advantage+ Audience)',
        exclusions: 'Compradores (180 dias)',
        sets: [
          {
            name: 'Conjunto Único · Aberto (3–5 conceitos)',
            budgetPerDay: testBudgetTotal,
            note: 'Teste de criativos nativo da Meta para não diluir o orçamento',
          },
        ],
      });
    }
    structure.push({
      title: `CAMPANHA 2 · ESCALA (Advantage+ Sales / CBO) — ${input.alreadyRunsAds ? formatBRL(scaleBudgetTotal) + '/dia' : 'Liga após 1º vencedor'}`,
      subtitle: 'Recebe apenas vencedores (CPA ≤ alvo com ≥ 5 compras em conta pequena), levados pelo ID do post.',
      audience: 'Advantage+ Sales (aberto) com sinal de visitantes/checkout',
      exclusions: 'Compradores (180 dias)',
      sets: [
        {
          name: 'Vencedores pelo ID do Post',
          budgetPerDay: scaleBudgetTotal || Math.round(input.dailyBudget * 0.8),
          note: 'Nunca teste criativos novos aqui dentro. Suba +20% a cada 3–4 dias.',
        },
      ],
    });
    weeks = [
      { week: 'Semana 1', focus: 'Validar Pixel + CAPI. Rodar teste ABO sem mexer nas primeiras 72h.' },
      { week: 'Semana 2', focus: 'Cortar conjuntos que gastaram 2× o CPA alvo sem venda. Analisar Hook/Hold Rate.' },
      { week: 'Semana 3', focus: 'Promover vencedores (pelo ID do post) para Advantage+ Sales (80% escala / 20% teste).' },
      { week: 'Semana 4', focus: 'Ajustar order bump/upsell e lançar nova rodada de 3–5 conceitos no teste.' },
    ];
    checklist = [
      'Pixel + API de Conversões (CAPI) com deduplicação ativa no checkout',
      'Exclusão de compradores configurada',
      'Order bump e upsell configurados (são eles que fecham a conta no low ticket)',
      'Nomenclatura padronizada aplicada em campanha, conjunto e anúncio',
    ];
  } else if (input.path === 'ecommerce') {
    objectiveLine = input.hasCatalog
      ? 'Vendas → Compra com Catálogo dinâmico (Advantage+ Sales + CAPI).'
      : 'Vendas → Compra com Pixel + CAPI (conectar catálogo no Gerenciador de Comércio).';
    benchmarks = {
      cpm: 'R$ 14–24 (moda/beleza) · R$ 22–38 (eletrônicos)',
      ctr: '1,0% – 1,8%',
      resultCost: `ROAS equilíbrio ${roasEquilibrio.toFixed(2)}x (acompanhar MER total)`,
    };
    const testB = Math.max(20, Math.round(input.dailyBudget * 0.2));
    const scaleB = Math.max(0, input.dailyBudget - testB);
    structure.push({
      title: `CAMPANHA 1 · MOTOR DE ESCALA (Advantage+ Sales) — ${formatBRL(scaleB)}/dia`,
      subtitle: 'Maior parte da verba em catálogo dinâmico agrupado por faixa de ticket parecida.',
      audience: 'Advantage+ Shopping/Sales (público aberto + remarketing automático)',
      exclusions: 'Compradores recentes (30 dias)',
      sets: [
        {
          name: 'Catálogo Dinâmico + Vencedores (UGC / Produto)',
          budgetPerDay: scaleB,
          note: input.isBlackFriday
            ? 'Black Friday: aquecer lista até 26/11; 27/11–01/12 subir oferta sem mexer no histórico'
            : 'Agrupe produtos de ticket parecido para não bagunçar o algoritmo',
        },
      ],
    });
    structure.push({
      title: `CAMPANHA 2 · TESTE DE CRIATIVOS (ABO) — ${formatBRL(testB)}/dia`,
      subtitle: '10–20% da verba para testar formatos distintos (UGC, estúdio, lifestyle, comparativo).',
      audience: 'Público aberto',
      exclusions: 'Compradores (30–60 dias)',
      sets: [
        {
          name: 'Conjunto Teste · Novos Conceitos (UGC / Oferta)',
          budgetPerDay: testB,
          note: 'Trocar cor ou legenda do mesmo vídeo NÃO conta como conceito novo pós-Andromeda',
        },
      ],
    });
    weeks = [
      { week: 'Semana 1', focus: 'Conferir feed do catálogo sem erros + compra teste validada no Meta e GA4.' },
      { week: 'Semana 2', focus: 'Avaliar MER (faturamento total ÷ verba total) além do ROAS da plataforma.' },
      { week: 'Semana 3', focus: 'Mover criativos UGC/lifestyle vencedores para a campanha principal.' },
      { week: 'Semana 4', focus: 'Testar kits/combos ou frete grátis acima de X para elevar ticket médio.' },
    ];
    checklist = [
      'Catálogo conectado e sem erros de feed / estoque',
      'Pixel + API de Conversões com evento Purchase e valor dinâmico',
      'Compra de teste validada no Gerenciador de Eventos e GA4',
      'Google Shopping / PMax configurado como complemento de busca',
    ];
  } else {
    // lancamento
    campaignTest = `${ym} · LEADS · CAPTÃCAO · ${biz.toUpperCase()}`;
    campaignScale = `${ym} · VENDAS · CARRINHO · ${biz.toUpperCase()}`;
    objectiveLine = '3 Fases: Captação (Leads) → Aquecimento (Engajamento/ThruPlay na base) → Carrinho Aberto (Vendas na base).';
    const leadsNeeded = Math.ceil((input.launchGoalSales || 30) / Math.max(0.01, input.convRatePct / 100));
    benchmarks = {
      cpm: 'R$ 15–30 (sobe próximo ao evento)',
      ctr: '1,2% – 2,0% na captação',
      resultCost: `CPL máximo ${formatBRL(tetoUnidade)} (meta: ${leadsNeeded.toLocaleString('pt-BR')} leads para ${input.launchGoalSales} vendas a ${input.convRatePct}%)`,
    };
    const capBudget = Math.round(input.dailyBudget * 0.65);
    const warmBudget = Math.round(input.dailyBudget * 0.12);
    const cartBudget = Math.max(10, input.dailyBudget - capBudget - warmBudget);
    structure.push({
      title: `FASE 1 · CAPTAÇÃO (~14 dias · 65% da verba) — ${formatBRL(capBudget)}/dia`,
      subtitle: `Meta estimada: ${leadsNeeded.toLocaleString('pt-BR')} leads · CPL máx ${formatBRL(tetoUnidade)}`,
      audience: 'Conjuntos abertos + 1 Semelhante de compradores/lista',
      exclusions: 'Quem já se cadastrou no evento (Leads)',
      sets: [
        {
          name: 'Captação · Público Aberto + Lookalike',
          budgetPerDay: capBudget,
          note: '5–10 criativos variando promessa do evento, dor, autoridade e data',
        },
      ],
    });
    structure.push({
      title: `FASE 2 · AQUECIMENTO (10–15% da verba) — ${formatBRL(warmBudget)}/dia`,
      subtitle: 'Engajamento / ThruPlay / Alcance exclusivamente para a base de leads.',
      audience: 'Leads captados + Envolvimento IG/FB 30d',
      exclusions: 'Público frio (não gastar aqui)',
      sets: [
        {
          name: 'Aquecimento · Lembretes e Cortes',
          budgetPerDay: warmBudget,
          note: 'Cortes das aulas, bastidores e provas sociais para elevar comparecimento',
        },
      ],
    });
    structure.push({
      title: `FASE 3 · CARRINHO ABERTO (5–7 dias · 20–25%) — ${formatBRL(cartBudget)}/dia`,
      subtitle: 'Vendas apenas para quem se cadastrou, assistiu às aulas ou iniciou checkout.',
      audience: 'Leads + Video Views aulas + Checkout iniciado 7d',
      exclusions: 'Quem já comprou (atualizar lista todo dia!)',
      sets: [
        {
          name: 'Carrinho + Remarketing Final (48–72h)',
          budgetPerDay: cartBudget,
          note: 'Oferta direta, bônus com prazo, quebra de objeção e último aviso',
        },
      ],
    });
    weeks = [
      { week: 'Semanas 1–2', focus: 'Captação de leads. Avaliar CPL junto com qualidade (não comemorar lead barato que não compra).' },
      { week: 'Semana 3', focus: 'Aquecimento intenso da base e liberação das aulas/CPL.' },
      { week: 'Semana 4', focus: 'Abertura de carrinho (5–7 dias) + remarketing nas últimas 48h excluindo compradores.' },
      { week: 'Pós-evento', focus: 'Consolidar taxa real de lead → venda para calibrar o próximo lançamento.' },
    ];
    checklist = [
      'Reserva de 20–25% da verba garantida para o carrinho aberto',
      'Página de obrigado com evento Lead + CAPI testados',
      'Público personalizado de compradores configurado para exclusão diária',
      'Grupo de WhatsApp / e-mail de aquecimento automatizado',
    ];
  }

  const zernioPlanJson =
    input.path === 'local'
      ? {
          objetivo: 'mensagens',
          destino: 'WHATSAPP',
          campanha: campaignTest,
          orcamentoDiarioReais: input.dailyBudget,
          publico: {
            cities: [{ query: input.city || 'São Paulo', radius: input.radiusKm || 6 }],
            advantageAudience: true,
          },
          anuncios: Array.from({ length: activeConceptsCount }, (_, i) => ({
            nome: `conceito-${i + 1} · video · v1`,
            arquivo: `./criativos/video-${i + 1}.mp4`,
          })),
        }
      : {
          objetivo: input.path === 'lancamento' ? 'lead_conversion' : 'conversions',
          promotedObject: {
            pixelId: 'SEU_PIXEL_ID',
            customEventType: input.path === 'lancamento' ? 'LEAD' : 'PURCHASE',
          },
          campanha: campaignTest,
          orcamentoDiarioReais: testBudgetTotal,
          publico: {
            countries: ['BR'],
            advantageAudience: true,
          },
          anuncios: Array.from({ length: activeConceptsCount }, (_, i) => ({
            nome: `conceito-${i + 1} · video · v1`,
            arquivo: `./criativos/video-${i + 1}.mp4`,
          })),
        };

  return {
    header: `PLANO DE TRÁFEGO · ${biz} · ${PATH_META[input.path].label}`,
    objectiveLine,
    budgetMathLine: `Receita/comprador ${formatBRL(effectiveRevenuePerBuyer)} × margem ${input.marginPct}% = Equilíbrio ${formatBRL(cpaEquilibrio)} → CPA Alvo ${formatBRL(cpaAlvo)} (ROAS equilíbrio ${roasEquilibrio.toFixed(2)}x)`,
    cpaEquilibrio,
    cpaAlvo,
    roasEquilibrio,
    tetoUnidade,
    unidadeLabel,
    budgetWarning,
    naming: {
      campaignTest,
      campaignScale,
      adSetPattern: '{conceito} · {público}',
      adPattern: '{conceito} · {formato} · v1',
    },
    structure,
    benchmarks,
    cutAndScaleRules: [
      '72h iniciais sem mexer (não reiniciar aprendizado).',
      `Corte: pausar anúncio que gastou 2× o teto (${formatBRL(tetoUnidade * 2)}) sem resultado, ou passou do teto após 7 dias.`,
      input.path === 'local'
        ? 'Escala local: subir +20% a cada 3–4 dias no mesmo conjunto se o custo por agendamento estiver saudável.'
        : 'Vencedor vai para Escala (pelo ID do post) com CPA ≤ alvo e ≥ 5 resultados (conta pequena) ou 15–20 (conta maior).',
      'Escala segura: +20% de orçamento a cada 3–4 dias. Nunca dobrar de uma vez.',
    ],
    weeks,
    checklist,
    zernioPlanJson,
  };
}

export interface AdMetricInput {
  id: string;
  name: string;
  spend: number;
  impressions: number;
  views3s: number;
  thruPlays: number;
  linkClicks: number;
  results: number;
  targetCostPerResult: number;
}

export interface AdAnalysis {
  hookRate: number;
  holdRate: number;
  ctr: number;
  cpm: number;
  cpr: number | null;
  verdict: 'ESCALAR' | 'MANTER' | 'PAUSAR' | 'OTIMIZAR';
  badgeColor: 'emerald' | 'amber' | 'rose' | 'sky';
  reason: string;
  nextAction: string;
}

export function analyzeAdMetrics(ad: AdMetricInput): AdAnalysis {
  const hookRate = ad.impressions > 0 ? (ad.views3s / ad.impressions) * 100 : 0;
  const holdRate = ad.views3s > 0 ? (ad.thruPlays / ad.views3s) * 100 : 0;
  const ctr = ad.impressions > 0 ? (ad.linkClicks / ad.impressions) * 100 : 0;
  const cpm = ad.impressions > 0 ? (ad.spend / ad.impressions) * 1000 : 0;
  const cpr = ad.results > 0 ? ad.spend / ad.results : null;

  const cutCeiling = ad.targetCostPerResult * 2;

  if (ad.results === 0 && ad.spend >= cutCeiling) {
    return {
      hookRate,
      holdRate,
      ctr,
      cpm,
      cpr,
      verdict: 'PAUSAR',
      badgeColor: 'rose',
      reason: `Gastou ${formatBRL(ad.spend)} (≥ 2× o teto de ${formatBRL(ad.targetCostPerResult)}) sem nenhum resultado.`,
      nextAction:
        hookRate < 20
          ? 'Hook Rate abaixo de 20% — regravar os 3 primeiros segundos com gancho visual + título na tela.'
          : 'Subir novo conceito com ângulo diferente (dor, prova ou demonstração).',
    };
  }

  if (cpr !== null && cpr > ad.targetCostPerResult * 1.25 && ad.spend >= ad.targetCostPerResult * 2) {
    return {
      hookRate,
      holdRate,
      ctr,
      cpm,
      cpr,
      verdict: 'PAUSAR',
      badgeColor: 'rose',
      reason: `Custo por resultado (${formatBRL(cpr)}) está acima do teto alvo (${formatBRL(ad.targetCostPerResult)}).`,
      nextAction:
        ctr >= 1 && holdRate < 25
          ? 'CTR bom com Hold Rate baixo (< 25%) — gancho atrai, mas o corpo do vídeo não retém. Ajustar meio do vídeo e oferta.'
          : 'Substituir por novo conceito criativo mantendo o formato que teve melhor retenção.',
    };
  }

  if (cpr !== null && cpr <= ad.targetCostPerResult && ad.results >= 5) {
    return {
      hookRate,
      holdRate,
      ctr,
      cpm,
      cpr,
      verdict: 'ESCALAR',
      badgeColor: 'emerald',
      reason: `Vencedor validado: ${ad.results} resultados a ${formatBRL(cpr)} (≤ alvo ${formatBRL(ad.targetCostPerResult)}).`,
      nextAction: 'Levar pelo ID do post para Escala ou subir +20% de orçamento a cada 3–4 dias. Criar 3 variações de gancho deste vencedor.',
    };
  }

  if (hookRate > 0 && hookRate < 20) {
    return {
      hookRate,
      holdRate,
      ctr,
      cpm,
      cpr,
      verdict: 'OTIMIZAR',
      badgeColor: 'amber',
      reason: `Hook Rate de ${hookRate.toFixed(1)}% está abaixo de 20% — pouca gente para nos 3 primeiros segundos.`,
      nextAction: 'Aguardar fechar o teto de corte se ainda < 72h, mas já preparar 2 novos ganchos de 3s para o mesmo corpo.',
    };
  }

  return {
    hookRate,
    holdRate,
    ctr,
    cpm,
    cpr,
    verdict: 'MANTER',
    badgeColor: 'sky',
    reason:
      ad.results > 0
        ? `Custo atual de ${formatBRL(cpr!)} com ${ad.results} resultado(s). Ainda acumulando volume para decisão.`
        : `Ainda abaixo do teto de corte (${formatBRL(cutCeiling)}). Deixar rodar sem mexer.`,
    nextAction: 'Manter rodando até completar 72h–7 dias ou atingir 5 resultados para decisão segura.',
  };
}
