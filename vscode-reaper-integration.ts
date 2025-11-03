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
