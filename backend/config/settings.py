import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    WC2026_API_KEY = os.getenv("WC2026_API_KEY")
    WC_LEAGUE_ID = 16
    WC_SEASON_ID_2022 = 41087
    WC_SEASON_ID_2026 = 58210
