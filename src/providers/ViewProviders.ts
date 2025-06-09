// Dans src/providers/ViewProviders.ts
import * as vscode from 'vscode';
import { SelfAnalyzer } from '../self-analyzing-extension';

// Data Provider pour Code Health
export class CodeHealthProvider implements vscode.TreeDataProvider<HealthItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<HealthItem | undefined | null | void> = new vscode.EventEmitter<HealthItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<HealthItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private analyzer: SelfAnalyzer;
    
    constructor(analyzer: SelfAnalyzer) {
        this.analyzer = analyzer;
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: HealthItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: HealthItem): Promise<HealthItem[]> {
        if (!element) {
            try {
                const analysis = await this.analyzer.analyzeWorkspace();
                return [
                    new HealthItem(`Health: ${(analysis.healthScore * 100).toFixed(1)}%`, 'heart', 'health'),
                    new HealthItem(`Functions: ${analysis.workingFunctions.length}`, 'symbol-function', 'functions'),
                    new HealthItem(`Patterns: ${analysis.codePatterns.length}`, 'package', 'patterns')
                ];
            } catch (error) {
                console.error('Failed to get health data:', error);
                return [
                    new HealthItem('Analysis Failed', 'error', 'error'),
                    new HealthItem('Open a workspace to analyze', 'info', 'info')
                ];
            }
        }
        return [];
    }
}

// Data Provider pour Patterns
export class PatternsProvider implements vscode.TreeDataProvider<PatternItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<PatternItem | undefined | null | void> = new vscode.EventEmitter<PatternItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<PatternItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private analyzer: SelfAnalyzer;
    
    constructor(analyzer: SelfAnalyzer) {
        this.analyzer = analyzer;
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: PatternItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: PatternItem): Promise<PatternItem[]> {
        if (!element) {
            try {
                const analysis = await this.analyzer.analyzeWorkspace();
                return analysis.codePatterns.map(pattern => 
                    new PatternItem(`${pattern.name} (${pattern.frequency}x)`, 'package', 'pattern')
                );
            } catch (error) {
                return [
                    new PatternItem('File Reading Pattern', 'file', 'pattern'),
                    new PatternItem('Error Handling Pattern', 'error', 'pattern'),
                    new PatternItem('Async/Await Pattern', 'sync', 'pattern')
                ];
            }
        }
        return [];
    }
}

// Data Provider pour Improvements
export class ImprovementsProvider implements vscode.TreeDataProvider<ImprovementItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<ImprovementItem | undefined | null | void> = new vscode.EventEmitter<ImprovementItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<ImprovementItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private analyzer: SelfAnalyzer;
    
    constructor(analyzer: SelfAnalyzer) {
        this.analyzer = analyzer;
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: ImprovementItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: ImprovementItem): Promise<ImprovementItem[]> {
        if (!element) {
            try {
                const analysis = await this.analyzer.analyzeWorkspace();
                return analysis.improvementOpportunities.map(improvement => 
                    new ImprovementItem(improvement, 'lightbulb', 'improvement')
                );
            } catch (error) {
                return [
                    new ImprovementItem('Remove unused imports', 'trash', 'improvement'),
                    new ImprovementItem('Add error handling', 'shield', 'improvement'),
                    new ImprovementItem('Optimize loops', 'sync', 'improvement')
                ];
            }
        }
        return [];
    }
}

// Classes pour les items
export class HealthItem extends vscode.TreeItem {
    constructor(label: string, iconName: string, contextValue: string) {
        super(label, vscode.TreeItemCollapsibleState.None);
        this.iconPath = new vscode.ThemeIcon(iconName);
        this.contextValue = contextValue;
    }
}

export class PatternItem extends vscode.TreeItem {
    constructor(label: string, iconName: string, contextValue: string) {
        super(label, vscode.TreeItemCollapsibleState.None);
        this.iconPath = new vscode.ThemeIcon(iconName);
        this.contextValue = contextValue;
    }
}

export class ImprovementItem extends vscode.TreeItem {
    constructor(label: string, iconName: string, contextValue: string) {
        super(label, vscode.TreeItemCollapsibleState.None);
        this.iconPath = new vscode.ThemeIcon(iconName);
        this.contextValue = contextValue;
    }
}