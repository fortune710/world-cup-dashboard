## Coding Agent Instrutions

### Backend
1. Always include structured logging in every fucntion or methods you create or edit and use the logger methods directly.
DO NOT create a helper function to log events.

2. For every ETL pipeline you create, separate tasks into extract, transform and load tasks.

3. All database migrations must be idempotent. Use SQLAlchemy's inspector to check if tables, columns, or indexes exist before attempting to create or modify them to prevent deployment failures on pre-initialized databases.