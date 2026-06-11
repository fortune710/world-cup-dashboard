## Coding Agent Instrutions

### Backend
1. Always include structured logging in every fucntion or methods you create or edit and use the logger methods directly.
DO NOT create a helper function to log events.

2. For every ETL pipeline you create, separate tasks into extract, transform and load tasks.

3. All database migrations must be idempotent. Use SQLAlchemy's inspector to check if tables, columns, or indexes exist before attempting to create or modify them to prevent deployment failures on pre-initialized databases.

4. Matchday stats defaults and indexes must be derived from the raw Sofascore `statistics` block documented inside `transform_matchday_stats` in the transformation layer. Keep the transformation docstring, `MATCHDAY_STATS_STATISTICS_FIELDS`, model defaults, migrations, and tests in sync whenever the matchday stats shape changes. Do not remove the `field` entry from matchday stats unless the transform contract itself changes. Do not use the broader player `stats_json` schema as the source of truth for matchday stats.
