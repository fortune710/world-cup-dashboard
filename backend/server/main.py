import logging

from fastapi import FastAPI
from server.routes import predictions, teams, matches, ratings, players, bracket


logger = logging.getLogger(__name__)

app = FastAPI(title="World Cup Dashboard API")

app.include_router(predictions.router)
app.include_router(teams.router)
app.include_router(matches.router)
app.include_router(ratings.router)
app.include_router(players.router)
app.include_router(bracket.router)

@app.get("/")
def read_root():
    logger.info({"message": "Handling root request"})
    return {"message": "Welcome to the World Cup Dashboard API"}

@app.get("/health")
def health_check():
    logger.info({"message": "Handling health check request"})
    return {"status": "healthy"}
