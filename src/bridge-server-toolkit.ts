// ===== BRIDGE SERVER TOOLKIT =====
// Serveur Node.js qui fait le pont entre Mobile App et Reaper

import express from 'express';
import { Server } from 'socket.io';
import { createServer } from 'http';
import osc from 'osc';
import midi from 'midi';

// INSTALLATION DES DÉPENDANCES
/*
npm install express socket.io http
npm install osc midi cors
npm install @types/node @types/express
npm install nodemon --save-dev
*/

class ReaperBridgeServer {
    private app = express();
    private server = createServer(this.app);
    private io = new Server(this.server, {
        cors: { origin: "*", methods: ["GET", "POST"] }
    });
    
    private oscPort: any;
    private midiOutput: any;
    private connectedClients = new Set<string>();

    constructor() {
        this.setupOSC();
        this.setupMIDI();
        this.setupWebSocket();
        this.setupRoutes();
    }

    // 🎛️ CONFIGURATION OSC POUR REAPER
    private setupOSC() {
        this.oscPort = new osc.UDPPort({
            localAddress: "0.0.0.0",
            localPort: 9000,
            remoteAddress: "127.0.0.1", // Reaper IP
            remotePort: 8000,
            metadata: true
        });

        this.oscPort.on("ready", () => {
            console.log("🎛️ OSC Port ready - Connected to Reaper");
        });

        this.oscPort.on("message", (oscMsg: any) => {
            console.log("📨 Received OSC from Reaper:", oscMsg);
            // Relayer vers les clients mobiles
            this.io.emit('reaper-update', oscMsg);
        });

        this.oscPort.open();
    }

    // 🎹 CONFIGURATION MIDI
    private setupMIDI() {
        this.midiOutput = new midi.Output();
        
        // Lister les ports MIDI disponibles
        const portCount = this.midiOutput.getPortCount();
        for (let i = 0; i < portCount; i++) {
            console.log(`🎹 MIDI Port ${i}: ${this.midiOutput.getPortName(i)}`);
        }

        // Se connecter au premier port disponible
        if (portCount > 0) {
            this.midiOutput.openPort(0);
            console.log("🎹 MIDI Output connected");
        }
    }

    // 🔌 WEBSOCKET POUR MOBILE
    private setupWebSocket() {
        this.io.on('connection', (socket) => {
            console.log(`📱 Mobile client connected: ${socket.id}`);
            this.connectedClients.add(socket.id);

            // COMMANDES DEPUIS MOBILE
            socket.on('reaper-command', (data) => {
                this.handleReaperCommand(data);
            });

            // COMMANDES VINCIAN (intégration AIMastery)
            socket.on('vincian-analysis', (data) => {
                this.handleVincianAnalysis(data);
            });

            socket.on('disconnect', () => {
                console.log(`📱 Mobile client disconnected: ${socket.id}`);
                this.connectedClients.delete(socket.id);
            });
        });
    }

    // 🎛️ TRAITEMENT COMMANDES REAPER
    private handleReaperCommand(data: any) {
        const { command, params } = data;

        switch (command) {
            case 'play':
                this.sendOSC('/play', []);
                break;
            
            case 'stop':
                this.sendOSC('/stop', []);
                break;
            
            case 'record':
                this.sendOSC('/record', []);
                break;
            
            case 'volume':
                this.sendOSC('/track/volume', [params.track, params.volume]);
                break;
            
            case 'mute':
                this.sendOSC('/track/mute', [params.track, params.mute ? 1 : 0]);
                break;
            
            case 'solo':
                this.sendOSC('/track/solo', [params.track, params.solo ? 1 : 0]);
                break;

            case 'fx':
                this.sendOSC(`/track/${params.track}/fx/${params.fx}/param/${params.param}/value`, [params.value]);
                break;

            default:
                console.log(`❓ Unknown command: ${command}`);
        }
    }

    // ✨ INTÉGRATION VINCIAN (depuis votre extension AIMastery)
    private handleVincianAnalysis(data: any) {
        const { codeHealthScore, audioPatterns, socialPack } = data;

        // Mapper le score de santé du code vers des paramètres Reaper
        const tempoModification = Math.floor(120 + (codeHealthScore * 60)); // 120-180 BPM
        const reverbAmount = 1 - codeHealthScore; // Plus le code est mauvais, plus de reverb

        // Envoyer les modifications à Reaper
        this.sendOSC('/tempo', [tempoModification]);
        this.sendOSC('/track/1/fx/reverb/wet', [reverbAmount]);

        // Générer des patterns MIDI basés sur les patterns de code
        if (audioPatterns && audioPatterns.length > 0) {
            this.generateMIDIFromPatterns(audioPatterns);
        }

        console.log(`✨ Vincian analysis applied - Tempo: ${tempoModification}, Reverb: ${reverbAmount}`);
    }

    // 🎵 GÉNÉRATION MIDI DEPUIS PATTERNS DE CODE
    private generateMIDIFromPatterns(patterns: any[]) {
        patterns.forEach((pattern, index) => {
            const note = 60 + (index * 2); // C4 + intervalles
            const velocity = Math.floor(pattern.frequency * 10); // Intensité basée sur fréquence
            
            // Envoyer note MIDI
            setTimeout(() => {
                this.midiOutput.sendMessage([0x90, note, velocity]); // Note ON
                setTimeout(() => {
                    this.midiOutput.sendMessage([0x80, note, 0]); // Note OFF
                }, 500);
            }, index * 1000);
        });
    }

    // 📡 ENVOYER COMMANDE OSC
    private sendOSC(address: string, args: any[] = []) {
        this.oscPort.send({
            address: address,
            args: args
        });
        console.log(`📡 OSC sent: ${address}`, args);
    }

    // 🛣️ ROUTES HTTP
    private setupRoutes() {
        this.app.use(express.json());
        this.app.use(express.static('public'));

        // Status endpoint
        this.app.get('/status', (req, res) => {
            res.json({
                connected: this.connectedClients.size,
                reaper: this.oscPort.ready,
                midi: this.midiOutput.isPortOpen()
            });
        });

        // Configuration endpoint
        this.app.get('/config', (req, res) => {
            res.json({
                osc: { port: 9000, reaperPort: 8000 },
                websocket: { port: 3000 },
                midi: { ports: this.getMIDIPorts() }
            });
        });

        // Intégration VS Code Extension
        this.app.post('/vscode/analysis', (req, res) => {
            const analysis = req.body;
            this.handleVincianAnalysis(analysis);
            res.json({ success: true, message: 'Analysis applied to Reaper' });
        });
    }

    private getMIDIPorts(): string[] {
        const ports: string[] = [];
        const portCount = this.midiOutput.getPortCount();
        for (let i = 0; i < portCount; i++) {
            ports.push(this.midiOutput.getPortName(i));
        }
        return ports;
    }

    start(port = 3000) {
        this.server.listen(port, () => {
            console.log(`🌉 Reaper Bridge Server running on port ${port}`);
            console.log(`🔗 Mobile app can connect to: ws://localhost:${port}`);
            console.log(`🎛️ OSC connected to Reaper on port 8000`);
        });
    }
}

// 🚀 DÉMARRAGE DU SERVEUR
const bridge = new ReaperBridgeServer();
bridge.start();

export default ReaperBridgeServer;