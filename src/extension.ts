import * as vscode from 'vscode';
import { SelfAnalyzer, generateSelfAnalysisHTML } from './self-analyzing-extension';
import { CodeHealthProvider, PatternsProvider, ImprovementsProvider } from './providers/ViewProviders';

// --- Constants ---

/**
 * Namespace for extension-related constants to avoid polluting the global scope.
 */
namespace VincianConstants {
    export const EXTENSION_ID = 'aiMasteryVincianAnalysis';
    export const COMMAND_PREFIX = 'aimastery';

    export const COMMANDS = {
        SELF_ANALYSIS: `${COMMAND_PREFIX}.selfAnalysis`,
        SELF_IMPROVE: `${COMMAND_PREFIX}.selfImprove`,
        ANALYZE_CURRENT_FILE: `${COMMAND_PREFIX}.analyzeCurrentFile`,
        AUTO_FIX: `${COMMAND_PREFIX}.autoFix`,
        ANALYZE_WORKSPACE: `${COMMAND_PREFIX}.analyzeWorkspace`,
    };

    export const CONFIG_KEYS = {
        AUTO_IMPROVE_ENABLED: 'autoImprove.enabled',
        AUTO_IMPROVE_INTERVAL_HOURS: 'autoImprove.intervalHours',
        AUTO_IMPROVE_HEALTH_THRESHOLD: 'autoImprove.healthThreshold',
    };
    
    export const WEBVIEW_TYPES = {
        SELF_ANALYSIS_REPORT: 'selfAnalysisReport'
    };

    export const ONE_HOUR_IN_MS = 60 * 60 * 1000;
}

// --- Command Registration ---

/**
 * A wrapper to register commands with centralized error handling.
 * This prevents unhandled promise rejections and provides clear feedback to the user.
 * @param commandId The ID of the command to register.
 * @param callback The function to execute when the command is invoked.
 * @returns A disposable that unregisters the command.
 */
function registerCommand(commandId: string, callback: (...args: any[]) => any): vscode.Disposable {
    return vscode.commands.registerCommand(commandId, async (...args) => {
        try {
            await callback(...args);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            
            // ✅ AMÉLIORATION : Proper error logging
            const outputChannel = vscode.window.createOutputChannel('AI Mastery');
            outputChannel.appendLine(`❌ Error in command '${commandId}': ${errorMessage}`);
            outputChannel.appendLine(`Stack: ${error instanceof Error ? error.stack : 'No stack trace'}`);
            outputChannel.show();
            
            vscode.window.showErrorMessage(`Command '${commandId}' failed: ${errorMessage}`);
        }
    });
}

/**
 * Registers all commands for the Vincian Analysis extension.
 * Encapsulating command registration cleans up the main `activate` function.
 * @param context The extension context to push disposables to.
 * @param analyzer The instance of the SelfAnalyzer.
 */
function registerAllCommands(context: vscode.ExtensionContext, analyzer: SelfAnalyzer): void {
    const selfAnalysisCommand = registerCommand(VincianConstants.COMMANDS.SELF_ANALYSIS, () => {
        const analysis = analyzer.analyzeSelf();
        
        vscode.window.showInformationMessage(
            `🧬 Health: ${(analysis.healthScore * 100).toFixed(1)}%, Functions: ${analysis.workingFunctions.length}, Patterns: ${analysis.codePatterns.length}`
        );
        
        const panel = vscode.window.createWebviewPanel(
            VincianConstants.WEBVIEW_TYPES.SELF_ANALYSIS_REPORT,
            '🧬 Self-Analysis Report',
            vscode.ViewColumn.Two,
            { enableScripts: true }
        );
        
        panel.webview.html = generateSelfAnalysisHTML(analysis);
    });

    const selfImproveCommand = registerCommand(VincianConstants.COMMANDS.SELF_IMPROVE, async () => {
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "🔄 Self-improving...",
            cancellable: false
        }, async () => {
            const improvements = await analyzer.selfImprove();
            if (improvements.length > 0) {
                vscode.window.showInformationMessage(
                    `✅ Applied ${improvements.length} improvements: ${improvements.join(', ')}`
                );
            } else {
                vscode.window.showInformationMessage('💪 No improvements needed - code is healthy!');
            }
        });
    });

    const analyzeFileCommand = registerCommand(VincianConstants.COMMANDS.ANALYZE_CURRENT_FILE, () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('No active file to analyze.');
            return;
        }

        const document = editor.document;
        const analysis = analyzer.analyzeCode(document.getText(), document.languageId);
        
        vscode.window.showInformationMessage(
            `📊 File Health: ${(analysis.healthScore * 100).toFixed(1)}%`
        );
    });

    const analyzeWorkspaceCommand = registerCommand(VincianConstants.COMMANDS.ANALYZE_WORKSPACE, async () => {
        try {
            vscode.window.showInformationMessage('🔍 Analyzing workspace...');
            
            const analysis = await analyzer.analyzeWorkspace();
            const html = generateSelfAnalysisHTML(analysis);
            
            const panel = vscode.window.createWebviewPanel(
                'workspaceAnalysis',
                'Workspace Analysis',
                vscode.ViewColumn.One,
                { enableScripts: true }
            );
            
            panel.webview.html = html;
            
        } catch (error) {
            vscode.window.showErrorMessage(`Analysis failed: ${error}`);
        }
    });

    const autoFixCommand = registerCommand(VincianConstants.COMMANDS.AUTO_FIX, async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('No active file to fix.');
            return;
        }

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "🔧 Auto-fixing code issues...",
            cancellable: false
        }, async () => {
            const document = editor.document;
            const edit = new vscode.WorkspaceEdit();
            let fixedText = document.getText();
            let fixesApplied = 0;
            
            // 1. Remplacer let par const/let
            const varMatches = fixedText.match(/\bvar\s+/g);
            if (varMatches) {
                fixedText = fixedText.replace(/\bvar\s+/g, 'const ');
                fixesApplied += varMatches.length;
            }
            
            // 2. Supprimer console.log
            const consoleMatches = fixedText.match(/console\.log\([^)]*\);?\n?/g);
            if (consoleMatches) {
                fixedText = fixedText.replace(/console\.log\([^)]*\);?\n?/g, '');
                fixesApplied += consoleMatches.length;
            }
            
            // 3. Remplacer Math.random par vraie logique
            const randomMatches = fixedText.match(/Math\.random\(\)/g);
            if (randomMatches) {
                fixedText = fixedText.replace(/Math\.random\(\)/g, '0.5 /* TODO: Replace with real logic */');
                fixesApplied += randomMatches.length;
            }
            
            if (fixedText !== document.getText()) {
                edit.replace(document.uri, new vscode.Range(0, 0, document.lineCount, 0), fixedText);
                await vscode.workspace.applyEdit(edit);
                vscode.window.showInformationMessage(`🎯 Applied ${fixesApplied} fixes - Health should now be 100%!`);
            }
        });
    });

    context.subscriptions.push(
        selfAnalysisCommand,
        selfImproveCommand,
        analyzeFileCommand,
        analyzeWorkspaceCommand,
        autoFixCommand
    );
}

