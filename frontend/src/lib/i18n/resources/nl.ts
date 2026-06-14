export const nl = {

  app: {

    title: "BF WC26-dashboard",

    skipToContent: "Ga naar hoofdinhoud",

  },

  nav: {

    live: "Live",

    teams: "Teams",

    players: "Spelers",

    matches: "Wedstrijden",

    bracket: "Schema",

    settings: "Instellingen",

    getHelp: "Help",

    search: "Zoeken",

  },

  routes: {

    live: "Live",

    teams: "Teams",

    players: "Spelers",

    matches: "Wedstrijden",

    bracket: "Schema",

    settings: "Instellingen",

    help: "Help",

    notFound: "Pagina niet gevonden",

    descriptions: {

      live: "Live WK 2026-rush, groepsstanden, Elo-power rankings, xG en toppers bijgewerkt tijdens het toernooi.",

      teams: "Bekijk alle WK 2026-teams met selectie, vorm en toernooistatistieken.",

      players: "WK 2026-spelersstatistieken — goals, assists, reddingen en toppers.",

      matches: "Volledig WK 2026-schema en uitslagen met kick-offs, groepen en eindstanden.",

      bracket: "WK 2026-knock-outschema — van de achtste finales tot de finale.",

      settings: "Dashboardvoorkeuren en weergaveopties.",

      help: "Hoe het WK 2026-dashboard te gebruiken — live data, standen, rankings en navigatie.",

      notFound: "De opgevraagde pagina is niet beschikbaar op dit dashboard.",

    },

  },

  language: { label: "Taal" },

  theme: {

    label: "Thema",

    light: "Licht",

    dark: "Donker",

    system: "Systeem",

  },

  common: {

    all: "Alle",

    allConfederations: "Alle confederaties",

    allMatches: "Alle wedstrijden",

    team: "Team",

    vs: "vs",

    group: "Groep {{group}}",

    knockout: "Knock-out",

    columns: "Kolommen",

    rows: "Rijen",

    more: "Meer",

    open: "Openen",

    share: "Delen",

    delete: "Verwijderen",

    filterByConfederation: "Filter op confederatie",

    pos: "Pos",

    form: "Vorm",

    formLast5SrOnly: " — laatste 5",

    rankChange: "Rangwijziging",

    confederation: "Conf.",

    pageOf: "Pagina {{current}} van {{total}}",

    teamsRankedSorted: "{{count}} teams gerangschikt · gesorteerd op {{sort}}",

    goToFirstPage: "Ga naar eerste pagina",

    goToPreviousPage: "Ga naar vorige pagina",

    goToNextPage: "Ga naar volgende pagina",

    goToLastPage: "Ga naar laatste pagina",

    last5Results: "Laatste 5 uitslagen: {{results}}",

    yellowCardsCount: "{{count}} gele kaarten",

    redCardsCount: "{{count}} rode kaarten",

    win: "Winst",

    draw: "Gelijk",

    loss: "Verlies",

    selectGroup: "Selecteer groep",

    selectMatchFilter: "Selecteer wedstrijdfilter",

    selectPerformerCategory: "Selecteer spelerscategorie",

    toggleSidebar: "Zijbalk in-/uitklappen",

    documents: "Documenten",

    account: "Account",

    billing: "Facturering",

    notifications: "Meldingen",

    logOut: "Uitloggen",

  },

  pages: {

    teams: { description: "Teamkaarten, filters en profielen." },

    players: { description: "Rankings, stat-modi en spelersprofielen." },

    matches: { description: "Wedstrijddetail, pitch-lagen en event-timelines." },

    bracket: { description: "Knock-outfases van achtste finales tot finale." },

    settings: { description: "Voorkeuren, filters en weergaveopties." },

    help: { description: "Handleidingen, sneltoetsen en supportlinks." },

    notFound: {

      message: "Deze route bestaat nog niet.",

      backToLive: "Terug naar Live",

    },

  },

  liveRush: {

    demoDate: "zaterdag 13 juni 2026",

    title: "Live rush",

    description: "Live wedstrijden van vandaag",

    noMatches: "Geen wedstrijden in deze weergave.",

    tabs: {

      all: "Alle",

      finished: "Afgelopen",

      live: "Live",

      upcoming: "Komend",

    },

    footer: {

      finished: "Einde wedstrijd — rush vergrendeld",

      live: "Bezig — goals tellen nu",

      upcoming: "Aftrap in afwachting — picks open",

    },

  },

  matchCard: {

    live: "Live",

    fullTime: "FT",

    liveKickoff: "{{label}} live",

  },

  sectionCards: {

    goalsToday: "Beste beoordeling vandaag",

    goalsTodayTrend: "Hoogste wedstrijdbeoordeling",

    goalsTodayFootnote: "Aangevoerd door {{playerName}}",

    matchesPlayed: "Gespeelde wedstrijden",

    matchesPlayedTrend: "Nog één wedstrijd te spelen",

    matchesPlayedBadge: "1 over",

    matchesPlayedFootnote: "Speelronde van vandaag",

    topXgToday: "Doelbijdragen vandaag",

    topXgTrend: "Meeste directe doelbijdragen",

    topXgFootnote: "Aangevoerd door {{playerName}}",

    cardsToday: "Passnauwkeurigheid vandaag",

    cardsTrend: "Beste passnauwkeurigheid",

    cardsFootnote: "Aangevoerd door {{playerName}}",

  },

  topPerformers: {

    title: "Topspelers",

    description: "Uitblinkers in het toernooi tot nu toe",

    tabs: { goals: "Goals", assists: "Assists", saves: "Reddingen" },

  },

  groupStandings: {

    title: "Groepsfase-stand",

    description: "De eerste twee per groep gaan door naar de achtste finales",

    groupShort: "Groep {{group}}",

    selectPlaceholder: "Groep A",

    tableAriaLabel: "Stand groep {{group}}",
    loading: "Stand laden…",

  },

  powerRanking: {

    title: "Toernooi power ranking",

    description:

      "Record, goals, xG en discipline in de groepsfase. Elo past een kleine straf toe voor geel (−{{yellowPenalty}}) en rood (−{{redPenalty}}) — hover over een score voor details.",

    tableAriaLabel: "Toernooi power ranking",

    noTeams: "Geen teams komen overeen met dit filter.",

    topRankAria: "{{team}}, top {{threshold}} in power ranking",

    eloTooltip: {

      base: "Basis-Elo {{elo}}",

      discipline:

        " · −{{penalty}} discipline ({{yellow}} geel × {{yellowPenalty}}, {{red}} rood × {{redPenalty}})",

      none: " · geen disciplinaire straf",

    },

  },

} as const


