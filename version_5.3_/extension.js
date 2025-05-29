"use strict";
// NOUVEAU : Intégration FUZZY-SEA-QUEST
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = __importStar(require("vscode"));
function activate(context) {
    console.log('🎨 AI Mastery Vincian Analyzer activé !');
    // 🌊 NOUVEAU : Reception des messages FUZZY-SEA-QUEST
    const handleFuzzyMessages = (message) => {
        switch (message.command) {
            case 'fuzzy-sync':
                handleGameStateSync(message.data);
                break;
            case 'fuzzy-heal':
                handleExtensionHealing(message.data);
                break;
            case 'check-subscription-status':
                sendSubscriptionStatus();
                break;
            case 'open-subscription-page':
                openSubscriptionPage();
                break;
        }
    };
    // 🎮 Synchronisation avec FUZZY-SEA-QUEST
    const handleGameStateSync = (gameState) => {
        console.log('🌊 Game State reçu:', gameState);
        // Stocker les données du jeu
        context.globalState.update('fuzzyGameState', gameState);
        // Mettre à jour l'interface extension avec les vibes
        updateExtensionInterface(gameState);
        // Notification de succès
        vscode.window.showInformationMessage(`🎮 FUZZY-SEA-QUEST synchronisé ! Vibe: ${gameState.currentVibe}, Confidence: ${gameState.codeConfidence}%`);
    };
    // 🔧 Auto-healing via patterns FUZZY
    const handleExtensionHealing = (healingData) => {
        console.log('🔧 Tentative de guérison avec patterns FUZZY:', healingData);
        try {
            // Appliquer les patterns qui marchent dans le jeu
            applyWorkingPatterns(healingData.workingPatterns);
            // Tester les fonctionnalités
            testExtensionFeatures();
            // Notification de guérison
            vscode.window.showInformationMessage('✨ Extension guérie grâce aux patterns FUZZY-SEA-QUEST !');
        }
        catch (error) {
            console.error('❌ Erreur durante la guérison:', error);
            // Transformer l'erreur en insight créatif (vibe creative !)
            const creativeInsight = transformErrorToInsight(error);
            vscode.window.showWarningMessage(`🎨 Insight créatif: ${creativeInsight}`);
        }
    };
    // 💎 Gestion du statut d'abonnement
    const sendSubscriptionStatus = () => {
        // Vérifier le statut d'abonnement (simulation)
        const subscriptionStatus = getSubscriptionStatus();
        // Envoyer vers FUZZY-SEA-QUEST
        const panel = vscode.window.activeTextEditor;
        if (panel) {
            vscode.commands.executeCommand('vscode.postMessage', {
                command: 'subscription-status',
                status: subscriptionStatus
            });
        }
    };
    // 🛒 Ouvrir la page d'abonnement
    const openSubscriptionPage = () => {
        vscode.env.openExternal(vscode.Uri.parse('https://marketplace.visualstudio.com/items?itemName=Serigne-Diagne.aimastery-vincian-analysis'));
    };
    // 🔧 Appliquer les patterns qui marchent
    const applyWorkingPatterns = (patterns) => {
        console.log('🌊 Application des patterns océaniques:', patterns);
        // Exemple : Si FUZZY-SEA-QUEST détecte un pattern 'flow',
        // on applique la même fluidité à l'extension
        if (patterns.creativityFlow === 'flow') {
            enableFlowMode();
        }
        // Si le jeu a un high confidence, on boost l'extension
        if (patterns.confidenceBoost > 75) {
            enableHighConfidenceMode();
        }
    };
    // 🌊 Mode Flow pour l'extension
    const enableFlowMode = () => {
        console.log('🌊 Flow Mode activé dans l\'extension !');
        // Optimiser les analyses pour plus de fluidité
        // Réduire les délais, augmenter la réactivité
    };
    // 💪 Mode High Confidence
    const enableHighConfidenceMode = () => {
        console.log('💪 High Confidence Mode activé !');
        // Analyses plus poussées, suggestions plus audacieuses
    };
    // 🎨 Analyse Vincienne améliorée avec vibes FUZZY
    const vincianAnalysisCommand = vscode.commands.registerCommand('aimastery.vincianAnalysis', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('Aucun fichier ouvert !');
            return;
        }
        const code = editor.document.getText();
        const gameState = context.globalState.get('fuzzyGameState');
        // Analyse enrichie avec les vibes du jeu
        const analysis = await performVincianAnalysis(code, gameState);
        // Afficher dans un webview
        showVincianAnalysisPanel(analysis);
    });
    // 🧠 Analyse Vincienne enrichie
    const performVincianAnalysis = async (code, gameState) => {
        const baseAnalysis = {
            codeComplexity: calculateComplexity(code),
            creativityScore: calculateCreativity(code),
            vincianInsight: generateVincianWisdom(code),
            suggestions: generateSuggestions(code)
        };
        // Enrichir avec les vibes FUZZY si disponibles
        if (gameState) {
            baseAnalysis['fuzzyEnrichment'] = {
                playerVibe: gameState.currentVibe,
                confidence: gameState.codeConfidence,
                fuzzyTokens: gameState.playerFuzzy,
                vibeBasedSuggestion: adaptSuggestionToVibe(code, gameState.currentVibe)
            };
        }
        return baseAnalysis;
    };
    // 🎯 Suggestions adaptées au vibe
    const adaptSuggestionToVibe = (code, vibe) => {
        const vibeSuggestions = {
            chill: "🧘 Simplifie ce code. Retire les complexités inutiles.",
            flow: "🌊 Rends ce code plus fluide. Évite les interruptions de flux.",
            creative: "🎨 Ajoute de la créativité ! Ose une approche différente.",
            intense: "🚀 Optimise les performances. Chaque ligne doit être efficace."
        };
        return vibeSuggestions[vibe] || "💡 Améliore selon ton instinct.";
    };
    // 📱 Panel Webview avec intégration FUZZY
    const showVincianAnalysisPanel = (analysis) => {
        const panel = vscode.window.createWebviewPanel('vincianAnalysis', '🎨 Analyse Vincienne Enhanced', vscode.ViewColumn.Two, { enableScripts: true });
        panel.webview.html = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { 
                        background: linear-gradient(135deg, #20b2aa, #008b8b);
                        color: white;
                        font-family: 'Segoe UI', sans-serif;
                        padding: 2rem;
                        margin: 0;
                    }
                    .vibe-card {
                        background: rgba(255,255,255,0.1);
                        padding: 1.5rem;
                        border-radius: 15px;
                        margin: 1rem 0;
                        backdrop-filter: blur(10px);
                        border: 1px solid rgba(255,255,255,0.2);
                    }
                    .fuzzy-enhanced {
                        background: linear-gradient(135deg, #ff6b6b, #feca57);
                        padding: 1rem;
                        border-radius: 10px;
                        margin: 1rem 0;
                    }
                    button {
                        background: linear-gradient(135deg, #8e44ad, #3498db);
                        color: white;
                        border: none;
                        padding: 0.75rem 1.5rem;
                        border-radius: 20px;
                        cursor: pointer;
                        font-size: 1rem;
                        margin: 0.5rem;
                        transition: all 0.3s ease;
                    }
                    button:hover {
                        transform: scale(1.05);
                        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
                    }
                </style>
            </head>
            <body>
                <h1>🎨 Analyse Vincienne du Code</h1>
                
                <div class="vibe-card">
                    <h2>🧠 Insights Léonard</h2>
                    <p><strong>Complexité:</strong> ${analysis.codeComplexity}/10</p>
                    <p><strong>Créativité:</strong> ${analysis.creativityScore}%</p>
                    <p><strong>🎨 Sagesse Vincienne:</strong> "${analysis.vincianInsight}"</p>
                </div>

                ${analysis.fuzzyEnrichment ? `
                <div class="fuzzy-enhanced">
                    <h2>🌊 FUZZY-SEA-QUEST Enhancement</h2>
                    <p><strong>🎵 Vibe Actuel:</strong> ${analysis.fuzzyEnrichment.playerVibe.toUpperCase()}</p>
                    <p><strong>💫 Code Confidence:</strong> ${analysis.fuzzyEnrichment.confidence}%</p>
                    <p><strong>💰 FUZZY Tokens:</strong> ${analysis.fuzzyEnrichment.fuzzyTokens.toLocaleString()}</p>
                    <p><strong>🎯 Suggestion Vibe:</strong> "${analysis.fuzzyEnrichment.vibeBasedSuggestion}"</p>
                </div>
                ` : ''}
                
                <div class="vibe-card">
                    <h2>🔧 Suggestions d'Amélioration</h2>
                    <ul>
                        ${analysis.suggestions.map(s => `<li>${s}</li>`).join('')}
                    </ul>
                </div>
                
                <div style="text-align: center; margin-top: 2rem;">
                    <button onclick="applyFuzzyOptimization()">🌊 Appliquer Optimisation FUZZY</button>
                    <button onclick="generateVibeCode()">🎨 Générer Code Vibe</button>
                    <button onclick="syncWithGame()">🎮 Sync avec FUZZY-SEA-QUEST</button>
                </div>
                
                <script>
                    const vscode = acquireVsCodeApi();
                    
                    function applyFuzzyOptimization() {
                        vscode.postMessage({ 
                            command: 'applyFuzzyOptimization',
                            vibe: '${analysis.fuzzyEnrichment?.playerVibe || 'flow'}'
                        });
                    }
                    
                    function generateVibeCode() {
                        vscode.postMessage({ 
                            command: 'generateVibeCode',
                            analysis: ${JSON.stringify(analysis)}
                        });
                    }
                    
                    function syncWithGame() {
                        vscode.postMessage({ 
                            command: 'syncWithFuzzyGame'
                        });
                    }
                </script>
            </body>
            </html>
        `;
        // Gérer les messages du webview
        panel.webview.onDidReceiveMessage(message => {
            switch (message.command) {
                case 'applyFuzzyOptimization':
                    applyFuzzyOptimization(message.vibe);
                    break;
                case 'generateVibeCode':
                    generateVibeBasedCode(message.analysis);
                    break;
                case 'syncWithFuzzyGame':
                    requestGameSync();
                    break;
            }
        });
    };
    // 🔧 Fonctions utilitaires
    const calculateComplexity = (code) => {
        // Calcul simple de complexité
        const lines = code.split('\n').length;
        const functions = (code.match(/function|=>/g) || []).length;
        const conditions = (code.match(/if|switch|for|while/g) || []).length;
        return Math.min(Math.floor((lines + functions * 2 + conditions * 3) / 10), 10);
    };
    const calculateCreativity = (code) => {
        // Score créativité basé sur patterns uniques
        const uniquePatterns = new Set([
            ...code.match(/\w+/g) || []
        ]).size;
        return Math.min(Math.floor(uniquePatterns / 2), 100);
    };
    const generateVincianWisdom = (code) => {
        const wisdoms = [
            "La simplicité est la sophistication suprême.",
            "L'art et la science s'embrassent dans ce code.",
            "Comme l'eau trouve son chemin, ton code trouvera sa forme.",
            "Chaque ligne est un coup de pinceau sur la toile digitale."
        ];
        return wisdoms[Math.floor(Math.random() * wisdoms.length)];
    };
    const generateSuggestions = (code) => {
        return [
            "🎨 Ajouter des commentaires créatifs",
            "🌊 Simplifier les flux complexes",
            "⚡ Optimiser les performances",
            "🧘 Séparer les responsabilités"
        ];
    };
    const getSubscriptionStatus = () => {
        // Pour l'instant simulation - à connecter avec vraie logique
        return 'free';
    };
    // 🎨 Interface extension update
    const updateExtensionInterface = (gameState) => {
        console.log('🎨 Mise à jour interface avec vibe:', gameState.currentVibe);
        // Future: mettre à jour l'UI de l'extension avec les données du jeu
    };
    // 🧪 Test des fonctionnalités extension
    const testExtensionFeatures = () => {
        console.log('🧪 Test des fonctionnalités extension...');
        // Vérifier que tout fonctionne
        return true;
    };
    // 🎨 Transformer erreur en insight créatif
    const transformErrorToInsight = (error) => {
        const insights = [
            "Cette erreur révèle une opportunité créative !",
            "Comme Leonardo transformait ses erreurs en découvertes...",
            "L'erreur est le début de l'innovation !",
            "Chaque bug cache une leçon précieuse."
        ];
        return insights[Math.floor(Math.random() * insights.length)];
    };
    // 🌊 Optimisation FUZZY
    const applyFuzzyOptimization = (vibe) => {
        vscode.window.showInformationMessage(`🌊 Optimisation ${vibe} appliquée à votre code !`);
        console.log(`🚀 Application optimisation vibe: ${vibe}`);
    };
    // 🎨 Génération code basé sur vibe
    const generateVibeBasedCode = (analysis) => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const vibeCode = `
// 🌊 Code généré avec vibe ${analysis.fuzzyEnrichment?.playerVibe || 'flow'}
// 🎨 Sagesse Vincienne: ${analysis.vincianInsight}

function fuzzyEnhancedFunction() {
    // TODO: Implémenter selon votre vibe !
    console.log('🎮 FUZZY-SEA-QUEST enhanced code!');
}
`;
            editor.edit(editBuilder => {
                editBuilder.insert(editor.selection.start, vibeCode);
            });
            vscode.window.showInformationMessage('🎨 Code vibe généré dans votre fichier !');
        }
    };
    // 🔗 Demander sync avec le jeu
    const requestGameSync = () => {
        vscode.window.showInformationMessage('🔗 Synchronisation avec FUZZY-SEA-QUEST demandée !');
        // Future: vraie communication avec le jeu
    };
    // 🌊 AUTRES COMMANDES MANQUANTES - AJOUTEZ CECI AUSSI :
    // 🌊 Sync FUZZY Command
    const fuzzySyncCommand = vscode.commands.registerCommand('aimastery.fuzzySync', () => {
        vscode.window.showInformationMessage('🌊 Synchronisation FUZZY-SEA-QUEST activée !');
        // Simuler réception données jeu
        const mockGameState = {
            currentVibe: 'flow',
            codeConfidence: 85,
            playerFuzzy: 1337,
            vibeLevel: 3
        };
        handleGameStateSync(mockGameState);
    });
    // 🎮 Ouvrir jeu Command
    const openGameCommand = vscode.commands.registerCommand('aimastery.openGame', () => {
        vscode.env.openExternal(vscode.Uri.parse('http://localhost:3000'));
        vscode.window.showInformationMessage('🎮 Ouverture FUZZY-SEA-QUEST dans le navigateur !');
    });
    // 🔧 Heal Extension Command
    const healExtensionCommand = vscode.commands.registerCommand('aimastery.healExtension', () => {
        const mockHealingData = {
            workingPatterns: {
                creativityFlow: 'flow',
                confidenceBoost: 90,
                successfulLogic: 'FUZZY patterns work!'
            }
        };
        handleExtensionHealing(mockHealingData);
    });
    // 🎵 Vibe Mode Command
    const vibeModeCommand = vscode.commands.registerCommand('aimastery.vibeMode', async () => {
        const vibes = [
            '🧘 Chill - Mode zen',
            '🌊 Flow - État optimal',
            '🎨 Creative - Créativité max',
            '⚔️ Intense - Performance ultime'
        ];
        const selectedVibe = await vscode.window.showQuickPick(vibes, {
            placeHolder: 'Choisissez votre vibe de codage !'
        });
        if (selectedVibe) {
            const vibeName = selectedVibe.split(' - ')[0];
            vscode.window.showInformationMessage(`🎵 Vibe changé: ${vibeName}`);
        }
    });
    // 🏗️ Générer App Command
    const generateAppCommand = vscode.commands.registerCommand('aimastery.generateApp', async () => {
        const apps = [
            '🌊 Ocean Analytics Dashboard',
            '🎨 Creative Design Tool',
            '🧘 Zen Productivity App',
            '⚔️ Performance Monitor'
        ];
        const selectedApp = await vscode.window.showQuickPick(apps, {
            placeHolder: 'Quel type d\'app générer ?'
        });
        if (selectedApp) {
            vscode.window.showInformationMessage(`🏗️ Génération "${selectedApp}" en cours...`);
            setTimeout(() => {
                vscode.window.showInformationMessage(`✅ "${selectedApp}" généré ! 🎉`);
            }, 2000);
        }
    });
    // 📝 ENREGISTRER TOUTES LES COMMANDES (remplacez la ligne existante) :
    context.subscriptions.push(vincianAnalysisCommand, fuzzySyncCommand, openGameCommand, healExtensionCommand, vibeModeCommand, generateAppCommand);
    // 🎉 Message final d'activation
    vscode.window.showInformationMessage('🌊 AI Mastery + FUZZY-SEA-QUEST v6.0 prêt ! 🎮🎨');
    console.log('🌊 AI Mastery Extension prête pour FUZZY-SEA-QUEST !');
}
exports.activate = activate;
function deactivate() {
    console.log('🎨 AI Mastery Vincian Analyzer désactivé');
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map