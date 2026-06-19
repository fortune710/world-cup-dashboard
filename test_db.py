import sys
import os

# add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from config.db import SessionLocal
from db.models.players import Player
import sqlalchemy as sa

db = SessionLocal()

try:
    minutes_expr = sa.cast(Player.stats_json['minutes_played'].astext, sa.Integer)
    rows = db.query(Player).filter(minutes_expr >= 270).all()
    print("Success. Found:", len(rows))
except Exception as e:
    print("Error:", repr(e))
