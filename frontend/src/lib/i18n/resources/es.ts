export const es = {
  app: {
    title: "Panel BF WC26",
    skipToContent: "Ir al contenido principal",
  },
  nav: {
    live: "En vivo",
    teams: "Selecciones",
    players: "Jugadores",
    matches: "Partidos",
    bracket: "Cuadro",
    settings: "Ajustes",
    getHelp: "Ayuda",
    search: "Buscar",
  },
  routes: {
    live: "En vivo",
    teams: "Selecciones",
    players: "Jugadores",
    matches: "Partidos",
    bracket: "Cuadro",
    settings: "Ajustes",
    help: "Ayuda",
    notFound: "Página no encontrada",
    descriptions: {
      live: "Rush en vivo del Mundial 2026, clasificación por grupos, ranking Elo, xG y mejores jugadores actualizados durante el torneo.",
      teams: "Explora todas las selecciones del Mundial 2026 con plantilla, forma y métricas del torneo.",
      players: "Estadísticas de jugadores del Mundial 2026: goles, asistencias, paradas y destacados.",
      matches: "Calendario y resultados completos del Mundial 2026 con horarios, grupos y marcadores finales.",
      bracket: "Cuadro eliminatorio del Mundial 2026: sigue el camino desde los dieciseisavos hasta la final.",
      settings: "Preferencias del panel y opciones de visualización.",
      help: "Cómo usar el panel del Mundial 2026: datos en vivo, clasificación, rankings y navegación.",
      notFound: "La página solicitada no está disponible en este panel.",
    },
  },
  language: { label: "Idioma" },
  theme: {
    label: "Tema",
    light: "Claro",
    dark: "Oscuro",
    system: "Sistema",
  },
  common: {
    all: "Todos",
    allConfederations: "Todas las confederaciones",
    allMatches: "Todos los partidos",
    team: "Equipo",
    vs: "vs",
    group: "Grupo {{group}}",
    knockout: "Eliminatorias",
    columns: "Columnas",
    rows: "Filas",
    more: "Más",
    open: "Abrir",
    share: "Compartir",
    delete: "Eliminar",
    filterByConfederation: "Filtrar por confederación",
    pos: "Pos",
    form: "Forma",
    formLast5SrOnly: " — últimos 5",
    rankChange: "Cambio de puesto",
    confederation: "Conf.",
    pageOf: "Página {{current}} de {{total}}",
    teamsRankedSorted: "{{count}} equipos clasificados · ordenado por {{sort}}",
    goToFirstPage: "Ir a la primera página",
    goToPreviousPage: "Ir a la página anterior",
    goToNextPage: "Ir a la página siguiente",
    goToLastPage: "Ir a la última página",
    last5Results: "Últimos 5 resultados: {{results}}",
    yellowCardsCount: "{{count}} tarjetas amarillas",
    redCardsCount: "{{count}} tarjetas rojas",
    win: "Victoria",
    draw: "Empate",
    loss: "Derrota",
    selectGroup: "Seleccionar grupo",
    selectMatchFilter: "Seleccionar filtro de partidos",
    selectPerformerCategory: "Seleccionar categoría de jugador",
    toggleSidebar: "Mostrar u ocultar barra lateral",
    documents: "Documentos",
    account: "Cuenta",
    billing: "Facturación",
    notifications: "Notificaciones",
    logOut: "Cerrar sesión",
  },
  pages: {
    teams: { description: "Tarjetas de equipos, filtros y perfiles." },
    players: { description: "Rankings, modos de estadísticas y perfiles de jugadores." },
    matches: { description: "Detalle del partido, capas del campo y líneas de tiempo." },
    bracket: { description: "Fases eliminatorias desde dieciseisavos hasta la final." },
    settings: { description: "Preferencias, filtros y opciones de visualización." },
    help: { description: "Guías, atajos y enlaces de soporte." },
    notFound: {
      message: "Esta ruta aún no existe.",
      backToLive: "Volver a En vivo",
    },
  },
  liveRush: {
    demoDate: "sábado, 13 de junio de 2026",
    title: "Rush en vivo",
    description: "Partidos en vivo del día",
    noMatches: "No hay partidos en esta vista.",
    tabs: {
      all: "Todos",
      finished: "Finalizados",
      live: "En vivo",
      upcoming: "Próximos",
    },
    footer: {
      finished: "Final del partido — rush cerrado",
      live: "En juego — los goles cuentan ahora",
      upcoming: "Pendiente de inicio — picks abiertos",
    },
  },
  matchCard: {
    live: "En vivo",
    fullTime: "FT",
    liveKickoff: "{{label}} en vivo",
  },
  sectionCards: {
    goalsToday: "Goles hoy",
    goalsTodayTrend: "Por encima de la jornada de ayer",
    goalsTodayFootnote: "En todos los partidos completados hoy",
    matchesPlayed: "Partidos jugados",
    matchesPlayedTrend: "Queda un partido por jugar",
    matchesPlayedBadge: "1 pendiente",
    matchesPlayedFootnote: "Jornada del torneo de hoy",
    topXgToday: "Mejor xG hoy",
    topXgTrend: "Mayor amenaza esperada",
    topXgFootnote: "Liderado por Mbappé vs México",
    cardsToday: "Tarjetas hoy",
    cardsTrend: "Resumen disciplinario",
    cardsFootnote: "Tarjetas amarillas y rojas de hoy",
  },
  topPerformers: {
    title: "Mejores jugadores",
    description: "Destacados del torneo hasta ahora",
    tabs: { goals: "Goles", assists: "Asistencias", saves: "Paradas" },
  },
  groupStandings: {
    title: "Clasificación por grupos",
    description: "Los dos primeros de cada grupo avanzan a dieciseisavos",
    groupShort: "Grupo {{group}}",
    selectPlaceholder: "Grupo A",
    tableAriaLabel: "Clasificación del grupo {{group}}",
  },
  powerRanking: {
    title: "Ranking de poder del torneo",
    description:
      "Récord, goles, xG y disciplina en fase de grupos. Elo aplica una pequeña penalización por amarilla (−{{yellowPenalty}}) y roja (−{{redPenalty}}) — pasa el cursor sobre la puntuación para el desglose.",
    tableAriaLabel: "Ranking de poder del torneo",
    noTeams: "Ningún equipo coincide con este filtro.",
    topRankAria: "{{team}}, entre el top {{threshold}} del ranking",
    eloTooltip: {
      base: "Elo base {{elo}}",
      discipline:
        " · −{{penalty}} disciplina ({{yellow}} amarillas × {{yellowPenalty}}, {{red}} rojas × {{redPenalty}})",
      none: " · sin penalización disciplinaria",
    },
  },
} as const
