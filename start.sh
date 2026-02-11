#!/bin/bash

# Function to kill background processes on exit
cleanup() {
    echo "Stopping services..."
    kill $(jobs -p)
}

# Trap SIGINT (Ctrl+C) to run cleanup
trap cleanup SIGINT

# Start Backend
echo "Starting Backend..."
if [ -d "backend/venv" ]; then
    source backend/venv/bin/activate
elif [ -d "venv" ]; then
    source venv/bin/activate
else
    echo "Warning: No virtual environment found in backend/venv or venv."
fi

# Run uvicorn in background
# Assuming app is in backend.main:app based on README instructions
uvicorn backend.main:app --reload --reload-dir=backend &

# Start Frontend
echo "Starting Frontend..."
cd frontend
npm run dev &

# Wait for all background processes to finish
wait
