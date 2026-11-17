/**
 * Pedido 20: Motor de Direção Criativa (100% Client-Side, sem geração sintética)
 * Formula diretrizes paramétricas para Google Flow (imagens estáticas e carrosséis)
 * e roteiros estruturados em 4 blocos para gravação humana (Vídeos / Reels),
 * com áreas de segurança obrigatórias (1:1, 4:5 e 9:16 com respiro de 250px topo/base).
 */

export type CreativeAngle = 'dor-aguda' | 'prova-social' | 'contraintuitivo' | 'oferta-direta';
export type CreativeMedium = 'static' | 'carousel' | 'video';

export interface CreativeBriefInput {
  id?: string;
  businessName: string;
  productName: string;
  targetAudience: string;
  mainPain: string;
  mainPromise: string;
  ctaDestination: string;
  angle: CreativeAngle;
  medium: CreativeMedium;
}

export interface FormatSpec {
  ratio: '1:1' | '4:5' | '9:16';
  dimensions: string;
  placement: string;
  safeZoneNote: string;
  topMarginPx: number;
  bottomMarginPx: number;
}

export interface GoogleFlowBrief {
  palette: {
    name: string;
    backgroundHex: string;
    accentHex: string;
    textHex: string;
    rationale: string;
  };
  headlineWords: string; // máx 7–10 palavras
  typographySpec: string;
  focalElement: string;
  googleFlowPrompt: string;
  carouselSlides?: {
    slideNumber: number;
    role: string;
    headline: string;
    visualDirection: string;
  }[];
}

export interface VideoScriptBlock {
  block: '1. Gancho (Hook)' | '2. Retenção (Hold)' | '3. Corpo (Body)' | '4. Fechamento (CTA)';
  timeRange: string;
  psychologicalGoal: string;
  recordingDirection: string;
  spokenCopy: string;
}

export interface VideoScriptOutput {
  hookVariations: {
    code: string;
    label: string;
    spokenLine: string;
    onScreenText: string;
    cameraNote: string;
  }[];
  blocks: VideoScriptBlock[];
}

export interface GeneratedCreativePack {
  id: string;
  createdAt: string;
  input: CreativeBriefInput;
  formats: FormatSpec[];
  googleFlow: GoogleFlowBrief;
  videoScript: VideoScriptOutput;
}

const ANGLE_PALETTES: Record<
  CreativeAngle,
  { name: string; backgroundHex: string; accentHex: string; textHex: string; rationale: string }
> = {
  'dor-aguda': {
    name: 'Contraste Alerta Âmbar/Carvão',
    backgroundHex: '#18181B',
    accentHex: '#F59E0B',
    textHex: '#FAFAFA',
    rationale:
      'Quebra o padrão branco/cinza do feed com fundo grafite profundo e destaque âmbar de urgência.',
  },
  'prova-social': {
    name: 'Confiança Esmeralda/Obsidiana',
    backgroundHex: '#09090B',
    accentHex: '#10B981',
    textHex: '#F4F4F5',
    rationale:
      'Transmite validação numérica e resultado real com alto contraste de leitura em telas móveis.',
  },
  contraintuitivo: {
    name: 'Ruptura Ciano/Preto',
    backgroundHex: '#020617',
    accentHex: '#06B6D4',
    textHex: '#F8FAFC',
    rationale:
      'Estética editorial limpa que interrompe o scroll automático por quebrar expectativas visuais.',
  },
  'oferta-direta': {
    name: 'Ação Coral/Branco',
    backgroundHex: '#FFFBEB',
    accentHex: '#E11D48',
    textHex: '#09090B',
    rationale:
      'Fundo claro de alta legibilidade com selo coral focado em conversão imediata e CTA evidente.',
  },
};

