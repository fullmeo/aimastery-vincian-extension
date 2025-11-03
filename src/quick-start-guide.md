# 🎛️ AIMastery Reaper Control - Quick Start

## 🚀 Installation en 5 minutes

### 1. Téléchargez et lancez le setup
```bash
# Sauvegardez le script setup comme setup-reaper-toolkit.sh
chmod +x setup-reaper-toolkit.sh
./setup-reaper-toolkit.sh
```

### 2. Configuration Reaper (IMPORTANT)
1. **Ouvrir Reaper**
2. **Options > Preferences > Control/OSC/web**
3. **Add > OSC (Open Sound Control)**
4. **Configuration :**
   - Local listen port: `8000`
   - Device port: `9000`
   - Device IP: `127.0.0.1`
5. **Enable** ✅

### 3. Démarrer le système
```bash
# Terminal 1: Bridge Server
./start-bridge.sh

# Terminal 2: App Mobile (dev)
./run-mobile-dev.sh

# Terminal 3: Tester les connexions
node test-connection.js
```

## 📱 Utilisation Mobile

### Configuration première utilisation
1. **Connecter smartphone au même WiFi que PC**
2. **Trouver IP de votre PC :**
   ```bash
   # Windows
   ipconfig
   
   # Mac/Linux
   ifconfig | grep inet
   ```
3. **Dans l'app mobile : Entrer l'IP** (ex: `192.168.1.100`)

### Contrôles disponibles
- **🎮 Transport:** Play, Stop, Record
- **🎚️ Mixer:** Volume, Mute, Solo par track
- **✨ Vincian:** Analyse code → Audio

## 🧬 Intégration VS Code AIMastery

### Ajout à votre extension
```typescript
// Dans votre extension.ts
import { ReaperIntegration } from './reaper-integration';

// Dans votre constructor
this.reaperIntegration = new ReaperIntegration(context);

// Dans handleSelfAnalysis, ajouter :
if (choice === '🎵 Sonify in Reaper') {
    await this.reaperIntegration.sendVincianAnalysis(analysis);
}
```

### Nouvelles commandes disponibles
- `AIMastery: Setup Reaper Integration`
- `AIMastery: Play Reaper`
- `AIMastery: Stop Reaper`
- `AIMastery: Sonify Code Analysis`

## 🎵 Mapping Vincian Code → Audio

| Code Métrique | Audio Output |
|---------------|--------------|
| Health Score 80%+ | Tempo 168+ BPM, harmonies majeures |
| Health Score 60-80% | Tempo 144-168 BPM, harmonies mixtes |
| Health Score <60% | Tempo <144 BPM, harmonies mineures |
| Error Handling ✅ | Accords stables (C, F, G) |
| No Error Handling ❌ | Accords dissonants (tritones) |
| Complex Functions | Reverb + delay |
| Clean Functions | Son sec et précis |
| Many Patterns | Séquences rythmiques complexes |
| Few Patterns | Mélodies simples |

## 🛠️ Troubleshooting

### ❌ Bridge Server ne démarre pas
```bash
cd reaper-bridge-server
npm install
npm run build
npm start
```

### ❌ Mobile app ne se connecte pas
1. Vérifier même réseau WiFi
2. Vérifier IP correcte
3. Désactiver firewall temporairement
4. Tester : `curl http://PC_IP:3000/status`

### ❌ Reaper ne répond pas
1. Vérifier OSC activé dans Reaper
2. Port 8000 libre : `netstat -an | grep 8000`
3. Redémarrer Reaper
4. Tester manuellement : 
   ```bash
   # Envoyer commande OSC test
   node -e "
   const osc = require('osc');
   const port = new osc.UDPPort({
     remoteAddress: '127.0.0.1',
     remotePort: 8000
   });
   port.open();
   port.send({address: '/play', args: []});
   "
   ```

### ❌ L'app mobile crash
1. Vérifier React Native environment
2. Rebuild : `cd reaper-mobile-app && npx react-native run-android`
3. Logs : `npx react-native log-android`

## 🎯 Cas d'Usage Typiques

### 🧬 Développeur Solo
1. Code dans VS Code
2. `Ctrl+Shift+P` > "AIMastery: Self Analysis"
3. Clic "Sonify in Reaper"
4. 🎵 Écouter la "symphonie" de votre code !

### 🎵 Producteur Musical + Dev
1. Analyser différents projets code
2. Comparer les "signatures sonores"
3. Créer des compositions basées sur l'architecture logicielle
4. Utiliser mobile pour contrôle temps réel pendant jam sessions

### 🎓 Enseignement Code
1. Analyser code étudiant
2. "Faire entendre" la qualité du code
3. Améliorer le code = améliorer la musique
4. Gamification de l'apprentissage

## 🚀 Extensions Possibles

### Niveau 1 (facile)
- [ ] Presets de mapping personnalisés
- [ ] Support plus de types de fichiers
- [ ] Sauvegarde des "compositions de code"

### Niveau 2 (moyen)
- [ ] Support Ableton Live
- [ ] Plugin Reaper natif
- [ ] Reconnaissance de gammes musicales

### Niveau 3 (avancé)
- [ ] IA pour améliorer les mappings
- [ ] Export automatique vers streaming
- [ ] Collaboration multi-développeurs temps réel

## 📞 Support

- **Documentation :** `README.md`
- **Logs :** `reaper-bridge-server/logs/`
- **Tests :** `node test-connection.js`
- **GitHub Issues :** Votre repo extension

---

## 🎊 Félicitations !

Vous avez maintenant un toolkit complet pour :
- ✅ Contrôler Reaper depuis smartphone
- ✅ Transformer code en musique (Vincian Analysis)
- ✅ Intégrer avec votre extension VS Code AIMastery
- ✅ Créer des expériences audio-code uniques

**Votre extension AIMastery devient maintenant un véritable instrument de musique pour développeurs ! 🎹🧬**