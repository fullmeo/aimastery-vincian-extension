import * as vscode from 'vscode';
import { ProjectConsolidator, ProjectAnalysis, ConsolidationReport } from '../services/ProjectConsolidator';

export class ProjectAnalysisProvider implements vscode.TreeDataProvider<ProjectAnalysisItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<ProjectAnalysisItem | undefined | null | void> = new vscode.EventEmitter<ProjectAnalysisItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<ProjectAnalysisItem | undefined | null | void> = this._onDidChangeTreeData.event;

  private consolidationReport: ConsolidationReport | null = null;
  private consolidator: ProjectConsolidator;

  constructor() {
    this.consolidator = new ProjectConsolidator();
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  async refreshAnalysis(): Promise<void> {
    try {
      await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "🔍 Analyzing workspace projects...",
        cancellable: false
      }, async (progress) => {
        progress.report({ increment: 10, message: "Scanning directories..." });

        this.consolidationReport = await this.consolidator.analyzeWorkspace();

        progress.report({ increment: 90, message: "Analysis complete!" });
        this.refresh();

        // Show summary notification
        const totalProjects = this.consolidationReport.summary.totalProjects;
        const duplicates = this.consolidationReport.duplicates.length;

        vscode.window.showInformationMessage(
          `✅ Analysis complete: ${totalProjects} projects found, ${duplicates} duplicate groups detected`
        );
      });
    } catch (error) {
      vscode.window.showErrorMessage(`Analysis failed: ${error}`);
      console.error('Project analysis failed:', error);
    }
  }

  getTreeItem(element: ProjectAnalysisItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: ProjectAnalysisItem): Thenable<ProjectAnalysisItem[]> {
    if (!element) {
      // Root level - show categories
      return Promise.resolve(this.getRootCategories());
    }

    if (element.contextValue === 'category') {
      // Show projects in category
      return Promise.resolve(this.getProjectsInCategory(element.category!));
    }

    if (element.contextValue === 'project') {
      // Show project details
      return Promise.resolve(this.getProjectDetails(element.project!));
    }

    return Promise.resolve([]);
  }

  private getRootCategories(): ProjectAnalysisItem[] {
    if (!this.consolidationReport) {
      return [new ProjectAnalysisItem(
        'No analysis available',
        'Click refresh to analyze workspace',
        vscode.TreeItemCollapsibleState.None,
        'info'
      )];
    }

    const categories: ProjectAnalysisItem[] = [];
    const discovered = this.consolidationReport.discovered;

    if (discovered.webProjects.length > 0) {
      categories.push(new ProjectAnalysisItem(
        `🌐 Web Projects (${discovered.webProjects.length})`,
        'HTML, JavaScript, TypeScript projects',
        vscode.TreeItemCollapsibleState.Collapsed,
        'category',
        'webProjects'
      ));
    }

    if (discovered.pythonProjects.length > 0) {
      categories.push(new ProjectAnalysisItem(
        `🐍 Python Projects (${discovered.pythonProjects.length})`,
        'Python scripts and applications',
        vscode.TreeItemCollapsibleState.Collapsed,
        'category',
        'pythonProjects'
      ));
    }

    if (discovered.extensionProjects.length > 0) {
      categories.push(new ProjectAnalysisItem(
        `🧩 VS Code Extensions (${discovered.extensionProjects.length})`,
        'VS Code extension projects',
        vscode.TreeItemCollapsibleState.Collapsed,
        'category',
        'extensionProjects'
      ));
    }

    if (discovered.dataProjects.length > 0) {
      categories.push(new ProjectAnalysisItem(
        `📊 Data Projects (${discovered.dataProjects.length})`,
        'CSV, JSON, database files',
        vscode.TreeItemCollapsibleState.Collapsed,
        'category',
        'dataProjects'
      ));
    }

    if (discovered.documentationProjects.length > 0) {
      categories.push(new ProjectAnalysisItem(
        `📚 Documentation (${discovered.documentationProjects.length})`,
        'Markdown and documentation files',
        vscode.TreeItemCollapsibleState.Collapsed,
        'category',
        'documentationProjects'
      ));
    }

    if (this.consolidationReport.duplicates.length > 0) {
      categories.push(new ProjectAnalysisItem(
        `🔄 Duplicates (${this.consolidationReport.duplicates.length})`,
        `${(this.consolidationReport.summary.duplicateWaste / (1024 * 1024)).toFixed(1)}MB wasted`,
        vscode.TreeItemCollapsibleState.Collapsed,
        'category',
        'duplicates'
      ));
    }

    // Summary item
    categories.unshift(new ProjectAnalysisItem(
      `📈 Summary`,
      `${this.consolidationReport.summary.totalProjects} projects, ${this.consolidationReport.summary.totalFiles} files, Quality: ${this.consolidationReport.summary.qualityScore.toFixed(0)}/100`,
      vscode.TreeItemCollapsibleState.None,
      'summary'
    ));

    return categories;
  }

  private getProjectsInCategory(category: string): ProjectAnalysisItem[] {
    if (!this.consolidationReport) return [];

    if (category === 'duplicates') {
      return this.consolidationReport.duplicates.slice(0, 20).map(dup =>
        new ProjectAnalysisItem(
          `${dup.instances[0].file}`,
          `${dup.instances.length} copies, ${(dup.size / 1024).toFixed(1)}KB each`,
          vscode.TreeItemCollapsibleState.None,
          'duplicate',
          undefined,
          undefined,
          dup
        )
      );
    }

    const projects = (this.consolidationReport.discovered as any)[category] as ProjectAnalysis[];

    return projects.map(project => {
      const maturityIcon = this.getMaturityIcon(project.maturity.level);
      const qualityColor = this.getQualityColor(project.codeQuality.score);

      return new ProjectAnalysisItem(
        `${maturityIcon} ${project.name}`,
        `${project.type} • ${project.size.mb}MB • Quality: ${project.codeQuality.score.toFixed(0)}/100`,
        vscode.TreeItemCollapsibleState.Collapsed,
        'project',
        undefined,
        project
      );
    });
  }

  private getProjectDetails(project: ProjectAnalysis): ProjectAnalysisItem[] {
    const details: ProjectAnalysisItem[] = [];

    // Maturity indicators
    details.push(new ProjectAnalysisItem(
      `🎯 Maturity: ${project.maturity.level}`,
      `Score: ${project.maturity.score}/5`,
      vscode.TreeItemCollapsibleState.None,
      'detail'
    ));

    // Size info
    details.push(new ProjectAnalysisItem(
      `📏 Size: ${project.size.mb}MB`,
      `${project.size.fileCount} files`,
      vscode.TreeItemCollapsibleState.None,
      'detail'
    ));

    // Last activity
    const daysSinceActivity = Math.floor((Date.now() - project.lastActivity.getTime()) / (1000 * 60 * 60 * 24));
    details.push(new ProjectAnalysisItem(
      `🕒 Last Activity: ${daysSinceActivity} days ago`,
      project.lastActivity.toLocaleDateString(),
      vscode.TreeItemCollapsibleState.None,
      'detail'
    ));

    // Quality issues
    if (project.codeQuality.issues.length > 0) {
      details.push(new ProjectAnalysisItem(
        `⚠️ Issues (${project.codeQuality.issues.length})`,
        project.codeQuality.issues.slice(0, 3).join(', '),
        vscode.TreeItemCollapsibleState.None,
        'warning'
      ));
    }

    // Files (show first few)
    const fileItems = project.files.slice(0, 5).map(file =>
      new ProjectAnalysisItem(
        `📄 ${file.name}`,
        `${(file.size / 1024).toFixed(1)}KB`,
        vscode.TreeItemCollapsibleState.None,
        'file',
        undefined,
        undefined,
        undefined,
        file
      )
    );

    details.push(...fileItems);

    if (project.files.length > 5) {
      details.push(new ProjectAnalysisItem(
        `... and ${project.files.length - 5} more files`,
        'Click project to open in explorer',
        vscode.TreeItemCollapsibleState.None,
        'info'
      ));
    }

    return details;
  }

  private getMaturityIcon(level: string): string {
    switch (level) {
      case 'production': return '🏭';
      case 'development': return '🔧';
      case 'prototype': return '🧪';
      case 'abandoned': return '💀';
      default: return '❓';
    }
  }

  private getQualityColor(score: number): vscode.ThemeColor {
    if (score >= 80) return new vscode.ThemeColor('terminal.ansiGreen');
    if (score >= 60) return new vscode.ThemeColor('terminal.ansiYellow');
    return new vscode.ThemeColor('terminal.ansiRed');
  }

  // Command handlers
  public async openProject(item: ProjectAnalysisItem): Promise<void> {
    if (item.project) {
      const uri = vscode.Uri.file(item.project.path);
      await vscode.commands.executeCommand('vscode.openFolder', uri, { forceNewWindow: false });
    }
  }

  public async openFile(item: ProjectAnalysisItem): Promise<void> {
    if (item.file) {
      const uri = vscode.Uri.file(item.file.path);
      const document = await vscode.workspace.openTextDocument(uri);
      await vscode.window.showTextDocument(document);
    }
  }

  public async showDuplicateDetails(item: ProjectAnalysisItem): Promise<void> {
    if (item.duplicate) {
      const instances = item.duplicate.instances;
      const quickPick = vscode.window.createQuickPick();

      quickPick.title = `Duplicate: ${item.duplicate.instances[0].file}`;
      quickPick.items = instances.map(instance => ({
        label: `📁 ${instance.project}`,
        description: instance.path,
        detail: `${(item.duplicate!.size / 1024).toFixed(1)}KB`
      }));

      quickPick.onDidChangeSelection(async (selection) => {
        if (selection[0]) {
          const uri = vscode.Uri.file(selection[0].description!);
          const document = await vscode.workspace.openTextDocument(uri);
          await vscode.window.showTextDocument(document);
          quickPick.hide();
        }
      });

      quickPick.show();
    }
  }

  public async deleteDuplicates(): Promise<void> {
    if (!this.consolidationReport) return;

    const duplicates = this.consolidationReport.duplicates;
    const totalSavings = duplicates.reduce((sum, dup) => sum + dup.size * dup.canDelete, 0);

    const result = await vscode.window.showWarningMessage(
      `Delete ${duplicates.length} duplicate file groups to save ${(totalSavings / (1024 * 1024)).toFixed(1)}MB?`,
      { modal: true },
      'Delete Duplicates',
      'Cancel'
    );

    if (result === 'Delete Duplicates') {
      await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "🗑️ Deleting duplicate files...",
        cancellable: false
      }, async (progress) => {
        let deleted = 0;

        for (const duplicate of duplicates) {
          // Keep the first instance, delete the rest
          for (let i = 1; i < duplicate.instances.length; i++) {
            try {
              await vscode.workspace.fs.delete(vscode.Uri.file(duplicate.instances[i].path));
              deleted++;
            } catch (error) {
              console.warn(`Failed to delete ${duplicate.instances[i].path}:`, error);
            }
          }

          progress.report({
            increment: (100 / duplicates.length),
            message: `Deleted ${deleted} files...`
          });
        }

        vscode.window.showInformationMessage(
          `✅ Deleted ${deleted} duplicate files, saved ${(totalSavings / (1024 * 1024)).toFixed(1)}MB`
        );

        // Refresh analysis
        await this.refreshAnalysis();
      });
    }
  }

  public async generateReport(): Promise<void> {
    if (!this.consolidationReport) {
      vscode.window.showWarningMessage('No analysis data available. Run analysis first.');
      return;
    }

    const report = await this.consolidator.generateDetailedReport(this.consolidationReport);

    // Create a new document with the report
    const doc = await vscode.workspace.openTextDocument({
      content: report,
      language: 'markdown'
    });

    await vscode.window.showTextDocument(doc);
  }
}

class ProjectAnalysisItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly tooltip: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly contextValue: string,
    public readonly category?: string,
    public readonly project?: ProjectAnalysis,
    public readonly duplicate?: any,
    public readonly file?: any
  ) {
    super(label, collapsibleState);
    this.tooltip = tooltip;
    this.contextValue = contextValue;

    // Set icons based on context
    if (contextValue === 'project') {
      this.iconPath = new vscode.ThemeIcon('folder');
    } else if (contextValue === 'file') {
      this.iconPath = new vscode.ThemeIcon('file');
    } else if (contextValue === 'duplicate') {
      this.iconPath = new vscode.ThemeIcon('files');
    } else if (contextValue === 'warning') {
      this.iconPath = new vscode.ThemeIcon('warning');
    }

    // Make files and duplicates clickable
    if (contextValue === 'file' || contextValue === 'duplicate' || contextValue === 'project') {
      this.command = {
        command: contextValue === 'file' ? 'aimastery.openFile' :
                 contextValue === 'duplicate' ? 'aimastery.showDuplicateDetails' :
                 'aimastery.openProject',
        title: 'Open',
        arguments: [this]
      };
    }
  }
}