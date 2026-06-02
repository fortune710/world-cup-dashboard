"""
Prediction routes.

This module intentionally defines only the router skeleton.
Inference logic and endpoints will be added when the match outcome predictor is implemented.
"""

from fastapi import APIRouter

router = APIRouter(prefix="/predictions", tags=["predictions"])

