from fastapi import FastAPI
from server.routes import predictions, teams, matches

app = FastAPI(title="World Cup Dashboard API")

app.include_router(predictions.router)
app.include_router(teams.router)
app.include_router(matches.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to the World Cup Dashboard API"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}
