from logging.config import fileConfig
from sqlalchemy import engine_from_config
from sqlalchemy import pool
from alembic import context
import os
import sys

# Add the current directory (backend) to sys.path so we can import config and db
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from config.db import Base, SQLALCHEMY_DATABASE_URL
from db.models.teams import Team
from db.models.matches import Match
from db.models.players import Player
from db.models.elo import TeamEloHistory
from db.models.historical_matches import HistoricalMatch
from db.models.fifa_ranking_snapshot import FifaRankingSnapshot
from db.models.ml_elo_history import MlEloHistory
from db.models.training_examples import TrainingExample

# this is the Alembic Config object, which provides access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Set the target_metadata to our Base.metadata
target_metadata = Base.metadata

def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = SQLALCHEMY_DATABASE_URL
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        include_object=include_object
    )

    with context.begin_transaction():
        context.run_migrations()

def include_object(object, name, type_, reflected, compare_to):
    if type_ == "table":
        return name in target_metadata.tables
    return True

def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    # We override the url from alembic.ini with the one from our config
    configuration = config.get_section(config.config_ini_section, {})
    configuration["sqlalchemy.url"] = SQLALCHEMY_DATABASE_URL
    
    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, 
            target_metadata=target_metadata,
            include_object=include_object
        )

        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
