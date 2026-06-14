export const fr = {

  app: {

    title: "Tableau de bord BF WC26",

    skipToContent: "Aller au contenu principal",

  },

  nav: {

    live: "En direct",

    teams: "Équipes",

    players: "Joueurs",

    matches: "Matchs",

    bracket: "Tableau",

    settings: "Paramètres",

    getHelp: "Aide",

    search: "Rechercher",

  },

  routes: {

    live: "En direct",

    teams: "Équipes",

    players: "Joueurs",

    matches: "Matchs",

    bracket: "Tableau",

    settings: "Paramètres",

    help: "Aide",

    notFound: "Page introuvable",

    descriptions: {

      live: "Rush en direct de la Coupe du monde 2026, classements de groupes, ranking Elo, xG et meilleurs joueurs mis à jour tout au long du tournoi.",

      teams: "Parcourez toutes les équipes de la Coupe du monde 2026 avec effectifs, forme et statistiques du tournoi.",

      players: "Statistiques joueurs de la Coupe du monde 2026 — buts, passes décisives, arrêts et performances marquantes.",

      matches: "Calendrier et résultats complets de la Coupe du monde 2026 avec horaires, groupes et scores finaux.",

      bracket: "Tableau à élimination directe de la Coupe du monde 2026 — suivez le parcours des huitièmes à la finale.",

      settings: "Préférences du tableau de bord et options d'affichage.",

      help: "Comment utiliser le tableau de bord Coupe du monde 2026 — données en direct, classements, rankings et navigation.",

      notFound: "La page demandée n'est pas disponible sur ce tableau de bord.",

    },

  },

  language: { label: "Langue" },

  theme: {

    label: "Thème",

    light: "Clair",

    dark: "Sombre",

    system: "Système",

  },

  common: {

    all: "Tous",

    allConfederations: "Toutes les confédérations",

    allMatches: "Tous les matchs",

    team: "Équipe",

    vs: "vs",

    group: "Groupe {{group}}",

    knockout: "Éliminatoires",

    columns: "Colonnes",

    rows: "Lignes",

    more: "Plus",

    open: "Ouvrir",

    share: "Partager",

    delete: "Supprimer",

    filterByConfederation: "Filtrer par confédération",

    pos: "Pos",

    form: "Forme",

    formLast5SrOnly: " — 5 derniers",

    rankChange: "Évolution du rang",

    confederation: "Conf.",

    pageOf: "Page {{current}} sur {{total}}",

    teamsRankedSorted: "{{count}} équipes classées · tri par {{sort}}",

    goToFirstPage: "Aller à la première page",

    goToPreviousPage: "Aller à la page précédente",

    goToNextPage: "Aller à la page suivante",

    goToLastPage: "Aller à la dernière page",

    last5Results: "5 derniers résultats : {{results}}",

    yellowCardsCount: "{{count}} cartons jaunes",

    redCardsCount: "{{count}} cartons rouges",

    win: "Victoire",

    draw: "Nul",

    loss: "Défaite",

    selectGroup: "Sélectionner le groupe",

    selectMatchFilter: "Sélectionner le filtre de matchs",

    selectPerformerCategory: "Sélectionner la catégorie de joueur",

    toggleSidebar: "Afficher/masquer la barre latérale",

    documents: "Documents",

    account: "Compte",

    billing: "Facturation",

    notifications: "Notifications",

    logOut: "Se déconnecter",

  },

  pages: {

    teams: { description: "Fiches d'équipes, filtres et profils." },

    players: { description: "Classements, modes de stats et profils joueurs." },

    matches: { description: "Détail du match, couches du terrain et chronologies." },

    bracket: { description: "Phases à élimination des huitièmes à la finale." },

    settings: { description: "Préférences, filtres et options d'affichage." },

    help: { description: "Guides, raccourcis et liens d'assistance." },

    notFound: {

      message: "Cette route n'existe pas encore.",

      backToLive: "Retour au direct",

    },

  },

  liveRush: {

    demoDate: "samedi 13 juin 2026",

    title: "Rush en direct",

    description: "Matchs en direct du jour",

    noMatches: "Aucun match dans cette vue.",

    tabs: {

      all: "Tous",

      finished: "Terminés",

      live: "En direct",

      upcoming: "À venir",

    },

    footer: {

      finished: "Fin du match — rush verrouillé",

      live: "En cours — les buts comptent maintenant",

      upcoming: "Coup d'envoi en attente — picks ouverts",

    },

  },

  matchCard: {

    live: "En direct",

    fullTime: "FT",

    liveKickoff: "{{label}} en direct",

  },

  sectionCards: {

    goalsToday: "Meilleure note aujourd'hui",

    goalsTodayTrend: "Note de match la plus haute",

    goalsTodayFootnote: "Mené par {{playerName}}",

    matchesPlayed: "Matchs joués",

    matchesPlayedTrend: "Un match encore à jouer",

    matchesPlayedBadge: "1 restant",

    matchesPlayedFootnote: "Journée du tournoi d'aujourd'hui",

    topXgToday: "Contributions aux buts aujourd'hui",

    topXgTrend: "Plus forte implication directe dans les buts",

    topXgFootnote: "Mené par {{playerName}}",

    cardsToday: "Précision de passe aujourd'hui",

    cardsTrend: "Meilleure précision de passe",

    cardsFootnote: "Mené par {{playerName}}",

  },

  topPerformers: {

    title: "Meilleurs joueurs",

    description: "Les stars du tournoi jusqu'ici",

    tabs: { goals: "Buts", assists: "Passes D.", saves: "Arrêts" },

  },

  groupStandings: {

    title: "Classement des groupes",

    description: "Les deux premiers de chaque groupe passent en seizièmes",

    groupShort: "Groupe {{group}}",

    selectPlaceholder: "Groupe A",

    tableAriaLabel: "Classement du groupe {{group}}",
    loading: "Chargement du classement…",

  },

  powerRanking: {

    title: "Classement de puissance du tournoi",

    description:

      "Bilan, buts, xG et discipline en phase de groupes. L'Elo applique une petite pénalité pour jaune (−{{yellowPenalty}}) et rouge (−{{redPenalty}}) — survolez une note pour le détail.",

    tableAriaLabel: "Classement de puissance du tournoi",

    noTeams: "Aucune équipe ne correspond à ce filtre.",

    topRankAria: "{{team}}, dans le top {{threshold}} du classement",

    eloTooltip: {

      base: "Elo de base {{elo}}",

      discipline:

        " · −{{penalty}} discipline ({{yellow}} jaunes × {{yellowPenalty}}, {{red}} rouges × {{redPenalty}})",

      none: " · aucune pénalité disciplinaire",

    },

  },

} as const


