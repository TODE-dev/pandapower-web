#!/bin/bash
#
# Pandapower Web Stop Script
#

# Color definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Project root directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="$SCRIPT_DIR/.pids"

echo -e "${YELLOW}Stopping Pandapower Web services...${NC}"

if [ -f "$PID_FILE" ]; then
    while read -r pid; do
        if kill -0 "$pid" 2>/dev/null; then
            echo "  Stopping process $pid..."
            kill "$pid" 2>/dev/null

            # Wait for process to exit
            for i in {1..10}; do
                if ! kill -0 "$pid" 2>/dev/null; then
                    break
                fi
                sleep 0.5
            done

            # Force kill if still running
            if kill -0 "$pid" 2>/dev/null; then
                kill -9 "$pid" 2>/dev/null || true
            fi
        fi
    done < "$PID_FILE"
    rm -f "$PID_FILE"
    echo -e "${GREEN}✓ Services stopped${NC}"
else
    echo -e "${YELLOW}No running services found${NC}"
fi
