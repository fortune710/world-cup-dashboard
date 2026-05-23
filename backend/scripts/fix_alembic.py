from sqlalchemy import create_engine, text
import sys
import os

# Add current dir to path
sys.path.insert(0, os.getcwd())

from config.db import SQLALCHEMY_DATABASE_URL

def clear_alembic():
    try:
        engine = create_engine(SQLALCHEMY_DATABASE_URL)
        with engine.connect() as connection:
            connection.execute(text('DROP TABLE IF EXISTS alembic_version'))
            connection.commit()
            print("Successfully dropped alembic_version table.")
        return True
    except Exception as e:
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    clear_alembic()
