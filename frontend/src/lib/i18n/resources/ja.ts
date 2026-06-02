export const ja = {
  app: {
    title: "BF WC26 ダッシュボード",
    skipToContent: "メインコンテンツへスキップ",
  },
  nav: {
    live: "ライブ",
    teams: "チーム",
    players: "選手",
    matches: "試合",
    bracket: "トーナメント表",
    settings: "設定",
    getHelp: "ヘルプ",
    search: "検索",
  },
  routes: {
    live: "ライブ",
    teams: "チーム",
    players: "選手",
    matches: "試合",
    bracket: "トーナメント表",
    settings: "設定",
    help: "ヘルプ",
    notFound: "ページが見つかりません",
    descriptions: {
      live: "W杯2026ライブラッシュ、グループ順位、Eloパワーランキング、xG、大会を通じたトップパフォーマー。",
      teams: "W杯2026全チームのメンバー、調子、大会成績を閲覧。",
      players: "W杯2026選手統計 — ゴール、アシスト、セーブ、注目選手。",
      matches: "W杯2026の全試合日程と結果、キックオフ、グループ、最終スコア。",
      bracket: "W杯2026ノックアウト表 — ラウンド32から決勝まで。",
      settings: "ダッシュボードの設定と表示オプション。",
      help: "W杯2026ダッシュボードの使い方 — ライブデータ、順位、ランキング、ナビゲーション。",
      notFound: "リクエストされたページはこのダッシュボードでは利用できません。",
    },
  },
  language: { label: "言語" },
  theme: {
    label: "テーマ",
    light: "ライト",
    dark: "ダーク",
    system: "システム",
  },
  common: {
    all: "すべて",
    allConfederations: "すべての連盟",
    allMatches: "すべての試合",
    team: "チーム",
    vs: "vs",
    group: "グループ {{group}}",
    knockout: "ノックアウト",
    columns: "列",
    rows: "行",
    more: "その他",
    open: "開く",
    share: "共有",
    delete: "削除",
    filterByConfederation: "連盟で絞り込み",
    pos: "順位",
    form: "調子",
    formLast5SrOnly: " — 直近5",
    rankChange: "順位変動",
    confederation: "連盟",
    pageOf: "{{current}} / {{total}} ページ",
    teamsRankedSorted: "{{count}} チーム · {{sort}} でソート",
    goToFirstPage: "最初のページへ",
    goToPreviousPage: "前のページへ",
    goToNextPage: "次のページへ",
    goToLastPage: "最後のページへ",
    last5Results: "直近5試合: {{results}}",
    yellowCardsCount: "イエローカード {{count}} 枚",
    redCardsCount: "レッドカード {{count}} 枚",
    win: "勝ち",
    draw: "引き分け",
    loss: "負け",
    selectGroup: "グループを選択",
    selectMatchFilter: "試合フィルターを選択",
    selectPerformerCategory: "カテゴリを選択",
    toggleSidebar: "サイドバーの表示切替",
    documents: "ドキュメント",
    account: "アカウント",
    billing: "請求",
    notifications: "通知",
    logOut: "ログアウト",
  },
  pages: {
    teams: { description: "チームカード、フィルター、プロフィール。" },
    players: { description: "ランキング、統計モード、選手プロフィール。" },
    matches: { description: "試合詳細、ピッチレイヤー、イベントタイムライン。" },
    bracket: { description: "ラウンド32から決勝までのノックアウト。" },
    settings: { description: "設定、フィルター、表示オプション。" },
    help: { description: "ガイド、ショートカット、サポートリンク。" },
    notFound: {
      message: "このルートはまだ存在しません。",
      backToLive: "ライブに戻る",
    },
  },
  liveRush: {
    demoDate: "2026年6月13日（土）",
    title: "ライブラッシュ",
    description: "本日のライブ試合",
    noMatches: "この表示に試合はありません。",
    tabs: {
      all: "すべて",
      finished: "終了",
      live: "ライブ",
      upcoming: "予定",
    },
    footer: {
      finished: "試合終了 — ラッシュ確定",
      live: "進行中 — ゴールは現在カウント",
      upcoming: "キックオフ待ち — ピック受付中",
    },
  },
  matchCard: {
    live: "ライブ",
    fullTime: "終了",
    liveKickoff: "{{label}} ライブ",
  },
  sectionCards: {
    goalsToday: "本日のゴール",
    goalsTodayTrend: "昨日より増加",
    goalsTodayFootnote: "本日終了した全試合",
    matchesPlayed: "消化試合",
    matchesPlayedTrend: "残り1試合",
    matchesPlayedBadge: "残り1",
    matchesPlayedFootnote: "本日の大会スケジュール",
    topXgToday: "本日トップxG",
    topXgTrend: "最高の期待脅威",
    topXgFootnote: "ムバッペ vs メキシコが牽引",
    cardsToday: "本日のカード",
    cardsTrend: "規律スナップショット",
    cardsFootnote: "本日のイエロー・レッドカード",
  },
  topPerformers: {
    title: "トップパフォーマー",
    description: "大会序盤の注目選手",
    tabs: { goals: "ゴール", assists: "アシスト", saves: "セーブ" },
  },
  groupStandings: {
    title: "グループステージ順位",
    description: "各組1・2位がラウンド32へ",
    groupShort: "グループ {{group}}",
    selectPlaceholder: "グループ A",
    tableAriaLabel: "グループ {{group}} 順位",
  },
  powerRanking: {
    title: "大会パワーランキング",
    description:
      "グループステージの成績、ゴール、xG、規律。Eloはイエロー（−{{yellowPenalty}}）とレッド（−{{redPenalty}}）に小さな減点 — 評価にホバーで内訳。",
    tableAriaLabel: "大会パワーランキング",
    noTeams: "このフィルターに一致するチームはありません。",
    topRankAria: "{{team}}、パワーランキング上位{{threshold}}",
    eloTooltip: {
      base: "ベースElo {{elo}}",
      discipline:
        " · −{{penalty}} 規律（イエロー {{yellow}} × {{yellowPenalty}}、レッド {{red}} × {{redPenalty}}）",
      none: " · 規律減点なし",
    },
  },
} as const
