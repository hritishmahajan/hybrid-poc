#!/bin/bash
set -e

echo "→ Installing frontend dependencies..."
cd app && npm install && cd ..

echo "→ Installing backend dependencies..."
cd server && pip install -r requirements.txt && cd ..

# When running in Codespaces, point the frontend at the public backend URL
# so phones/laptops that open the shared link can actually reach the API.
if [ -n "$CODESPACE_NAME" ]; then
  BACKEND_URL="https://${CODESPACE_NAME}-8000.app.github.dev"
  echo "VITE_API_URL=${BACKEND_URL}" > app/.env.local
  echo "→ Backend URL set to: ${BACKEND_URL}"
fi

echo "✓ Setup complete. Run: bash start.sh"
