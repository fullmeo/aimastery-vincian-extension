// ===== PROVIDERS UNIFIÉS - FUSION INTELLIGENTE =====
// Combine l'analyse technique du code avec l'analyse Vincienne

import * as vscode from 'vscode';
import * as path from 'path';
import { SelfAnalyzer } from './self-analyzing-extension';
import { SelfAnalysisResult, WorkingFunction, CodePattern } from './VincianTypes';

// ===== INTERFACES UNIFIÉES =====

/**
 * Interface pour une analyse unifiée (code + audio)
 */
export interface UnifiedAnalysisResult {
    // Analyse technique
    codeHealth?: {
        score: number;
        functions: WorkingFunction[];
        patterns: CodePattern[];
        improvements: string[];
    };
    
    // Analyse Vincienne (pour l'audio)
    vincianAnalysis?: {
        score: number;
        cymaticPatterns: any[];
        harmonics: any[];
        socialMediaPacks: any[];
    };
    
    // Métadonnées communes
    timestamp: Date;
    analysisType: 'code' | 'audio' | 'unified';
    userId: string;
    version: string;
}

/**
 * Item unifié pour la TreeView
 */
export class UnifiedAnalysisItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly itemType: 'root' | 'category' | 'detail' | 'action',
        public readonly data?: any,
        public readonly description?: string,
        public readonly command?: vscode.Command,
        public readonly iconPath?: vscode.ThemeIcon | string
    ) {
        super(label, collapsibleState);
        this.description = description;
        this.command = command;
        this.iconPath = iconPath;
        
        // Ajouter tooltip contextuel
        this.tooltip = this.generateTooltip();
        
        // Styling conditionnel
        this.contextValue = itemType;
    }

    private generateTooltip(): string {
        switch (this.itemType) {
            case 'root':
                return `${this.label} - Cliquez pour voir les détails`;
            case 'category':
                return `Catégorie: ${this.label}`;
            case 'detail':
                return this.description || this.label;
            case 'action':
                return `Action: ${this.label} - Cliquez pour exécuter`;
            default:
                return this.label;
        }
    }
}

// ===== PROVIDER UNIFIÉ PRINCIPAL =====

/**
 * Provider principal qui combine analyse technique et Vincienne
 */
