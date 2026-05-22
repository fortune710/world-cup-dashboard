from sqlalchemy import Column, Integer, String
from backend.config.db import Base

class Team(Base):
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    code = Column(String, unique=True, index=True)
    logo_url = Column(String, nullable=True)
    group = Column(String, nullable=True)
