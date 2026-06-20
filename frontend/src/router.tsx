/* eslint-disable react-refresh/only-export-components */
import * as React from "react"
import { createBrowserRouter } from "react-router"

import { AppLayout } from "@/layouts/app-layout"
import { RouteErrorPage } from "@/pages/route-error-page"

const BracketPage = React.lazy(() => import("@/pages/bracket-page").then(m => ({ default: m.BracketPage })))
const HelpPage = React.lazy(() => import("@/pages/help-page").then(m => ({ default: m.HelpPage })))
const LivePage = React.lazy(() => import("@/pages/live-page").then(m => ({ default: m.LivePage })))
const MatchesPage = React.lazy(() => import("@/pages/matches-page").then(m => ({ default: m.MatchesPage })))
const NotFoundPage = React.lazy(() => import("@/pages/not-found-page").then(m => ({ default: m.NotFoundPage })))
const PlayerComparePage = React.lazy(() => import("@/pages/player-compare-page").then(m => ({ default: m.PlayerComparePage })))
const PlayerDetailsPage = React.lazy(() => import("@/pages/player-details-page").then(m => ({ default: m.PlayerDetailsPage })))
const PlayersPage = React.lazy(() => import("@/pages/players-page").then(m => ({ default: m.PlayersPage })))
const SettingsPage = React.lazy(() => import("@/pages/settings-page").then(m => ({ default: m.SettingsPage })))
const TeamDetailsPage = React.lazy(() => import("@/pages/team-details-page").then(m => ({ default: m.TeamDetailsPage })))
const TeamsPage = React.lazy(() => import("@/pages/teams-page").then(m => ({ default: m.TeamsPage })))

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <LivePage /> },
      { path: "teams", element: <TeamsPage /> },
      { path: "teams/:teamId", element: <TeamDetailsPage /> },
      { path: "players", element: <PlayersPage /> },
      { path: "players/:playerId/compare", element: <PlayerComparePage /> },
      { path: "players/:playerId", element: <PlayerDetailsPage /> },
      { path: "matches", element: <MatchesPage /> },
      { path: "bracket", element: <BracketPage /> },
      { path: "settings", element: <SettingsPage /> },
      { path: "help", element: <HelpPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
])

