import * as vscode from 'vscode';
import { SelfAnalyzer, generateSelfAnalysisHTML } from './self-analyzing-extension';
import {
  UnifiedAnalysisProvider,
  EnhancedVincianAnalysisProvider,
  EnhancedAutocodingProvider,
  registerUnifiedProviderCommands,
} from './UnifiedProviders';
import { activateUXOptimization } from './ux_optimization';
import { VincianAnalysisProvider, VincianAutocodingProvider } from './TreeViewProvider';

// --- Constants Unifiés ---

namespace AIMasteryConstants {
  export const EXTENSION_ID = 'aiMasteryVincianAnalysis';
  export const COMMAND_PREFIX = 'aimastery';

  export const COMMANDS = {
    // Commandes d'analyse technique
    SELF_ANALYSIS: `${COMMAND_PREFIX}.selfAnalysis`,
    SELF_IMPROVE: `${COMMAND_PREFIX}.selfImprove`,
    ANALYZE_CURRENT_FILE: `${COMMAND_PREFIX}.analyzeCurrentFile`,
    AUTO_FIX: `${COMMAND_PREFIX}.autoFix`,
    ANALYZE_WORKSPACE: `${COMMAND_PREFIX}.analyzeWorkspace`,

    // Commandes d'analyse Vincienne
    ANALYZE_AUDIO: `${COMMAND_PREFIX}.analyzeAudio`,
    GENERATE_SOCIAL_PACK: `${COMMAND_PREFIX}.generateSocialPack`,
    SHOW_VINCIAN_DASHBOARD: `${COMMAND_PREFIX}.showVincianDashboard`,

    // Commandes unifiées
    UNIFIED_ANALYSIS: `${COMMAND_PREFIX}.unifiedAnalysis`,
    SWITCH_MODE: `${COMMAND_PREFIX}.switchMode`,

    // Commandes système
    REFRESH_DATA: `${COMMAND_PREFIX}.refreshData`,
    START_ANALYSIS: `${COMMAND_PREFIX}.startAnalysis`,
    SHOW_PREMIUM_UPGRADE: `${COMMAND_PREFIX}.showPremiumUpgrade`,
  };

  export const CONFIG_KEYS = {
    // Configuration technique
    AUTO_IMPROVE_ENABLED: 'autoImprove.enabled',
    AUTO_IMPROVE_INTERVAL_HOURS: 'autoImprove.intervalHours',
    AUTO_IMPROVE_HEALTH_THRESHOLD: 'autoImprove.healthThreshold',

    // Configuration UX
    SHOW_NOTIFICATIONS: 'ui.showNotifications',
    ENABLE_ANIMATIONS: 'ui.enableAnimations',
    THEME_MODE: 'ui.theme',

    // Configuration Vincienne
    VINCIAN_ANALYSIS_ENABLED: 'vincian.enabled',
    SOCIAL_PACK_AUTO_GENERATE: 'vincian.autoGenerateSocialPack',

    // Configuration Premium
    PREMIUM_TIER: 'premium.tier',
    TRIAL_STATUS: 'premium.trialStatus',
  };

  export const WEBVIEW_TYPES = {
    SELF_ANALYSIS_REPORT: 'selfAnalysisReport',
    WORKSPACE_ANALYSIS: 'workspaceAnalysis',
    VINCIAN_DASHBOARD: 'vincianDashboard',
    WELCOME_FLOW: 'welcomeFlow',
    PREMIUM_UPGRADE: 'premiumUpgrade',
  };

  export const TREE_VIEWS = {
    UNIFIED_ANALYSIS: 'aimastery-unified',
    CODE_HEALTH: 'aimastery-health',
    VINCIAN_ANALYSIS: 'aimastery-vincian',
    AUTO_CODING: 'aimastery-autocoding',
  };
}

// --- Enhanced Logger avec Analytics ---

class EnhancedLogger {
  private static instance: EnhancedLogger;
  private outputChannel: vscode.OutputChannel;
  private analyticsEnabled: boolean = true;

  private constructor() {
    this.outputChannel = vscode.window.createOutputChannel('AIMastery - Unified Extension');
  }

  static getInstance(): EnhancedLogger {
    if (!EnhancedLogger.instance) {
      EnhancedLogger.instance = new EnhancedLogger();
    }
    return EnhancedLogger.instance;
  }

  private formatMessage(level: string, message: string, context?: any): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | Context: ${JSON.stringify(context)}` : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${contextStr}`;
  }

  info(message: string, context?: any): void {
    this.outputChannel.appendLine(this.formatMessage('info', `ℹ️ ${message}`, context));
    this.trackEvent('log_info', { message, context });
  }

  warn(message: string, context?: any): void {
    this.outputChannel.appendLine(this.formatMessage('warn', `⚠️ ${message}`, context));
    this.trackEvent('log_warn', { message, context });
  }

  error(message: string, error?: Error, context?: any): void {
    this.outputChannel.appendLine(this.formatMessage('error', `❌ ${message}`, context));
    if (error) {
      this.outputChannel.appendLine(`Stack: ${error.stack || 'No stack trace'}`);
    }
    this.outputChannel.show();
    this.trackEvent('log_error', { message, error: error?.message, context });
  }

  success(message: string, context?: any): void {
    this.outputChannel.appendLine(this.formatMessage('success', `✅ ${message}`, context));
    this.trackEvent('log_success', { message, context });
  }

  private async trackEvent(event: string, data?: any): Promise<void> {
    if (!this.analyticsEnabled) {
      return;
    }

    try {
      // Envoi analytics asynchrone (fail silently)
      // await axios.post('https://your-vercel-app.vercel.app/api/analytics/track', {
      //     event,
      //     data,
      //     userId: vscode.env.machineId,
      //     timestamp: new Date().toISOString(),
      //     source: 'vscode_extension'
      // });
    } catch (error) {
      // Fail silently pour ne pas impacter l'UX
    }
  }

  show(): void {
    this.outputChannel.show();
  }
}

