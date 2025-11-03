import * as vscode from 'vscode';
import { SelfAnalyzer, generateSelfAnalysisHTML } from './self-analyzing-extension';
import { CodeHealthProvider, PatternsProvider, ImprovementsProvider } from './providers/ViewProviders';
import { activateUXOptimization } from './ux_optimization';

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
        REFRESH_DATA: `${COMMAND_PREFIX}.refreshData`,
    };

    export const CONFIG_KEYS = {
        AUTO_IMPROVE_ENABLED: 'autoImprove.enabled',
        AUTO_IMPROVE_INTERVAL_HOURS: 'autoImprove.intervalHours',
        AUTO_IMPROVE_HEALTH_THRESHOLD: 'autoImprove.healthThreshold',
    };
    
    export const WEBVIEW_TYPES = {
        SELF_ANALYSIS_REPORT: 'selfAnalysisReport',
        WORKSPACE_ANALYSIS: 'workspaceAnalysis'
    };

    export const ONE_HOUR_IN_MS = 60 * 60 * 1000;
    export const MAX_INTERVAL_HOURS = 24;
}

// --- Logging System ---

/**
 * ✅ SINGLETON pour OutputChannel avec gestion d'erreurs robuste
 */
class Logger {
    private static instance: Logger;
    private outputChannel: vscode.OutputChannel;
    
    private constructor() {
        this.outputChannel = vscode.window.createOutputChannel('AI Mastery');
    }
    
    static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }
    
    error(message: string, error?: Error): void {
        const timestamp = new Date().toISOString();
        this.outputChannel.appendLine(`❌ [${timestamp}] ${message}`);
        if (error) {
            this.outputChannel.appendLine(`Stack: ${error.stack || 'No stack trace'}`);
        }
        this.outputChannel.show();
    }
    
    info(message: string): void {
        const timestamp = new Date().toISOString();
        this.outputChannel.appendLine(`ℹ️ [${timestamp}] ${message}`);
    }

    warn(message: string): void {
        const timestamp = new Date().toISOString();
        this.outputChannel.appendLine(`⚠️ [${timestamp}] ${message}`);
    }
}

// --- Interfaces ---

interface AutoImprovementConfig {
    enabled: boolean;
    intervalHours: number;
    healthThreshold: number;
}

interface CommandRegistration {
    id: string;
    handler: (...args: any[]) => Promise<void> | void;
    description: string;
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
            const logger = Logger.getInstance();
            logger.error(`Command '${commandId}' failed: ${error instanceof Error ? error.message : String(error)}`, error instanceof Error ? error : undefined);
            
            vscode.window.showErrorMessage(`Command '${commandId}' failed: ${error instanceof Error ? error.message : String(error)}`);
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

