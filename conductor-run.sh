#!/bin/bash
set -e

# Find an available port starting from 3001
PORT=3001
while lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; do
    echo "⚠️  Port $PORT is already in use, trying next port..."
    PORT=$((PORT + 1))
done

echo "🚀 Starting dev server on port $PORT..."
cd apps/web && bun next dev --port=$PORT
