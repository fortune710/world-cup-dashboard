# MLflow conventions (match outcome)

This directory is configuration-only. It defines conventions for MLflow tracking + registry used by the match outcome predictor.

## Environment variables

- `MLFLOW_TRACKING_URI`
  - Example (local): `http://mlflow:5000`
  - Example (file store): `file:/app/backend/pipeline/ml/match_outcome/data/mlruns`
- `MLFLOW_EXPERIMENT_NAME`
  - Default: `world-cup-match-outcome`
- `MLFLOW_MODEL_NAME`
  - Default: `world-cup-match-outcome-xgb`

## Tags (required on every run)

- `project`: `world-cup-dashboard`
- `model_family`: `xgboost`
- `task`: `match_outcome`
- `data_source`: `postgres_etl`
- `feature_set`: (string key, e.g. `v1`)
- `split_strategy`: (string key, e.g. `time_based_v1`)

## Artifacts (logged via MLflow)

- `feature_definitions.json` (canonical feature list + dtypes)
- `metrics.json` (validation metrics summary)
- `calibration.json` (if calibration is applied)
- `model_card.md` (human-readable report)

## Registry usage

- Only register models that pass the validation thresholds defined in `thresholds.json`.
- Promote versions through stages (e.g. `Staging` -> `Production`) outside of request paths.