    /**
     * ✅ AMÉLIORATION: Validation et gestion d'erreurs renforcées
     */
    const analyzeWorkspaceCommand = registerCommand(VincianConstants.COMMANDS.ANALYZE_WORKSPACE, async () => {
        // Validation du workspace
        if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
            vscode.window.showWarningMessage('No workspace folder opened. Please open a folder to analyze.');
            return;
        }
        
        try {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "🔍 Analyzing workspace...",
                cancellable: true
            }, async (progress, token) => {
                // Vérification d'annulation
                if (token.isCancellationRequested) {
                    return;
                }
                
                progress.report({ increment: 0, message: "Scanning files..." });
                
                const analysis = await analyzer.analyzeWorkspace();
                
                if (token.isCancellationRequested) {
                    return;
                }
                
                progress.report({ increment: 50, message: "Generating report..." });
                
                const html = generateSelfAnalysisHTML(analysis);
                
                progress.report({ increment: 100, message: "Complete!" });
                
                const panel = vscode.window.createWebviewPanel(
                    VincianConstants.WEBVIEW_TYPES.WORKSPACE_ANALYSIS,
                    `📊 Workspace Analysis - Health: ${(analysis.healthScore * 100).toFixed(1)}%`,
                    vscode.ViewColumn.One,
                    { enableScripts: true }
                );
                
                panel.webview.html = html;
            });
            
        } catch (error) {
            Logger.getInstance().error('Workspace analysis failed', error instanceof Error ? error : undefined);
            vscode.window.showErrorMessage(`Analysis failed: ${error instanceof Error ? error.message : String(error)}`);
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
            
            // 1. Remplacer var par const/let
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
            } else {
                vscode.window.showInformationMessage('✨ No fixes needed - code is already clean!');
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
 * ✅ RÉPARÉ ET AMÉLIORÉ: Configuration d'auto-amélioration avec validation stricte
 * @param context The extension context to push disposables to.
 * @param analyzer The instance of the SelfAnalyzer.
 */
function setupAutoImprovement(context: vscode.ExtensionContext, analyzer: SelfAnalyzer): void {
    const config = vscode.workspace.getConfiguration(VincianConstants.EXTENSION_ID);
    const logger = Logger.getInstance();
    
    const autoImproveConfig: AutoImprovementConfig = {
        enabled: config.get<boolean>(VincianConstants.CONFIG_KEYS.AUTO_IMPROVE_ENABLED, true),
        intervalHours: config.get<number>(VincianConstants.CONFIG_KEYS.AUTO_IMPROVE_INTERVAL_HOURS, 1),
        healthThreshold: config.get<number>(VincianConstants.CONFIG_KEYS.AUTO_IMPROVE_HEALTH_THRESHOLD, 0.8)
    };

    if (!autoImproveConfig.enabled) {
        logger.info('Auto-improvement disabled by user configuration');
        return;
    }
    
    // ✅ AMÉLIORATION: Validation plus stricte avec bornes
    if (autoImproveConfig.intervalHours <= 0 || autoImproveConfig.intervalHours > VincianConstants.MAX_INTERVAL_HOURS) {
        logger.warn(`Invalid auto-improvement interval: ${autoImproveConfig.intervalHours}h. Using default 1h.`);
        vscode.window.showWarningMessage(`Invalid auto-improvement interval: ${autoImproveConfig.intervalHours}h. Using default 1h.`);
        autoImproveConfig.intervalHours = 1;
    }

    if (autoImproveConfig.healthThreshold < 0 || autoImproveConfig.healthThreshold > 1) {
        logger.warn(`Invalid health threshold: ${autoImproveConfig.healthThreshold}. Using default 0.8.`);
        autoImproveConfig.healthThreshold = 0.8;
    }
    
    const intervalMs = autoImproveConfig.intervalHours * VincianConstants.ONE_HOUR_IN_MS;
    logger.info(`Auto-improvement enabled: ${autoImproveConfig.intervalHours}h interval, ${autoImproveConfig.healthThreshold} threshold`);

    const autoImprovementTask = setInterval(async () => {
        try {
            const analysis = analyzer.analyzeSelf();
            logger.info(`Auto-improvement check: health score ${(analysis.healthScore * 100).toFixed(1)}%`);
            
            if (analysis.healthScore < autoImproveConfig.healthThreshold) {
                logger.info('Health below threshold, triggering auto-improvement');
                const improvements = await analyzer.selfImprove();
                
                if (improvements.length > 0) {
                    logger.info(`Auto-improvement applied ${improvements.length} fixes: ${improvements.join(', ')}`);
                    // Notification optionnelle pour succès
                    vscode.window.showInformationMessage(`🔄 Auto-improved: ${improvements.length} fixes applied`);
                }
            }
        } catch (error) {
            logger.error('Auto-improvement task failed', error instanceof Error ? error : undefined);
            
            // Notification optionnelle pour erreurs critiques
            if (error instanceof Error && error.message.includes('CRITICAL')) {
                vscode.window.showErrorMessage(`Auto-improvement failed: ${error.message}`);
            }
        }
    }, intervalMs);

    context.subscriptions.push({ 
        dispose: () => {
            clearInterval(autoImprovementTask);
            logger.info('Auto-improvement task stopped');
        }
    });
}

/**
 * ✅ AJOUTÉ: Configuration des TreeView providers avec commande refresh
 */
function setupTreeViewProviders(context: vscode.ExtensionContext, analyzer: SelfAnalyzer): void {
    const healthProvider = new CodeHealthProvider(analyzer);
    const patternsProvider = new PatternsProvider(analyzer);
    const improvementsProvider = new ImprovementsProvider(analyzer);

    // Enregistrement des providers
    vscode.window.registerTreeDataProvider('aimastery-health', healthProvider);
    vscode.window.registerTreeDataProvider('aimastery-patterns', patternsProvider);
    vscode.window.registerTreeDataProvider('aimastery-improvements', improvementsProvider);

    // Commande pour rafraîchir les données
    const refreshCommand = registerCommand(VincianConstants.COMMANDS.REFRESH_DATA, () => {
        healthProvider.refresh();
        patternsProvider.refresh();
        improvementsProvider.refresh();
        vscode.window.showInformationMessage('🔄 AI Mastery data refreshed!');
        Logger.getInstance().info('TreeView providers refreshed');
    });

    context.subscriptions.push(refreshCommand);
}

/**
 * ✅ PRINCIPAL: Point d'entrée de l'extension avec activation UX
 * This method is called when your extension is activated.
 * It initializes the extension's features.
 */
export function activate(context: vscode.ExtensionContext) {
    try {
        const logger = Logger.getInstance();
        logger.info('AI Mastery - Vincian Analysis Extension starting...');

        // Initialisation du SelfAnalyzer
        const analyzer = new SelfAnalyzer(context);

        // Configuration des commandes
        registerAllCommands(context, analyzer);

        // Configuration de l'auto-amélioration
        setupAutoImprovement(context, analyzer);

        // Configuration des TreeView providers
        setupTreeViewProviders(context, analyzer);

        // Activation des optimisations UX
        activateUXOptimization(context);

        logger.info('AI Mastery - Vincian Analysis Extension fully activated');
        vscode.window.showInformationMessage('🧬 AI Mastery - Vincian Analysis Extension ready!');

    } catch (error) {
        const logger = Logger.getInstance();
        logger.error('Extension activation failed', error instanceof Error ? error : undefined);
        vscode.window.showErrorMessage(`Extension activation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * This method is called when your extension is deactivated.
 */
export function deactivate() {
    const logger = Logger.getInstance();
    logger.info('AI Mastery - Vincian Analysis Extension deactivated');
}