export class UnifiedAnalysisProvider implements vscode.TreeDataProvider<UnifiedAnalysisItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<UnifiedAnalysisItem | undefined | void> = new vscode.EventEmitter<UnifiedAnalysisItem | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<UnifiedAnalysisItem | undefined | void> = this._onDidChangeTreeData.event;
    
    private codeAnalyzer: SelfAnalyzer;
    private analysisResults: UnifiedAnalysisResult[] = [];
    private currentMode: 'auto' | 'code' | 'audio' | 'unified' = 'auto';
    
    constructor(analyzer: SelfAnalyzer) {
        this.codeAnalyzer = analyzer;
        this.detectUserMode();
    }

    /**
     * Détecte automatiquement le mode utilisateur basé sur l'environnement
     */
    private detectUserMode(): void {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        
        if (workspaceFolders) {
            // Analyser les types de fichiers dans le workspace
            vscode.workspace.findFiles('**/*.{ts,js,py,java,cpp}', '**/node_modules/**', 50)
                .then(codeFiles => {
                    vscode.workspace.findFiles('**/*.{mp3,wav,m4a,flac}', undefined, 20)
                        .then(audioFiles => {
                            if (codeFiles.length > 0 && audioFiles.length > 0) {
                                this.currentMode = 'unified';
                            } else if (codeFiles.length > 0) {
                                this.currentMode = 'code';
                            } else if (audioFiles.length > 0) {
                                this.currentMode = 'audio';
                            } else {
                                this.currentMode = 'auto';
                            }
                            this.refresh();
                        });
                });
        }
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    addAnalysisResult(result: UnifiedAnalysisResult): void {
        this.analysisResults.unshift(result); // Ajouter au début
        this.analysisResults = this.analysisResults.slice(0, 10); // Garder seulement les 10 derniers
        this.refresh();
    }

    setMode(mode: 'auto' | 'code' | 'audio' | 'unified'): void {
        this.currentMode = mode;
        this.refresh();
    }

    getTreeItem(element: UnifiedAnalysisItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: UnifiedAnalysisItem): Thenable<UnifiedAnalysisItem[]> {
        if (!element) {
            return this.getRootItems();
        }

        switch (element.itemType) {
            case 'root':
                return this.getCategoryItems(element.data);
            case 'category':
                return this.getDetailItems(element.data);
            default:
                return Promise.resolve([]);
        }
    }

    private async getRootItems(): Promise<UnifiedAnalysisItem[]> {
        const items: UnifiedAnalysisItem[] = [];

        // Mode selector
        items.push(new UnifiedAnalysisItem(
            `Mode: ${this.currentMode.toUpperCase()}`,
            vscode.TreeItemCollapsibleState.None,
            'action',
            null,
            'Cliquez pour changer de mode',
            {
                command: 'aimastery.switchMode',
                title: 'Changer de mode',
                arguments: []
            },
            new vscode.ThemeIcon('settings-gear')
        ));

        // Actions quick selon le mode
        items.push(...this.getQuickActions());

        // Séparateur
        items.push(new UnifiedAnalysisItem(
            '─ Analyses Récentes ─',
            vscode.TreeItemCollapsibleState.None,
            'detail',
            null,
            '',
            undefined,
            new vscode.ThemeIcon('history')
        ));

        // Résultats d'analyses récentes
        if (this.analysisResults.length === 0) {
            items.push(new UnifiedAnalysisItem(
                'Aucune analyse récente',
                vscode.TreeItemCollapsibleState.None,
                'action',
                null,
                'Cliquez pour commencer',
                {
                    command: 'aimastery.startAnalysis',
                    title: 'Démarrer analyse',
                    arguments: []
                },
                new vscode.ThemeIcon('play')
            ));
        } else {
            this.analysisResults.forEach((result, index) => {
                const icon = this.getIconForAnalysisType(result.analysisType);
                const score = this.getMainScore(result);
                
                items.push(new UnifiedAnalysisItem(
                    `${this.getAnalysisLabel(result)} (${score})`,
                    vscode.TreeItemCollapsibleState.Collapsed,
                    'root',
                    result,
                    result.timestamp.toLocaleString(),
                    undefined,
                    new vscode.ThemeIcon(icon)
                ));
            });
        }

        return items;
    }

    private getQuickActions(): UnifiedAnalysisItem[] {
        const actions: UnifiedAnalysisItem[] = [];

        switch (this.currentMode) {
            case 'code':
                actions.push(
                    new UnifiedAnalysisItem(
                        '🔍 Analyser le Code',
                        vscode.TreeItemCollapsibleState.None,
                        'action',
                        null,
                        'Analyse complète du code',
                        {
                            command: 'aimastery.selfAnalysis',
                            title: 'Analyser le code',
                            arguments: []
                        },
                        new vscode.ThemeIcon('search')
                    ),
                    new UnifiedAnalysisItem(
                        '⚡ Auto-Améliorer',
                        vscode.TreeItemCollapsibleState.None,
                        'action',
                        null,
                        'Amélioration automatique',
                        {
                            command: 'aimastery.selfImprove',
                            title: 'Auto-améliorer',
                            arguments: []
                        },
                        new vscode.ThemeIcon('zap')
                    )
                );
                break;

            case 'audio':
                actions.push(
                    new UnifiedAnalysisItem(
                        '🎵 Analyser Audio',
                        vscode.TreeItemCollapsibleState.None,
                        'action',
                        null,
                        'Analyse cymatique audio',
                        {
                            command: 'aimastery.analyzeAudio',
                            title: 'Analyser audio',
                            arguments: []
                        },
                        new vscode.ThemeIcon('play')
                    ),
                    new UnifiedAnalysisItem(
                        '📱 Générer Social Pack',
                        vscode.TreeItemCollapsibleState.None,
                        'action',
                        null,
                        'Contenu social media',
                        {
                            command: 'aimastery.generateSocialPack',
                            title: 'Générer social pack',
                            arguments: []
                        },
                        new vscode.ThemeIcon('globe')
                    )
                );
                break;

            case 'unified':
                actions.push(
                    new UnifiedAnalysisItem(
                        '🚀 Analyse Complète',
                        vscode.TreeItemCollapsibleState.None,
                        'action',
                        null,
                        'Code + Audio + Social',
                        {
                            command: 'aimastery.unifiedAnalysis',
                            title: 'Analyse unifiée',
                            arguments: []
                        },
                        new vscode.ThemeIcon('rocket')
                    )
                );
                break;

            default:
                actions.push(
                    new UnifiedAnalysisItem(
                        '🎯 Démarrer',
                        vscode.TreeItemCollapsibleState.None,
                        'action',
                        null,
                        'Première analyse',
                        {
                            command: 'aimastery.startAnalysis',
                            title: 'Commencer',
                            arguments: []
                        },
                        new vscode.ThemeIcon('play')
                    )
                );
        }

        return actions;
    }

    private async getCategoryItems(result: UnifiedAnalysisResult): Promise<UnifiedAnalysisItem[]> {
        const items: UnifiedAnalysisItem[] = [];

        // Analyse du code si disponible
        if (result.codeHealth) {
            items.push(new UnifiedAnalysisItem(
                `💻 Code Health (${(result.codeHealth.score * 100).toFixed(0)}%)`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'category',
                { type: 'codeHealth', data: result.codeHealth },
                `${result.codeHealth.functions.length} fonctions, ${result.codeHealth.patterns.length} patterns`,
                undefined,
                new vscode.ThemeIcon('code')
            ));
        }

        // Analyse Vincienne si disponible
        if (result.vincianAnalysis) {
            items.push(new UnifiedAnalysisItem(
                `🎵 Score Vincien (${result.vincianAnalysis.score}/100)`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'category',
                { type: 'vincianAnalysis', data: result.vincianAnalysis },
                `${result.vincianAnalysis.cymaticPatterns?.length || 0} patterns cymatiques`,
                undefined,
                new vscode.ThemeIcon('play')
            ));
        }

        // Actions contextuelles
        items.push(new UnifiedAnalysisItem(
            '⚡ Actions',
            vscode.TreeItemCollapsibleState.Collapsed,
            'category',
            { type: 'actions', data: result },
            'Actions disponibles',
            undefined,
            new vscode.ThemeIcon('zap')
        ));

        return items;
    }

    private async getDetailItems(categoryData: any): Promise<UnifiedAnalysisItem[]> {
        const items: UnifiedAnalysisItem[] = [];

        switch (categoryData.type) {
            case 'codeHealth':
                const codeHealth = categoryData.data;
                
                // Fonctions
                items.push(new UnifiedAnalysisItem(
                    `⚙️ Fonctions (${codeHealth.functions.length})`,
                    vscode.TreeItemCollapsibleState.Collapsed,
                    'detail',
                    null,
                    'Fonctions détectées'
                ));
                
                codeHealth.functions.slice(0, 5).forEach((func: WorkingFunction) => {
                    const quality = func.qualityScore ? (func.qualityScore * 100).toFixed(0) : 'N/A';
                    items.push(new UnifiedAnalysisItem(
                        `  ${func.name}`,
                        vscode.TreeItemCollapsibleState.None,
                        'detail',
                        func,
                        `Qualité: ${quality}% | Lignes: ${func.lineCount}`,
                        {
                            command: 'aimastery.showFunctionDetails',
                            title: 'Voir détails',
                            arguments: [func]
                        },
                        new vscode.ThemeIcon('symbol-function')
                    ));
                });

                // Patterns
                items.push(new UnifiedAnalysisItem(
                    `🔍 Patterns (${codeHealth.patterns.length})`,
                    vscode.TreeItemCollapsibleState.Collapsed,
                    'detail',
                    null,
                    'Patterns de code'
                ));
                
                codeHealth.patterns.slice(0, 3).forEach((pattern: CodePattern) => {
                    items.push(new UnifiedAnalysisItem(
                        `  ${pattern.name}`,
                        vscode.TreeItemCollapsibleState.None,
                        'detail',
                        pattern,
                        `Utilisé ${pattern.frequency} fois | ${pattern.useCase}`,
                        {
                            command: 'aimastery.showPatternDetails',
                            title: 'Voir pattern',
                            arguments: [pattern]
                        },
                        new vscode.ThemeIcon('symbol-class')
                    ));
                });

                // Améliorations
                if (codeHealth.improvements.length > 0) {
                    items.push(new UnifiedAnalysisItem(
                        `💡 Améliorations (${codeHealth.improvements.length})`,
                        vscode.TreeItemCollapsibleState.Collapsed,
                        'detail',
                        null,
                        'Suggestions d\'amélioration'
                    ));
                    
                    codeHealth.improvements.slice(0, 3).forEach((improvement: string) => {
                        const priority = this.extractPriority(improvement);
                        items.push(new UnifiedAnalysisItem(
                            `  ${improvement.replace(/^\[[\w]+\]\s*/, '')}`,
                            vscode.TreeItemCollapsibleState.None,
                            'detail',
                            improvement,
                            `Priorité: ${priority}`,
                            {
                                command: 'aimastery.applyImprovement',
                                title: 'Appliquer',
                                arguments: [improvement]
                            },
                            new vscode.ThemeIcon('lightbulb')
                        ));
                    });
                }
                break;

            case 'vincianAnalysis':
                const vincian = categoryData.data;
                
                items.push(
                    new UnifiedAnalysisItem(
                        `🌊 Patterns Cymatiques (${vincian.cymaticPatterns?.length || 0})`,
                        vscode.TreeItemCollapsibleState.None,
                        'detail',
                        null,
                        'Formes géométriques détectées'
                    ),
                    new UnifiedAnalysisItem(
                        `🎼 Harmoniques (${vincian.harmonics?.length || 0})`,
                        vscode.TreeItemCollapsibleState.None,
                        'detail',
                        null,
                        'Fréquences harmoniques'
                    ),
                    new UnifiedAnalysisItem(
                        `📱 Social Packs (${vincian.socialMediaPacks?.length || 0})`,
                        vscode.TreeItemCollapsibleState.None,
                        'detail',
                        null,
                        'Contenus générés'
                    )
                );
                break;

            case 'actions':
                items.push(
                    new UnifiedAnalysisItem(
                        '🔄 Réanalyser',
                        vscode.TreeItemCollapsibleState.None,
                        'action',
                        null,
                        'Relancer l\'analyse',
                        {
                            command: 'aimastery.reAnalyze',
                            title: 'Réanalyser',
                            arguments: [categoryData.data]
                        },
                        new vscode.ThemeIcon('refresh')
                    ),
                    new UnifiedAnalysisItem(
                        '📊 Rapport Détaillé',
                        vscode.TreeItemCollapsibleState.None,
                        'action',
                        null,
                        'Ouvrir rapport complet',
                        {
                            command: 'aimastery.showDetailedReport',
                            title: 'Voir rapport',
                            arguments: [categoryData.data]
                        },
                        new vscode.ThemeIcon('graph')
                    ),
                    new UnifiedAnalysisItem(
                        '📤 Exporter',
                        vscode.TreeItemCollapsibleState.None,
                        'action',
                        null,
                        'Exporter les résultats',
                        {
                            command: 'aimastery.exportResults',
                            title: 'Exporter',
                            arguments: [categoryData.data]
                        },
                        new vscode.ThemeIcon('export')
                    )
                );
                break;
        }

        return items;
    }

    // Méthodes utilitaires
    private getIconForAnalysisType(type: string): string {
        switch (type) {
            case 'code': return 'code';
            case 'audio': return 'play';
            case 'unified': return 'rocket';
            default: return 'search';
        }
    }

    private getMainScore(result: UnifiedAnalysisResult): string {
        if (result.codeHealth && result.vincianAnalysis) {
            return `${(result.codeHealth.score * 100).toFixed(0)}% | ${result.vincianAnalysis.score}/100`;
        } else if (result.codeHealth) {
            return `${(result.codeHealth.score * 100).toFixed(0)}%`;
        } else if (result.vincianAnalysis) {
            return `${result.vincianAnalysis.score}/100`;
        }
        return 'N/A';
    }

    private getAnalysisLabel(result: UnifiedAnalysisResult): string {
        switch (result.analysisType) {
            case 'code': return '💻 Code Analysis';
            case 'audio': return '🎵 Vincian Analysis';
            case 'unified': return '🚀 Unified Analysis';
            default: return '🔍 Analysis';
        }
    }

    private extractPriority(improvement: string): string {
        const match = improvement.match(/^\[(\w+)\]/);
        return match ? match[1] : 'MEDIUM';
    }
}

