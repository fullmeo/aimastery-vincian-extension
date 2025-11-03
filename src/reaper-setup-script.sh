#!/bin/bash
# ===== REAPER CONTROL TOOLKIT SETUP =====
# Setup complet pour contrôler Reaper depuis smartphone + VS Code

echo "🎛️ AIMastery Reaper Control Toolkit Setup"
echo "==========================================="

# Variables de configuration
BRIDGE_DIR="reaper-bridge-server"
MOBILE_DIR="reaper-mobile-app"
VSCODE_INTEGRATION="vscode-reaper-integration"

# 1. SETUP BRIDGE SERVER
echo "🌉 Setting up Bridge Server..."
mkdir -p $BRIDGE_DIR
cd $BRIDGE_DIR

# Initialiser projet Node.js
npm init -y

# Installation des dépendances
npm install express socket.io http cors
npm install osc midi ws
npm install @types/node @types/express
npm install nodemon typescript ts-node --save-dev

# Configuration TypeScript
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOF

# Scripts package.json
npm pkg set scripts.start="node dist/server.js"
npm pkg set scripts.dev="nodemon --exec ts-node src/server.ts"
npm pkg set scripts.build="tsc"

# Créer le serveur (copier le code TypeScript créé précédemment)
mkdir -p src
cat > src/server.ts << 'EOF'
// Coller ici le code du Bridge Server créé précédemment
import express from 'express';
// ... (code complet du serveur)
EOF

echo "✅ Bridge Server setup complete"
cd ..

# 2. SETUP MOBILE APP (React Native)
echo "📱 Setting up Mobile App..."

# Vérifier si React Native CLI est installé
if ! command -v react-native &> /dev/null; then
    echo "Installing React Native CLI..."
    npm install -g react-native-cli
fi

# Créer l'app mobile
npx react-native init $MOBILE_DIR --template typescript
cd $MOBILE_DIR

# Dependencies mobiles
npm install @react-native-community/slider
npm install socket.io-client react-native-vector-icons
npm install react-native-haptic-feedback
npm install native-base react-native-svg

# Configuration iOS (si sur macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
    cd ios && pod install && cd ..
fi

echo "✅ Mobile App setup complete"
cd ..

# 3. SETUP VS CODE INTEGRATION
echo "🔗 Setting up VS Code Integration..."
mkdir -p $VSCODE_INTEGRATION

# Ajouter les dépendances à votre extension existante
echo "Add these dependencies to your extension:"
echo "npm install axios ws osc-js"

# Créer fichier d'intégration
cat > $VSCODE_INTEGRATION/reaper-integration.ts << 'EOF'
// Coller ici le code de l'intégration VS Code
// ... (code complet de l'intégration)
EOF

echo "✅ VS Code Integration files created"

# 4. CONFIGURATION REAPER
echo "🎛️ Reaper Configuration Guide"
cat << 'EOF'

📋 CONFIGURATION REAPER MANUELLE REQUISE:
==========================================

1. Ouvrir Reaper
2. Options > Preferences > Control/OSC/web
3. Cliquer "Add"
4. Sélectionner "OSC (Open Sound Control)"
5. Configuration :
   - Mode: OSC (Open Sound Control)
   - Pattern config: Device IP
   - Local listen port: 8000
   - Device port: 9000
   - Device IP: 127.0.0.1 (ou IP de votre PC)
6. Cliquer OK
7. Activer "Enable"

Pour le contrôle web (optionnel):
8. Cocher "Enable web interface"
9. Port: 8080
10. Défaut login/password

EOF

# 5. SCRIPTS DE LANCEMENT
echo "🚀 Creating launch scripts..."

# Script de démarrage du bridge
cat > start-bridge.sh << 'EOF'
#!/bin/bash
echo "🌉 Starting Reaper Bridge Server..."
cd reaper-bridge-server
npm run dev
EOF
chmod +x start-bridge.sh

# Script de build mobile
cat > build-mobile.sh << 'EOF'
#!/bin/bash
echo "📱 Building Mobile App..."
cd reaper-mobile-app

echo "Building for Android..."
npx react-native build-android

echo "Building for iOS (macOS only)..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    npx react-native build-ios
fi
EOF
chmod +x build-mobile.sh

# Script de développement mobile
cat > run-mobile-dev.sh << 'EOF'
#!/bin/bash
echo "📱 Running Mobile App in development..."
cd reaper-mobile-app

# Démarrer Metro bundler
npx react-native start &

# Attendre un peu pour que Metro démarre
sleep 3

# Lancer sur Android (si appareil connecté)
echo "Launching on Android..."
npx react-native run-android

# Lancer sur iOS (macOS seulement)
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "Launching on iOS..."
    npx react-native run-ios
fi
EOF
chmod +x run-mobile-dev.sh

# 6. DOCKER SETUP (Optionnel)
echo "🐳 Creating Docker setup..."
cat > docker-compose.yml << 'EOF'
version: '3.8'
services:
  reaper-bridge:
    build: ./reaper-bridge-server
    ports:
      - "3000:3000"
      - "8000:8000"
      - "9000:9000"
    volumes:
      - ./reaper-bridge-server:/app
    environment:
      - NODE_ENV=development
    networks:
      - reaper-network

  mobile-dev:
    build: ./reaper-mobile-app
    ports:
      - "8081:8081"
    volumes:
      - ./reaper-mobile-app:/app
    depends_on:
      - reaper-bridge
    networks:
      - reaper-network

