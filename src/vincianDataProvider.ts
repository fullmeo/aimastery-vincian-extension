import * as vscode from 'vscode';
import * as path from 'path';

export class VincianAnalysisItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly description?: string,
        public readonly command?: vscode.Command
    ) {
        super(label, collapsibleState);
        this.description = description;
        this.command = command;
    }
}

export class VincianAnalysisProvider implements vscode.TreeDataProvider<VincianAnalysisItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<VincianAnalysisItem | undefined | void> = new vscode.EventEmitter<VincianAnalysisItem | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<VincianAnalysisItem | undefined | void> = this._onDidChangeTreeData.event;
    
    private results: any[] = [];
    
    refresh(): void {
        this._onDidChangeTreeData.fire();
    }
    
    addResult(result: any): void {
        this.results.push(result);
        this.refresh();
    }
    
    getTreeItem(element: VincianAnalysisItem): vscode.TreeItem {
        return element;
    }
    
    getChildren(element?: VincianAnalysisItem): Thenable<VincianAnalysisItem[]> {
        if (!element) {
            // Racine de la vue
            if (this.results.length === 0) {
                return Promise.resolve([
                    new VincianAnalysisItem(
                        "Aucune analyse récente",
                        vscode.TreeItemCollapsibleState.None,
                        "",
                        {
                            command: "aimastery-vincian-analysis.startAnalysis",
                            title: "Lancer une analyse",
                            arguments: []
                        }
                    )
                ]);
            }
            
            return Promise.resolve(
                this.results.map((result, index) => {
                    return new VincianAnalysisItem(
                        `Analyse #${index + 1} - Score: ${result.score}`,
                        vscode.TreeItemCollapsibleState.Collapsed,
                        new Date().toLocaleString()
                    );
                })
            );
        } else {
            // Sous-éléments pour une analyse
            const index = parseInt(element.label.split('#')[1].split(' ')[0]) - 1;
            const result = this.results[index];
            
            if (result) {
                const insightItems = result.insights.map((insight: any) => {
                    return new VincianAnalysisItem(
                        insight.category,
                        vscode.TreeItemCollapsibleState.None,
                        `Score: ${insight.score}/10`
                    );
                });
                
                return Promise.resolve(insightItems);
            }
        }
        
        return Promise.resolve([]);
    }
}

export class VincianAutocodingProvider implements vscode.TreeDataProvider<VincianAnalysisItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<VincianAnalysisItem | undefined | void> = new vscode.EventEmitter<VincianAnalysisItem | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<VincianAnalysisItem | undefined | void> = this._onDidChangeTreeData.event;
    
    getTreeItem(element: VincianAnalysisItem): vscode.TreeItem {
        return element;
    }
    
    getChildren(): Thenable<VincianAnalysisItem[]> {
        return Promise.resolve([
            new VincianAnalysisItem(
                "Lancer l'auto-coding",
                vscode.TreeItemCollapsibleState.None,
                "",
                {
                    command: "aimastery-vincian-analysis.startAutoCode",
                    title: "Lancer l'auto-coding",
                    arguments: []
                }
            ),
            new VincianAnalysisItem(
                "Tableau de bord vincien",
                vscode.TreeItemCollapsibleState.None,
                "",
                {
                    command: "aimastery-vincian-analysis.showVincianDashboard",
                    title: "Ouvrir le tableau de bord",
                    arguments: []
                }
            )
        ]);
    }
}