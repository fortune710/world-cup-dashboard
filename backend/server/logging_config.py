import json
import logging


class JsonFormatter(logging.Formatter):
    """Renders the dict-style logger.info({...}) calls used throughout this app
    as real JSON lines, so Loki/LogQL can parse and query fields directly."""

    def format(self, record: logging.LogRecord) -> str:
        payload = dict(record.msg) if isinstance(record.msg, dict) else {"message": record.getMessage()}

        entry = {
            "timestamp": self.formatTime(record, "%Y-%m-%dT%H:%M:%S%z"),
            "level": record.levelname,
            "logger": record.name,
            **payload,
        }
        if record.exc_info:
            entry["exception"] = self.formatException(record.exc_info)

        return json.dumps(entry, default=str)


def configure_logging(level: int = logging.INFO) -> None:
    handler = logging.StreamHandler()
    handler.setFormatter(JsonFormatter())

    root = logging.getLogger()
    root.handlers = [handler]
    root.setLevel(level)
