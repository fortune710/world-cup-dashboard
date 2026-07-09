import logging

from config.db import SessionLocal
from db.controllers.training_examples import upsert_training_example

logger = logging.getLogger(__name__)


class TrainingExamplesLoader:
    """
    Loader class for materialized training examples -- the final stage of the
    historical backfill. Its output is what a future training job would consume.
    """

    def load_training_examples(self, examples: list[dict]) -> None:
        logger.info({
            "message": "Starting training examples loader",
            "row_count": len(examples or []),
        })
        db = SessionLocal()
        try:
            for example in examples:
                upsert_training_example(db, example)
            db.commit()
            logger.info({
                "message": "Successfully loaded training examples",
                "row_count": len(examples or []),
            })
        except Exception as e:
            db.rollback()
            logger.error({
                "message": "Failed to load training examples",
                "error": {"message": str(e), "type": type(e).__name__},
            })
            raise
        finally:
            db.close()
