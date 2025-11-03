// ===== ARCHITECTURE AMÉLIORÉE - STRUCTURE MODULAIRE =====

import * as vscode from 'vscode';
import { ISelfAnalyzer, ExtensionConfiguration, ExtensionEventBus } from './interfaces';

/**
 * ✅ DEPENDENCY INJECTION CONTAINER
 * Gestion centralisée des dépendances pour éviter le couplage fort
 */
export class DIContainer {
    private static instance: DIContainer;
    private services = new Map<string, any>();
    
    static getInstance(): DIContainer {
        if (!DIContainer.instance) {
            DIContainer.instance = new DIContainer();
        }
        return DIContainer.instance;
    }
    
    register<T>(key: string, service: T): void {
        this.services.set(key, service);
    }
    
    get<T>(key: string): T {
        const service = this.services.get(key);
        if (!service) {
            throw new Error(`Service ${key} not registered`);
        }
        return service;
    }
    
    has(key: string): boolean {
        return this.services.has(key);
    }
    
    clear(): void {
        this.services.clear();
    }
}

/**
 * ✅ CONFIGURATION MANAGER
 * Centralisation de la configuration avec validation
 */
export class ConfigurationManager {
    private static instance: ConfigurationManager;
    private config: ExtensionConfiguration;
    private readonly eventBus = ExtensionEventBus.getInstance();
    
    private constructor() {
        this.loadConfiguration();
        this.setupConfigurationWatcher();
    }
    
    static getInstance(): ConfigurationManager {
        if (!ConfigurationManager.instance) {
            ConfigurationManager.instance = new ConfigurationManager();
        }
        return ConfigurationManager.instance;
    }
    
    private loadConfiguration(): void {
        const vsConfig = vscode.workspace.getConfiguration('aiMasteryVincianAnalysis');
        
        this.config = {
            autoImprove: {
                enabled: vsConfig.get('autoImprove.enabled', true),
                intervalHours: this.validateNumber(vsConfig.get('autoImprove.intervalHours', 1), 1, 24),
                healthThreshold: this.validateNumber(vsConfig.get('autoImprove.healthThreshold', 0.8), 0, 1)
            },
            analysis: {
                includeNodeModules: vsConfig.get('analysis.includeNodeModules', false),
                fileExtensions: vsConfig.get('analysis.fileExtensions', ['.ts', '.js', '.tsx', '.jsx']),
                excludePatterns: vsConfig.get('analysis.excludePatterns', ['**/node_modules/**', '**/dist/**']),
                maxFileSize: vsConfig.get('analysis.maxFileSize', 1048576), // 1MB
                enableRealTimeAnalysis: vsConfig.get('analysis.enableRealTimeAnalysis', true)
            },
            ui: {
                showNotifications: vsConfig.get('ui.showNotifications', true),
                enableAnimations: vsConfig.get('ui.enableAnimations', true),
                theme: vsConfig.get('ui.theme', 'auto'),
                compactMode: vsConfig.get('ui.compactMode', false)
            },
            logging: {
                level: vsConfig.get('logging.level', 'info'),
                enableFileLogging: vsConfig.get('logging.enableFileLogging', false),
                maxLogFileSize: vsConfig.get('logging.maxLogFileSize', 10485760) // 10MB
            }
        };
    }
    
    private validateNumber(value: any, min: number, max: number): number {
        const num = typeof value === 'number' ? value : parseFloat(value);
        if (isNaN(num) || num < min || num > max) {
            return min;
        }
        return num;
    }
    
    private setupConfigurationWatcher(): void {
        vscode.workspace.onDidChangeConfiguration(event => {
            if (event.affectsConfiguration('aiMasteryVincianAnalysis')) {
                this.loadConfiguration();
                this.eventBus.emit({
                    type: 'configuration-changed',
                    data: this.config,
                    timestamp: new Date()
                });
            }
        });
    }
    
    get(): ExtensionConfiguration {
        return this.config;
    }
    
    getSection<K extends keyof ExtensionConfiguration>(section: K): ExtensionConfiguration[K] {
        return this.config[section];
    }
}

/**
 * ✅ COMMAND MANAGER
 * Gestion centralisée des commandes avec middleware
 */
export class CommandManager {
    private commands = new Map<string, vscode.Disposable>();
    private middleware: Array<(commandId: string, args: any[]) => boolean> = [];
    private readonly logger = DIContainer.getInstance().get<Logger>('logger');
    
    addMiddleware(fn: (commandId: string, args: any[]) => boolean): void {
        this.middleware.push(fn);
    }
    
