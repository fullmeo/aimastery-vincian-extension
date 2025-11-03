// ===== VIEW PROVIDERS - INTERFACES TREEVIEW POUR VS CODE =====

import * as vscode from 'vscode';
import { SelfAnalyzer } from './self-analyzing-extension';
import { SelfAnalysisResult, WorkingFunction, CodePattern, Improvement, CodeMetrics } from './VincianTypes';

/**
 * Interface commune pour tous les providers d'analyse
 */
export interface IAnalysisProvider {
    refresh(): void;
    getChildren(element?: any): vscode.ProviderResult<any[]>;
    getTreeItem(element: any): vscode.TreeItem;
}

/**
 * Classe de base abstraite pour les providers d'analyse
 */
export abstract class BaseAnalysisProvider<T> implements vscode.TreeDataProvider<T>, IAnalysisProvider {
    private _onDidChangeTreeData: vscode.EventEmitter<T | undefined | null | void> = new vscode.EventEmitter<T | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<T | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor(protected analyzer: SelfAnalyzer) {}

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    abstract getChildren(element?: T): vscode.ProviderResult<T[]>;
    abstract getTreeItem(element: T): vscode.TreeItem;
    
    /**
     * Méthode utilitaire pour créer des TreeItems standardisés
     */
    protected createTreeItem(
        label: string, 
        collapsibleState: vscode.TreeItemCollapsibleState, 
        iconPath?: string,
        tooltip?: string,
        command?: vscode.Command
    ): vscode.TreeItem {
        const item = new vscode.TreeItem(label, collapsibleState);
        
        if (iconPath) {
            item.iconPath = new vscode.ThemeIcon(iconPath);
        }
        
        if (tooltip) {
            item.tooltip = tooltip;
        }
        
        if (command) {
            item.command = command;
        }
        
        return item;
    }

    /**
     * Méthode utilitaire pour formater les pourcentages
     */
    protected formatPercentage(value: number): string {
        return `${(value * 100).toFixed(1)}%`;
    }

    /**
     * Méthode utilitaire pour obtenir une couleur basée sur un score
     */
    protected getScoreColor(score: number): string {
        if (score >= 0.8) return '✅';
        if (score >= 0.6) return '⚠️';
        return '❌';
    }
}

// ===== HEALTH PROVIDER =====

/**
 * Item de santé du code dans la TreeView
 */
export class HealthItem {
    constructor(
        public readonly label: string,
        public readonly value: string | number,
        public readonly icon: string,
        public readonly severity: 'good' | 'warning' | 'error' = 'good',
        public readonly children?: HealthItem[]
    ) {}
}

/**
 * Provider pour la vue de santé du code
 */
export class CodeHealthProvider extends BaseAnalysisProvider<HealthItem> {
    private cachedAnalysis: SelfAnalysisResult | null = null;
    private lastRefresh: number = 0;
    private readonly CACHE_DURATION = 5000; // 5 secondes

    getTreeItem(element: HealthItem): vscode.TreeItem {
        const item = this.createTreeItem(
            `${element.icon} ${element.label}: ${element.value}`,
            element.children ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.None,
            this.getIconForSeverity(element.severity),
            this.getTooltipForHealthItem(element)
        );

        // Ajouter couleur contextuelle
        if (element.severity === 'error') {
            item.iconPath = new vscode.ThemeIcon('error', new vscode.ThemeColor('errorForeground'));
        } else if (element.severity === 'warning') {
            item.iconPath = new vscode.ThemeIcon('warning', new vscode.ThemeColor('warningForeground'));
        } else {
            item.iconPath = new vscode.ThemeIcon('check', new vscode.ThemeColor('terminal.ansiGreen'));
        }

        return item;
    }

    getChildren(element?: HealthItem): vscode.ProviderResult<HealthItem[]> {
        if (element) {
            return element.children || [];
        }

        return this.getRootHealthItems();
    }