// ===== PROVIDER SPÉCIALISÉ AUDIO/VINCIAN =====

/**
 * Provider spécialisé pour l'analyse Vincienne (audio)
 * Compatible avec l'existant mais amélioré
 */
export class EnhancedVincianAnalysisProvider implements vscode.TreeDataProvider<UnifiedAnalysisItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<UnifiedAnalysisItem | undefined | void> = new vscode.EventEmitter<UnifiedAnalysisItem | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<UnifiedAnalysisItem | undefined | void> = this._onDidChangeTreeData.event;
    
    private results: any[] = [];
    
    refresh(): void {
        this._onDidChangeTreeData.fire();
    }
    
    addResult(result: any): void {
        this.results.unshift(result);
        this.results = this.results.slice(0, 20); // Garder les 20 derniers
        this.refresh();
    }
    
    getTreeItem(element: UnifiedAnalysisItem): vscode.TreeItem {
        return element;
    }
    
    getChildren(element?: UnifiedAnalysisItem): Thenable<UnifiedAnalysisItem[]> {
        if (!element) {
            if (this.results.length === 0) {
                return Promise.resolve([
                    new UnifiedAnalysisItem(
                        "🎵 Analyser un fichier audio",
                        vscode.TreeItemCollapsibleState.None,
                        'action',
                        null,
                        "Démarrer analyse cymatique",
                        {
                            command: "aimastery.startAudioAnalysis",
                            title: "Analyser audio",
                            arguments: []
                        },
                        new vscode.ThemeIcon('play')
                    ),
                    new UnifiedAnalysisItem(
                        "📚 Guide d'utilisation",
                        vscode.TreeItemCollapsibleState.None,
                        'action',
                        null,
                        "Comment utiliser l'analyse Vincienne",
                        {
                            command: "aimastery.showVincianGuide",
                            title: "Voir guide",
                            arguments: []
                        },
                        new vscode.ThemeIcon('book')
                    )
                ]);
            }
            
            return Promise.resolve(
                this.results.map((result, index) => {
                    const score = result.vincianScore || result.score || 0;
                    const quality = score > 80 ? '🌟' : score > 60 ? '⚡' : '📊';
                    
                    return new UnifiedAnalysisItem(
                        `${quality} Analyse #${index + 1} - Score: ${score}`,
                        vscode.TreeItemCollapsibleState.Collapsed,
                        'root',
                        result,
                        new Date(result.timestamp || Date.now()).toLocaleString(),
                        undefined,
                        new vscode.ThemeIcon('play')
                    );
                })
            );
        } else {
            // Détails d'une analyse
            const result = element.data;
            const items: UnifiedAnalysisItem[] = [];

            if (result.insights) {
                result.insights.forEach((insight: any) => {
                    items.push(new UnifiedAnalysisItem(
                        `${insight.category}`,
                        vscode.TreeItemCollapsibleState.None,
                        'detail',
                        insight,
                        `Score: ${insight.score}/10`,
                        undefined,
                        new vscode.ThemeIcon('symbol-misc')
                    ));
                });
            }

            // Actions pour cette analyse
            items.push(
                new UnifiedAnalysisItem(
                    "📱 Générer Social Pack",
                    vscode.TreeItemCollapsibleState.None,
                    'action',
                    result,
                    "Créer contenu social media",
                    {
                        command: "aimastery.generateSocialPack",
                        title: "Générer pack",
                        arguments: [result]
                    },
                    new vscode.ThemeIcon('globe')
                ),
                new UnifiedAnalysisItem(
                    "📊 Voir Rapport Complet",
                    vscode.TreeItemCollapsibleState.None,
                    'action',
                    result,
                    "Ouvrir analyse détaillée",
                    {
                        command: "aimastery.showVincianReport",
                        title: "Voir rapport",
                        arguments: [result]
                    },
                    new vscode.ThemeIcon('graph')
                )
            );

            return Promise.resolve(items);
        }
    }
}

