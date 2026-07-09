from __future__ import annotations

import logging

from sqlalchemy.orm import Session

from db.models.training_examples import TrainingExample

logger = logging.getLogger(__name__)


def upsert_training_example(db: Session, example_data: dict) -> TrainingExample:
    db_example = (
        db.query(TrainingExample)
        .filter(TrainingExample.historical_match_id == example_data["historical_match_id"])
        .first()
    )
    if db_example:
        for key, value in example_data.items():
            setattr(db_example, key, value)
    else:
        db_example = TrainingExample(**example_data)
        db.add(db_example)

    return db_example
