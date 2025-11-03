import * as vscode from 'vscode';

export class VincianAnalysisProvider implements vscode.TreeDataProvider<any> {
    private _onDidChangeTreeData = new vscode.EventEmitter<any>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;
    
    getTreeItem(element: any) {
        return new vscode.TreeItem(element.label, vscode.TreeItemCollapsibleState.None);
    }
    
    getChildren() {
        return [];
    }
}

export class VincianAutocodingProvider implements vscode.TreeDataProvider<any> {
    private _onDidChangeTreeData = new vscode.EventEmitter<any>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;
    
    getTreeItem(element: any) {
        return new vscode.TreeItem(element.label, vscode.TreeItemCollapsibleState.None);
    }
    
    getChildren() {
        return [];
    }
}