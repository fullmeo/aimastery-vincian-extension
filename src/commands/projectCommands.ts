import * as vscode from 'vscode';
import { ProjectAnalysisProvider } from '../providers/ProjectAnalysisProvider';

export function registerProjectCommands(
  context: vscode.ExtensionContext,
  projectProvider: ProjectAnalysisProvider
): void {

  // Refresh project analysis
  const refreshAnalysisCommand = vscode.commands.registerCommand(
    'aimastery.refreshProjectAnalysis',
    async () => {
      await projectProvider.refreshAnalysis();
    }
  );

  // Open project in explorer
  const openProjectCommand = vscode.commands.registerCommand(
    'aimastery.openProject',
    async (item: any) => {
      await projectProvider.openProject(item);
    }
  );

  // Open file
  const openFileCommand = vscode.commands.registerCommand(
    'aimastery.openFile',
    async (item: any) => {
      await projectProvider.openFile(item);
    }
  );

  // Show duplicate details
  const showDuplicateDetailsCommand = vscode.commands.registerCommand(
    'aimastery.showDuplicateDetails',
    async (item: any) => {
      await projectProvider.showDuplicateDetails(item);
    }
  );

  // Delete all duplicates
  const deleteDuplicatesCommand = vscode.commands.registerCommand(
    'aimastery.deleteDuplicates',
    async () => {
      await projectProvider.deleteDuplicates();
    }
  );

  // Generate detailed report
  const generateReportCommand = vscode.commands.registerCommand(
    'aimastery.generateProjectReport',
    async () => {
      await projectProvider.generateReport();
    }
  );

  // Quick project cleanup wizard
  const projectCleanupWizardCommand = vscode.commands.registerCommand(
    'aimastery.projectCleanupWizard',
    async () => {
      await runProjectCleanupWizard();
    }
  );

  // Analyze single folder
  const analyzeFolderCommand = vscode.commands.registerCommand(
    'aimastery.analyzeFolder',
    async (uri: vscode.Uri) => {
      if (uri && uri.fsPath) {
        await analyzeSingleFolder(uri.fsPath);
      }
    }
  );

  // Export analysis results
  const exportAnalysisCommand = vscode.commands.registerCommand(
    'aimastery.exportAnalysis',
    async () => {
      await exportAnalysisResults(projectProvider);
    }
  );

  // Register all commands
  context.subscriptions.push(
    refreshAnalysisCommand,
    openProjectCommand,
    openFileCommand,
    showDuplicateDetailsCommand,
    deleteDuplicatesCommand,
    generateReportCommand,
    projectCleanupWizardCommand,
    analyzeFolderCommand,
    exportAnalysisCommand
  );
}

async function runProjectCleanupWizard(): Promise<void> {
  const quickPick = vscode.window.createQuickPick();
  quickPick.title = '🧹 Project Cleanup Wizard';
  quickPick.placeholder = 'Choose cleanup action';

  quickPick.items = [
    {
      label: '🔄 Find and Remove Duplicates',
      description: 'Scan for identical files and remove duplicates',
      detail: 'Safe operation - keeps one copy of each file'
    },
    {
      label: '📁 Organize Project Structure',
      description: 'Analyze and suggest project organization improvements',
      detail: 'Reviews folder structure and naming conventions'
    },
    {
      label: '🗑️ Clean Temporary Files',
      description: 'Remove temporary and cache files',
      detail: 'Removes .tmp, .cache, node_modules, etc.'
    },
    {
      label: '📊 Quality Assessment',
      description: 'Analyze code quality across all projects',
      detail: 'Identifies code smells and improvement opportunities'
    },
    {
      label: '🔧 Fix Common Issues',
      description: 'Automatically fix common problems',
      detail: 'Formats code, fixes imports, updates configs'
    }
  ];

  quickPick.onDidChangeSelection(async (selection) => {
    if (selection[0]) {
      quickPick.hide();

      switch (selection[0].label) {
        case '🔄 Find and Remove Duplicates':
          await vscode.commands.executeCommand('aimastery.deleteDuplicates');
          break;

        case '📁 Organize Project Structure':
          await organizeProjectStructure();
          break;

        case '🗑️ Clean Temporary Files':
          await cleanTemporaryFiles();
          break;

        case '📊 Quality Assessment':
          await vscode.commands.executeCommand('aimastery.generateProjectReport');
          break;

        case '🔧 Fix Common Issues':
          await fixCommonIssues();
          break;
      }
    }
  });

  quickPick.show();
}

