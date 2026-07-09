from __future__ import annotations

import logging
from collections import defaultdict
from datetime import datetime
from typing import Any

from sqlalchemy.orm import Session

from db.controllers.fifa_ranking import get_nearest_fifa_rank
from db.controllers.historical_matches import get_historical_matches
from db.models.historical_matches import HistoricalMatch
from db.models.ml_elo_history import MlEloHistory
from pipeline.transformations.elo import DEFAULT_ELO_RATING, STAGE_WEIGHTS

logger = logging.getLogger(__name__)

# World Cup host nation(s) per tournament, using the same 3-letter codes as
# `historical_matches.home_team_code`/`away_team_code`. A single host per year --
# WC26's multi-host (USA/CAN/MEX) is out of scope, since training_examples only
# covers 2010-2022.
HOST_NATIONS = {
    2010: "RSA",
    2014: "BRA",
    2018: "RUS",
    2022: "QAT",
}

L5_WINDOW = 5


def _extract_xg(match: HistoricalMatch) -> tuple[float | None, float | None]:
    """Returns (home_xg, away_xg). Pre-2018 rows fall back to actual goals (spec'd --
    confirmed empirically that Sofascore has no xG data at all before 2018)."""
    if match.tournament_year < 2018:
        return float(match.home_score), float(match.away_score)

    stats = (match.detail_json or {}).get("stats")
    if not stats:
        return None, None

    for period in stats.get("statistics", []) or []:
        if period.get("period") != "ALL":
            continue
        for group in period.get("groups", []) or []:
            if group.get("groupName") != "Match overview":
                continue
            for item in group.get("statisticsItems", []) or []:
                if item.get("key") == "expectedGoals":
                    return item.get("homeValue"), item.get("awayValue")
    return None, None


def _extract_h2h(match: HistoricalMatch) -> dict[str, int | None]:
    h2h = (match.detail_json or {}).get("h2h") or {}
    team_duel = h2h.get("teamDuel") or {}
    return {
        "h2h_wins_home": team_duel.get("homeWins"),
        "h2h_wins_away": team_duel.get("awayWins"),
        "h2h_draws": team_duel.get("draws"),
    }


def _extract_avg_rating(match: HistoricalMatch) -> tuple[float | None, float | None]:
    form = (match.detail_json or {}).get("pre_match_form") or {}
    home_rating = (form.get("homeTeam") or {}).get("avgRating")
    away_rating = (form.get("awayTeam") or {}).get("avgRating")
    return (
        float(home_rating) if home_rating is not None else None,
        float(away_rating) if away_rating is not None else None,
    )


def _result_for_team(match: HistoricalMatch, is_home: bool) -> str:
    if match.home_pen is not None and match.away_pen is not None:
        home_won = match.home_pen > match.away_pen
    else:
        home_won = match.home_score > match.away_score
    if match.home_score == match.away_score and match.home_pen is None:
        return "D"
    return "W" if (home_won == is_home) else "L"


def _label_home_advanced(match: HistoricalMatch) -> bool:
    if match.home_pen is not None and match.away_pen is not None:
        return match.home_pen > match.away_pen
    return match.home_score > match.away_score


def _l5_features(prefix: str, history: list[dict]) -> dict[str, Any]:
    window = history[-L5_WINDOW:]
    if not window:
        return {
            f"{prefix}_goals_scored_l5": None,
            f"{prefix}_goals_conceded_l5": None,
            f"{prefix}_wins_l5": None,
            f"{prefix}_draws_l5": None,
            f"{prefix}_xg_for_l5": None,
            f"{prefix}_xg_against_l5": None,
        }

    xg_for_values = [w["xg_for"] for w in window if w["xg_for"] is not None]
    xg_against_values = [w["xg_against"] for w in window if w["xg_against"] is not None]
    return {
        f"{prefix}_goals_scored_l5": sum(w["goals_for"] for w in window) / len(window),
        f"{prefix}_goals_conceded_l5": sum(w["goals_against"] for w in window) / len(window),
        f"{prefix}_wins_l5": sum(1 for w in window if w["result"] == "W"),
        f"{prefix}_draws_l5": sum(1 for w in window if w["result"] == "D"),
        f"{prefix}_xg_for_l5": (sum(xg_for_values) / len(xg_for_values)) if xg_for_values else None,
        f"{prefix}_xg_against_l5": (sum(xg_against_values) / len(xg_against_values)) if xg_against_values else None,
    }


def _tournament_cumulative(prefix: str, history: list[dict], tournament_year: int) -> dict[str, Any]:
    prior_this_tournament = [w for w in history if w["tournament_year"] == tournament_year]
    if not prior_this_tournament:
        return {
            f"tournament_goals_scored_{prefix}": None,
            f"tournament_goals_conceded_{prefix}": None,
            f"tournament_wins_{prefix}": None,
            f"tournament_draws_{prefix}": None,
        }
    return {
        f"tournament_goals_scored_{prefix}": sum(w["goals_for"] for w in prior_this_tournament),
        f"tournament_goals_conceded_{prefix}": sum(w["goals_against"] for w in prior_this_tournament),
        f"tournament_wins_{prefix}": sum(1 for w in prior_this_tournament if w["result"] == "W"),
        f"tournament_draws_{prefix}": sum(1 for w in prior_this_tournament if w["result"] == "D"),
    }


