#!/bin/bash

# Re-write the env in case the codespace was rebuilt with a new name
if [ -n "$CODESPACE_NAME" ]; then
  BACKEND_URL="https://${CODESPACE_NAME}-8000.app.github.dev"
  echo "VITE_API_URL=${BACKEND_URL}" > app/.env.local
  echo "→ Backend URL: ${BACKEND_URL}"
fi

echo "→ Starting FastAPI backend on :8000 ..."
cd server && uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

sleep 2

echo "→ Starting Vite frontend on :5173 ..."
cd ../app && npm run dev -- --host &
FRONTEND_PID=$!

echo ""
echo "✓ Both servers are running."
echo "  Frontend : port 5173  (share this — it's public)"
echo "  Backend  : port 8000  (admin at /admin)"
echo ""
echo "Press Ctrl+C to stop."

wait $BACKEND_PID $FRONTEND_PID
