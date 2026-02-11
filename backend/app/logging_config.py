"""Logging configuration for the application.

Provides JSON-structured logging with file rotation and request correlation.
"""
import json
import logging
import logging.handlers
import sys
from contextvars import ContextVar
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, MutableMapping, Optional

# Context variables for request correlation
request_id_ctx: ContextVar[Optional[str]] = ContextVar("request_id", default=None)
session_id_ctx: ContextVar[Optional[str]] = ContextVar("session_id", default=None)


def get_request_id() -> Optional[str]:
    """Get the current request ID from context."""
    return request_id_ctx.get()


def set_request_id(request_id: str) -> None:
    """Set the request ID in context."""
    request_id_ctx.set(request_id)


def get_session_id() -> Optional[str]:
    """Get the current session ID from context."""
    return session_id_ctx.get()


def set_session_id(session_id: str) -> None:
    """Set the session ID in context."""
    session_id_ctx.set(session_id)


class JSONFormatter(logging.Formatter):
    """JSON log formatter with context injection."""

    def format(self, record: logging.LogRecord) -> str:
        log_data: dict[str, Any] = {
            "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }

        # Add request context if available
        request_id = get_request_id()
        if request_id:
            log_data["request_id"] = request_id

        session_id = get_session_id()
        if session_id:
            log_data["session_id"] = session_id

        # Add extra fields from record
        if hasattr(record, "extra_data"):
            log_data.update(record.extra_data)

        # Add exception info if present
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)

        return json.dumps(log_data, ensure_ascii=False)


class ContextLogger(logging.LoggerAdapter):
    """Logger adapter that adds extra context to all log records."""

    def process(
        self, msg: str, kwargs: MutableMapping[str, Any]
    ) -> tuple[str, MutableMapping[str, Any]]:
        # Extract extra data and add to record
        extra = kwargs.get("extra", {})
        kwargs["extra"] = {"extra_data": extra}
        return msg, kwargs


def setup_logging(
    log_dir: Optional[Path] = None,
    log_level: str = "INFO",
    max_bytes: int = 50 * 1024 * 1024,  # 50MB
    backup_count: int = 10,
) -> None:
    """Configure application logging.

    Args:
        log_dir: Directory for log files. If None, uses ../logs relative to app.
        log_level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL).
        max_bytes: Maximum size of each log file before rotation.
        backup_count: Number of backup files to keep.
    """
    if log_dir is None:
        log_dir = Path(__file__).parent.parent.parent / "logs"

    log_dir.mkdir(parents=True, exist_ok=True)

    # Get root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, log_level.upper()))

    # Clear existing handlers
    root_logger.handlers.clear()

    # Create JSON formatter
    json_formatter = JSONFormatter()

    # Console handler (for development)
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(json_formatter)
    root_logger.addHandler(console_handler)

    # Rotating file handler
    log_file = log_dir / "app.log"
    file_handler = logging.handlers.RotatingFileHandler(
        log_file,
        maxBytes=max_bytes,
        backupCount=backup_count,
        encoding="utf-8",
    )
    file_handler.setFormatter(json_formatter)
    root_logger.addHandler(file_handler)

    # Suppress noisy loggers
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("uvicorn.error").setLevel(logging.WARNING)


def get_logger(name: str) -> ContextLogger:
    """Get a logger with context support.

    Args:
        name: Logger name (typically __name__).

    Returns:
        ContextLogger instance.
    """
    return ContextLogger(logging.getLogger(name), {})
