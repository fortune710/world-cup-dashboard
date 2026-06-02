export const pt = {
  app: {
    title: "Painel BF WC26",
    skipToContent: "Ir para o conteúdo principal",
  },
  nav: {
    live: "Ao vivo",
    teams: "Seleções",
    players: "Jogadores",
    matches: "Partidas",
    bracket: "Chave",
    settings: "Configurações",
    getHelp: "Ajuda",
    search: "Buscar",
  },
  routes: {
    live: "Ao vivo",
    teams: "Seleções",
    players: "Jogadores",
    matches: "Partidas",
    bracket: "Chave",
    settings: "Configurações",
    help: "Ajuda",
    notFound: "Página não encontrada",
    descriptions: {
      live: "Rush ao vivo da Copa 2026, classificação dos grupos, ranking Elo, xG e melhores jogadores atualizados durante o torneio.",
      teams: "Explore todas as seleções da Copa 2026 com elenco, forma e métricas do torneio.",
      players: "Estatísticas de jogadores da Copa 2026 — gols, assistências, defesas e destaques.",
      matches: "Calendário e resultados completos da Copa 2026 com horários, grupos e placares finais.",
      bracket: "Chave eliminatória da Copa 2026 — acompanhe do mata-mata à final.",
      settings: "Preferências do painel e opções de exibição.",
      help: "Como usar o painel da Copa 2026 — dados ao vivo, classificação, rankings e navegação.",
      notFound: "A página solicitada não está disponível neste painel.",
    },
  },
  language: { label: "Idioma" },
  theme: {
    label: "Tema",
    light: "Claro",
    dark: "Escuro",
    system: "Sistema",
  },
  common: {
    all: "Todos",
    allConfederations: "Todas as confederações",
    allMatches: "Todas as partidas",
    team: "Equipe",
    vs: "vs",
    group: "Grupo {{group}}",
    knockout: "Mata-mata",
    columns: "Colunas",
    rows: "Linhas",
    more: "Mais",
    open: "Abrir",
    share: "Compartilhar",
    delete: "Excluir",
    filterByConfederation: "Filtrar por confederação",
    pos: "Pos",
    form: "Forma",
    formLast5SrOnly: " — últimos 5",
    rankChange: "Mudança de posição",
    confederation: "Conf.",
    pageOf: "Página {{current}} de {{total}}",
    teamsRankedSorted: "{{count}} equipes classificadas · ordenado por {{sort}}",
    goToFirstPage: "Ir para a primeira página",
    goToPreviousPage: "Ir para a página anterior",
    goToNextPage: "Ir para a próxima página",
    goToLastPage: "Ir para a última página",
    last5Results: "Últimos 5 resultados: {{results}}",
    yellowCardsCount: "{{count}} cartões amarelos",
    redCardsCount: "{{count}} cartões vermelhos",
    win: "Vitória",
    draw: "Empate",
    loss: "Derrota",
    selectGroup: "Selecionar grupo",
    selectMatchFilter: "Selecionar filtro de partidas",
    selectPerformerCategory: "Selecionar categoria de jogador",
    toggleSidebar: "Alternar barra lateral",
    documents: "Documentos",
    account: "Conta",
    billing: "Cobrança",
    notifications: "Notificações",
    logOut: "Sair",
  },
  pages: {
    teams: { description: "Cards de equipes, filtros e perfis." },
    players: { description: "Rankings, modos de estatísticas e perfis de jogadores." },
    matches: { description: "Detalhes da partida, camadas do campo e linhas do tempo." },
    bracket: { description: "Fases eliminatórias do mata-mata à final." },
    settings: { description: "Preferências, filtros e opções de exibição." },
    help: { description: "Guias, atalhos e links de suporte." },
    notFound: {
      message: "Esta rota ainda não existe.",
      backToLive: "Voltar ao Ao vivo",
    },
  },
  liveRush: {
    demoDate: "sábado, 13 de junho de 2026",
    title: "Rush ao vivo",
    description: "Partidas ao vivo do dia",
    noMatches: "Nenhuma partida nesta visualização.",
    tabs: {
      all: "Todos",
      finished: "Encerradas",
      live: "Ao vivo",
      upcoming: "Próximas",
    },
    footer: {
      finished: "Fim de jogo — rush fechado",
      live: "Em andamento — gols contam agora",
      upcoming: "Aguardando início — palpites abertos",
    },
  },
  matchCard: {
    live: "Ao vivo",
    fullTime: "FT",
    liveKickoff: "{{label}} ao vivo",
  },
  sectionCards: {
    goalsToday: "Gols hoje",
    goalsTodayTrend: "Acima da rodada de ontem",
    goalsTodayFootnote: "Em todos os jogos concluídos hoje",
    matchesPlayed: "Partidas disputadas",
    matchesPlayedTrend: "Uma partida ainda por jogar",
    matchesPlayedBadge: "1 restante",
    matchesPlayedFootnote: "Rodada do torneio de hoje",
    topXgToday: "Melhor xG hoje",
    topXgTrend: "Maior ameaça esperada",
    topXgFootnote: "Liderado por Mbappé vs México",
    cardsToday: "Cartões hoje",
    cardsTrend: "Panorama disciplinar",
    cardsFootnote: "Cartões amarelos e vermelhos de hoje",
  },
  topPerformers: {
    title: "Melhores jogadores",
    description: "Destaques do torneio até agora",
    tabs: { goals: "Gols", assists: "Assistências", saves: "Defesas" },
  },
  groupStandings: {
    title: "Classificação dos grupos",
    description: "Os dois primeiros de cada grupo avançam ao mata-mata",
    groupShort: "Grupo {{group}}",
    selectPlaceholder: "Grupo A",
    tableAriaLabel: "Classificação do grupo {{group}}",
  },
  powerRanking: {
    title: "Ranking de força do torneio",
    description:
      "Desempenho, gols, xG e disciplina na fase de grupos. O Elo aplica pequena penalidade por amarelo (−{{yellowPenalty}}) e vermelho (−{{redPenalty}}) — passe o mouse na nota para detalhes.",
    tableAriaLabel: "Ranking de força do torneio",
    noTeams: "Nenhuma equipe corresponde a este filtro.",
    topRankAria: "{{team}}, entre o top {{threshold}} do ranking",
    eloTooltip: {
      base: "Elo base {{elo}}",
      discipline:
        " · −{{penalty}} disciplina ({{yellow}} amarelos × {{yellowPenalty}}, {{red}} vermelhos × {{redPenalty}})",
      none: " · sem penalidade disciplinar",
    },
  },
} as const