    private getRootHealthItems(): HealthItem[] {
        const analysis = this.getAnalysis();
        
        if (!analysis) {
            return [new HealthItem('Analysis', 'Not available', '❌', 'error')];
        }

        const healthScore = analysis.healthScore;
        const healthPercentage = this.formatPercentage(healthScore);
        const healthSeverity: 'good' | 'warning' | 'error' = 
            healthScore >= 0.8 ? 'good' : healthScore >= 0.6 ? 'warning' : 'error';

        return [
            new HealthItem(
                'Overall Health',
                healthPercentage,
                this.getScoreColor(healthScore),
                healthSeverity,
                [
                    new HealthItem('Functions Found', analysis.workingFunctions.length.toString(), '⚙️'),
                    new HealthItem('Code Patterns', analysis.codePatterns.length.toString(), '🔍'),
                    new HealthItem('Improvements Available', analysis.improvementOpportunities.length.toString(), '💡'),
                    new HealthItem('Lines Analyzed', analysis.analysisMetadata.linesAnalyzed.toString(), '📄'),
                    new HealthItem('AI Confidence', this.formatPercentage(analysis.analysisMetadata.aiConfidence), '🤖')
                ]
            ),
            new HealthItem(
                'Quality Metrics',
                '',
                '📊',
                'good',
                this.getQualityMetrics(analysis)
            ),
            new HealthItem(
                'Recent Analysis',
                analysis.timestamp.toLocaleTimeString(),
                '🕒',
                'good',
                [
                    new HealthItem('Analysis Type', analysis.analysisMetadata.analysisType, 'ℹ️'),
                    new HealthItem('Duration', `${analysis.analysisMetadata.analysisDuration}ms`, '⏱️'),
                    new HealthItem('Version', analysis.analysisMetadata.version, '🏷️')
                ]
            )
        ];
    }

    private getQualityMetrics(analysis: SelfAnalysisResult): HealthItem[] {
        const functionsWithQuality = analysis.workingFunctions.filter(f => f.qualityScore !== undefined);
        const avgQuality = functionsWithQuality.length > 0 
            ? functionsWithQuality.reduce((sum, f) => sum + (f.qualityScore || 0), 0) / functionsWithQuality.length
            : 0;

        const functionsWithErrorHandling = analysis.workingFunctions.filter(f => f.hasErrorHandling).length;
        const functionsWithRealLogic = analysis.workingFunctions.filter(f => f.usesRealLogic).length;
        const totalFunctions = analysis.workingFunctions.length;

        return [
            new HealthItem(
                'Average Function Quality',
                this.formatPercentage(avgQuality),
                this.getScoreColor(avgQuality),
                avgQuality >= 0.7 ? 'good' : avgQuality >= 0.5 ? 'warning' : 'error'
            ),
            new HealthItem(
                'Error Handling Coverage',
                `${functionsWithErrorHandling}/${totalFunctions}`,
                '🛡️',
                functionsWithErrorHandling / totalFunctions >= 0.7 ? 'good' : 'warning'
            ),
            new HealthItem(
                'Real Logic Usage',
                `${functionsWithRealLogic}/${totalFunctions}`,
                '🧠',
                functionsWithRealLogic / totalFunctions >= 0.8 ? 'good' : 'warning'
            )
        ];
    }

    private getAnalysis(): SelfAnalysisResult | null {
        const now = Date.now();
        if (this.cachedAnalysis && (now - this.lastRefresh) < this.CACHE_DURATION) {
            return this.cachedAnalysis;
        }

        try {
            this.cachedAnalysis = this.analyzer.analyzeSelf();
            this.lastRefresh = now;
            return this.cachedAnalysis;
        } catch (error) {
            console.error('Failed to get analysis:', error);
            return null;
        }
    }

    private getIconForSeverity(severity: 'good' | 'warning' | 'error'): string {
        switch (severity) {
            case 'good': return 'check';
            case 'warning': return 'warning';
            case 'error': return 'error';
        }
    }

    private getTooltipForHealthItem(item: HealthItem): string {
        return `${item.label}: ${item.value}`;
    }
}

// ===== PATTERNS PROVIDER =====

/**
 * Item de pattern dans la TreeView
 */
export class PatternItem {
    constructor(
        public readonly pattern: CodePattern,
        public readonly type: 'pattern' | 'detail' = 'pattern',
        public readonly label?: string,
        public readonly value?: string
    ) {}
}

/**
 * Provider pour la vue des patterns de code
 */