    register(commandId: string, handler: (...args: any[]) => any): void {
        const disposable = vscode.commands.registerCommand(commandId, async (...args) => {
            try {
                // Exécuter les middleware
                for (const middleware of this.middleware) {
                    if (!middleware(commandId, args)) {
                        this.logger.warn(`Command ${commandId} blocked by middleware`);
                        return;
                    }
                }
                
                this.logger.info(`Executing command: ${commandId}`);
                const startTime = Date.now();
                
                await handler(...args);
                
                const duration = Date.now() - startTime;
                this.logger.info(`Command ${commandId} completed in ${duration}ms`);
                
            } catch (error) {
                this.logger.error(`Command ${commandId} failed`, error instanceof Error ? error : undefined);
                vscode.window.showErrorMessage(`Command failed: ${error instanceof Error ? error.message : String(error)}`);
            }
        });
        
        this.commands.set(commandId, disposable);
    }
    
    unregister(commandId: string): void {
        const disposable = this.commands.get(commandId);
        if (disposable) {
            disposable.dispose();
            this.commands.delete(commandId);
        }
    }
    
    dispose(): void {
        this.commands.forEach(disposable => disposable.dispose());
        this.commands.clear();
    }
}

/**
 * ✅ ENHANCED LOGGER avec niveaux et persistance
 */
export class EnhancedLogger {
    private outputChannel: vscode.OutputChannel;
    private config: LoggingConfiguration;
    private logBuffer: string[] = [];
    
    constructor() {
        this.outputChannel = vscode.window.createOutputChannel('AI Mastery');
        this.config = ConfigurationManager.getInstance().getSection('logging');
        
        // Écouter les changements de configuration
        ExtensionEventBus.getInstance().onEvent(event => {
            if (event.type === 'configuration-changed') {
                this.config = ConfigurationManager.getInstance().getSection('logging');
            }
        });
    }
    
    private shouldLog(level: string): boolean {
        const levels = ['debug', 'info', 'warn', 'error'];
        const currentLevel = levels.indexOf(this.config.level);
        const messageLevel = levels.indexOf(level);
        return messageLevel >= currentLevel;
    }
    
    private formatMessage(level: string, message: string): string {
        const timestamp = new Date().toISOString();
        return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    }
    
    private log(level: string, message: string, error?: Error): void {
        if (!this.shouldLog(level)) return;
        
        const formattedMessage = this.formatMessage(level, message);
        
        // Ajouter au buffer
        this.logBuffer.push(formattedMessage);
        if (this.logBuffer.length > 1000) {
            this.logBuffer.shift(); // Garder seulement les 1000 derniers logs
        }
        
        // Afficher dans l'output channel
        this.outputChannel.appendLine(formattedMessage);
        if (error) {
            this.outputChannel.appendLine(`Stack: ${error.stack || 'No stack trace'}`);
        }
        
        // Afficher l'output channel pour les erreurs
        if (level === 'error') {
            this.outputChannel.show();
        }
        
        // Logging vers fichier si activé
        if (this.config.enableFileLogging) {
            this.writeToFile(formattedMessage, error);
        }
    }
    
    private async writeToFile(message: string, error?: Error): Promise<void> {
        // TODO: Implémenter l'écriture vers fichier
        // vscode.workspace.fs.writeFile() + rotation des logs
    }
    
    debug(message: string): void {
        this.log('debug', message);
    }
    
    info(message: string): void {
        this.log('info', message);
    }
    
    warn(message: string): void {
        this.log('warn', message);
    }
    
    error(message: string, error?: Error): void {
        this.log('error', message, error);
    }
    
    getRecentLogs(count: number = 100): string[] {
        return this.logBuffer.slice(-count);
    }
}

/**
 * ✅ EXTENSION ORCHESTRATOR
 * Point d'entrée principal avec orchestration des modules
 */
export class ExtensionOrchestrator {
    private readonly container = DIContainer.getInstance();
    private readonly commandManager = new CommandManager();
    private readonly configManager = ConfigurationManager.getInstance();
    private readonly eventBus = ExtensionEventBus.getInstance();
    
    async activate(context: vscode.ExtensionContext): Promise<void> {
        try {
            // 1. Initialiser les services de base
            await this.initializeServices(context);
            
            // 2. Configurer les middleware
            this.setupMiddleware();
            
            // 3. Enregistrer les commandes
            this.registerCommands();
            
            // 4. Initialiser les providers
            this.initializeProviders();
            
            // 5. Démarrer les tâches en arrière-plan
            this.startBackgroundTasks();
            
            // 6. Finaliser l'activation
            this.finalizeActivation();
            
        } catch (error) {
            const logger = this.container.get<EnhancedLogger>('logger');
            logger.error('Extension activation failed', error instanceof Error ? error : undefined);
            throw error;
        }
    }
    
