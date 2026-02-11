#!/bin/bash
#
# Pandapower Web Startup Script
#
# Usage:
#   ./start.sh [options]
#
# Options:
#   -m, --mode       Run mode: dev or prod, default: prod
#   -b, --backend    Backend port, default: 8000
#   -f, --frontend   Frontend port, default: 5173 (dev) or 8080 (prod)
#   -H, --host       External access hostname or IP, default: auto-detect
#   -w, --workers    Backend worker count (prod mode only), default: 4
#   -h, --help       Show help
#
# Examples:
#   ./start.sh                      # Production mode, default ports
#   ./start.sh -m dev               # Development mode
#   ./start.sh -b 8080 -f 3000      # Custom ports
#   ./start.sh -m prod -w 8         # Production mode, 8 workers
#   ./start.sh -H 192.168.1.100     # Specify external access IP
#

set -e

# Default parameters
MODE="prod"
BACKEND_PORT=8000
FRONTEND_PORT=""
WORKERS=4
EXTERNAL_HOST=""

# Color definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# Project root directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"

# Log directory
LOG_DIR="$SCRIPT_DIR/logs"
mkdir -p "$LOG_DIR"

# PID file
PID_FILE="$SCRIPT_DIR/.pids"

# Help message
show_help() {
    echo "Pandapower Web Startup Script"
    echo ""
    echo "Usage: ./start.sh [options]"
    echo ""
    echo "Options:"
    echo "  -m, --mode       Run mode: dev or prod, default: prod"
    echo "  -b, --backend    Backend port, default: 8000"
    echo "  -f, --frontend   Frontend port, default: 5173 (dev) or 8080 (prod)"
    echo "  -H, --host       External access hostname or IP, default: auto-detect"
    echo "  -w, --workers    Backend worker count (prod mode only), default: 4"
    echo "  -h, --help       Show help"
    echo ""
    echo "Examples:"
    echo "  ./start.sh                      # Production mode, default ports"
    echo "  ./start.sh -m dev               # Development mode"
    echo "  ./start.sh -b 8080 -f 3000      # Custom ports"
    echo "  ./start.sh -m prod -w 8         # Production mode, 8 workers"
    echo "  ./start.sh -H 192.168.1.100     # Specify external access IP"
    exit 0
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -m|--mode)
            MODE="$2"
            shift 2
            ;;
        -b|--backend)
            BACKEND_PORT="$2"
            shift 2
            ;;
        -f|--frontend)
            FRONTEND_PORT="$2"
            shift 2
            ;;
        -w|--workers)
            WORKERS="$2"
            shift 2
            ;;
        -H|--host)
            EXTERNAL_HOST="$2"
            shift 2
            ;;
        -h|--help)
            show_help
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            show_help
            ;;
    esac
done

# Set default frontend port
if [ -z "$FRONTEND_PORT" ]; then
    if [ "$MODE" = "dev" ]; then
        FRONTEND_PORT=5173
    else
        FRONTEND_PORT=8080
    fi
fi

# Auto-detect external host address
if [ -z "$EXTERNAL_HOST" ]; then
    if command -v hostname &> /dev/null; then
        EXTERNAL_HOST=$(hostname -I 2>/dev/null | awk '{print $1}')
    fi
    # macOS compatibility
    if [ -z "$EXTERNAL_HOST" ] && command -v ipconfig &> /dev/null; then
        EXTERNAL_HOST=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null)
    fi
    if [ -z "$EXTERNAL_HOST" ]; then
        EXTERNAL_HOST="localhost"
    fi
fi

echo -e "${CYAN}======================================${NC}"
echo -e "${CYAN}   Pandapower Web Startup${NC}"
echo -e "${CYAN}======================================${NC}"
echo ""
echo -e "  Mode: ${GREEN}$MODE${NC}"
echo -e "  Backend port: ${GREEN}$BACKEND_PORT${NC}"
echo -e "  Frontend port: ${GREEN}$FRONTEND_PORT${NC}"
echo -e "  External host: ${GREEN}$EXTERNAL_HOST${NC}"
if [ "$MODE" = "prod" ]; then
    echo -e "  Workers: ${GREEN}$WORKERS${NC}"
