/**
 * EXTENSION INTEGRATION - Project Consolidator
 * Intégration complète du Universal Project Consolidator dans VS Code
 */

import * as vscode from 'vscode';
import { ProjectAnalysisProvider } from './providers/ProjectAnalysisProvider';
import { registerProjectCommands } from './commands/projectCommands';

export function activateProjectConsolidator(context: vscode.ExtensionContext): void {
  console.log('🚀 Activating Project Consolidator integration...');

  // Initialize Project Analysis Provider
  const projectAnalysisProvider = new ProjectAnalysisProvider();

  // Register tree view
  const projectAnalysisView = vscode.window.createTreeView('aimastery-project-analysis', {
    treeDataProvider: projectAnalysisProvider,
    showCollapseAll: true
  });

  // Register commands
  registerProjectCommands(context, projectAnalysisProvider);

  // Add context menu commands
  const disposables = [
    projectAnalysisView,

    // Command palette commands
    vscode.commands.registerCommand('aimastery.refreshProjectAnalysis', async () => {
      await projectAnalysisProvider.refreshAnalysis();
    }),

    vscode.commands.registerCommand('aimastery.openProject', async (item) => {
      await projectAnalysisProvider.openProject(item);
    }),

    vscode.commands.registerCommand('aimastery.openFile', async (item) => {
      await projectAnalysisProvider.openFile(item);
    }),

    vscode.commands.registerCommand('aimastery.showDuplicateDetails', async (item) => {
      await projectAnalysisProvider.showDuplicateDetails(item);
    }),

    vscode.commands.registerCommand('aimastery.deleteDuplicates', async () => {
      await projectAnalysisProvider.deleteDuplicates();
    }),

    vscode.commands.registerCommand('aimastery.generateProjectReport', async () => {
      await projectAnalysisProvider.generateReport();
    }),

    vscode.commands.registerCommand('aimastery.exportAnalysis', async () => {
      await exportAnalysisToFile(projectAnalysisProvider);
    }),

    // Auto-analyze on workspace change
    vscode.workspace.onDidChangeWorkspaceFolders(async () => {
      await projectAnalysisProvider.refreshAnalysis();
    }),

    // Status bar item
    createProjectAnalysisStatusBar(projectAnalysisProvider)
  ];

  context.subscriptions.push(...disposables);

  // Show welcome message
  vscode.window.showInformationMessage(
    '🔍 Project Consolidator activated! Check the AI Mastery panel for project analysis.',
    'Analyze Now'
  ).then(selection => {
    if (selection === 'Analyze Now') {
      vscode.commands.executeCommand('aimastery.refreshProjectAnalysis');
    }
  });

  console.log('✅ Project Consolidator integration complete');
}

function createProjectAnalysisStatusBar(provider: ProjectAnalysisProvider): vscode.StatusBarItem {
  const statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );

  statusBarItem.text = '$(folder-library) Project Analysis';
  statusBarItem.tooltip = 'Click to analyze workspace projects';
  statusBarItem.command = 'aimastery.refreshProjectAnalysis';
  statusBarItem.show();

  return statusBarItem;
}

async function exportAnalysisToFile(provider: ProjectAnalysisProvider): Promise<void> {
  const options: vscode.SaveDialogOptions = {
    defaultUri: vscode.Uri.file(`project-analysis-${new Date().toISOString().split('T')[0]}.md`),
    filters: {
      'Markdown Files': ['md'],
      'JSON Files': ['json'],
      'Text Files': ['txt']
    }
  };

  const uri = await vscode.window.showSaveDialog(options);
  if (!uri) return;

  try {
    // Generate comprehensive report
    await provider.generateReport();

    vscode.window.showInformationMessage(
      `✅ Project analysis exported to ${uri.fsPath}`,
      'Open File'
    ).then(selection => {
      if (selection === 'Open File') {
        vscode.window.showTextDocument(uri);
      }
    });

  } catch (error) {
    vscode.window.showErrorMessage(`Export failed: ${error}`);
  }
}

// Extension configuration
export interface ProjectConsolidatorConfig {
  autoAnalyzeOnOpen: boolean;
  showDuplicateWarnings: boolean;
  maxFileSizeMB: number;
  excludePatterns: string[];
  enableAutoCleanup: boolean;
}

export function getProjectConsolidatorConfig(): ProjectConsolidatorConfig {
  const config = vscode.workspace.getConfiguration('aimastery.projectConsolidator');

  return {
    autoAnalyzeOnOpen: config.get('autoAnalyzeOnOpen', true),
    showDuplicateWarnings: config.get('showDuplicateWarnings', true),
    maxFileSizeMB: config.get('maxFileSizeMB', 10),
    excludePatterns: config.get('excludePatterns', ['node_modules', '.git', 'dist']),
    enableAutoCleanup: config.get('enableAutoCleanup', false)
  };
}

// Workspace analysis scheduler
export class WorkspaceAnalysisScheduler {
  private analysisTimer?: NodeJS.Timeout;
  private provider: ProjectAnalysisProvider;

  constructor(provider: ProjectAnalysisProvider) {
    this.provider = provider;
  }

  public scheduleAnalysis(delayMs: number = 5000): void {
    if (this.analysisTimer) {
      clearTimeout(this.analysisTimer);
    }

    this.analysisTimer = setTimeout(async () => {
      try {
        await this.provider.refreshAnalysis();
      } catch (error) {
        console.warn('Scheduled analysis failed:', error);
      }
    }, delayMs);
  }

  public cancelScheduledAnalysis(): void {
    if (this.analysisTimer) {
      clearTimeout(this.analysisTimer);
      this.analysisTimer = undefined;
    }
  }

  public dispose(): void {
    this.cancelScheduledAnalysis();
  }
}

// Performance monitor
export class ProjectAnalysisPerformanceMonitor {
  private analysisStartTime: number = 0;
  private metrics: Array<{
    timestamp: number;
    duration: number;
    projectCount: number;
    fileCount: number;
  }> = [];

  public startAnalysis(): void {
    this.analysisStartTime = Date.now();
  }

  public endAnalysis(projectCount: number, fileCount: number): void {
    const duration = Date.now() - this.analysisStartTime;

    this.metrics.push({
      timestamp: Date.now(),
      duration,
      projectCount,
      fileCount
    });

    // Keep only last 10 measurements
    if (this.metrics.length > 10) {
      this.metrics = this.metrics.slice(-10);
    }

    console.log(`📊 Analysis completed in ${duration}ms (${projectCount} projects, ${fileCount} files)`);
  }

  public getAveragePerformance(): { avgDuration: number; avgThroughput: number } {
    if (this.metrics.length === 0) {
      return { avgDuration: 0, avgThroughput: 0 };
    }

    const avgDuration = this.metrics.reduce((sum, m) => sum + m.duration, 0) / this.metrics.length;
    const avgThroughput = this.metrics.reduce((sum, m) => sum + m.fileCount, 0) / this.metrics.length;

    return { avgDuration, avgThroughput };
  }
}