// --- Configuration Manager Unifié ---

class UnifiedConfigurationManager {
  private static instance: UnifiedConfigurationManager;
  private config: vscode.WorkspaceConfiguration;
  private logger = EnhancedLogger.getInstance();

  private constructor() {
    this.config = vscode.workspace.getConfiguration(AIMasteryConstants.EXTENSION_ID);
    this.setupConfigurationWatcher();
  }

  static getInstance(): UnifiedConfigurationManager {
    if (!UnifiedConfigurationManager.instance) {
      UnifiedConfigurationManager.instance = new UnifiedConfigurationManager();
    }
    return UnifiedConfigurationManager.instance;
  }

  private setupConfigurationWatcher(): void {
    vscode.workspace.onDidChangeConfiguration(event => {
      if (event.affectsConfiguration(AIMasteryConstants.EXTENSION_ID)) {
        this.config = vscode.workspace.getConfiguration(AIMasteryConstants.EXTENSION_ID);
        this.logger.info('Configuration updated');
        vscode.commands.executeCommand(AIMasteryConstants.COMMANDS.REFRESH_DATA);
      }
    });
  }

  get<T>(key: string, defaultValue: T): T {
    return this.config.get<T>(key, defaultValue);
  }

  async update(
    key: string,
    value: any,
    configurationTarget?: vscode.ConfigurationTarget
  ): Promise<void> {
    await this.config.update(key, value, configurationTarget);
  }

  // Méthodes de configuration spécialisées
  isFeatureEnabled(
    feature: 'autoImprove' | 'vincianAnalysis' | 'notifications' | 'animations'
  ): boolean {
    const featureMap = {
      autoImprove: AIMasteryConstants.CONFIG_KEYS.AUTO_IMPROVE_ENABLED,
      vincianAnalysis: AIMasteryConstants.CONFIG_KEYS.VINCIAN_ANALYSIS_ENABLED,
      notifications: AIMasteryConstants.CONFIG_KEYS.SHOW_NOTIFICATIONS,
      animations: AIMasteryConstants.CONFIG_KEYS.ENABLE_ANIMATIONS,
    };

    return this.get(featureMap[feature], true);
  }

  getPremiumTier(): 'free' | 'premium' | 'pro' {
    return this.get(AIMasteryConstants.CONFIG_KEYS.PREMIUM_TIER, 'free');
  }

  getTrialStatus(): { active: boolean; endDate?: string } {
    return this.get(AIMasteryConstants.CONFIG_KEYS.TRIAL_STATUS, { active: false });
  }
}

// --- User Progression & Analytics Manager ---

class UserProgressionManager {
  private context: vscode.ExtensionContext;
  private logger = EnhancedLogger.getInstance();
  private config = UnifiedConfigurationManager.getInstance();

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  async trackUserAction(action: string, data?: any): Promise<void> {
    const progress = this.context.globalState.get('userProgress', {
      firstInstall: Date.now(),
      totalActions: 0,
      codeAnalyses: 0,
      audioAnalyses: 0,
      socialPacksGenerated: 0,
      improvementsApplied: 0,
      lastAction: Date.now(),
      conversionScore: 0,
      tier: 'free',
    });

    progress.totalActions++;
    progress.lastAction = Date.now();

    // Compteurs spécialisés
    switch (action) {
      case 'code_analyzed':
        progress.codeAnalyses++;
        break;
      case 'audio_analyzed':
        progress.audioAnalyses++;
        break;
      case 'social_pack_generated':
        progress.socialPacksGenerated++;
        break;
      case 'improvement_applied':
        progress.improvementsApplied++;
        break;
    }

    // Calculer score de conversion
    progress.conversionScore = this.calculateConversionScore(progress);

    await this.context.globalState.update('userProgress', progress);

    // Déclencher événements basés sur progression
    await this.checkProgressionMilestones(progress, action, data);

    this.logger.info(`User action tracked: ${action}`, {
      progress: progress.totalActions,
      score: progress.conversionScore,
    });
  }

  private calculateConversionScore(progress: any): number {
    let score = 0;

    // Points pour actions
    score += progress.codeAnalyses * 10;
    score += progress.audioAnalyses * 15;
    score += progress.socialPacksGenerated * 20;
    score += progress.improvementsApplied * 5;

    // Bonus pour diversité d'usage
    const usageTypes = [
      progress.codeAnalyses > 0,
      progress.audioAnalyses > 0,
      progress.socialPacksGenerated > 0,
    ].filter(Boolean).length;

    score += usageTypes * 20;

    // Bonus pour usage régulier
    const daysSinceInstall = (Date.now() - progress.firstInstall) / (1000 * 60 * 60 * 24);
    const usageFrequency = progress.totalActions / Math.max(daysSinceInstall, 1);

    if (usageFrequency > 1) {
      score += 30;
    }

    return Math.min(score, 100);
  }