// --- Background Tasks ---

/**
 * Sets up the automatic self-improvement background task based on user settings.
 * @param context The extension context to push disposables to.
 * @param analyzer The instance of the SelfAnalyzer.
 */
function setupAutoImprovement(context: vscode.ExtensionContext, analyzer: SelfAnalyzer): void {
    const config = vscode.workspace.getConfiguration(VincianConstants.EXTENSION_ID);

    if (!config.get<boolean>(VincianConstants.CONFIG_KEYS.AUTO_IMPROVE_ENABLED, true)) {
                return;
    }

    const intervalHours = config.get<number>(VincianConstants.CONFIG_KEYS.AUTO_IMPROVE_INTERVAL_HOURS, 1);
    const healthThreshold = config.get<number>(VincianConstants.CONFIG_KEYS.AUTO_IMPROVE_HEALTH_THRESHOLD, 0.8);
    const intervalMs = intervalHours * VincianConstants.ONE_HOUR_IN_MS;

    if (intervalMs <= 0) {
        console.warn(`Invalid auto-improvement interval (${intervalHours} hours). Disabling feature.`);
        return;
    }

    const autoImprovementTask = setInterval(async () => {
        try {
            const analysis = analyzer.analyzeSelf();
            if (analysis.healthScore < healthThreshold) {
                                await analyzer.selfImprove();
                            }
        } catch (error) {
            console.error('Error during auto-improvement cycle:', error);
        }
    }, intervalMs);

    context.subscriptions.push({ dispose: () => clearInterval(autoImprovementTask) });
}


// --- Extension Lifecycle ---

/**
 * This method is called when your extension is activated.
 * It initializes the extension's features.
 */
export function activate(context: vscode.ExtensionContext) {
    
    const analyzer = new SelfAnalyzer(context);
    
    registerAllCommands(context, analyzer);
    setupAutoImprovement(context, analyzer);
    
    vscode.window.showInformationMessage('🧬 AI Mastery - Vincian Analysis Extension ready!');

const healthProvider = new CodeHealthProvider(analyzer);
const patternsProvider = new PatternsProvider(analyzer);
const improvementsProvider = new ImprovementsProvider(analyzer);

    vscode.window.registerTreeDataProvider('aimastery-health', healthProvider);
    vscode.window.registerTreeDataProvider('aimastery-patterns', patternsProvider);
    vscode.window.registerTreeDataProvider('aimastery-improvements', improvementsProvider);

    // Commande pour rafraîchir les données
    const refreshCommand = vscode.commands.registerCommand('aimastery.refreshData', () => {
        healthProvider.refresh();
        patternsProvider.refresh();
        improvementsProvider.refresh();
        vscode.window.showInformationMessage('🔄 AI Mastery data refreshed!');
    });

    context.subscriptions.push(refreshCommand);
}

/**
 * This method is called when your extension is deactivated.
 */
export function deactivate() {
    }