networks:
  reaper-network:
    driver: bridge
EOF

# Dockerfile pour le bridge
cat > $BRIDGE_DIR/Dockerfile << 'EOF'
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000 8000 9000
CMD ["npm", "start"]
EOF

# 7. TESTS ET VALIDATION
echo "🧪 Creating test scripts..."

cat > test-connection.js << 'EOF'
const io = require('socket.io-client');
const osc = require('osc');

console.log('🧪 Testing Reaper Toolkit connections...');

// Test Bridge Server
const socket = io('http://localhost:3000');
socket.on('connect', () => {
    console.log('✅ Bridge Server: Connected');
    
    // Test commande
    socket.emit('reaper-command', { command: 'play' });
    
    setTimeout(() => {
        socket.disconnect();
    }, 1000);
});

socket.on('connect_error', () => {
    console.log('❌ Bridge Server: Connection failed');
});

// Test OSC vers Reaper
const oscPort = new osc.UDPPort({
    localAddress: "0.0.0.0",
    localPort: 9001,
    remoteAddress: "127.0.0.1",
    remotePort: 8000,
    metadata: true
});

oscPort.on("ready", function () {
    console.log("✅ OSC: Connected to Reaper");
    
    // Test play command
    oscPort.send({
        address: "/play",
        args: []
    });
    
    setTimeout(() => {
        oscPort.close();
    }, 2000);
});

oscPort.on("error", function (error) {
    console.log("❌ OSC: Connection error -", error.message);
});

oscPort.open();
EOF

# 8. DOCUMENTATION
echo "📚 Creating documentation..."
cat > README.md << 'EOF'
# 🎛️ AIMastery Reaper Control Toolkit

## Vue d'ensemble
Contrôlez Reaper depuis votre smartphone et intégrez l'analyse de code Vincienne pour générer de la musique automatiquement.

## Architecture
```
VS Code Extension (AIMastery) 
    ↓ [Analysis Data]
Bridge Server (Node.js)
    ↓ [OSC/MIDI Commands]  ↓ [WebSocket]
Reaper DAW              Mobile App
```

## Installation Rapide
```bash
# 1. Lancer le setup
./setup-reaper-toolkit.sh

# 2. Démarrer le bridge server
./start-bridge.sh

# 3. Configurer Reaper (voir guide)

# 4. Builder l'app mobile
./build-mobile.sh

# 5. Tester les connexions
node test-connection.js
```

## Utilisation

### 🧬 Depuis VS Code
1. Analyser votre code avec AIMastery
2. Choisir "Sonify in Reaper"
3. L'analyse se transforme en musique !

### 📱 Depuis Mobile
1. Connecter à votre réseau WiFi
2. Entrer l'IP de votre PC
3. Contrôler Reaper en temps réel

### 🎛️ Mapping Vincian
- **Code Health** → Tempo (120-180 BPM)
- **Error Handling** → Harmonies majeures/mineures
- **Complexity** → Effets (reverb, delay)
- **Patterns** → Séquences MIDI

## Commandes Disponibles

### Transport
- `play` - Démarrer lecture
- `stop` - Arrêter
- `record` - Enregistrer

### Mixer
- `volume` - Contrôle volume track
- `mute` - Mute/unmute track
- `solo` - Solo track

### Effets
- `fx` - Contrôle paramètres FX

## Configuration Réseau
- Bridge Server: `localhost:3000`
- Reaper OSC: `localhost:8000`
- Mobile WebSocket: WiFi IP:3000

## Troubleshooting
- Vérifier que Reaper OSC est activé
- Firewall autorise ports 3000, 8000, 9000
- Mobile et PC sur même réseau WiFi

## Roadmap
- [ ] Support multi-track avancé
- [ ] Presets Vincian personnalisés
- [ ] Export compositions automatique
- [ ] Plugin Reaper natif
- [ ] Support Ableton Live

EOF

# 9. FINALISATION
echo ""
echo "🎉 REAPER CONTROL TOOLKIT SETUP COMPLETE!"
echo "=========================================="
echo ""
echo "📁 Structure créée:"
echo "├── reaper-bridge-server/     # Serveur de communication"
echo "├── reaper-mobile-app/        # App React Native"
echo "├── vscode-reaper-integration/ # Intégration VS Code"
echo "├── start-bridge.sh           # Démarrer serveur"
echo "├── build-mobile.sh           # Builder app mobile"
echo "├── run-mobile-dev.sh         # Dev mobile"
echo "├── test-connection.js        # Tester connexions"
echo "└── README.md                 # Documentation"
echo ""
echo "🚀 Prochaines étapes:"
echo "1. Configurer Reaper OSC (voir README.md)"
echo "2. ./start-bridge.sh"
echo "3. ./run-mobile-dev.sh"
echo "4. Intégrer à votre extension AIMastery"
echo ""
echo "✨ Votre code va devenir de la musique Vincienne ! 🎵"

# Rendre tous les scripts exécutables
chmod +x *.sh

echo "🔧 All scripts made executable"
echo "Setup completed successfully! 🎊"