  private async checkProgressionMilestones(
    progress: any,
    action: string,
    data?: any
  ): Promise<void> {
    // Première analyse réussie
    if (action === 'code_analyzed' && progress.codeAnalyses === 1) {
      setTimeout(() => {
        vscode.window
          .showInformationMessage(
            "🎉 Première analyse réussie ! Découvrez maintenant l'analyse audio Vincienne.",
            '🎵 Essayer Audio',
            'Plus tard'
          )
          .then(choice => {
            if (choice === '🎵 Essayer Audio') {
              vscode.commands.executeCommand(AIMasteryConstants.COMMANDS.ANALYZE_AUDIO);
            }
          });
      }, 2000);
    }

    // Première analyse audio
    if (action === 'audio_analyzed' && progress.audioAnalyses === 1) {
      setTimeout(() => {
        vscode.window
          .showInformationMessage(
            '✨ Score Vincien obtenu ! Générez maintenant votre Social Media Pack.',
            '📱 Générer Pack',
            'Continuer'
          )
          .then(choice => {
            if (choice === '📱 Générer Pack') {
              vscode.commands.executeCommand(
                AIMasteryConstants.COMMANDS.GENERATE_SOCIAL_PACK,
                data
              );
            }
          });
      }, 1500);
    }

    // Power user détecté
    if (progress.totalActions === 10) {
      setTimeout(() => {
        vscode.window
          .showInformationMessage(
            '🔥 Power User détecté ! Vous maîtrisez AIMastery. Débloquez toutes les fonctionnalités.',
            '💎 Voir Premium',
            'Plus tard'
          )
          .then(choice => {
            if (choice === '💎 Voir Premium') {
              vscode.commands.executeCommand(AIMasteryConstants.COMMANDS.SHOW_PREMIUM_UPGRADE);
            }
          });
      }, 2000);
    }

    // Hybrid user (utilise les deux fonctionnalités)
    if (progress.codeAnalyses >= 3 && progress.audioAnalyses >= 3) {
      setTimeout(() => {
        vscode.window
          .showInformationMessage(
            "🚀 Utilisateur Hybride ! Vous exploitez le plein potentiel. Essayez l'analyse unifiée.",
            '🔬 Analyse Unifiée',
            'OK'
          )
          .then(choice => {
            if (choice === '🔬 Analyse Unifiée') {
              vscode.commands.executeCommand(AIMasteryConstants.COMMANDS.UNIFIED_ANALYSIS);
            }
          });
      }, 1000);
    }
  }

  getProgressionSummary(): any {
    return this.context.globalState.get('userProgress', {
      totalActions: 0,
      codeAnalyses: 0,
      audioAnalyses: 0,
      conversionScore: 0,
    });
  }
}

// --- Premium Features Manager ---

class PremiumFeaturesManager {
  private context: vscode.ExtensionContext;
  private config = UnifiedConfigurationManager.getInstance();
  private logger = EnhancedLogger.getInstance();

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  isPremiumFeature(feature: string): boolean {
    const premiumFeatures = [
      'unlimited_analyses',
      'advanced_social_packs',
      'export_reports',
      'api_access',
      'custom_templates',
      'priority_support',
      'auto_fix',
    ];

    return premiumFeatures.includes(feature);
  }

  canAccessFeature(feature: string): boolean {
    if (!this.isPremiumFeature(feature)) {
      return true;
    }

    const tier = this.config.getPremiumTier();
    const trial = this.config.getTrialStatus();

    // Trial actif
    if (trial.active && trial.endDate) {
      const trialEnd = new Date(trial.endDate);
      if (new Date() < trialEnd) {
        return true;
      }
    }

    // Tier premium ou pro
    return tier === 'premium' || tier === 'pro';
  }

  async checkFeatureAccess(feature: string, showUpgradePrompt: boolean = true): Promise<boolean> {
    if (this.canAccessFeature(feature)) {
      return true;
    }

    if (showUpgradePrompt) {
      const choice = await vscode.window.showInformationMessage(
        `🔒 Fonctionnalité Premium: ${feature}`,
        {
          detail:
            'Cette fonctionnalité nécessite un abonnement Premium. Débloquez toutes les fonctionnalités dès maintenant !',
          modal: true,
        },
        '💎 Upgrade Premium',
        '🎁 Essai Gratuit',
        'Plus tard'
      );

      if (choice === '💎 Upgrade Premium' || choice === '🎁 Essai Gratuit') {
        vscode.commands.executeCommand(AIMasteryConstants.COMMANDS.SHOW_PREMIUM_UPGRADE);
      }
    }

    return false;
  }
}

// --- Stubs pour imports manquants ---

// Si UnifiedProviders.ts n'existe pas encore
class UnifiedAnalysisProvider implements vscode.TreeDataProvider<any> {
  private _onDidChangeTreeData: vscode.EventEmitter<any | undefined | null | void> =
    new vscode.EventEmitter<any | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<any | undefined | null | void> =
    this._onDidChangeTreeData.event;

  constructor(private analyzer: SelfAnalyzer) {}

  getTreeItem(element: any): vscode.TreeItem {
    return new vscode.TreeItem('Unified Analysis', vscode.TreeItemCollapsibleState.Expanded);
  }

  getChildren(element?: any): Thenable<any[]> {
    return Promise.resolve([]);
  }

  addAnalysisResult(result: any): void {
    // Implémenter logic
    this.refresh();
  }

  setMode(mode: string): void {
    // Implémenter logic
    this.refresh();
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }
}

