import * as vscode from 'vscode';

export class VincianWebviewProvider implements vscode.WebviewViewProvider {
    private _view?: vscode.WebviewView;
    
    constructor(private readonly _extensionUri: vscode.Uri) {}
    
    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ) {
        this._view = webviewView;
        
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };
        
        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
        
        // Gestion des messages du webview
        webviewView.webview.onDidReceiveMessage(message => {
            switch (message.command) {
                case 'runAnalysis':
                    vscode.commands.executeCommand('aimastery-vincian-analysis.startAnalysis');
                    break;
                case 'runAutoCode':
                    vscode.commands.executeCommand('aimastery-vincian-analysis.startAutoCode');
                    break;
            }
        });
    }
    
    public showDashboard() {
        if (this._view) {
            this._view.show(true);
        } else {
            vscode.commands.executeCommand('vincianAnalysisResults.focus');
        }
    }
    
    private _getHtmlForWebview(webview: vscode.Webview) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Tableau de bord Vincien</title>
                <style>
                    body { padding: 20px; font-family: var(--vscode-font-family); }
                    .card { padding: 15px; margin-bottom: 15px; border-radius: 5px; background: var(--vscode-editor-background); }
                    button { padding: 8px 12px; border: none; background: var(--vscode-button-background); color: var(--vscode-button-foreground); }
                    h2 { color: var(--vscode-editor-foreground); }
                </style>
            </head>
            <body>
                <h2>Analyse Vincienne</h2>
                <div class="card">
                    <p>Analysez votre code selon les principes de design et d'ingénierie inspirés par Léonard de Vinci.</p>
                    <button id="analyze">Lancer l'analyse</button>
                </div>
                
                <h2>Auto-Coding AIMastery</h2>
                <div class="card">
                    <p>Générez du code intelligent avec l'IA d'AIMastery.</p>
                    <button id="autocode">Démarrer l'Auto-Coding</button>
                </div>
                
                <script>
                    const vscode = acquireVsCodeApi();
                    
                    document.getElementById('analyze').addEventListener('click', () => {
                        vscode.postMessage({ command: 'runAnalysis' });
                    });
                    
                    document.getElementById('autocode').addEventListener('click', () => {
                        vscode.postMessage({ command: 'runAutoCode' });
                    });
                </script>
            </body>
            </html>
        `;
    }
}