fi
echo ""

# Check dependencies
check_dependencies() {
    echo -e "${YELLOW}[1/5] Checking dependencies...${NC}"

    if ! command -v uv &> /dev/null; then
        echo -e "${RED}Error: uv not found, please install first: curl -LsSf https://astral.sh/uv/install.sh | sh${NC}"
        exit 1
    fi

    if ! command -v node &> /dev/null; then
        echo -e "${RED}Error: Node.js not found, please install Node.js 18+${NC}"
        exit 1
    fi

    if ! command -v npm &> /dev/null; then
        echo -e "${RED}Error: npm not found${NC}"
        exit 1
    fi

    echo -e "${GREEN}✓ Dependency check passed${NC}"
}

# Setup backend
setup_backend() {
    echo -e "${YELLOW}[2/5] Setting up backend...${NC}"
    cd "$BACKEND_DIR"

    if [ ! -f "uv.lock" ] || [ ! -d ".venv" ]; then
        echo "  Installing Python dependencies..."
        uv sync
    fi

    echo -e "${GREEN}✓ Backend setup complete${NC}"
}

# Setup frontend
setup_frontend() {
    echo -e "${YELLOW}[3/5] Setting up frontend...${NC}"
    cd "$FRONTEND_DIR"

    echo "  Installing Node.js dependencies..."
    npm install

    echo -e "${GREEN}✓ Frontend setup complete${NC}"
}

# Build frontend (production mode)
build_frontend() {
    if [ "$MODE" = "prod" ]; then
        echo -e "${YELLOW}[4/5] Building frontend...${NC}"
        cd "$FRONTEND_DIR"

        echo "  Building production bundle..."
        VITE_API_BASE_URL="http://$EXTERNAL_HOST:$BACKEND_PORT" npm run build

        echo -e "${GREEN}✓ Frontend build complete${NC}"
    else
        echo -e "${YELLOW}[4/5] Skipping build (dev mode)${NC}"
    fi
}

# Stop running services
stop_services() {
    if [ -f "$PID_FILE" ]; then
        echo "  Stopping running services..."
        while read -r pid; do
            if kill -0 "$pid" 2>/dev/null; then
                kill "$pid" 2>/dev/null || true
            fi
        done < "$PID_FILE"
        rm -f "$PID_FILE"
        sleep 1
    fi

    # Check if ports are in use
    if lsof -i :"$BACKEND_PORT" &>/dev/null; then
        echo -e "${YELLOW}  Warning: port $BACKEND_PORT is in use, attempting to free...${NC}"
        lsof -ti :"$BACKEND_PORT" | xargs kill -9 2>/dev/null || true
        sleep 1
    fi

    if lsof -i :"$FRONTEND_PORT" &>/dev/null; then
        echo -e "${YELLOW}  Warning: port $FRONTEND_PORT is in use, attempting to free...${NC}"
        lsof -ti :"$FRONTEND_PORT" | xargs kill -9 2>/dev/null || true
        sleep 1
    fi
}

