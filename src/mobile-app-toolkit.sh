# ===== MOBILE APP DEVELOPMENT TOOLKIT =====

# OPTION 1: REACT NATIVE (Cross-platform)
npx react-native init ReaperController
cd ReaperController

# Dependencies React Native
npm install react-native-osc            # OSC client
npm install react-native-websocket      # WebSocket
npm install react-native-slider         # Faders
npm install react-native-vector-icons   # Icons
npm install react-native-gesture-handler # Touch gestures
npm install @react-native-community/slider
npm install react-native-midi           # MIDI support

# UI Components avancés
npm install native-base                  # UI Library
npm install react-native-elements       # Components
npm install react-native-paper          # Material Design

# OPTION 2: EXPO (Plus rapide à démarrer)
npm install -g @expo/cli
npx create-expo-app ReaperControllerExpo
cd ReaperControllerExpo

# Dependencies Expo
npx expo install expo-av                 # Audio
npx expo install expo-websocket-client   # WebSocket
npx expo install expo-haptics            # Vibration feedback

# OPTION 3: FLUTTER (Performance native)
# Installation Flutter SDK requise
flutter create reaper_controller
cd reaper_controller

# Dependencies Flutter (pubspec.yaml)
# osc: ^2.0.0
# web_socket_channel: ^2.4.0  
# flutter_midi: ^1.0.0
# flutter_slider: ^1.0.0

# OPTION 4: PWA (Web Progressive App)
npx create-react-app reaper-pwa
cd reaper-pwa

# PWA Dependencies
npm install workbox-webpack-plugin       # Service worker
npm install react-pwa-install-button     # Install prompt
npm install osc-js                       # OSC browser
npm install socket.io-client             # WebSocket