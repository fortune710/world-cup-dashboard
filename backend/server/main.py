import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from server import image_browser
from server.logging_config import configure_logging
from server.routes import predictions, teams, matches, ratings, players, bracket, image_proxy


configure_logging()
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await image_browser.startup()
    yield
    await image_browser.shutdown()


app = FastAPI(title="World Cup Dashboard API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=False,
)

app.include_router(predictions.router)
app.include_router(teams.router)
app.include_router(matches.router)
app.include_router(ratings.router)
app.include_router(players.router)
app.include_router(bracket.router)
app.include_router(image_proxy.router)

@app.get("/")
def read_root():
    logger.info({"message": "Handling root request"})
    return {"message": "Welcome to the World Cup Dashboard API"}

@app.get("/health")
def health_check():
    logger.info({"message": "Handling health check request"})
    return {"status": "healthy"}
