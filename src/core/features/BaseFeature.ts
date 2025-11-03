import * as vscode from 'vscode';
import { ServiceContainer } from '../di/ServiceContainer';

/**
 * Interface that all features must implement
 * Provides a consistent API for feature management
 */
export interface IFeature {
  /** Unique feature identifier */
  readonly id: string;

  /** Human-readable feature name */
  readonly name: string;

  /** Feature description */
  readonly description: string;

  /** Feature version (semver) */
  readonly version: string;

  /**
   * Activate the feature
   * Called when the extension starts or feature is enabled
   */
  activate(context: vscode.ExtensionContext): Promise<void>;

  /**
   * Deactivate the feature
   * Called when the extension stops or feature is disabled
   */
  deactivate(): Promise<void>;

  /**
   * Check if feature is enabled
   * Reads from VS Code configuration
   */
  isEnabled(): boolean;
}

/**
 * Base class for all v8.0 features
 * Provides common functionality:
 * - Lifecycle management (activate/deactivate)
 * - Disposable tracking
 * - Configuration reading
 * - Command/provider registration helpers
 *
 * Features should extend this class and implement abstract methods
 *
 * @example
 * ```typescript
 * export class VincianAnalysisFeature extends BaseFeature {
 *   readonly id = 'vincian-analysis';
 *   readonly name = 'Vincian Score Analysis';
 *   readonly description = 'Calculates code beauty score';
 *   readonly version = '8.0.0';
 *
 *   protected async onActivate(): Promise<void> {
 *     // Feature-specific initialization
 *   }
 *
 *   protected async onDeactivate(): Promise<void> {
 *     // Feature-specific cleanup
 *   }
 *
 *   protected registerCommands(): void {
 *     this.registerCommand('aimastery.calculateVincianScore', () => {
 *       // Command handler
 *     });
 *   }
 *
 *   protected registerProviders(): void {
 *     // Register VS Code providers
 *   }
 * }
 * ```
 */
export abstract class BaseFeature implements IFeature {
  protected context!: vscode.ExtensionContext;
  protected disposables: vscode.Disposable[] = [];

  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly description: string;
  abstract readonly version: string;

  constructor(protected container: ServiceContainer) {}

  /**
   * Activate the feature
   * Template method that orchestrates activation steps
   */
  async activate(context: vscode.ExtensionContext): Promise<void> {
    this.context = context;

    if (!this.isEnabled()) {
      console.log(`[${this.id}] Feature is disabled, skipping activation`);
      return;
    }

    console.log(`[${this.id}] Activating feature: ${this.name} v${this.version}`);

    try {
      // Feature-specific initialization
      await this.onActivate();

      // Register commands and providers
      this.registerCommands();
      this.registerProviders();

      console.log(`[${this.id}] Feature activated successfully`);
    } catch (error) {
      console.error(`[${this.id}] Failed to activate feature:`, error);
      throw error;
    }
  }

  /**
   * Deactivate the feature
   * Cleans up all disposables
   */
  async deactivate(): Promise<void> {
    console.log(`[${this.id}] Deactivating feature: ${this.name}`);

    try {
      // Feature-specific cleanup
      await this.onDeactivate();

      // Dispose all registered disposables
      this.disposables.forEach(d => {
        try {
          d.dispose();
        } catch (error) {
          console.error(`[${this.id}] Error disposing resource:`, error);
        }
      });

      this.disposables = [];

      console.log(`[${this.id}] Feature deactivated successfully`);
    } catch (error) {
      console.error(`[${this.id}] Error during deactivation:`, error);
      throw error;
    }
  }

  /**
   * Check if feature is enabled in configuration
   * Override this to implement custom enable/disable logic
   */
  isEnabled(): boolean {
    const config = vscode.workspace.getConfiguration('aimastery');
    return config.get<boolean>(`${this.id}.enabled`, true);
  }

