from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api.powerflow import router as powerflow_router
from .config import (
    API_V1_PREFIX,
    CORS_ORIGINS,
    LOG_DIR,
    LOG_LEVEL,
    LOG_MAX_BYTES,
    LOG_BACKUP_COUNT,
)
from .logging_config import setup_logging, get_logger
from .middleware import LoggingMiddleware

# Initialize logging with config values
setup_logging(
    log_dir=LOG_DIR,
    log_level=LOG_LEVEL,
    max_bytes=LOG_MAX_BYTES,
    backup_count=LOG_BACKUP_COUNT,
)
logger = get_logger(__name__)

app = FastAPI(
    title="Pandapower Web API",
    description="Web API for pandapower power flow calculation",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add logging middleware
app.add_middleware(LoggingMiddleware)

# Include routers
app.include_router(powerflow_router, prefix=API_V1_PREFIX)


@app.on_event("startup")
async def startup_event():
    """Log application startup."""
    logger.info("Application started", extra={"version": "0.1.0"})


@app.on_event("shutdown")
async def shutdown_event():
    """Log application shutdown."""
    logger.info("Application shutting down")


@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "name": "Pandapower Web API",
        "version": "0.1.0",
        "docs": "/docs",
        "api_prefix": API_V1_PREFIX,
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}