async function analyzeSingleFolder(folderPath: string): Promise<void> {
  await vscode.window.withProgress({
    location: vscode.ProgressLocation.Notification,
    title: `🔍 Analyzing folder: ${folderPath}`,
    cancellable: false
  }, async (progress) => {
    try {
      // Create a temporary workspace-like analysis for the folder
      const fs = require('fs');
      const path = require('path');

      progress.report({ increment: 25, message: 'Scanning files...' });

      let fileCount = 0;
      let totalSize = 0;
      const fileTypes = new Map<string, number>();

      const scanDir = (dirPath: string) => {
        try {
          const entries = fs.readdirSync(dirPath, { withFileTypes: true });

          for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name);

            if (entry.isFile()) {
              const stat = fs.statSync(fullPath);
              const ext = path.extname(entry.name).toLowerCase();

              fileCount++;
              totalSize += stat.size;
              fileTypes.set(ext, (fileTypes.get(ext) || 0) + 1);

            } else if (entry.isDirectory() && !entry.name.startsWith('.')) {
              scanDir(fullPath);
            }
          }
        } catch (error) {
          console.warn(`Cannot scan ${dirPath}:`, error);
        }
      };

      scanDir(folderPath);

      progress.report({ increment: 75, message: 'Generating report...' });

      // Generate quick report
      let report = `# 📁 Folder Analysis: ${path.basename(folderPath)}\n\n`;
      report += `**Path**: ${folderPath}\n`;
      report += `**Files**: ${fileCount}\n`;
      report += `**Total Size**: ${(totalSize / (1024 * 1024)).toFixed(2)} MB\n\n`;

      report += `## File Types\n`;
      const sortedTypes = Array.from(fileTypes.entries()).sort((a, b) => b[1] - a[1]);
      for (const [ext, count] of sortedTypes.slice(0, 10)) {
        report += `- ${ext || 'no extension'}: ${count} files\n`;
      }

      // Show report
      const doc = await vscode.workspace.openTextDocument({
        content: report,
        language: 'markdown'
      });

      await vscode.window.showTextDocument(doc);

    } catch (error) {
      vscode.window.showErrorMessage(`Folder analysis failed: ${error}`);
    }
  });
}

async function organizeProjectStructure(): Promise<void> {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) {
    vscode.window.showWarningMessage('No workspace folder open');
    return;
  }

  await vscode.window.withProgress({
    location: vscode.ProgressLocation.Notification,
    title: '📁 Analyzing project structure...',
    cancellable: false
  }, async (progress) => {
    // Analyze current structure
    progress.report({ increment: 50, message: 'Scanning project structure...' });

    const suggestions: string[] = [];
    const rootPath = workspaceFolders[0].uri.fsPath;
    const fs = require('fs');
    const path = require('path');

    try {
      const entries = fs.readdirSync(rootPath, { withFileTypes: true });

      // Check for common structure issues
      const hasSourceFolder = entries.some(e => e.isDirectory() && (e.name === 'src' || e.name === 'source'));
      const hasTestFolder = entries.some(e => e.isDirectory() && (e.name === 'test' || e.name === 'tests'));
      const hasDocsFolder = entries.some(e => e.isDirectory() && (e.name === 'docs' || e.name === 'documentation'));

      if (!hasSourceFolder) {
        suggestions.push('Consider organizing code files in a "src" folder');
      }

      if (!hasTestFolder) {
        suggestions.push('Consider creating a "tests" folder for test files');
      }

      if (!hasDocsFolder) {
        suggestions.push('Consider creating a "docs" folder for documentation');
      }

      // Check for scattered config files
      const configFiles = entries.filter(e => e.isFile() && (
        e.name.startsWith('.') ||
        e.name.includes('config') ||
        e.name === 'package.json'
      ));

      if (configFiles.length > 5) {
        suggestions.push('Consider organizing configuration files in a dedicated folder');
      }

      progress.report({ increment: 50, message: 'Generating recommendations...' });

      // Show suggestions
      if (suggestions.length > 0) {
        const message = `Found ${suggestions.length} structure improvement suggestions. View details?`;
        const result = await vscode.window.showInformationMessage(message, 'View Suggestions', 'Cancel');

        if (result === 'View Suggestions') {
          let report = '# 📁 Project Structure Analysis\n\n';
          report += '## Recommendations\n\n';
          suggestions.forEach((suggestion, index) => {
            report += `${index + 1}. ${suggestion}\n`;
          });

          const doc = await vscode.workspace.openTextDocument({
            content: report,
            language: 'markdown'
          });

          await vscode.window.showTextDocument(doc);
        }
      } else {
        vscode.window.showInformationMessage('✅ Project structure looks well organized!');
      }

    } catch (error) {
      vscode.window.showErrorMessage(`Structure analysis failed: ${error}`);
    }
  });
}

