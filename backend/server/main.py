from fastapi import FastAPI
from config.db import engine, Base

# Create tables on startup (simplest way without migrations for now)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="World Cup Dashboard API")

@app.get("/")
def read_root():
    return {"message": "Welcome to the World Cup Dashboard API"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}