  /**
   * Get feature-specific configuration value
   * @param key - Configuration key (relative to aimastery.<feature-id>)
   * @param defaultValue - Default value if config not set
   */
  protected getConfig<T>(key: string, defaultValue: T): T {
    const config = vscode.workspace.getConfiguration('aimastery');
    return config.get<T>(`${this.id}.${key}`, defaultValue);
  }

  /**
   * Set feature-specific configuration value
   * @param key - Configuration key (relative to aimastery.<feature-id>)
   * @param value - Value to set
   * @param target - Configuration target (Global, Workspace, etc.)
   */
  protected async setConfig<T>(
    key: string,
    value: T,
    target: vscode.ConfigurationTarget = vscode.ConfigurationTarget.Global
  ): Promise<void> {
    const config = vscode.workspace.getConfiguration('aimastery');
    await config.update(`${this.id}.${key}`, value, target);
  }

  /**
   * Feature-specific activation logic
   * Override this to initialize your feature
   */
  protected abstract onActivate(): Promise<void>;

  /**
   * Feature-specific deactivation logic
   * Override this to clean up your feature
   */
  protected abstract onDeactivate(): Promise<void>;

  /**
   * Register VS Code commands
   * Override this to register your feature's commands
   */
  protected abstract registerCommands(): void;

  /**
   * Register VS Code providers (completion, hover, etc.)
   * Override this to register your feature's providers
   */
  protected abstract registerProviders(): void;

  /**
   * Helper to register a command and track its disposable
   * @param command - Command identifier (e.g., 'aimastery.analyzeCode')
   * @param handler - Command handler function
   */
  protected registerCommand(command: string, handler: (...args: any[]) => any): void {
    const disposable = vscode.commands.registerCommand(command, handler);
    this.disposables.push(disposable);
    this.context.subscriptions.push(disposable);
  }

  /**
   * Helper to register a text document content provider
   * @param scheme - URI scheme
   * @param provider - Content provider
   */
  protected registerTextDocumentContentProvider(
    scheme: string,
    provider: vscode.TextDocumentContentProvider
  ): void {
    const disposable = vscode.workspace.registerTextDocumentContentProvider(scheme, provider);
    this.disposables.push(disposable);
    this.context.subscriptions.push(disposable);
  }

  /**
   * Helper to register a tree data provider
   * @param viewId - View identifier
   * @param provider - Tree data provider
   */
  protected registerTreeDataProvider<T>(
    viewId: string,
    provider: vscode.TreeDataProvider<T>
  ): vscode.TreeView<T> {
    const treeView = vscode.window.createTreeView(viewId, { treeDataProvider: provider });
    this.disposables.push(treeView);
    this.context.subscriptions.push(treeView);
    return treeView;
  }

  /**
   * Helper to register a webview panel
   * @param viewType - Webview type identifier
   * @param title - Panel title
   * @param viewColumn - View column
   * @param options - Webview options
   */
  protected createWebviewPanel(
    viewType: string,
    title: string,
    viewColumn: vscode.ViewColumn,
    options?: vscode.WebviewOptions & vscode.WebviewPanelOptions
  ): vscode.WebviewPanel {
    const panel = vscode.window.createWebviewPanel(viewType, title, viewColumn, options);
    this.disposables.push(panel);
    return panel;
  }

  /**
   * Helper to show information message
   */
  protected showInfo(message: string): void {
    vscode.window.showInformationMessage(`[${this.name}] ${message}`);
  }

  /**
   * Helper to show warning message
   */
  protected showWarning(message: string): void {
    vscode.window.showWarningMessage(`[${this.name}] ${message}`);
  }

  /**
   * Helper to show error message
   */
  protected showError(message: string): void {
    vscode.window.showErrorMessage(`[${this.name}] ${message}`);
  }

  /**
   * Helper to add a disposable to tracking
   */
  protected addDisposable(disposable: vscode.Disposable): void {
    this.disposables.push(disposable);
    this.context.subscriptions.push(disposable);
  }
}
