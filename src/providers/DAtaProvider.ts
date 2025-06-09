// Dans src/providers/DataProvider.ts
import * as vscode from 'vscode';

export class AimasteryDataProvider implements vscode.TreeDataProvider<DataItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<DataItem | undefined | null | void> = new vscode.EventEmitter<DataItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<DataItem | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor() {}

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: DataItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: DataItem): Thenable<DataItem[]> {
        if (!element) {
            // Root level items
            return Promise.resolve([
                new DataItem('Analysis Results', 'analysisResults', vscode.TreeItemCollapsibleState.Expanded),
                new DataItem('Code Patterns', 'codePatterns', vscode.TreeItemCollapsibleState.Expanded),
                new DataItem('Improvements', 'improvements', vscode.TreeItemCollapsibleState.Expanded)
            ]);
        }

        // Sub-items based on category
        switch (element.contextValue) {
            case 'analysisResults':
                return Promise.resolve([
                    new DataItem('Health Score: 85%', 'healthScore', vscode.TreeItemCollapsibleState.None),
                    new DataItem('Functions: 12', 'functionCount', vscode.TreeItemCollapsibleState.None)
                ]);
            case 'codePatterns':
                return Promise.resolve([
                    new DataItem('File Reading Pattern', 'pattern', vscode.TreeItemCollapsibleState.None),
                    new DataItem('Error Handling Pattern', 'pattern', vscode.TreeItemCollapsibleState.None)
                ]);
            case 'improvements':
                return Promise.resolve([
                    new DataItem('Replace console.log', 'improvement', vscode.TreeItemCollapsibleState.None),
                    new DataItem('Add error handling', 'improvement', vscode.TreeItemCollapsibleState.None)
                ]);
            default:
                return Promise.resolve([]);
        }
    }
}

export class DataItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly contextValue: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState
    ) {
        super(label, collapsibleState);
        this.tooltip = `${this.label}`;
    }
}