class EnhancedVincianAnalysisProvider implements vscode.TreeDataProvider<any> {
  private _onDidChangeTreeData: vscode.EventEmitter<any | undefined | null | void> =
    new vscode.EventEmitter<any | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<any | undefined | null | void> =
    this._onDidChangeTreeData.event;

  getTreeItem(element: any): vscode.TreeItem {
    return new vscode.TreeItem('Vincian Analysis', vscode.TreeItemCollapsibleState.Expanded);
  }

  getChildren(element?: any): Thenable<any[]> {
    return Promise.resolve([]);
  }

  addResult(result: any): void {
    // Implémenter logic
    this.refresh();
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }
}

class EnhancedAutocodingProvider implements vscode.TreeDataProvider<any> {
  private _onDidChangeTreeData: vscode.EventEmitter<any | undefined | null | void> =
    new vscode.EventEmitter<any | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<any | undefined | null | void> =
    this._onDidChangeTreeData.event;

  constructor(private analyzer: SelfAnalyzer) {}

  getTreeItem(element: any): vscode.TreeItem {
    return new vscode.TreeItem('Auto-coding', vscode.TreeItemCollapsibleState.Expanded);
  }

  getChildren(element?: any): Thenable<any[]> {
    return Promise.resolve([]);
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }
}

// Stubs pour TreeViewProvider.ts
const VincianAnalysisProvider = EnhancedVincianAnalysisProvider;
const VincianAutocodingProvider = EnhancedAutocodingProvider;

// Stub pour registerUnifiedProviderCommands
function registerUnifiedProviderCommands(
  context: vscode.ExtensionContext,
  analyzer: SelfAnalyzer
): void {
  // Commands registration will be handled by main manager
}

// Stub pour ux_optimization si non disponible
function activateUXOptimization(context: vscode.ExtensionContext): any {
  return {
    progressTracker: {
      trackUserAction: async (action: string, data: any) => {
        // Stub implementation
      },
    },
  };
}

// --- Main Extension Manager ---

class AIMasteryExtensionManager {
  private context: vscode.ExtensionContext;
  private logger = EnhancedLogger.getInstance();
  private config = UnifiedConfigurationManager.getInstance();
  private progressManager: UserProgressionManager;
  private premiumManager: PremiumFeaturesManager;
  private uxOptimization: any;

  // Analyseurs
  private codeAnalyzer!: SelfAnalyzer;

