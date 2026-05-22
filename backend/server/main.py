from fastapi import FastAPI
from config.db import engine, Base
from db.models import matches, teams

app = FastAPI(title="World Cup Dashboard API")

@app.on_event("startup")
def create_tables():
    # Simple startup table creation until migrations are added.
    Base.metadata.create_all(bind=engine)

@app.get("/")
def read_root():
    return {"message": "Welcome to the World Cup Dashboard API"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}
