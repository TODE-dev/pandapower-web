import os
from pathlib import Path
from typing import Literal

# Supported file formats and their extensions
FILE_FORMATS: dict[str, list[str]] = {
    "json": [".json"],
    "excel": [".xlsx", ".xls"],
    "pickle": [".p", ".pkl", ".pickle"],
    "sqlite": [".sqlite", ".db"],
}

# All supported extensions
SUPPORTED_EXTENSIONS: list[str] = [
    ext for extensions in FILE_FORMATS.values() for ext in extensions
]

# Power flow algorithms
ALGORITHMS: dict[str, str] = {
    "nr": "Newton-Raphson",
    "bfsw": "Backward/Forward Sweep",
    "gs": "Gauss-Seidel",
    "fdbx": "Fast-Decoupled BX",
    "fdxb": "Fast-Decoupled XB",
}

# Initialization methods
INIT_METHODS: list[str] = ["auto", "flat", "dc", "results"]

# API settings
API_V1_PREFIX: str = "/api/v1"

# CORS settings
# Allow all origins for internal network use
CORS_ORIGINS: list[str] = ["*"]

# Logging settings
LOG_DIR: Path = Path(__file__).parent.parent.parent / "logs"
LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
LOG_MAX_BYTES: int = 50 * 1024 * 1024  # 50MB
LOG_BACKUP_COUNT: int = 10

# Session storage settings (file-based for multi-worker support)
SESSION_DIR: Path = Path(__file__).parent.parent.parent / "sessions"
SESSION_TTL_SECONDS: int = 3600  # 1 hour