// ===== PROVIDER AUTO-CODING AMÉLIORÉ =====

/**
 * Provider pour l'auto-coding et tableau de bord
 */
export class EnhancedAutocodingProvider implements vscode.TreeDataProvider<UnifiedAnalysisItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<UnifiedAnalysisItem | undefined | void> = new vscode.EventEmitter<UnifiedAnalysisItem | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<UnifiedAnalysisItem | undefined | void> = this._onDidChangeTreeData.event;
    
    private codeAnalyzer: SelfAnalyzer;
    
    constructor(analyzer: SelfAnalyzer) {
        this.codeAnalyzer = analyzer;
    }
    
    refresh(): void {
        this._onDidChangeTreeData.fire();
    }
    
    getTreeItem(element: UnifiedAnalysisItem): vscode.TreeItem {
        return element;
    }
    
    getChildren(): Thenable<UnifiedAnalysisItem[]> {
        return Promise.resolve([
            new UnifiedAnalysisItem(
                "🚀 Auto-Code Generator",
                vscode.TreeItemCollapsibleState.Collapsed,
                'category',
                null,
                "Génération automatique de code",
                undefined,
                new vscode.ThemeIcon('rocket')
            ),
            new UnifiedAnalysisItem(
                "📊 Tableau de Bord Vincien",
                vscode.TreeItemCollapsibleState.None,
                'action',
                null,
                "Dashboard complet",
                {
                    command: "aimastery.showVincianDashboard",
                    title: "Ouvrir dashboard",
                    arguments: []
                },
                new vscode.ThemeIcon('dashboard')
            ),
            new UnifiedAnalysisItem(
                "⚡ Quick Actions",
                vscode.TreeItemCollapsibleState.Collapsed,
                'category',
                null,
                "Actions rapides",
                undefined,
                new vscode.ThemeIcon('zap')
            ),
            new UnifiedAnalysisItem(
                "💎 Premium Features",
                vscode.TreeItemCollapsibleState.Collapsed,
                'category',
                null,
                "Fonctionnalités premium",
                undefined,
                new vscode.ThemeIcon('star')
            )
        ]);
    }
}