export class PatternsProvider extends BaseAnalysisProvider<PatternItem> {
    getTreeItem(element: PatternItem): vscode.TreeItem {
        if (element.type === 'detail') {
            return this.createTreeItem(
                `${element.label}: ${element.value}`,
                vscode.TreeItemCollapsibleState.None,
                'info'
            );
        }

        const pattern = element.pattern;
        const label = `${pattern.name} (${pattern.frequency}x)`;
        
        return this.createTreeItem(
            label,
            vscode.TreeItemCollapsibleState.Collapsed,
            'code',
            `${pattern.useCase}\nFrequency: ${pattern.frequency}`,
            {
                command: 'aimastery.showPatternDetails',
                title: 'Show Pattern Details',
                arguments: [pattern]
            }
        );
    }

    getChildren(element?: PatternItem): vscode.ProviderResult<PatternItem[]> {
        if (element && element.type === 'pattern') {
            return this.getPatternDetails(element.pattern);
        }

        return this.getRootPatterns();
    }

    private getRootPatterns(): PatternItem[] {
        try {
            const analysis = this.analyzer.analyzeSelf();
            return analysis.codePatterns
                .sort((a, b) => b.frequency - a.frequency) // Trier par fréquence décroissante
                .map(pattern => new PatternItem(pattern));
        } catch (error) {
            console.error('Failed to get patterns:', error);
            return [];
        }
    }

    private getPatternDetails(pattern: CodePattern): PatternItem[] {
        const details: PatternItem[] = [
            new PatternItem(pattern, 'detail', 'Use Case', pattern.useCase),
            new PatternItem(pattern, 'detail', 'Frequency', pattern.frequency.toString())
        ];

        if (pattern.template) {
            details.push(new PatternItem(pattern, 'detail', 'Template', 'Available'));
        }

        if (pattern.quality) {
            const qualityIcon = pattern.quality === 'good' ? '✅' : pattern.quality === 'bad' ? '❌' : '⚠️';
            details.push(new PatternItem(pattern, 'detail', 'Quality', `${qualityIcon} ${pattern.quality}`));
        }

        return details;
    }
}

// ===== IMPROVEMENTS PROVIDER =====

/**
 * Item d'amélioration dans la TreeView
 */
export class ImprovementItem {
    constructor(
        public readonly improvement: string,
        public readonly priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
        public readonly category: string,
        public readonly description: string
    ) {}
}

/**
 * Provider pour la vue des améliorations suggérées
 */
export class ImprovementsProvider extends BaseAnalysisProvider<ImprovementItem> {
    getTreeItem(element: ImprovementItem): vscode.TreeItem {
        const priorityIcon = this.getPriorityIcon(element.priority);
        const label = `${priorityIcon} ${element.description}`;
        
        return this.createTreeItem(
            label,
            vscode.TreeItemCollapsibleState.None,
            this.getPriorityIconName(element.priority),
            `Priority: ${element.priority}\nCategory: ${element.category}`,
            {
                command: 'aimastery.applyImprovement',
                title: 'Apply Improvement',
                arguments: [element.improvement]
            }
        );
    }

    getChildren(element?: ImprovementItem): vscode.ProviderResult<ImprovementItem[]> {
        if (element) {
            return [];
        }

        return this.getRootImprovements();
    }

    private getRootImprovements(): ImprovementItem[] {
        try {
            const analysis = this.analyzer.analyzeSelf();
            
            return analysis.improvementOpportunities.map(improvement => {
                const { priority, category, description } = this.parseImprovement(improvement);
                return new ImprovementItem(improvement, priority, category, description);
            }).sort((a, b) => this.getPriorityWeight(b.priority) - this.getPriorityWeight(a.priority));
        } catch (error) {
            console.error('Failed to get improvements:', error);
            return [];
        }
    }

