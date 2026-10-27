#!/usr/bin/env bash
PORT=${1:-8080}
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

echo "==============================================="
echo "   KDPsych Study Portal (Question Bank App)"
echo "   Opening at: http://localhost:$PORT"
echo "==============================================="

# Attempt to open browser automatically on macOS
if command -v open >/dev/null 2>&1; then
    (sleep 1 && open "http://localhost:$PORT") &
fi

python3 server.py