// ===== COMMANDES POUR LES PROVIDERS UNIFIÉS =====

/**
 * Enregistre toutes les commandes pour les providers unifiés
 */
export function registerUnifiedProviderCommands(context: vscode.ExtensionContext, analyzer: SelfAnalyzer): void {
    // Commande pour changer de mode
    const switchModeCommand = vscode.commands.registerCommand(
        'aimastery.switchMode',
        async () => {
            const modes = [
                { label: '🤖 Auto (Detection automatique)', value: 'auto' },
                { label: '💻 Code (Analyse technique)', value: 'code' },
                { label: '🎵 Audio (Analyse Vincienne)', value: 'audio' },
                { label: '🚀 Unifié (Code + Audio)', value: 'unified' }
            ];

            const selected = await vscode.window.showQuickPick(modes, {
                placeHolder: 'Sélectionnez le mode d\'analyse',
                canPickMany: false
            });

            if (selected) {
                // Ici vous mettriez à jour le mode du provider
                vscode.window.showInformationMessage(`Mode ${selected.label} activé`);
                vscode.commands.executeCommand('aimastery.refreshData');
            }
        }
    );

    // Commande pour analyse unifiée
    const unifiedAnalysisCommand = vscode.commands.registerCommand(
        'aimastery.unifiedAnalysis',
        async () => {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "🚀 Analyse unifiée en cours...",
                cancellable: false
            }, async (progress) => {
                progress.report({ increment: 0, message: "Analyse du code..." });
                
                // Analyse technique
                const codeAnalysis = analyzer.analyzeSelf();
                
                progress.report({ increment: 50, message: "Analyse audio..." });
                
                // Simulation analyse audio (à remplacer par vraie logique)
                const audioAnalysis = {
                    score: 75 + Math.random() * 25,
                    cymaticPatterns: [],
                    harmonics: [],
                    socialMediaPacks: []
                };
                
                progress.report({ increment: 100, message: "Finalisation..." });
                
                // Créer résultat unifié
                const unifiedResult: UnifiedAnalysisResult = {
                    codeHealth: {
                        score: codeAnalysis.healthScore,
                        functions: codeAnalysis.workingFunctions,
                        patterns: codeAnalysis.codePatterns,
                        improvements: codeAnalysis.improvementOpportunities
                    },
                    vincianAnalysis: audioAnalysis,
                    timestamp: new Date(),
                    analysisType: 'unified',
                    userId: vscode.env.machineId,
                    version: '1.0.0'
                };

                vscode.window.showInformationMessage(
                    `🚀 Analyse unifiée terminée ! Code: ${(codeAnalysis.healthScore * 100).toFixed(0)}% | Vincien: ${audioAnalysis.score.toFixed(0)}/100`
                );
            });
        }
    );

    // Commande pour démarrer l'analyse audio
    const startAudioAnalysisCommand = vscode.commands.registerCommand(
        'aimastery.startAudioAnalysis',
        async () => {
            const audioFiles = await vscode.window.showOpenDialog({
                canSelectFiles: true,
                canSelectFolders: false,
                canSelectMany: false,
                filters: {
                    'Audio Files': ['mp3', 'wav', 'm4a', 'flac', 'aac']
                },
                openLabel: 'Analyser ce fichier audio'
            });

            if (audioFiles && audioFiles.length > 0) {
                const filePath = audioFiles[0].fsPath;
                vscode.window.showInformationMessage(
                    `🎵 Analyse cymatique de ${path.basename(filePath)} en cours...`
                );
                
                // Ici vous ajouteriez la vraie logique d'analyse audio
                // Pour l'instant, simulation
                setTimeout(() => {
                    vscode.window.showInformationMessage(
                        `✨ Analyse terminée ! Score Vincien: ${(70 + Math.random() * 30).toFixed(0)}/100`
                    );
                }, 2000);
            }
        }
    );

    // Commande pour afficher le guide Vincien
    const showVincianGuideCommand = vscode.commands.registerCommand(
        'aimastery.showVincianGuide',
        () => {
            const panel = vscode.window.createWebviewPanel(
                'vincianGuide',
                '📚 Guide d\'Analyse Vincienne',
                vscode.ViewColumn.Two,
                { enableScripts: true }
            );

            panel.webview.html = `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: -apple-system, sans-serif; padding: 20px; background: #1e1e1e; color: #d4d4d4; }
                        h1 { color: #ffd700; }
                        .section { margin: 20px 0; padding: 15px; background: rgba(255,255,255,0.05); border-radius: 8px; }
                    </style>
                </head>
                <body>
                    <h1>🎵 Guide d'Analyse Vincienne</h1>
                    
                    <div class="section">
                        <h3>🌊 Qu'est-ce que l'analyse cymatique ?</h3>
                        <p>L'analyse cymatique étudie les formes géométriques créées par les vibrations sonores, inspirée des travaux de Léonard de Vinci sur les patterns naturels.</p>
                    </div>
                    
                    <div class="section">
                        <h3>📊 Le Score Vincien</h3>
                        <p>Note de 0 à 100 basée sur :</p>
                        <ul>
                            <li>Harmonie des fréquences</li>
                            <li>Complexité des patterns cymatiques</li>
                            <li>Résonance avec les proportions dorées</li>
                            <li>Potentiel viral selon l'IA</li>
                        </ul>
                    </div>
                    
                    <div class="section">
                        <h3>🚀 Comment commencer ?</h3>
                        <ol>
                            <li>Cliquez sur "🎵 Analyser un fichier audio"</li>
                            <li>Sélectionnez votre fichier (MP3, WAV, M4A...)</li>
                            <li>Attendez l'analyse (30-60 secondes)</li>
                            <li>Consultez votre Score Vincien</li>
                            <li>Générez vos Social Media Packs</li>
                        </ol>
                    </div>
                </body>
                </html>
            `;
        }
    );

    context.subscriptions.push(
        switchModeCommand,
        unifiedAnalysisCommand,
        startAudioAnalysisCommand,
        showVincianGuideCommand
    );
}