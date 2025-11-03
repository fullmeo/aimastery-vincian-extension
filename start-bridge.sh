#!/bin/bash
echo "🌉 Starting Reaper Bridge Server..."

# Vérifier si le serveur TypeScript existe
if [ -f "reaper-bridge-server.ts" ]; then
    echo "Starting TypeScript server directly..."
    npx ts-node reaper-bridge-server.ts
else
    echo "Starting from reaper-bridge-server directory..."
    cd reaper-bridge-server
    npm run dev
fi
