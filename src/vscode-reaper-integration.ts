// ===== VS CODE + REAPER INTEGRATION =====
// Ajout à votre extension AIMastery pour contrôler Reaper

import * as vscode from 'vscode';
import axios from 'axios';

// INSTALLATION REQUISE dans votre extension:
// npm install axios ws osc-js

class ReaperIntegration {
    private bridgeServerURL: string;
    private connected: boolean = false;
    private context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.bridgeServerURL = vscode.workspace.getConfiguration('aimastery').get('reaperBridgeURL', 'http://localhost:3000');
        this.checkConnection();
    }

    // 🔌 VÉRIFIER CONNEXION AU BRIDGE
    private async checkConnection(): Promise<void> {
        try {
            const response = await axios.get(`${this.bridgeServerURL}/status`, { timeout: 2000 });
            this.connected = response.data.reaper && response.data.connected > 0;
            
            if (this.connected) {
                vscode.window.showInformationMessage('🎛️ Reaper Bridge connected!');
            }
        } catch (error) {
            this.connected = false;
            console.log('Reaper Bridge not available (normal if not using audio features)');
        }
    }

    // 🧬 ENVOYER ANALYSE VINCIAN À REAPER
    async sendVincianAnalysis(analysis: any): Promise<void> {
        if (!this.connected) {
            // Proposer d'activer l'intégration Reaper
            const choice = await vscode.window.showInformationMessage(
                '🎵 Voulez-vous sonifier cette analyse avec Reaper ?',
                'Activer Reaper',
                'Plus tard'
            );
            
            if (choice === 'Activer Reaper') {
                await this.setupReaperIntegration();
            }
            return;
        }

        try {
            // Transformer l'analyse de code en données audio
            const audioData = this.transformAnalysisToAudio(analysis);
            
            // Envoyer au bridge server
            await axios.post(`${this.bridgeServerURL}/vscode/analysis`, audioData);
            
            vscode.window.showInformationMessage(
                `🎵 Analysis sent to Reaper! Tempo: ${audioData.adaptedTempo} BPM`
            );
            
        } catch (error) {
            vscode.window.showErrorMessage('❌ Failed to send analysis to Reaper');
        }
    }

    // 🎵 TRANSFORMER ANALYSE CODE EN DONNÉES AUDIO
    private transformAnalysisToAudio(analysis: any): any {
        const healthScore = analysis.healthScore || 0.8;
        const patterns = analysis.codePatterns || [];
        const functions = analysis.workingFunctions || [];

        // MAPPING VINCIAN : Code → Audio
        return {
            codeHealthScore: healthScore,
            
            // Tempo basé sur la santé du code
            adaptedTempo: Math.floor(120 + (healthScore * 60)), // 120-180 BPM
            
            // Effets basés sur les patterns
            effects: {
                reverb: 1 - healthScore, // Plus le code est mauvais, plus de reverb
                delay: patterns.length > 5 ? 0.3 : 0.1, // Delay si beaucoup de patterns
                distortion: functions.filter(f => !f.hasErrorHandling).length * 0.1,
            },
            
            // Génération de notes basée sur les patterns
            audioPatterns: patterns.map((pattern, index) => ({
                name: pattern.name,
                frequency: pattern.frequency,
                note: 60 + (index * 2), // C4 + intervalles
                velocity: Math.min(127, pattern.frequency * 20),
                duration: Math.max(0.5, pattern.frequency / 10)
            })),
            
            // Harmonie basée sur les fonctions
            harmony: functions.map((func, index) => ({
                functionName: func.name,
                chord: this.generateChordFromFunction(func),
                timing: index * 0.5 // Échelonnement temporel
            })),
            
            // Métadonnées pour l'app mobile
            metadata: {
                totalFunctions: functions.length,
                totalPatterns: patterns.length,
                analysisTimestamp: new Date().toISOString(),
                codeComplexity: this.calculateComplexity(analysis)
            }
        };
    }

    // 🎼 GÉNÉRER ACCORD DEPUIS FONCTION
    private generateChordFromFunction(func: any): number[] {
        const baseNote = 60; // C4
        const chord = [baseNote];
        
        // Ajouter des notes selon les caractéristiques de la fonction
        if (func.hasErrorHandling) {
            chord.push(baseNote + 4); // Tierce majeure (stable)
        } else {
            chord.push(baseNote + 3); // Tierce mineure (instable)
        }
        
        if (func.returnsSomething) {
            chord.push(baseNote + 7); // Quinte (résolution)
        }
        
        if (func.usesRealLogic) {
            chord.push(baseNote + 10); // Septième (complexité)
        }
        
        return chord;
    }

    // 📊 CALCULER COMPLEXITÉ
    private calculateComplexity(analysis: any): number {
        const factors = [
            analysis.workingFunctions?.length || 0,
            analysis.codePatterns?.length || 0,
            analysis.improvementOpportunities?.length || 0
        ];
        
        return factors.reduce((sum, factor) => sum + factor, 0) / factors.length;
    }

    // ⚙️ SETUP REAPER INTEGRATION
    private async setupReaperIntegration(): Promise<void> {
        const panel = vscode.window.createWebviewPanel(
            'reaperSetup',
            '🎛️ Reaper Integration Setup',
            vscode.ViewColumn.One,
            { enableScripts: true }
        );

        panel.webview.html = this.getSetupHTML();
        
        panel.webview.onDidReceiveMessage(async (message) => {
            switch (message.command) {
                case 'setBridgeURL':
                    await vscode.workspace.getConfiguration('aimastery').update('reaperBridgeURL', message.url);
                    this.bridgeServerURL = message.url;
                    await this.checkConnection();
                    break;
                    
                case 'downloadBridge':
                    vscode.env.openExternal(vscode.Uri.parse('https://github.com/aimastery/reaper-bridge'));
                    break;
                    
                case 'downloadMobileApp':
                    vscode.env.openExternal(vscode.Uri.parse('https://github.com/aimastery/reaper-mobile'));
                    break;
            }
        });
    }

    // 📱 HTML SETUP REAPER
    private getSetupHTML(): string {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { 
                        font-family: -apple-system, sans-serif; 
                        padding: 20px; 
                        background: #1a1a2e; 
                        color: white;
                    }
                    .container { max-width: 600px; margin: 0 auto; }
                    .step { 
                        background: rgba(255,255,255,0.1); 
                        padding: 20px; 
                        margin: 20px 0; 
                        border-radius: 10px; 
                    }
                    .button {
                        background: #667eea;
                        color: white;
                        padding: 10px 20px;
                        border: none;
                        border-radius: 5px;
                        cursor: pointer;
                        margin: 5px;
                    }
                    .input {
                        background: #333;
                        color: white;
                        padding: 10px;
                        border: 1px solid #555;
                        border-radius: 5px;
                        width: 100%;
                        margin: 10px 0;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>🎛️ AIMastery + Reaper Integration</h1>
                    <p>Transformez votre code en musique avec l'analyse Vincienne !</p>
                    
                    <div class="step">
                        <h3>1. 📥 Télécharger le Bridge Server</h3>
                        <p>Le bridge server fait la connexion entre VS Code et Reaper</p>
                        <button class="button" onclick="downloadBridge()">
                            Télécharger Bridge Server
                        </button>
                    </div>
                    
                    <div class="step">
                        <h3>2. 🎛️ Configuration Reaper</h3>
                        <p>Dans Reaper :</p>
                        <ul>
                            <li>Options > Preferences > Control/OSC/web</li>
                            <li>Add > OSC (Open Sound Control)</li>
                            <li>Port : 8000</li>
                            <li>Device IP : 127.0.0.1</li>
                        </ul>
                    </div>
                    
                    <div class="step">
                        <h3>3. 📱 App Mobile (Optionnel)</h3>
                        <p>Contrôlez Reaper depuis votre smartphone</p>
                        <button class="button" onclick="downloadMobileApp()">
                            Télécharger App Mobile
                        </button>
                    </div>
                    
                    <div class="step">
                        <h3>4. 🔗 Configuration Bridge URL</h3>
                        <input type="text" class="input" id="bridgeURL" 
                               value="${this.bridgeServerURL}" 
                               placeholder="http://localhost:3000">
                        <button class="button" onclick="setBridgeURL()">
                            Définir URL Bridge
                        </button>
                    </div>
                    
                    <div class="step">
                        <h3>✨ Comment ça marche</h3>
                        <p>1. Analysez votre code avec AIMastery</p>
                        <p>2. L'extension transforme les patterns en données audio</p>
                        <p>3. Reaper reçoit les instructions et génère la musique</p>
                        <p>4. Votre code devient une symphonie Vincienne ! 🎵</p>
                    </div>
                </div>
                
                <script>
                    const vscode = acquireVsCodeApi();
                    
                    function setBridgeURL() {
                        const url = document.getElementById('bridgeURL').value;
                        vscode.postMessage({ command: 'setBridgeURL', url: url });
                    }
                    
                    function downloadBridge() {
                        vscode.postMessage({ command: 'downloadBridge' });
                    }
                    
                    function downloadMobileApp() {
                        vscode.postMessage({ command: 'downloadMobileApp' });
                    }
                </script>
            </body>
            </html>
        `;
    }

    // 🎵 COMMANDES REAPER DIRECTES
    async playReaper(): Promise<void> {
        if (this.connected) {
            await axios.post(`${this.bridgeServerURL}/reaper/command`, { command: 'play' });
        }
    }

    async stopReaper(): Promise<void> {
        if (this.connected) {
            await axios.post(`${this.bridgeServerURL}/reaper/command`, { command: 'stop' });
        }
    }

    async recordReaper(): Promise<void> {
        if (this.connected) {
            await axios.post(`${this.bridgeServerURL}/reaper/command`, { command: 'record' });
        }
    }
}

// 🔧 AJOUT À VOTRE EXTENSION MANAGER
// Dans votre AIMasteryExtensionManager, ajoutez :

class ExtendedAIMasteryExtensionManager {
    private reaperIntegration: ReaperIntegration;
    
    constructor(context: vscode.ExtensionContext) {
        // ... votre code existant ...
        
        // Ajouter l'intégration Reaper
        this.reaperIntegration = new ReaperIntegration(context);
    }
    
    // Modifier votre méthode handleSelfAnalysis existante
    private async handleSelfAnalysis(): Promise<void> {
        // ... votre code d'analyse existant ...
        
        // NOUVEAU: Proposer d'envoyer à Reaper
        const choice = await vscode.window.showInformationMessage(
            `🧬 Analysis complete! Health: ${healthPercentage}%`,
            '🎵 Sonify in Reaper',
            'OK'
        );
        
        if (choice === '🎵 Sonify in Reaper') {
            await this.reaperIntegration.sendVincianAnalysis(analysis);
        }
    }
    
    // Nouvelles commandes Reaper
    private async registerReaperCommands(): Promise<void> {
        this.registerCommand('aimastery.reaper.play', () => this.reaperIntegration.playReaper());
        this.registerCommand('aimastery.reaper.stop', () => this.reaperIntegration.stopReaper());
        this.registerCommand('aimastery.reaper.record', () => this.reaperIntegration.recordReaper());
        this.registerCommand('aimastery.reaper.setup', () => this.reaperIntegration.setupReaperIntegration());
    }
}

export { ReaperIntegration, ExtendedAIMasteryExtensionManager };