export function generateBriefing(input: CreativeBriefInput): GeneratedCreativePack {
  const palette = ANGLE_PALETTES[input.angle];
  const biz = input.businessName.trim() || 'Sua Marca';
  const prod = input.productName.trim() || 'Sua Solução';
  const pain = input.mainPain.trim() || 'perder tempo e dinheiro sem resultado';
  const promise = input.mainPromise.trim() || 'resultado previsível em poucos dias';
  const cta = input.ctaDestination.trim() || 'Saiba Mais';

  const formats: FormatSpec[] = [
    {
      ratio: '1:1',
      dimensions: '1080 × 1080 px',
      placement: 'Feed do Instagram & Aba Explorar',
      safeZoneNote:
        'Hierarquia visual centralizada. Manter margem interna de 90px nas 4 bordas para leitura instantânea.',
      topMarginPx: 90,
      bottomMarginPx: 90,
    },
    {
      ratio: '4:5',
      dimensions: '1080 × 1350 px',
      placement: 'Feed Mobile Instagram (Máxima Área Visível)',
      safeZoneNote:
        'Ocupa maior proporção de tela na rolagem. Posicionar título nos 35% superiores e elemento focal no centro.',
      topMarginPx: 110,
      bottomMarginPx: 110,
    },
    {
      ratio: '9:16',
      dimensions: '1080 × 1920 px',
      placement: 'Stories & Reels (Obrigatório)',
      safeZoneNote:
        'RESPIRO OBRIGATÓRIO: 250px livres no topo (perfil/botões) e 250px livres na base (CTA/legenda/comentários). Proibido texto essencial nessas faixas.',
      topMarginPx: 250,
      bottomMarginPx: 250,
    },
  ];

  const shortHeadlines: Record<CreativeAngle, string> = {
    'dor-aguda': `Pare de ${pain.split(' ').slice(0, 5).join(' ')} hoje`,
    'prova-social': `Como clientes alcançam ${promise.split(' ').slice(0, 5).join(' ')}`,
    contraintuitivo: `O erro invisível ao tentar ${promise.split(' ').slice(0, 4).join(' ')}`,
    'oferta-direta': `${prod}: ${promise.split(' ').slice(0, 5).join(' ')}`,
  };

  const headlineWords = shortHeadlines[input.angle];

  const googleFlowPrompt = [
    `Direção de Arte para Google Flow (${biz} · ${prod}):`,
    `- Fundo sólido ou gradiente limpo em ${palette.backgroundHex} com acento ${palette.accentHex}.`,
    `- Elemento focal único: fotografia nítida ou diagrama esquemático limpo representando "${prod}" sem poluição visual.`,
    `- Tipografia: fonte sem serifa peso ExtraBold/Black, cor ${palette.textHex}, texto máximo de 7 a 10 palavras: "${headlineWords}".`,
    `- Enquadramento: exportar versões 1:1 (1080x1080), 4:5 (1080x1350) e 9:16 (1080x1920) preservando 250px livres no topo e 250px na base no 9:16.`,
  ].join('\n');

  const carouselSlides =
    input.medium === 'carousel'
      ? [
          {
            slideNumber: 1,
            role: 'Gancho / Dor',
            headline: headlineWords,
            visualDirection: `Fundo ${palette.backgroundHex}, texto gigante + seta discreta indicando deslize.`,
          },
          {
            slideNumber: 2,
            role: 'Desenvolvimento do Problema',
            headline: `Por que ${pain} continua acontecendo`,
            visualDirection: 'Diagrama simples de 2 colunas comparando método comum vs. gargalo real.',
          },
          {
            slideNumber: 3,
            role: 'Virada de Chave',
            headline: `O que muda com ${prod}`,
            visualDirection: 'Elemento focal único destacando o mecanismo principal da solução.',
          },
          {
            slideNumber: 4,
            role: 'Aplicação Prática',
            headline: `3 passos para ${promise}`,
            visualDirection: 'Lista numerada limpa com no máximo 3 linhas curtas.',
          },
          {
            slideNumber: 5,
            role: 'Prova Social / Depoimento',
            headline: 'Resultados reais de quem já aplicou',
            visualDirection: 'Print real ou foto autêntica com destaque em métrica concreta.',
          },
          {
            slideNumber: 6,
            role: 'Oferta com CTA',
            headline: `Toque em "${cta}" agora`,
            visualDirection: `Botão simulado em ${palette.accentHex} apontando para a ação sem surpresa.`,
          },
        ]
      : undefined;

  const videoScript = scriptVideo(input);

  return {
    id: input.id ?? `cr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    createdAt: new Date().toISOString(),
    input,
    formats,
    googleFlow: {
      palette,
      headlineWords,
      typographySpec: 'Sem serifa peso pesado (Inter Black / Montserrat ExtraBold), máx. 7–10 palavras.',
      focalElement: `Objeto único de atenção visual: demonstração direta de ${prod} ou expressão humana autêntica olhando para a câmera.`,
      googleFlowPrompt,
      carouselSlides,
    },
    videoScript,
  };
}

export function scriptVideo(input: CreativeBriefInput): VideoScriptOutput {
  const prod = input.productName.trim() || 'nosso método';
  const audience = input.targetAudience.trim() || 'você';
  const pain = input.mainPain.trim() || 'gastar sem retorno';
  const promise = input.mainPromise.trim() || 'ter resultados consistentes';
  const cta = input.ctaDestination.trim() || 'Saiba Mais';

  const hookVariations = [
    {
      code: 'H1-DOR',
      label: 'Gancho 1 · Dor Aguda',
      spokenLine: `Se você ainda sofre com ${pain}, pare tudo por 30 segundos.`,
      onScreenText: `PARE DE ${pain.toUpperCase().slice(0, 28)}`,
      cameraNote: 'Close médio, olhar direto na lente, movimento sutil de mão nos primeiros 1,5s.',
    },
    {
      code: 'H2-CONTRA',
      label: 'Gancho 2 · Pergunta Contraintuitiva',
      spokenLine: `Por que ${audience} tenta de tudo e mesmo assim não consegue ${promise}?`,
      onScreenText: 'O ERRO QUE NINGUÉM TE CONTA',
      cameraNote: 'Começar caminhando ou segurando o produto/quadro branco para quebrar o padrão.',
    },
    {
      code: 'H3-PROVA',
      label: 'Gancho 3 · Promessa Direta',
      spokenLine: `Veja como é possível ${promise} usando exatamente o ${prod}.`,
      onScreenText: `COMO ALCANÇAR ${promise.toUpperCase().slice(0, 26)}`,
      cameraNote: 'Mostrar o resultado ou produto na tela no segundo 0,5 antes de explicar.',
    },
  ];

  const blocks: VideoScriptBlock[] = [
    {
      block: '1. Gancho (Hook)',
      timeRange: '0 a 3 segundos',
      psychologicalGoal: 'Quebrar a rolagem e gerar identificação imediata.',
      recordingDirection:
        'Olhar direto para a câmera, movimento corporal sutil, legenda dinâmica dentro da área segura (longe dos 250px do topo/base).',
      spokenCopy: hookVariations[0].spokenLine,
    },
    {
      block: '2. Retenção (Hold)',
      timeRange: '3 a 15 segundos',
      psychologicalGoal: 'Contextualizar o problema e afastar desinteressados.',
      recordingDirection:
        'Mudança de ângulo ou corte de respiro a cada 3 segundos. Sem introduções corporativas lentas ("Olá, meu nome é...").',
      spokenCopy: `A maioria de ${audience} continua travada em ${pain} porque tenta resolver o sintoma e não a causa. Se isso acontece com você, presta atenção no que muda agora.`,
    },
    {
      block: '3. Corpo (Body)',
      timeRange: '15 a 45 segundos',
      psychologicalGoal: 'Apresentar a solução, produto ou método prático.',
      recordingDirection:
        'Explicação clara e focada no benefício final, mostrando o produto ou prova visual enquanto fala.',
      spokenCopy: `Com ${prod}, você elimina esse gargalo de forma prática para ${promise}, sem complicação e com acompanhamento direto.`,
    },
    {
      block: '4. Fechamento (CTA)',
      timeRange: 'Últimos 5 a 10 segundos',
      psychologicalGoal: 'Conduzir à ação sem surpresa ou frustração.',
      recordingDirection:
        'Apontar para baixo (direção do botão oficial) e instruir exatamente o que acontece após o clique.',
      spokenCopy: `Toque agora no botão "${cta}" aqui embaixo para garantir sua condição e falar direto com nossa equipe.`,
    },
  ];

  return { hookVariations, blocks };
}
