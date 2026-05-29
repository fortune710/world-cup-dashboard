import { createBrowserRouter } from "react-router"

import { AppLayout } from "@/layouts/app-layout"
import { BracketPage } from "@/pages/bracket-page"
import { HelpPage } from "@/pages/help-page"
import { LivePage } from "@/pages/live-page"
import { MatchesPage } from "@/pages/matches-page"
import { NotFoundPage } from "@/pages/not-found-page"
import { PlayersPage } from "@/pages/players-page"
import { SettingsPage } from "@/pages/settings-page"
import { TeamsPage } from "@/pages/teams-page"

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <LivePage /> },
      { path: "teams", element: <TeamsPage /> },
      { path: "players", element: <PlayersPage /> },
      { path: "matches", element: <MatchesPage /> },
      { path: "bracket", element: <BracketPage /> },
      { path: "settings", element: <SettingsPage /> },
      { path: "help", element: <HelpPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
])
