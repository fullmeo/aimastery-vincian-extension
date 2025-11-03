# 1. Naviguer vers votre projet
cd ~/OneDrive/Musique/Documents/aimastery/vincian_analyzer_vs-extension/aimastery-vincian-analysis

# 2. Créer le script de setup principal
cat > setup-reaper-toolkit.sh << 'EOF'
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
EOF

chmod +x setup-reaper-toolkit.sh

# 3. Créer le Bridge Server
cat > reaper-bridge-server.ts << 'EOF'
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
EOF

# 4. Créer le script de démarrage
cat > start-bridge.sh << 'EOF'
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
EOF

chmod +x start-bridge.sh

# 5. Créer l'intégration VS Code
cat > vscode-reaper-integration.ts << 'EOF'
import * as vscode from 'vscode';
import axios from 'axios';

export class ReaperIntegration {
    private bridgeServerURL = 'http://localhost:3000';
    private connected = false;

    constructor(private context: vscode.ExtensionContext) {
        this.checkConnection();
    }

    private async checkConnection(): Promise<void> {
        try {
            const response = await axios.get(`${this.bridgeServerURL}/status`, { timeout: 2000 });
            this.connected = true;
            console.log('🎛️ Reaper Bridge connected!');
        } catch (error) {
            this.connected = false;
            console.log('🎛️ Reaper Bridge not available');
        }
    }

    async sendVincianAnalysis(analysis: any): Promise<void> {
        if (!this.connected) {
            const choice = await vscode.window.showInformationMessage(
                '🎵 Voulez-vous activer l\'intégration Reaper ?',
                'Activer',
                'Plus tard'
            );
            
            if (choice === 'Activer') {
                await this.showSetupInstructions();
            }
            return;
        }

        try {
            const audioData = this.transformAnalysisToAudio(analysis);
            await axios.post(`${this.bridgeServerURL}/vscode/analysis`, audioData);
            
            vscode.window.showInformationMessage(
                `🎵 Analysis sent to Reaper! Tempo: ${audioData.adaptedTempo} BPM`
            );
        } catch (error) {
            vscode.window.showErrorMessage('❌ Failed to send analysis to Reaper');
        }
    }

    private transformAnalysisToAudio(analysis: any): any {
        const healthScore = analysis.healthScore || 0.8;
        const patterns = analysis.codePatterns || [];

        return {
            codeHealthScore: healthScore,
            adaptedTempo: Math.floor(120 + (healthScore * 60)),
            audioPatterns: patterns.map((pattern: any, index: number) => ({
                name: pattern.name,
                frequency: pattern.frequency,
                note: 60 + (index * 2)
            }))
        };
    }

    private async showSetupInstructions(): Promise<void> {
        const message = `
🎛️ SETUP REAPER INTEGRATION

1. Dans Reaper:
   Options > Preferences > Control/OSC/web
   Add > OSC (Open Sound Control)
   Port: 8000

2. Lancer Bridge Server:
   ./start-bridge.sh

3. Tester la connexion
        `;

        vscode.window.showInformationMessage(message, { modal: true });
    }
}
EOF

# 6. Créer le script de test
cat > test-connection.js << 'EOF'
const axios = require('axios');

async function testConnections() {
    console.log('🧪 Testing Reaper Toolkit connections...');
    
    try {
        const response = await axios.get('http://localhost:3000/status');
        console.log('✅ Bridge Server: Connected');
        console.log(`📊 Status:`, response.data);
        
        // Test sending analysis
        const testAnalysis = {
            codeHealthScore: 0.85,
            audioPatterns: [
                { name: 'async/await', frequency: 5 },
                { name: 'error handling', frequency: 3 }
            ]
        };
        
        await axios.post('http://localhost:3000/vscode/analysis', testAnalysis);
        console.log('✅ Analysis sending: Success');
        
    } catch (error) {
        console.log('❌ Bridge Server: Connection failed');
        console.log('💡 Make sure to run: ./start-bridge.sh');
    }
}

testConnections();
EOF

# 7. Créer la documentation
cat > REAPER-SETUP.md << 'EOF'
# 🎛️ AIMastery Reaper Integration

## Quick Setup

### 1. Install Dependencies
```bash
npm install axios ws  # Add to your extension