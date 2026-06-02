export const it = {
  app: {
    title: "Dashboard BF WC26",
    skipToContent: "Vai al contenuto principale",
  },
  nav: {
    live: "Live",
    teams: "Squadre",
    players: "Giocatori",
    matches: "Partite",
    bracket: "Tabellone",
    settings: "Impostazioni",
    getHelp: "Aiuto",
    search: "Cerca",
  },
  routes: {
    live: "Live",
    teams: "Squadre",
    players: "Giocatori",
    matches: "Partite",
    bracket: "Tabellone",
    settings: "Impostazioni",
    help: "Aiuto",
    notFound: "Pagina non trovata",
    descriptions: {
      live: "Live rush Mondiale 2026, classifiche dei gironi, power ranking Elo, xG e migliori giocatori aggiornati durante il torneo.",
      teams: "Esplora tutte le squadre del Mondiale 2026 con rosa, forma e metriche del torneo.",
      players: "Statistiche giocatori Mondiale 2026 — gol, assist, parate e protagonisti.",
      matches: "Calendario e risultati completi del Mondiale 2026 con orari, gironi e punteggi finali.",
      bracket: "Tabellone a eliminazione del Mondiale 2026 — dagli ottavi di finale alla finale.",
      settings: "Preferenze della dashboard e opzioni di visualizzazione.",
      help: "Come usare la dashboard Mondiale 2026 — dati live, classifiche, ranking e navigazione.",
      notFound: "La pagina richiesta non è disponibile su questa dashboard.",
    },
  },
  language: { label: "Lingua" },
  theme: {
    label: "Tema",
    light: "Chiaro",
    dark: "Scuro",
    system: "Sistema",
  },
  common: {
    all: "Tutti",
    allConfederations: "Tutte le confederazioni",
    allMatches: "Tutte le partite",
    team: "Squadra",
    vs: "vs",
    group: "Gruppo {{group}}",
    knockout: "Eliminazione",
    columns: "Colonne",
    rows: "Righe",
    more: "Altro",
    open: "Apri",
    share: "Condividi",
    delete: "Elimina",
    filterByConfederation: "Filtra per confederazione",
    pos: "Pos",
    form: "Forma",
    formLast5SrOnly: " — ultime 5",
    rankChange: "Variazione posizione",
    confederation: "Conf.",
    pageOf: "Pagina {{current}} di {{total}}",
    teamsRankedSorted: "{{count}} squadre classificate · ordinate per {{sort}}",
    goToFirstPage: "Vai alla prima pagina",
    goToPreviousPage: "Vai alla pagina precedente",
    goToNextPage: "Vai alla pagina successiva",
    goToLastPage: "Vai all'ultima pagina",
    last5Results: "Ultimi 5 risultati: {{results}}",
    yellowCardsCount: "{{count}} cartellini gialli",
    redCardsCount: "{{count}} cartellini rossi",
    win: "Vittoria",
    draw: "Pareggio",
    loss: "Sconfitta",
    selectGroup: "Seleziona girone",
    selectMatchFilter: "Seleziona filtro partite",
    selectPerformerCategory: "Seleziona categoria giocatore",
    toggleSidebar: "Mostra/nascondi barra laterale",
    documents: "Documenti",
    account: "Account",
    billing: "Fatturazione",
    notifications: "Notifiche",
    logOut: "Esci",
  },
  pages: {
    teams: { description: "Schede squadra, filtri e profili." },
    players: { description: "Classifiche, modalità statistiche e profili giocatori." },
    matches: { description: "Dettaglio partita, layer del campo e timeline eventi." },
    bracket: { description: "Fasi a eliminazione dagli ottavi alla finale." },
    settings: { description: "Preferenze, filtri e opzioni di visualizzazione." },
    help: { description: "Guide, scorciatoie e link di supporto." },
    notFound: {
      message: "Questa route non esiste ancora.",
      backToLive: "Torna al Live",
    },
  },
  liveRush: {
    demoDate: "sabato 13 giugno 2026",
    title: "Live rush",
    description: "Partite live del giorno",
    noMatches: "Nessuna partita in questa vista.",
    tabs: {
      all: "Tutti",
      finished: "Terminate",
      live: "Live",
      upcoming: "In programma",
    },
    footer: {
      finished: "Fine partita — rush bloccato",
      live: "In corso — i gol contano ora",
      upcoming: "Calcio d'inizio in attesa — pick aperti",
    },
  },
  matchCard: {
    live: "Live",
    fullTime: "FT",
    liveKickoff: "{{label}} live",
  },
  sectionCards: {
    goalsToday: "Gol oggi",
    goalsTodayTrend: "Sopra la giornata di ieri",
    goalsTodayFootnote: "In tutte le partite concluse oggi",
    matchesPlayed: "Partite giocate",
    matchesPlayedTrend: "Ancora una partita da giocare",
    matchesPlayedBadge: "1 rimasta",
    matchesPlayedFootnote: "Giornata del torneo di oggi",
    topXgToday: "Miglior xG oggi",
    topXgTrend: "Minaccia attesa più alta",
    topXgFootnote: "Guidato da Mbappé vs Messico",
    cardsToday: "Cartellini oggi",
    cardsTrend: "Panoramica disciplinare",
    cardsFootnote: "Cartellini gialli e rossi di oggi",
  },
  topPerformers: {
    title: "Migliori giocatori",
    description: "In evidenza nel torneo finora",
    tabs: { goals: "Gol", assists: "Assist", saves: "Parate" },
  },
  groupStandings: {
    title: "Classifica fase a gironi",
    description: "I primi due di ogni girone passano agli ottavi",
    groupShort: "Gruppo {{group}}",
    selectPlaceholder: "Gruppo A",
    tableAriaLabel: "Classifica gruppo {{group}}",
  },
  powerRanking: {
    title: "Power ranking del torneo",
    description:
      "Record, gol, xG e disciplina nella fase a gironi. L'Elo applica una piccola penalità per giallo (−{{yellowPenalty}}) e rosso (−{{redPenalty}}) — passa il mouse sul punteggio per il dettaglio.",
    tableAriaLabel: "Power ranking del torneo",
    noTeams: "Nessuna squadra corrisponde a questo filtro.",
    topRankAria: "{{team}}, tra il top {{threshold}} del ranking",
    eloTooltip: {
      base: "Elo base {{elo}}",
      discipline:
        " · −{{penalty}} disciplina ({{yellow}} gialli × {{yellowPenalty}}, {{red}} rossi × {{redPenalty}})",
      none: " · nessuna penalità disciplinare",
    },
  },
} as const