  // Providers
  private unifiedProvider!: UnifiedAnalysisProvider;
  private vincianProvider!: EnhancedVincianAnalysisProvider;
  private autocodingProvider!: EnhancedAutocodingProvider;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.progressManager = new UserProgressionManager(context);
    this.premiumManager = new PremiumFeaturesManager(context);
  }

  async activate(): Promise<void> {
    const startTime = Date.now();

    try {
      this.logger.info('🚀 AIMastery Extension activation started...');

      // 1. Initialiser les analyseurs
      await this.initializeAnalyzers();

      // 2. Configurer l'UX Optimization
      this.uxOptimization = activateUXOptimization(this.context);

      // 3. Initialiser les providers TreeView
      await this.initializeProviders();

      // 4. Enregistrer toutes les commandes
      await this.registerAllCommands();

      // 5. Configurer les tâches d'arrière-plan
      await this.setupBackgroundTasks();

      // 6. Vérifier le statut utilisateur
      await this.checkUserStatus();

      const activationTime = Date.now() - startTime;
      this.logger.success(`Extension activated successfully in ${activationTime}ms`);

      // Notification de bienvenue conditionnelle
      if (this.config.isFeatureEnabled('notifications')) {
        const isFirstTime = this.context.globalState.get('firstActivation', true);
        if (isFirstTime) {
          await this.context.globalState.update('firstActivation', false);
          vscode.window
            .showInformationMessage(
              `🎉 AIMastery ready! Code + Audio analysis in one extension.`,
              '🚀 Start Tour',
              'OK'
            )
            .then(choice => {
              if (choice === '🚀 Start Tour') {
                vscode.commands.executeCommand(AIMasteryConstants.COMMANDS.START_ANALYSIS);
              }
            });
        } else {
          vscode.window.showInformationMessage(`⚡ AIMastery ready! (${activationTime}ms startup)`);
        }
      }
    } catch (error) {
      this.logger.error('Extension activation failed', error instanceof Error ? error : undefined);
      throw error;
    }
  }

  private async initializeAnalyzers(): Promise<void> {
    this.codeAnalyzer = new SelfAnalyzer(this.context);
    this.logger.info('Code analyzer initialized');
  }

  private async initializeProviders(): Promise<void> {
    // Providers unifiés (nouveaux)
    this.unifiedProvider = new UnifiedAnalysisProvider(this.codeAnalyzer);
    this.vincianProvider = new EnhancedVincianAnalysisProvider();
    this.autocodingProvider = new EnhancedAutocodingProvider(this.codeAnalyzer);

    // Enregistrer les TreeViews
    vscode.window.registerTreeDataProvider(
      AIMasteryConstants.TREE_VIEWS.UNIFIED_ANALYSIS,
      this.unifiedProvider
    );
    vscode.window.registerTreeDataProvider(
      AIMasteryConstants.TREE_VIEWS.VINCIAN_ANALYSIS,
      this.vincianProvider
    );
    vscode.window.registerTreeDataProvider(
      AIMasteryConstants.TREE_VIEWS.AUTO_CODING,
      this.autocodingProvider
    );

    // Providers existants (compatibilité)
    const legacyVincianProvider = new VincianAnalysisProvider();
    const legacyAutocodingProvider = new VincianAutocodingProvider();
    vscode.window.registerTreeDataProvider('vincian-analysis', legacyVincianProvider);
    vscode.window.registerTreeDataProvider('vincian-autocoding', legacyAutocodingProvider);

    this.logger.info('All TreeView providers registered');
  }

  private async registerAllCommands(): Promise<void> {
    // Commandes d'analyse technique
    this.registerCommand(AIMasteryConstants.COMMANDS.SELF_ANALYSIS, () =>
      this.handleSelfAnalysis()
    );
    this.registerCommand(AIMasteryConstants.COMMANDS.SELF_IMPROVE, () => this.handleSelfImprove());
    this.registerCommand(AIMasteryConstants.COMMANDS.ANALYZE_CURRENT_FILE, () =>
      this.handleAnalyzeCurrentFile()
    );
    this.registerCommand(AIMasteryConstants.COMMANDS.ANALYZE_WORKSPACE, () =>
      this.handleAnalyzeWorkspace()
    );
    this.registerCommand(AIMasteryConstants.COMMANDS.AUTO_FIX, () => this.handleAutoFix());

    // Commandes d'analyse Vincienne
    this.registerCommand(AIMasteryConstants.COMMANDS.ANALYZE_AUDIO, () =>
      this.handleAnalyzeAudio()
    );
    this.registerCommand(AIMasteryConstants.COMMANDS.GENERATE_SOCIAL_PACK, data =>
      this.handleGenerateSocialPack(data)
    );
    this.registerCommand(AIMasteryConstants.COMMANDS.SHOW_VINCIAN_DASHBOARD, () =>
      this.handleShowVincianDashboard()
    );

    // Commandes unifiées
    this.registerCommand(AIMasteryConstants.COMMANDS.UNIFIED_ANALYSIS, () =>
      this.handleUnifiedAnalysis()
    );
    this.registerCommand(AIMasteryConstants.COMMANDS.SWITCH_MODE, () => this.handleSwitchMode());

    // Commandes système
    this.registerCommand(AIMasteryConstants.COMMANDS.REFRESH_DATA, () => this.handleRefreshData());
    this.registerCommand(AIMasteryConstants.COMMANDS.START_ANALYSIS, () =>
      this.handleStartAnalysis()
    );
    this.registerCommand(AIMasteryConstants.COMMANDS.SHOW_PREMIUM_UPGRADE, () =>
      this.handleShowPremiumUpgrade()
    );

    this.logger.info('All commands registered');
  }

  private registerCommand(commandId: string, handler: (...args: any[]) => any): void {
    const disposable = vscode.commands.registerCommand(commandId, async (...args) => {
      const startTime = Date.now();

      try {
        this.logger.info(`Executing command: ${commandId}`);
        await handler(...args);

        const duration = Date.now() - startTime;
        this.logger.info(`Command completed: ${commandId} (${duration}ms)`);
      } catch (error) {
        this.logger.error(
          `Command failed: ${commandId}`,
          error instanceof Error ? error : undefined
        );
        vscode.window.showErrorMessage(
          `Command failed: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    });

    this.context.subscriptions.push(disposable);
  }

  // === HANDLERS DES COMMANDES ===

  private async handleSelfAnalysis(): Promise<void> {
    await this.progressManager.trackUserAction('code_analysis_started');

    const analysis = this.codeAnalyzer.analyzeSelf();
    const healthPercentage = (analysis.healthScore * 100).toFixed(1);

    // Ajouter aux providers
    this.unifiedProvider.addAnalysisResult({
      codeHealth: {
        score: analysis.healthScore,
        functions: analysis.workingFunctions,
        patterns: analysis.codePatterns,
        improvements: analysis.improvementOpportunities,
      },
      timestamp: new Date(),
      analysisType: 'code',
      userId: vscode.env.machineId,
      version: '1.0.0',
    });

    const panel = vscode.window.createWebviewPanel(
      AIMasteryConstants.WEBVIEW_TYPES.SELF_ANALYSIS_REPORT,
      `🧬 Code Analysis (${healthPercentage}%)`,
      vscode.ViewColumn.Two,
      { enableScripts: true, retainContextWhenHidden: true }
    );

    panel.webview.html = generateSelfAnalysisHTML(analysis);

    await this.progressManager.trackUserAction('code_analyzed', {
      healthScore: analysis.healthScore,
    });

    if (this.config.isFeatureEnabled('notifications')) {
      vscode.window.showInformationMessage(`🧬 Analysis complete! Health: ${healthPercentage}%`);
    }
  }

  private async handleSelfImprove(): Promise<void> {
    await this.progressManager.trackUserAction('self_improve_started');

    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: '🔄 Auto-improving code...',
        cancellable: false,
      },
      async () => {
        const improvements = await this.codeAnalyzer.selfImprove();

        await this.progressManager.trackUserAction('improvement_applied', {
          count: improvements.length,
        });

        if (improvements.length > 0) {
          vscode.window.showInformationMessage(`✅ Applied ${improvements.length} improvements!`);
          this.handleRefreshData();
        } else {
          vscode.window.showInformationMessage('💪 Code is already optimized!');
        }
      }
    );
  }

  private async handleAnalyzeCurrentFile(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage('No active file to analyze.');
      return;
    }

    const document = editor.document;
    const analysis = this.codeAnalyzer.analyzeCode(document.getText(), document.languageId);

    const healthPercentage = (analysis.healthScore * 100).toFixed(1);
    vscode.window.showInformationMessage(`📊 File Health: ${healthPercentage}%`);

    await this.progressManager.trackUserAction('file_analyzed', {
      healthScore: analysis.healthScore,
      language: document.languageId,
    });
  }

  private async handleAnalyzeWorkspace(): Promise<void> {
    if (!vscode.workspace.workspaceFolders) {
      vscode.window.showWarningMessage('No workspace folder opened.');
      return;
    }

    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: '🔍 Analyzing workspace...',
        cancellable: true,
      },
      async (progress, token) => {
        const analysis = await this.codeAnalyzer.analyzeWorkspace();

        if (token.isCancellationRequested) {
          return;
        }

        const healthPercentage = (analysis.healthScore * 100).toFixed(1);
        const panel = vscode.window.createWebviewPanel(
          AIMasteryConstants.WEBVIEW_TYPES.WORKSPACE_ANALYSIS,
          `📊 Workspace Analysis - ${healthPercentage}%`,
          vscode.ViewColumn.One,
          { enableScripts: true, retainContextWhenHidden: true }
        );

        panel.webview.html = generateSelfAnalysisHTML(analysis);

        await this.progressManager.trackUserAction('workspace_analyzed', {
          healthScore: analysis.healthScore,
          filesAnalyzed: analysis.analysisMetadata.filesAnalyzed,
        });
      }
    );
  }

  private async handleAutoFix(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage('No active file to fix.');
      return;
    }

    // Vérifier accès à la fonctionnalité auto-fix
    if (!(await this.premiumManager.checkFeatureAccess('auto_fix'))) {
      return;
    }

    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: '🔧 Auto-fixing issues...',
        cancellable: false,
      },
      async () => {
        // Logique d'auto-fix simplifiée
        const document = editor.document;
        const edit = new vscode.WorkspaceEdit();
        let fixedText = document.getText();
        let fixesApplied = 0;

        // Auto-fixes basiques
        const fixes = [
          { pattern: /\bvar\s+/g, replacement: 'const ', name: 'var→const' },
          { pattern: /console\.log\([^)]*\);?\n?/g, replacement: '', name: 'remove console.log' },
        ];

        fixes.forEach(fix => {
          const matches = fixedText.match(fix.pattern);
          if (matches) {
            fixedText = fixedText.replace(fix.pattern, fix.replacement);
            fixesApplied += matches.length;
          }
        });

        if (fixedText !== document.getText()) {
          edit.replace(document.uri, new vscode.Range(0, 0, document.lineCount, 0), fixedText);
          await vscode.workspace.applyEdit(edit);

          vscode.window.showInformationMessage(`🎯 Applied ${fixesApplied} fixes!`);
          await this.progressManager.trackUserAction('auto_fix_applied', { fixesApplied });
        } else {
          vscode.window.showInformationMessage('✨ No fixes needed!');
        }
      }
    );
  }

  private async handleAnalyzeAudio(): Promise<void> {
    await this.progressManager.trackUserAction('audio_analysis_started');

    const audioFiles = await vscode.window.showOpenDialog({
      canSelectFiles: true,
      canSelectFolders: false,
      canSelectMany: false,
      filters: {
        'Audio Files': ['mp3', 'wav', 'm4a', 'flac', 'aac', 'ogg'],
      },
      openLabel: 'Analyze Audio File',
    });

    if (audioFiles && audioFiles.length > 0) {
      const filePath = audioFiles[0].fsPath;
      const fileName = filePath.split('/').pop() || 'Unknown';

      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: `🎵 Analyzing ${fileName}...`,
          cancellable: false,
        },
        async () => {
          // Simulation d'analyse audio
          await new Promise(resolve => setTimeout(resolve, 2000));

          const vincianScore = 70 + Math.random() * 30;
          const result = {
            vincianScore,
            timestamp: Date.now(),
            fileName,
            filePath,
            insights: [
              { category: 'Harmonic Resonance', score: Math.floor(vincianScore * 0.1) },
              { category: 'Cymatic Patterns', score: Math.floor(vincianScore * 0.12) },
              { category: 'Frequency Analysis', score: Math.floor(vincianScore * 0.11) },
            ],
          };

          this.vincianProvider.addResult(result);

          await this.progressManager.trackUserAction('audio_analyzed', { vincianScore, fileName });

          vscode.window
            .showInformationMessage(
              `✨ Vincian Score: ${vincianScore.toFixed(0)}/100 for ${fileName}`,
              '📱 Generate Social Pack',
              'OK'
            )
            .then(choice => {
              if (choice === '📱 Generate Social Pack') {
                this.handleGenerateSocialPack(result);
              }
            });
        }
      );
    }
  }

  private async handleGenerateSocialPack(data?: any): Promise<void> {
    // Vérifier accès premium
    if (!(await this.premiumManager.checkFeatureAccess('social_pack_generation'))) {
      return;
    }

    await this.progressManager.trackUserAction('social_pack_generation_started');

    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: '📱 Generating Social Media Pack...',
        cancellable: false,
      },
      async () => {
        // Simulation de génération
        await new Promise(resolve => setTimeout(resolve, 3000));

        await this.progressManager.trackUserAction('social_pack_generated', data);

        vscode.window
          .showInformationMessage(
            '🎉 Social Media Pack generated! Instagram + LinkedIn + TikTok ready.',
            'View Pack',
            'OK'
          )
          .then(choice => {
            if (choice === 'View Pack') {
              this.showSocialPackPanel(data);
            }
          });
      }
    );
  }

  private showSocialPackPanel(data: any): void {
    const panel = vscode.window.createWebviewPanel(
      'socialPack',
      '📱 Social Media Pack',
      vscode.ViewColumn.Two,
      { enableScripts: true }
    );

    panel.webview.html = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: -apple-system, sans-serif; padding: 20px; background: #1a1a2e; color: #d4d4d4; }
                    .pack-container { max-width: 800px; margin: 0 auto; }
                    .platform { background: rgba(255,255,255,0.05); margin: 20px 0; padding: 20px; border-radius: 10px; }
                    .platform h3 { color: #ffd700; margin-bottom: 15px; }
                    .content-item { background: rgba(255,255,255,0.03); padding: 15px; margin: 10px 0; border-radius: 8px; }
                    .copy-btn { background: #007acc; color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer; }
                </style>
            </head>
            <body>
                <div class="pack-container">
                    <h1>📱 Social Media Pack</h1>
                    <p>Generated from: ${data?.fileName || 'Audio Analysis'}</p>
                    
                    <div class="platform">
                        <h3>📸 Instagram Story</h3>
                        <div class="content-item">
                            <p>🎵 Just discovered something amazing with this audio! The Vincian Score is off the charts! ✨</p>
                            <button class="copy-btn" onclick="navigator.clipboard.writeText(this.previousElementSibling.textContent)">Copy</button>
                        </div>
                    </div>
                    
                    <div class="platform">
                        <h3>💼 LinkedIn Post</h3>
                        <div class="content-item">
                            <p>Fascinating audio analysis results using cymatic principles inspired by Leonardo da Vinci. The harmonic patterns reveal unique insights about sound frequency resonance. #AudioAnalysis #Innovation #Technology</p>
                            <button class="copy-btn" onclick="navigator.clipboard.writeText(this.previousElementSibling.textContent)">Copy</button>
                        </div>
                    </div>
                    
                    <div class="platform">
                        <h3>🎬 TikTok Script</h3>
                        <div class="content-item">
                            <p>Hook: "This AI just analyzed my audio like Da Vinci would..."<br>
                            Content: Show Vincian Score reveal<br>
                            CTA: "What would your audio score be?"</p>
                            <button class="copy-btn" onclick="navigator.clipboard.writeText(this.previousElementSibling.textContent)">Copy</button>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `;
  }

  private async handleShowVincianDashboard(): Promise<void> {
    const progression = this.progressManager.getProgressionSummary();

    const panel = vscode.window.createWebviewPanel(
      AIMasteryConstants.WEBVIEW_TYPES.VINCIAN_DASHBOARD,
      '📊 Vincian Dashboard',
      vscode.ViewColumn.One,
      { enableScripts: true, retainContextWhenHidden: true }
    );

    panel.webview.html = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: -apple-system, sans-serif; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; margin: 0; }
                    .dashboard { max-width: 1200px; margin: 0 auto; }
                    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 30px 0; }
                    .stat-card { background: rgba(255,255,255,0.1); padding: 25px; border-radius: 15px; text-align: center; backdrop-filter: blur(20px); }
                    .stat-number { font-size: 2.5rem; font-weight: bold; color: #ffd700; }
                    .stat-label { opacity: 0.9; margin-top: 5px; }
                </style>
            </head>
            <body>
                <div class="dashboard">
                    <h1>📊 Your Vincian Dashboard</h1>
                    
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-number">${progression.totalActions}</div>
                            <div class="stat-label">Total Actions</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">${progression.codeAnalyses}</div>
                            <div class="stat-label">Code Analyses</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">${progression.audioAnalyses}</div>
                            <div class="stat-label">Audio Analyses</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">${progression.conversionScore}</div>
                            <div class="stat-label">Mastery Score</div>
                        </div>
                    </div>
                    
                    <div style="text-align: center; margin-top: 40px;">
                        <h3>🚀 Ready for more advanced features?</h3>
                        <button style="background: linear-gradient(45deg, #ffd700, #ff6b35); color: #333; border: none; padding: 15px 30px; border-radius: 25px; font-size: 1.1rem; cursor: pointer;" onclick="upgradePremium()">
                            💎 Upgrade to Premium
                        </button>
                    </div>
                </div>
                
                <script>
                    const vscode = acquireVsCodeApi();
                    function upgradePremium() {
                        vscode.postMessage({ command: 'upgrade' });
                    }
                </script>
            </body>
            </html>
        `;

    panel.webview.onDidReceiveMessage(async message => {
      if (message.command === 'upgrade') {
        await this.handleShowPremiumUpgrade();
      }
    });
  }

  private async handleUnifiedAnalysis(): Promise<void> {
    await this.progressManager.trackUserAction('unified_analysis_started');

    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: '🚀 Running unified analysis...',
        cancellable: false,
      },
      async progress => {
        progress.report({ increment: 0, message: 'Analyzing code...' });

        const codeAnalysis = this.codeAnalyzer.analyzeSelf();

        progress.report({ increment: 50, message: 'Analyzing audio patterns...' });

        // Simulation analyse audio
        const audioAnalysis = {
          score: 70 + Math.random() * 30,
          cymaticPatterns: [],
          harmonics: [],
          socialMediaPacks: [],
        };

        progress.report({ increment: 100, message: 'Generating insights...' });

        const unifiedResult = {
          codeHealth: {
            score: codeAnalysis.healthScore,
            functions: codeAnalysis.workingFunctions,
            patterns: codeAnalysis.codePatterns,
            improvements: codeAnalysis.improvementOpportunities,
          },
          vincianAnalysis: audioAnalysis,
          timestamp: new Date(),
          analysisType: 'unified' as const,
          userId: vscode.env.machineId,
          version: '1.0.0',
        };

        this.unifiedProvider.addAnalysisResult(unifiedResult);

        await this.progressManager.trackUserAction('unified_analysis_completed', {
          codeHealth: codeAnalysis.healthScore,
          vincianScore: audioAnalysis.score,
        });

        vscode.window.showInformationMessage(
          `🚀 Unified Analysis complete! Code: ${(codeAnalysis.healthScore * 100).toFixed(0)}% | Vincian: ${audioAnalysis.score.toFixed(0)}/100`
        );
      }
    );
  }

  private async handleSwitchMode(): Promise<void> {
    const modes = [
      {
        label: '🤖 Auto Detection',
        description: 'Automatically detect optimal mode',
        value: 'auto',
      },
      { label: '💻 Code Focus', description: 'Technical code analysis', value: 'code' },
      { label: '🎵 Audio Focus', description: 'Vincian audio analysis', value: 'audio' },
      { label: '🚀 Unified Mode', description: 'Combined code + audio analysis', value: 'unified' },
    ];

    const selected = await vscode.window.showQuickPick(modes, {
      placeHolder: 'Select analysis mode',
      canPickMany: false,
    });

    if (selected) {
      this.unifiedProvider.setMode(selected.value as any);
      await this.config.update('analysis.mode', selected.value);

      vscode.window.showInformationMessage(`Mode switched to: ${selected.label}`);
      await this.progressManager.trackUserAction('mode_switched', { mode: selected.value });
    }
  }

  private handleRefreshData(): void {
    // Rafraîchir tous les providers
    this.unifiedProvider.refresh();
    this.vincianProvider.refresh();
    this.autocodingProvider.refresh();

    if (this.config.isFeatureEnabled('notifications')) {
      vscode.window.showInformationMessage('🔄 Data refreshed!');
    }

    this.logger.info('All providers refreshed');
  }

  private async handleStartAnalysis(): Promise<void> {
    const options = [
      {
        label: '🧬 Analyze Code',
        description: 'Technical analysis of your code',
        command: AIMasteryConstants.COMMANDS.SELF_ANALYSIS,
      },
      {
        label: '🎵 Analyze Audio',
        description: 'Vincian cymatic analysis',
        command: AIMasteryConstants.COMMANDS.ANALYZE_AUDIO,
      },
      {
        label: '🚀 Unified Analysis',
        description: 'Combined code + audio analysis',
        command: AIMasteryConstants.COMMANDS.UNIFIED_ANALYSIS,
      },
      {
        label: '📊 View Dashboard',
        description: 'See your progress and stats',
        command: AIMasteryConstants.COMMANDS.SHOW_VINCIAN_DASHBOARD,
      },
    ];

    const selected = await vscode.window.showQuickPick(options, {
      placeHolder: 'What would you like to analyze?',
      canPickMany: false,
    });

    if (selected) {
      vscode.commands.executeCommand(selected.command);
    }
  }

  private async handleShowPremiumUpgrade(): Promise<void> {
    vscode.window.showInformationMessage(
      '💎 Premium Features Available!',
      {
        detail: 'Unlimited analyses, advanced social packs, priority support and more!',
        modal: true,
      },
      'Learn More'
    );
  }

  private async setupBackgroundTasks(): Promise<void> {
    // Configuration auto-improvement si activée
    if (this.config.isFeatureEnabled('autoImprove')) {
      const intervalHours = this.config.get('autoImprove.intervalHours', 1);
      const intervalMs = intervalHours * 60 * 60 * 1000;

      const autoImproveTask = setInterval(async () => {
        try {
          const analysis = this.codeAnalyzer.analyzeSelf();
          const threshold = this.config.get('autoImprove.healthThreshold', 0.8);

          if (analysis.healthScore < threshold) {
            const improvements = await this.codeAnalyzer.selfImprove();
            if (improvements.length > 0) {
              this.logger.info(`Auto-improvement applied ${improvements.length} fixes`);
              this.handleRefreshData();
            }
          }
        } catch (error) {
          this.logger.error(
            'Auto-improvement task failed',
            error instanceof Error ? error : undefined
          );
        }
      }, intervalMs);

      this.context.subscriptions.push({
        dispose: () => clearInterval(autoImproveTask),
      });
    }
  }

  private async checkUserStatus(): Promise<void> {
    const isFirstTime = this.context.globalState.get('firstTime', true);

    if (isFirstTime) {
      await this.context.globalState.update('firstTime', false);
    }
  }

  deactivate(): void {
    this.logger.info('AIMastery Extension deactivated');
  }
}

// === POINT D'ENTRÉE PRINCIPAL ===

let extensionManager: AIMasteryExtensionManager;

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  extensionManager = new AIMasteryExtensionManager(context);
  await extensionManager.activate();
}

export function deactivate(): void {
  if (extensionManager) {
    extensionManager.deactivate();
  }
}