    private async initializeServices(context: vscode.ExtensionContext): Promise<void> {
        // Enregistrer les services dans le container
        this.container.register('context', context);
        this.container.register('logger', new EnhancedLogger());
        this.container.register('commandManager', this.commandManager);
        this.container.register('configManager', this.configManager);
        this.container.register('eventBus', this.eventBus);
        
        // Initialiser l'analyzer (à implémenter selon votre logique)
        // const analyzer = new SelfAnalyzer(context);
        // this.container.register('analyzer', analyzer);
    }
    
    private setupMiddleware(): void {
        // Middleware de logging
        this.commandManager.addMiddleware((commandId, args) => {
            const logger = this.container.get<EnhancedLogger>('logger');
            logger.debug(`Command middleware: ${commandId} with ${args.length} args`);
            return true;
        });
        
        // Middleware de validation workspace
        this.commandManager.addMiddleware((commandId, args) => {
            if (commandId.includes('workspace') && !vscode.workspace.workspaceFolders) {
                vscode.window.showWarningMessage('No workspace folder opened');
                return false;
            }
            return true;
        });
    }
    
    private registerCommands(): void {
        const analyzer = this.container.get<ISelfAnalyzer>('analyzer');
        
        // Auto-enregistrement des commandes via réflexion
        const commands = [
            'selfAnalysis',
            'selfImprove', 
            'analyzeCurrentFile',
            'analyzeWorkspace',
            'autoFix',
            'refreshData'
        ];
        
        commands.forEach(cmd => {
            const commandId = `aimastery.${cmd}`;
            this.commandManager.register(commandId, this.createCommandHandler(cmd, analyzer));
        });
    }
    
    private createCommandHandler(commandName: string, analyzer: ISelfAnalyzer) {
        // Factory pattern pour créer les handlers
        const handlers = {
            selfAnalysis: () => this.handleSelfAnalysis(analyzer),
            selfImprove: () => this.handleSelfImprove(analyzer),
            analyzeCurrentFile: () => this.handleAnalyzeCurrentFile(analyzer),
            analyzeWorkspace: () => this.handleAnalyzeWorkspace(analyzer),
            autoFix: () => this.handleAutoFix(analyzer),
            refreshData: () => this.handleRefreshData()
        };
        
        return handlers[commandName as keyof typeof handlers] || (() => {
            throw new Error(`Handler not found for command: ${commandName}`);
        });
    }
    
    private async handleSelfAnalysis(analyzer: ISelfAnalyzer): Promise<void> {
        // Implémentation spécifique pour self analysis
        const analysis = analyzer.analyzeSelf();
        // ... reste de la logique
    }
    
    private async handleSelfImprove(analyzer: ISelfAnalyzer): Promise<void> {
        // Implémentation avec progress et notification
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "🔄 Self-improving...",
            cancellable: false
        }, async () => {
            const improvements = await analyzer.selfImprove();
            // ... logique de notification
        });
    }
    
    private async handleAnalyzeCurrentFile(analyzer: ISelfAnalyzer): Promise<void> {
        // Implémentation pour analyse fichier actuel
    }
    
    private async handleAnalyzeWorkspace(analyzer: ISelfAnalyzer): Promise<void> {
        // Implémentation pour analyse workspace
    }
    
    private async handleAutoFix(analyzer: ISelfAnalyzer): Promise<void> {
        // Implémentation pour auto-fix
    }
    
    private handleRefreshData(): void {
        // Émettre événement de refresh
        this.eventBus.emit({
            type: 'configuration-changed',
            timestamp: new Date()
        });
    }
    
    private initializeProviders(): void {
        // Initialisation des TreeView providers avec injection de dépendances
    }
    
    private startBackgroundTasks(): void {
        // Démarrage des tâches d'auto-amélioration
    }
    
    private finalizeActivation(): void {
        const logger = this.container.get<EnhancedLogger>('logger');
        logger.info('🧬 AI Mastery - Vincian Analysis Extension fully activated');
        
        if (this.configManager.getSection('ui').showNotifications) {
            vscode.window.showInformationMessage('🧬 AI Mastery Extension ready!');
        }
    }
    
    deactivate(): void {
        this.commandManager.dispose();
        this.eventBus.dispose();
        this.container.clear();
    }
}

// ===== POINT D'ENTRÉE SIMPLIFIÉ =====

export function activate(context: vscode.ExtensionContext): Promise<void> {
    const orchestrator = new ExtensionOrchestrator();
    return orchestrator.activate(context);
}

export function deactivate(): void {
    // L'orchestrator gérera le cleanup
}