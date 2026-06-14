import logging
from datetime import datetime
from typing import Any


logger = logging.getLogger(__name__)

DEFAULT_ELO_RATING = 1500.0
BASE_K_FACTOR = 30.0
HOME_ADVANTAGE = 100.0
"""
HOME_ADVANTAGE boosts the home team's rating by 100 points for the probability calculation.
This 100-point boost results in approximately 64% win expectancy versus 36% for equal-rated teams.
"""

DRAW_BONUS = 5.0
"""
DRAW_BONUS adds a flat 5-point bonus to both teams' Elo changes when a match ends in a draw
(excluding penalty shootouts). This breaks the zero-sum property of standard Elo, causing
total ratings to inflate by 10.0 points per draw (5.0 for each team).
"""
STAGE_WEIGHTS = {
    "group": 1.0,
    "group stage": 1.0,
    "round of 32": 1.15,
    "r32": 1.15,
    "round of 16": 1.25,
    "r16": 1.25,
    "quarterfinal": 1.5,
    "quarter-final": 1.5,
    "semifinal": 1.75,
    "semi-final": 1.75,
    "third place": 1.5,
    "final": 2.0,
}


class EloTransformations:
    """
    Transformation layer for recalculating team Elo ratings from completed matches.
    """

    def calculate_ratings(
        self,
        teams: list[Any],
        matches: list[Any],
        use_existing_ratings: bool = False,
    ) -> dict[str, Any]:
        """
        Recalculates current team ratings and match-by-match rating history.
        """
        logger.info({
            "message": "Starting Elo rating calculation",
            "team_count": len(teams or []),
            "match_count": len(matches or []),
            "use_existing_ratings": use_existing_ratings,
        })

        ratings: dict[str, float] = {}
        for team in teams or []:
            team_code = team.get("code") if isinstance(team, dict) else getattr(team, "code", None)
            if not team_code:
                logger.warning({"message": "Skipping team without code during Elo calculation"})
                continue

            existing_rating = None
            if use_existing_ratings:
                existing_rating = (
                    team.get("elo_rating") if isinstance(team, dict) else getattr(team, "elo_rating", None)
                )
            ratings[team_code] = float(existing_rating or DEFAULT_ELO_RATING)

        completed_matches = []
        for match in matches or []:
            status = match.get("status") if isinstance(match, dict) else getattr(match, "status", None)
            if status != "completed":
                continue
            kickoff_utc = (
                match.get("kickoff_utc") if isinstance(match, dict) else getattr(match, "kickoff_utc", None)
            )
            if isinstance(kickoff_utc, datetime):
                sort_value = kickoff_utc.isoformat()
            else:
                sort_value = str(kickoff_utc or "")
            completed_matches.append((sort_value, match))

        completed_matches = sorted(
            completed_matches,
            key=lambda item: item[0],
        )

        history: list[dict[str, Any]] = []
        for sort_value, match in completed_matches:
            match_id = match.get("id") if isinstance(match, dict) else getattr(match, "id", None)
            round_name = match.get("round") if isinstance(match, dict) else getattr(match, "round", None)
            home_team_code = (
                match.get("home_team_code") if isinstance(match, dict) else getattr(match, "home_team_code", None)
            )
            away_team_code = (
                match.get("away_team_code") if isinstance(match, dict) else getattr(match, "away_team_code", None)
            )
            home_score = (
                match.get("home_score", 0) if isinstance(match, dict) else getattr(match, "home_score", 0)
            ) or 0
            away_score = (
                match.get("away_score", 0) if isinstance(match, dict) else getattr(match, "away_score", 0)
            ) or 0
            home_pen = match.get("home_pen") if isinstance(match, dict) else getattr(match, "home_pen", None)
            away_pen = match.get("away_pen") if isinstance(match, dict) else getattr(match, "away_pen", None)

            if not home_team_code or not away_team_code:
                logger.warning({
                    "message": "Skipping completed match without both team codes during Elo calculation",
                    "match_id": match_id,
                    "home_team_code": home_team_code,
                    "away_team_code": away_team_code,
                })
                continue

            ratings.setdefault(home_team_code, DEFAULT_ELO_RATING)
            ratings.setdefault(away_team_code, DEFAULT_ELO_RATING)

            home_rating_before = ratings[home_team_code]
            away_rating_before = ratings[away_team_code]
            home_expected = 1 / (1 + 10 ** ((away_rating_before - (home_rating_before + HOME_ADVANTAGE)) / 400))
            away_expected = 1 - home_expected

            penalty_shootout = (
                home_score == away_score
                and home_pen is not None
                and away_pen is not None
                and home_pen != away_pen
            )
            if penalty_shootout:
                home_actual = 0.75 if home_pen > away_pen else 0.25
                away_actual = 1 - home_actual
                margin_multiplier = 1.0
            elif home_score > away_score:
                home_actual = 1.0
                away_actual = 0.0
                goal_diff = abs(home_score - away_score)
                margin_multiplier = 1.0 if goal_diff == 1 else 1.25 if goal_diff == 2 else 1.5
            elif away_score > home_score:
                home_actual = 0.0
                away_actual = 1.0
                goal_diff = abs(home_score - away_score)
                margin_multiplier = 1.0 if goal_diff == 1 else 1.25 if goal_diff == 2 else 1.5
            else:
                home_actual = 0.5
                away_actual = 0.5
                margin_multiplier = 1.0

            normalized_round = str(round_name or "").strip().lower()
            stage_weight = STAGE_WEIGHTS.get(normalized_round)
            if stage_weight is None and "round of 32" in normalized_round:
                stage_weight = STAGE_WEIGHTS["round of 32"]
            elif stage_weight is None and "round of 16" in normalized_round:
                stage_weight = STAGE_WEIGHTS["round of 16"]
            elif stage_weight is None and "quarter" in normalized_round:
                stage_weight = STAGE_WEIGHTS["quarterfinal"]
            elif stage_weight is None and "semi" in normalized_round:
                stage_weight = STAGE_WEIGHTS["semifinal"]
            elif stage_weight is None and "third" in normalized_round:
                stage_weight = STAGE_WEIGHTS["third place"]
            elif stage_weight is None and "final" in normalized_round:
                stage_weight = STAGE_WEIGHTS["final"]
            elif stage_weight is None:
                stage_weight = 1.0
            home_delta = BASE_K_FACTOR * stage_weight * margin_multiplier * (home_actual - home_expected)
            away_delta = BASE_K_FACTOR * stage_weight * margin_multiplier * (away_actual - away_expected)

            # Apply a flat draw bonus if the match ended in a draw (and not resolved by penalty shootout).
            # Note: This is an intentional design choice to reward competitive matches. It breaks the
            # zero-sum property of traditional Elo, inflating the total rating pool by 10.0 points per draw.
            # Cumulative growth of the rating pool is monitored via the logged delta contribution below.
            is_draw = home_score == away_score and not penalty_shootout
            if is_draw:
                home_delta += DRAW_BONUS
                away_delta += DRAW_BONUS
                logger.info({
                    "message": "Applied draw bonus to match Elo deltas",
                    "match_id": match_id,
                    "draw_bonus": DRAW_BONUS,
                    "home_delta_before": home_delta - DRAW_BONUS,
                    "home_delta_after": home_delta,
                    "away_delta_before": away_delta - DRAW_BONUS,
                    "away_delta_after": away_delta,
                })

            home_rating_after = home_rating_before + home_delta
            away_rating_after = away_rating_before + away_delta

            ratings[home_team_code] = home_rating_after
            ratings[away_team_code] = away_rating_after

            history.append({
                "match_id": match_id,
                "team_code": home_team_code,
                "opponent_code": away_team_code,
                "rating_before": home_rating_before,
                "rating_after": home_rating_after,
                "rating_delta": home_delta,
                "expected_score": home_expected,
                "actual_score": home_actual,
                "stage_weight": stage_weight,
                "margin_multiplier": margin_multiplier,
            })
            history.append({
                "match_id": match_id,
                "team_code": away_team_code,
                "opponent_code": home_team_code,
                "rating_before": away_rating_before,
                "rating_after": away_rating_after,
                "rating_delta": away_delta,
                "expected_score": away_expected,
                "actual_score": away_actual,
                "stage_weight": stage_weight,
                "margin_multiplier": margin_multiplier,
            })

            logger.info({
                "message": "Calculated Elo changes for match",
                "match_id": match_id,
                "home_team_code": home_team_code,
                "away_team_code": away_team_code,
                "home_delta": home_delta,
                "away_delta": away_delta,
                "penalty_shootout": penalty_shootout,
            })

        logger.info({
            "message": "Completed Elo rating calculation",
            "rated_team_count": len(ratings),
            "history_count": len(history),
        })
        return {"team_ratings": ratings, "history": history}
