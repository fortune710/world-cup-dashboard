# Alembic plan: `match_predictions` (PRD)

This file documents the intended Alembic migration(s) for the prediction persistence tables described in [`WC26_Dashboard_PRD_TRD.md`](../../../WC26_Dashboard_PRD_TRD.md).

## Target table

Create table: `match_predictions`

### Columns

- `prediction_id` (SERIAL / INTEGER, primary key)
- `match_id` (INTEGER, **FK** -> match table)
- `model_version` (VARCHAR(20), not null)
- `predicted_at` (TIMESTAMPTZ, not null)
- `home_win_prob` (NUMERIC(6,4), not null)
- `draw_prob` (NUMERIC(6,4), not null)
- `away_win_prob` (NUMERIC(6,4), not null)
- `home_xg_pred` (NUMERIC(5,3), nullable)
- `away_xg_pred` (NUMERIC(5,3), nullable)
- `confidence` (NUMERIC(5,4), nullable)
- `features_snapshot` (JSONB, nullable)

### Constraints

- Unique: `(match_id, model_version, predicted_at)`

### Indexes

- BTree: `idx_predictions_match` on `(match_id)`

### Foreign key target (repo alignment note)

The PRD references `dim_match(match_id)`. The current codebase today has `matches(id)` in [`backend/db/models/matches.py`](../../db/models/matches.py).

When implementing the migration, choose one:

- **Option A (minimal, matches current DB)**: FK `match_predictions.match_id -> matches.id`
- **Option B (analytics/star-schema)**: introduce `dim_match` and use FK to `dim_match.match_id` (larger schema migration)

## Rollout sequencing

1. Create the table + indexes.
2. Add an ORM model + controller/upsert layer for `match_predictions`.
3. Update inference to persist predictions with `features_snapshot`.

## Backfill (optional)

If needed, backfill can be scheduled as a batch inference DAG that computes predictions for all scheduled fixtures and writes one row per `(match_id, model_version, predicted_at)`.

