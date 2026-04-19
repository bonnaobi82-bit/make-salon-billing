#!/bin/bash
# Build the portable package
# Run this script to create the portable folder structure

set -e

PORTABLE_DIR="/app/portable"
echo "Building portable package..."

# Create directory structure
mkdir -p "$PORTABLE_DIR/app/backend"
mkdir -p "$PORTABLE_DIR/app/frontend/build"
mkdir -p "$PORTABLE_DIR/data/db"
mkdir -p "$PORTABLE_DIR/logs"
mkdir -p "$PORTABLE_DIR/runtime/python"
mkdir -p "$PORTABLE_DIR/runtime/mongodb/bin"

# Copy backend files
cp /app/backend/server.py "$PORTABLE_DIR/app/backend/"
cp /app/backend/seed_data.py "$PORTABLE_DIR/app/backend/"

# Build frontend
cd /app/frontend
REACT_APP_BACKEND_URL="" yarn build 2>/dev/null || true

# Copy frontend build
if [ -d "/app/frontend/build" ]; then
    cp -r /app/frontend/build/* "$PORTABLE_DIR/app/frontend/build/"
    echo "Frontend build copied!"
else
    echo "WARNING: Frontend build not found. Run 'yarn build' in frontend first."
fi

# Create nginx-like config for Python http.server (using index.html fallback)
# We'll serve frontend via Python's http.server and API via uvicorn

echo "Portable package built at: $PORTABLE_DIR"
echo ""
echo "Contents:"
find "$PORTABLE_DIR" -maxdepth 3 -type f | head -30
echo ""
echo "To use:"
echo "1. Copy the 'portable' folder to a pendrive"
echo "2. On target PC, run SETUP-FIRST-TIME.bat (once)"
echo "3. Then run START-SALON.bat"
