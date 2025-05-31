import * as vscode from 'vscode';

export class SocialContentEngine {
    private templates = {
        twitter: (title: string, score: number) => 
            `🎵 Nouvelle analyse #AIMastery !\n\n"${title}" a obtenu un score de ${score}/100\n\n#Musique #Analyse #VincianAnalysis`,
        
        instagram: (title: string, score: number) => 
            `✨ Analyse Vincienne Terminée ✨\n\n🎧 ${title}\n🎯 Score: ${score}/100\n\n#AIMastery #AnalyseMusicale #LeonardDeVinci`,
            
        linkedin: (title: string, score: number, insights: string[]) => 
            `📊 Analyse Vincienne - Résultats\n\nTitre: ${title}\nScore: ${score}/100\n\nPrincipaux points d'amélioration:\n${insights.slice(0, 3).map(i => `• ${i}`).join('\n')}\n\n#AIMastery #AnalyseMusicale #Innovation`
    };

    constructor() {
        console.log('📱 Social Content Engine initialized');
    }

    public generateContent(analysisResult: any): Record<string, string> {
        const { fileName, scores } = analysisResult;
        const score = scores?.overall || 0;
        const insights = analysisResult.recommendations || [];

        return {
            twitter: this.templates.twitter(fileName, score),
            instagram: this.templates.instagram(fileName, score),
            linkedin: this.templates.linkedin(fileName, score, insights)
        };
    }

    public async copyToClipboard(platform: string, content: string): Promise<boolean> {
        try {
            await vscode.env.clipboard.writeText(content);
            vscode.window.showInformationMessage(`✅ Contenu ${platform} copié dans le presse-papier`);
            return true;
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
            vscode.window.showErrorMessage('❌ Impossible de copier dans le presse-papier');
            return false;
        }
    }

    public async shareToSocialMedia(platform: string, content: string): Promise<boolean> {
        // Implémentation de base - à étendre avec des API spécifiques aux réseaux sociaux
        console.log(`Sharing to ${platform}:`, content);
        return this.copyToClipboard(platform, content);
    }
}