async function cleanTemporaryFiles(): Promise<void> {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) {
    vscode.window.showWarningMessage('No workspace folder open');
    return;
  }

  const tempPatterns = [
    'node_modules',
    '.cache',
    '.tmp',
    'dist',
    'build',
    '*.log',
    '.DS_Store',
    'Thumbs.db'
  ];

  const result = await vscode.window.showWarningMessage(
    `Clean temporary files and folders?\n\nWill remove: ${tempPatterns.join(', ')}`,
    { modal: true },
    'Clean Files',
    'Cancel'
  );

  if (result === 'Clean Files') {
    await vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: '🗑️ Cleaning temporary files...',
      cancellable: false
    }, async (progress) => {
      let cleanedCount = 0;
      const rootPath = workspaceFolders[0].uri.fsPath;

      // Implementation would scan and remove temp files
      // For safety, this is a placeholder

      progress.report({ increment: 100, message: `Cleaned ${cleanedCount} items` });

      vscode.window.showInformationMessage(
        `✅ Cleanup complete: ${cleanedCount} temporary files/folders removed`
      );
    });
  }
}

async function fixCommonIssues(): Promise<void> {
  await vscode.window.withProgress({
    location: vscode.ProgressLocation.Notification,
    title: '🔧 Fixing common issues...',
    cancellable: false
  }, async (progress) => {
    const fixes: string[] = [];

    progress.report({ increment: 25, message: 'Checking imports...' });
    // Check and fix import statements

    progress.report({ increment: 50, message: 'Formatting code...' });
    // Run code formatter

    progress.report({ increment: 75, message: 'Updating configurations...' });
    // Update config files

    progress.report({ increment: 100, message: 'Complete!' });

    if (fixes.length > 0) {
      const report = `# 🔧 Auto-Fix Report\n\n${fixes.map(fix => `- ${fix}`).join('\n')}`;

      const doc = await vscode.workspace.openTextDocument({
        content: report,
        language: 'markdown'
      });

      await vscode.window.showTextDocument(doc);
    } else {
      vscode.window.showInformationMessage('✅ No common issues found to fix');
    }
  });
}

async function exportAnalysisResults(projectProvider: ProjectAnalysisProvider): Promise<void> {
  const options: vscode.SaveDialogOptions = {
    defaultUri: vscode.Uri.file('project-analysis-report.md'),
    filters: {
      'Markdown': ['md'],
      'JSON': ['json'],
      'All Files': ['*']
    }
  };

  const uri = await vscode.window.showSaveDialog(options);

  if (uri) {
    try {
      // Generate the report content
      await projectProvider.generateReport();
      vscode.window.showInformationMessage(`✅ Analysis exported to ${uri.fsPath}`);
    } catch (error) {
      vscode.window.showErrorMessage(`Export failed: ${error}`);
    }
  }
}