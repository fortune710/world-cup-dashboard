export const ko = {

  app: {

    title: "BF WC26 대시보드",

    skipToContent: "본문으로 건너뛰기",

  },

  nav: {

    live: "라이브",

    teams: "팀",

    players: "선수",

    matches: "경기",

    bracket: "토너먼트",

    settings: "설정",

    getHelp: "도움말",

    search: "검색",

  },

  routes: {

    live: "라이브",

    teams: "팀",

    players: "선수",

    matches: "경기",

    bracket: "토너먼트",

    settings: "설정",

    help: "도움말",

    notFound: "페이지를 찾을 수 없음",

    descriptions: {

      live: "2026 월드컵 라이브 러시, 조별 순위, Elo 파워 랭킹, xG, 대회 내내 업데이트되는 톱 퍼포머.",

      teams: "2026 월드컵 모든 팀의 스쿼드, 폼, 대회 성적 지표를 둘러보세요.",

      players: "2026 월드컵 선수 통계 — 골, 어시스트, 선방, 주목 선수.",

      matches: "2026 월드컵 전체 일정과 결과, 킥오프, 조, 최종 스코어.",

      bracket: "2026 월드컵 토너먼트 — 32강부터 결승까지.",

      settings: "대시보드 환경설정 및 표시 옵션.",

      help: "2026 월드컵 대시보드 사용법 — 라이브 데이터, 순위, 랭킹, 탐색.",

      notFound: "요청한 페이지는 이 대시보드에서 사용할 수 없습니다.",

    },

  },

  language: { label: "언어" },

  theme: {

    label: "테마",

    light: "라이트",

    dark: "다크",

    system: "시스템",

  },

  common: {

    all: "전체",

    allConfederations: "모든 연맹",

    allMatches: "모든 경기",

    team: "팀",

    vs: "vs",

    group: "조 {{group}}",

    knockout: "토너먼트",

    columns: "열",

    rows: "행",

    more: "더보기",

    open: "열기",

    share: "공유",

    delete: "삭제",

    filterByConfederation: "연맹별 필터",

    pos: "순위",

    form: "폼",

    formLast5SrOnly: " — 최근 5",

    rankChange: "순위 변동",

    confederation: "연맹",

    pageOf: "{{current}} / {{total}} 페이지",

    teamsRankedSorted: "{{count}}팀 순위 · {{sort}} 정렬",

    goToFirstPage: "첫 페이지로",

    goToPreviousPage: "이전 페이지",

    goToNextPage: "다음 페이지",

    goToLastPage: "마지막 페이지",

    last5Results: "최근 5경기: {{results}}",

    yellowCardsCount: "옐로카드 {{count}}장",

    redCardsCount: "레드카드 {{count}}장",

    win: "승",

    draw: "무",

    loss: "패",

    selectGroup: "조 선택",

    selectMatchFilter: "경기 필터 선택",

    selectPerformerCategory: "선수 카테고리 선택",

    toggleSidebar: "사이드바 토글",

    documents: "문서",

    account: "계정",

    billing: "결제",

    notifications: "알림",

    logOut: "로그아웃",

  },

  pages: {

    teams: { description: "팀 카드, 필터, 프로필." },

    players: { description: "랭킹, 통계 모드, 선수 프로필." },

    matches: { description: "경기 상세, 피치 레이어, 이벤트 타임라인." },

    bracket: { description: "32강부터 결승까지 토너먼트." },

    settings: { description: "환경설정, 필터, 표시 옵션." },

    help: { description: "가이드, 단축키, 지원 링크." },

    notFound: {

      message: "이 경로는 아직 없습니다.",

      backToLive: "라이브로 돌아가기",

    },

  },

  liveRush: {

    demoDate: "2026년 6월 13일 토요일",

    title: "라이브 러시",

    description: "오늘의 라이브 경기",

    noMatches: "이 보기에 경기가 없습니다.",

    tabs: {

      all: "전체",

      finished: "종료",

      live: "라이브",

      upcoming: "예정",

    },

    footer: {

      finished: "경기 종료 — 러시 확정",

      live: "진행 중 — 골이 지금 반영됩니다",

      upcoming: "킥오프 대기 — 픽 오픈",

    },

  },

  matchCard: {

    live: "라이브",

    fullTime: "종료",

    liveKickoff: "{{label}} 라이브",

  },

  sectionCards: {

    goalsToday: "오늘 골",

    goalsTodayTrend: "어제보다 증가",

    goalsTodayFootnote: "오늘 종료된 모든 경기",

    matchesPlayed: "진행 경기",

    matchesPlayedTrend: "남은 경기 1건",

    matchesPlayedBadge: "1건 남음",

    matchesPlayedFootnote: "오늘의 대회 일정",

    topXgToday: "오늘 최고 xG",

    topXgTrend: "최고 기대 위협",

    topXgFootnote: "음바페 vs 멕시코 주도",

    cardsToday: "오늘 카드",

    cardsTrend: "징계 스냅샷",

    cardsFootnote: "오늘 부여된 옐로·레드카드",

  },

  topPerformers: {

    title: "톱 퍼포머",

    description: "대회 초반 두각을 나타낸 선수",

    tabs: { goals: "골", assists: "어시스트", saves: "선방" },

  },

  groupStandings: {

    title: "조별리그 순위",

    description: "각 조 1·2위가 32강 진출",

    groupShort: "조 {{group}}",

    selectPlaceholder: "조 A",

    tableAriaLabel: "조 {{group}} 순위",
    loading: "순위표를 불러오는 중…",

  },

  powerRanking: {

    title: "대회 파워 랭킹",

    description:

      "조별리그 전적, 골, xG, 징계. Elo는 옐로(−{{yellowPenalty}})와 레드(−{{redPenalty}})에 소폭 감점 — 등급에 마우스를 올려 상세 확인.",

    tableAriaLabel: "대회 파워 랭킹",

    noTeams: "이 필터에 맞는 팀이 없습니다.",

    topRankAria: "{{team}}, 파워 랭킹 상위 {{threshold}}",

    eloTooltip: {

      base: "기본 Elo {{elo}}",

      discipline:

        " · −{{penalty}} 징계 (옐로 {{yellow}} × {{yellowPenalty}}, 레드 {{red}} × {{redPenalty}})",

      none: " · 징계 감점 없음",

    },

  },

} as const


