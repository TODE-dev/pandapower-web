"""Logging middleware for request/response tracking."""
import time
import uuid
from typing import Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

from ..logging_config import get_logger, request_id_ctx, session_id_ctx

logger = get_logger(__name__)


class LoggingMiddleware(BaseHTTPMiddleware):
    """Middleware for logging requests and responses with correlation IDs."""

    async def dispatch(
        self, request: Request, call_next: Callable
    ) -> Response:
        # Extract or generate request ID
        request_id = request.headers.get("X-Request-ID")
        if not request_id:
            request_id = str(uuid.uuid4())

        # Set request ID in context
        request_token = request_id_ctx.set(request_id)
        session_token = None

        # Extract session ID from path if present
        path = request.url.path
        if "/run/" in path or "/results/" in path or "/download/" in path:
            parts = path.split("/")
            for i, part in enumerate(parts):
                if part in ("run", "results", "download") and i + 1 < len(parts):
                    session_id = parts[i + 1]
                    if session_id:  # Only set if not empty
                        session_token = session_id_ctx.set(session_id)
                    break

        # Log request start
        client_ip = request.client.host if request.client else "unknown"
        logger.info(
            "Request started",
            extra={
                "method": request.method,
                "path": path,
                "query": str(request.query_params) if request.query_params else None,
                "client_ip": client_ip,
            },
        )

        # Process request and measure duration
        start_time = time.perf_counter()
        try:
            response = await call_next(request)
            duration_ms = (time.perf_counter() - start_time) * 1000

            # Log response
            logger.info(
                "Request completed",
                extra={
                    "method": request.method,
                    "path": path,
                    "status_code": response.status_code,
                    "duration_ms": round(duration_ms, 2),
                },
            )

            # Add request ID to response headers
            response.headers["X-Request-ID"] = request_id

            return response

        except Exception as e:
            duration_ms = (time.perf_counter() - start_time) * 1000
            logger.error(
                "Request failed",
                extra={
                    "method": request.method,
                    "path": path,
                    "error": str(e),
                    "duration_ms": round(duration_ms, 2),
                },
                exc_info=True,
            )
            raise

        finally:
            # Reset context variables
            request_id_ctx.reset(request_token)
            if session_token is not None:
                session_id_ctx.reset(session_token)