    private parseImprovement(improvement: string): { priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL', category: string, description: string } {
        // Parser le format "[PRIORITY] Category: Description"
        const priorityMatch = improvement.match(/\[(\w+)\]/);
        const priority = (priorityMatch?.[1] as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL') || 'MEDIUM';
        
        const restText = improvement.replace(/\[\w+\]\s*/, '');
        const [category, ...descParts] = restText.split(':');
        const description = descParts.join(':').trim() || category;
        
        return {
            priority,
            category: category.trim(),
            description: description
        };
    }

    private getPriorityIcon(priority: string): string {
        switch (priority) {
            case 'CRITICAL': return '🔥';
            case 'HIGH': return '🔴';
            case 'MEDIUM': return '🟡';
            case 'LOW': return '🟢';
            default: return '⚪';
        }
    }

    private getPriorityIconName(priority: string): string {
        switch (priority) {
            case 'CRITICAL': return 'flame';
            case 'HIGH': return 'error';
            case 'MEDIUM': return 'warning';
            case 'LOW': return 'info';
            default: return 'circle-outline';
        }
    }

    private getPriorityWeight(priority: string): number {
        switch (priority) {
            case 'CRITICAL': return 4;
            case 'HIGH': return 3;
            case 'MEDIUM': return 2;
            case 'LOW': return 1;
            default: return 0;
        }
    }
}

// ===== COMMANDS POUR LES PROVIDERS =====

/**
 * Commandes additionnelles pour les providers
 */
export function registerProviderCommands(context: vscode.ExtensionContext, analyzer: SelfAnalyzer): void {
    // Commande pour afficher les détails d'un pattern
    const showPatternDetailsCommand = vscode.commands.registerCommand(
        'aimastery.showPatternDetails',
        (pattern: CodePattern) => {
            const panel = vscode.window.createWebviewPanel(
                'patternDetails',
                `Pattern: ${pattern.name}`,
                vscode.ViewColumn.Two,
                { enableScripts: true }
            );

            panel.webview.html = generatePatternDetailsHTML(pattern);
        }
    );

    // Commande pour appliquer une amélioration
    const applyImprovementCommand = vscode.commands.registerCommand(
        'aimastery.applyImprovement',
        async (improvement: string) => {
            const result = await vscode.window.showInformationMessage(
                `Apply improvement: ${improvement}?`,
                'Yes',
                'No'
            );

            if (result === 'Yes') {
                try {
                    // Simuler l'application de l'amélioration
                    await vscode.window.withProgress({
                        location: vscode.ProgressLocation.Notification,
                        title: "Applying improvement...",
                        cancellable: false
                    }, async () => {
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    });

                    vscode.window.showInformationMessage(`✅ Improvement applied: ${improvement}`);
                    
                    // Rafraîchir les providers
                    vscode.commands.executeCommand('aimastery.refreshData');
                } catch (error) {
                    vscode.window.showErrorMessage(`Failed to apply improvement: ${error}`);
                }
            }
        }
    );

    context.subscriptions.push(showPatternDetailsCommand, applyImprovementCommand);
}

/**
 * Génère le HTML pour les détails d'un pattern
 */
function generatePatternDetailsHTML(pattern: CodePattern): string {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Pattern: ${pattern.name}</title>
            <style>
                body { 
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                    padding: 20px;
                    background: #1e1e1e;
                    color: #d4d4d4;
                }
                .header { 
                    background: #2d2d30;
                    padding: 20px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                }
                .detail-item {
                    background: #252526;
                    padding: 15px;
                    border-radius: 6px;
                    margin: 10px 0;
                    border-left: 4px solid #007acc;
                }
                .code-block {
                    background: #1e1e1e;
                    border: 1px solid #3c3c3c;
                    border-radius: 4px;
                    padding: 15px;
                    font-family: 'Consolas', 'Courier New', monospace;
                    overflow-x: auto;
                }
                .frequency-badge {
                    background: #007acc;
                    color: white;
                    padding: 4px 8px;
                    border-radius: 12px;
                    font-size: 0.8em;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>📋 ${pattern.name}</h1>
                <span class="frequency-badge">Used ${pattern.frequency} times</span>
            </div>
            
            <div class="detail-item">
                <h3>🎯 Use Case</h3>
                <p>${pattern.useCase}</p>
            </div>
            
            ${pattern.template ? `
                <div class="detail-item">
                    <h3>📝 Template</h3>
                    <div class="code-block">${pattern.template}</div>
                </div>
            ` : ''}
            
            ${pattern.quality ? `
                <div class="detail-item">
                    <h3>⭐ Quality</h3>
                    <p>This pattern is considered <strong>${pattern.quality}</strong></p>
                </div>
            ` : ''}
        </body>
        </html>
    `;
}