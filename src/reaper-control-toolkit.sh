# ===== REAPER REMOTE CONTROL TOOLKIT =====

# 1. REAPER CONFIGURATION
echo "🎛️ Setting up Reaper remote control..."

# Dans Reaper : Options > Preferences > Control/OSC/web
# Activer "Control surface" et "OSC"
# Port par défaut : 8000 (OSC) et 8080 (Web)

# 2. OSC (Open Sound Control) - Protocol principal
npm install osc-js           # Client OSC JavaScript
npm install node-osc         # Serveur OSC Node.js
npm install osc              # Library OSC complète

# 3. WEBSOCKET - Communication temps réel
npm install ws socket.io socket.io-client
npm install express socket.io-express

# 4. MIDI - Contrôle MIDI over network
npm install midi             # MIDI natif Node.js
npm install webmidi          # MIDI pour web
npm install node-midi        # Alternative MIDI

# 5. HTTP API - REST calls to Reaper
npm install axios fetch      # HTTP requests
npm install express          # Serveur API local

# EXEMPLE CONFIGURATION REAPER OSC:
# Reaper > Preferences > Control/OSC/web > Add
# Mode: OSC (Open Sound Control)
# Pattern config: Device IP
# Local listen port: 8000
# Device port: 9000