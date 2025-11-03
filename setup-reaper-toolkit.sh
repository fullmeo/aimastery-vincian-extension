#!/bin/bash
echo "🎛️ AIMastery Reaper Control Toolkit Setup"
echo "==========================================="

# Variables
BRIDGE_DIR="reaper-bridge-server"
MOBILE_DIR="reaper-mobile-app"

# 1. SETUP BRIDGE SERVER
echo "🌉 Setting up Bridge Server..."
mkdir -p $BRIDGE_DIR
cd $BRIDGE_DIR

npm init -y
npm install express socket.io http cors osc midi ws
npm install @types/node @types/express typescript ts-node nodemon --save-dev

# Configuration TypeScript
cat > tsconfig.json << 'TSEOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
TSEOF

npm pkg set scripts.start="node dist/server.js"
npm pkg set scripts.dev="nodemon --exec ts-node src/server.ts"
npm pkg set scripts.build="tsc"

mkdir -p src
echo "Bridge server structure created"
cd ..

# 2. SETUP MOBILE APP (version basique)
echo "📱 Setting up Mobile App structure..."
mkdir -p $MOBILE_DIR
cd $MOBILE_DIR
npm init -y
npm install socket.io-client axios
echo "Mobile app structure created"
cd ..

# 3. SETUP COMPLETE
echo "✅ Reaper Toolkit setup complete!"
echo "Next steps:"
echo "1. Configure Reaper OSC (Options > Preferences > Control/OSC/web)"
echo "2. Run: ./start-bridge.sh"
echo "3. Add integration to your VS Code extension"
