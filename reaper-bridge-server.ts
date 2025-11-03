import express from 'express';
import { Server } from 'socket.io';
import { createServer } from 'http';

class ReaperBridgeServer {
    private app = express();
    private server = createServer(this.app);
    private io = new Server(this.server, {
        cors: { origin: "*", methods: ["GET", "POST"] }
    });

    constructor() {
        this.setupWebSocket();
        this.setupRoutes();
    }

    private setupWebSocket() {
        this.io.on('connection', (socket) => {
            console.log(`📱 Client connected: ${socket.id}`);

            socket.on('reaper-command', (data) => {
                console.log('🎛️ Reaper command:', data);
                // Ici, intégrer OSC vers Reaper
                this.handleReaperCommand(data);
            });

            socket.on('vincian-analysis', (data) => {
                console.log('✨ Vincian analysis:', data);
                this.handleVincianAnalysis(data);
            });

            socket.on('disconnect', () => {
                console.log(`📱 Client disconnected: ${socket.id}`);
            });
        });
    }

    private handleReaperCommand(data: any) {
        const { command, params } = data;
        console.log(`🎛️ Processing command: ${command}`, params);
        
        // Simuler envoi OSC pour l'instant
        switch (command) {
            case 'play':
                console.log('▶️ PLAY sent to Reaper');
                break;
            case 'stop':
                console.log('⏹️ STOP sent to Reaper');
                break;
            case 'record':
                console.log('⏺️ RECORD sent to Reaper');
                break;
            default:
                console.log(`❓ Unknown command: ${command}`);
        }
    }

    private handleVincianAnalysis(data: any) {
        console.log('✨ Processing Vincian analysis...');
        console.log(`Code Health: ${data.codeHealthScore * 100}%`);
        console.log(`Patterns: ${data.audioPatterns?.length || 0}`);
        
        // Simuler transformation en audio
        const tempo = Math.floor(120 + (data.codeHealthScore * 60));
        console.log(`🎵 Generated tempo: ${tempo} BPM`);
    }

    private setupRoutes() {
        this.app.use(express.json());
        
        this.app.get('/status', (req, res) => {
            res.json({
                status: 'running',
                connections: this.io.engine.clientsCount,
                timestamp: new Date().toISOString()
            });
        });

        this.app.post('/vscode/analysis', (req, res) => {
            console.log('📊 VS Code analysis received');
            this.handleVincianAnalysis(req.body);
            res.json({ success: true });
        });
    }

    start(port = 3000) {
        this.server.listen(port, () => {
            console.log(`🌉 Reaper Bridge Server running on port ${port}`);
            console.log(`🔗 WebSocket: ws://localhost:${port}`);
            console.log(`📡 HTTP API: http://localhost:${port}`);
        });
    }
}

const bridge = new ReaperBridgeServer();
bridge.start();