def _days_rest(history: list[dict], tournament_year: int, kickoff_utc: datetime) -> int | None:
    prior_this_tournament = [w for w in history if w["tournament_year"] == tournament_year]
    if not prior_this_tournament:
        return None
    last_kickoff = max(w["kickoff_utc"] for w in prior_this_tournament)
    return (kickoff_utc - last_kickoff).days


def _most_recent_prior_delta(elo_by_team: dict[str, list[MlEloHistory]], team_code: str, kickoff_utc: datetime):
    rows = elo_by_team.get(team_code) or []
    prior = [r for r in rows if r.match_date < kickoff_utc]
    if not prior:
        return None
    return prior[-1].rating_delta


def build_training_examples(db: Session) -> list[dict]:
    """
    Joins `historical_matches` + `ml_elo_history` + `fifa_ranking_snapshot` +
    `HistoricalMatch.detail_json` into one row per match, computing every feature
    as of that match's kickoff (no outcome leakage). Requires the Elo replay
    (`db.controllers.ml_elo`) to have already been run.
    """
    logger.info({"message": "Starting training examples feature build"})

    matches = get_historical_matches(db)
    elo_rows = db.query(MlEloHistory).filter(MlEloHistory.source_match_table == "historical").all()

    elo_by_match_team: dict[tuple[int, str], MlEloHistory] = {
        (row.source_match_id, row.team_code): row for row in elo_rows
    }
    elo_by_team: dict[str, list[MlEloHistory]] = defaultdict(list)
    for row in sorted(elo_rows, key=lambda r: (r.match_date, r.id)):
        elo_by_team[row.team_code].append(row)

    team_history: dict[str, list[dict]] = defaultdict(list)
    rows_out = []

    for match in matches:
        home_elo_row = elo_by_match_team.get((match.id, match.home_team_code))
        away_elo_row = elo_by_match_team.get((match.id, match.away_team_code))
        if not home_elo_row or not away_elo_row:
            logger.warning({
                "message": "Missing Elo replay row for historical match; run the Elo replay first",
                "historical_match_id": match.id,
            })

        home_elo = home_elo_row.rating_before if home_elo_row else DEFAULT_ELO_RATING
        away_elo = away_elo_row.rating_before if away_elo_row else DEFAULT_ELO_RATING
        stage_weight = home_elo_row.stage_weight if home_elo_row else STAGE_WEIGHTS.get(match.round, 1.0)

        home_fifa_rank_row = get_nearest_fifa_rank(db, match.home_team_code, match.kickoff_utc.date())
        away_fifa_rank_row = get_nearest_fifa_rank(db, match.away_team_code, match.kickoff_utc.date())

        host_nation = HOST_NATIONS.get(match.tournament_year)
        is_host = host_nation in (match.home_team_code, match.away_team_code)

        home_history = team_history[match.home_team_code]
        away_history = team_history[match.away_team_code]

        row = {
            "historical_match_id": match.id,
            "tournament_year": match.tournament_year,
            "round": match.round,
            "kickoff_utc": match.kickoff_utc,
            "home_team_code": match.home_team_code,
            "away_team_code": match.away_team_code,
            "home_elo": home_elo,
            "away_elo": away_elo,
            "elo_diff": home_elo - away_elo,
            "elo_delta_home": _most_recent_prior_delta(elo_by_team, match.home_team_code, match.kickoff_utc),
            "elo_delta_away": _most_recent_prior_delta(elo_by_team, match.away_team_code, match.kickoff_utc),
            "home_fifa_rank": home_fifa_rank_row.rank if home_fifa_rank_row else None,
            "away_fifa_rank": away_fifa_rank_row.rank if away_fifa_rank_row else None,
            **_l5_features("home", home_history),
            **_l5_features("away", away_history),
            "stage_weight": stage_weight,
            "is_neutral": not is_host,
            "is_host": is_host,
            **_extract_h2h(match),
            "days_rest_home": _days_rest(home_history, match.tournament_year, match.kickoff_utc),
            "days_rest_away": _days_rest(away_history, match.tournament_year, match.kickoff_utc),
            "injured_key_players_home": False,
            "injured_key_players_away": False,
            **_tournament_cumulative("home", home_history, match.tournament_year),
            **_tournament_cumulative("away", away_history, match.tournament_year),
            "label_home_advanced": _label_home_advanced(match),
        }
        home_avg_rating, away_avg_rating = _extract_avg_rating(match)
        row["avg_player_rating_home"] = home_avg_rating
        row["avg_player_rating_away"] = away_avg_rating

        rows_out.append(row)

        home_xg, away_xg = _extract_xg(match)
        team_history[match.home_team_code].append({
            "tournament_year": match.tournament_year,
            "kickoff_utc": match.kickoff_utc,
            "goals_for": match.home_score,
            "goals_against": match.away_score,
            "result": _result_for_team(match, is_home=True),
            "xg_for": home_xg,
            "xg_against": away_xg,
        })
        team_history[match.away_team_code].append({
            "tournament_year": match.tournament_year,
            "kickoff_utc": match.kickoff_utc,
            "goals_for": match.away_score,
            "goals_against": match.home_score,
            "result": _result_for_team(match, is_home=False),
            "xg_for": away_xg,
            "xg_against": home_xg,
        })

    logger.info({"message": "Completed training examples feature build", "row_count": len(rows_out)})
    return rows_out