# Start services
start_services() {
    echo -e "${YELLOW}[5/5] Starting services...${NC}"

    stop_services

    # Start backend
    cd "$BACKEND_DIR"
    echo "  Starting backend service..."

    if [ "$MODE" = "prod" ]; then
        # Production mode: multiple workers
        nohup uv run uvicorn app.main:app \
            --host 0.0.0.0 \
            --port "$BACKEND_PORT" \
            --workers "$WORKERS" \
            --log-level warning \
            > "$LOG_DIR/backend.log" 2>&1 &
    else
        # Development mode: hot reload
        nohup uv run uvicorn app.main:app \
            --host 0.0.0.0 \
            --port "$BACKEND_PORT" \
            --reload \
            > "$LOG_DIR/backend.log" 2>&1 &
    fi

    BACKEND_PID=$!
    echo "$BACKEND_PID" > "$PID_FILE"

    sleep 2
    if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
        echo -e "${RED}Error: Backend failed to start, check logs: $LOG_DIR/backend.log${NC}"
        exit 1
    fi
    echo -e "${GREEN}  ✓ Backend started (PID: $BACKEND_PID)${NC}"

    # Start frontend
    cd "$FRONTEND_DIR"
    echo "  Starting frontend service..."

    if [ "$MODE" = "prod" ]; then
        # Production mode: simple HTTP server for static files
        # For high-concurrency scenarios, consider using nginx
        cd dist
        nohup python3 -m http.server "$FRONTEND_PORT" --bind 0.0.0.0 \
            > "$LOG_DIR/frontend.log" 2>&1 &
        cd ..
    else
        # Development mode: Vite dev server
        export VITE_BACKEND_URL="http://localhost:$BACKEND_PORT"
        nohup npm run dev -- --port "$FRONTEND_PORT" --host \
            > "$LOG_DIR/frontend.log" 2>&1 &
    fi

    FRONTEND_PID=$!
    echo "$FRONTEND_PID" >> "$PID_FILE"

    sleep 2
    if ! kill -0 "$FRONTEND_PID" 2>/dev/null; then
        echo -e "${RED}Error: Frontend failed to start, check logs: $LOG_DIR/frontend.log${NC}"
        exit 1
    fi
    echo -e "${GREEN}  ✓ Frontend started (PID: $FRONTEND_PID)${NC}"
}

# Show startup info
show_info() {
    echo ""
    echo -e "${CYAN}======================================${NC}"
    echo -e "${GREEN}Services started successfully!${NC}"
    echo -e "${CYAN}======================================${NC}"
    echo ""
    echo -e "  Run mode: ${GREEN}$MODE${NC}"
    echo ""
    echo -e "  ${CYAN}Local access:${NC}"
    echo -e "    Frontend: ${GREEN}http://localhost:$FRONTEND_PORT${NC}"
    echo -e "    Backend API: ${GREEN}http://localhost:$BACKEND_PORT${NC}"
    echo -e "    API Docs: ${GREEN}http://localhost:$BACKEND_PORT/docs${NC}"
    echo ""
    if [ "$EXTERNAL_HOST" != "localhost" ]; then
        echo -e "  ${CYAN}External access:${NC}"
        echo -e "    Frontend: ${GREEN}http://$EXTERNAL_HOST:$FRONTEND_PORT${NC}"
        echo -e "    Backend API: ${GREEN}http://$EXTERNAL_HOST:$BACKEND_PORT${NC}"
        echo -e "    API Docs: ${GREEN}http://$EXTERNAL_HOST:$BACKEND_PORT/docs${NC}"
        echo ""
    fi
    echo -e "  Log directory: $LOG_DIR"
    echo -e "  Backend logs: tail -f $LOG_DIR/backend.log"
    echo -e "  Frontend logs: tail -f $LOG_DIR/frontend.log"
    echo ""
    echo -e "  Stop services: ${YELLOW}./stop.sh${NC}"

    if [ "$MODE" = "prod" ]; then
        echo ""
        echo -e "${YELLOW}Production notes:${NC}"
        echo "  - Currently using Python HTTP server for static files"
        echo "  - For high concurrency, consider using nginx instead"
        echo "  - Recommended to configure reverse proxy and HTTPS"
        echo "  - Ensure firewall allows ports $FRONTEND_PORT and $BACKEND_PORT"
    fi
    echo ""
}

# Main
main() {
    check_dependencies
    setup_backend
    setup_frontend
    build_frontend
    start_services
    show_info
}

main
