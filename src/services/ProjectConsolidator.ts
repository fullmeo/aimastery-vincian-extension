import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

export interface ProjectAnalysis {
  name: string;
  path: string;
  type: 'web' | 'python' | 'data' | 'documentation' | 'config' | 'extension';
  files: FileInfo[];
  maturity: MaturityAssessment;
  lastActivity: Date;
  codeQuality: QualityAssessment;
  size: SizeInfo;
}

export interface FileInfo {
  name: string;
  path: string;
  size: number;
  extension: string;
  relativePath: string;
}

export interface MaturityAssessment {
  level: 'production' | 'development' | 'prototype' | 'abandoned';
  score: number;
  indicators: {
    hasTests: boolean;
    hasDocumentation: boolean;
    hasConfiguration: boolean;
    hasGitHistory: boolean;
    hasTypeScript: boolean;
  };
}

export interface QualityAssessment {
  score: number;
  issues: string[];
  metrics: {
    todoCount: number;
    commentRatio: number;
    avgFileSize: number;
    duplicateFiles: number;
  };
}

export interface SizeInfo {
  bytes: number;
  mb: string;
  fileCount: number;
  largestFile: string;
}

export interface DuplicateGroup {
  hash: string;
  instances: Array<{
    project: string;
    file: string;
    path: string;
  }>;
  size: number;
  canDelete: number;
}

export interface ConsolidationReport {
  discovered: {
    webProjects: ProjectAnalysis[];
    pythonProjects: ProjectAnalysis[];
    dataProjects: ProjectAnalysis[];
    documentationProjects: ProjectAnalysis[];
    configProjects: ProjectAnalysis[];
    extensionProjects: ProjectAnalysis[];
  };
  duplicates: DuplicateGroup[];
  recommendations: Recommendation[];
  summary: {
    totalProjects: number;
    totalFiles: number;
    totalSize: number;
    duplicateWaste: number;
    qualityScore: number;
  };
}

export interface Recommendation {
  type: 'cleanup' | 'refactor' | 'optimize' | 'security' | 'structure';
  priority: 'low' | 'medium' | 'high' | 'critical';
  action: string;
  impact: string;
  effort: 'low' | 'medium' | 'high';
  details: any;
}

export class ProjectConsolidator {
  private config: {
    maxFileSize: number;
    excludePatterns: string[];
    supportedExtensions: string[];
  };

  constructor() {
    this.config = {
      maxFileSize: 10 * 1024 * 1024, // 10MB
      excludePatterns: ['node_modules', '.git', 'dist', 'build', '.vscode'],
      supportedExtensions: ['.ts', '.js', '.html', '.css', '.py', '.md', '.json', '.tsx', '.jsx']
    };
  }

  public async analyzeWorkspace(): Promise<ConsolidationReport> {
    const workspaceFolders = vscode.workspace.workspaceFolders;

    if (!workspaceFolders || workspaceFolders.length === 0) {
      throw new Error('No workspace folder open');
    }

    const rootPath = workspaceFolders[0].uri.fsPath;
    console.log(`🔍 Analyzing workspace: ${rootPath}`);

    try {
      const discovered = await this.discoverProjects(rootPath);
      const duplicates = await this.findDuplicates(discovered);
      const recommendations = this.generateRecommendations(discovered, duplicates);
      const summary = this.calculateSummary(discovered, duplicates);

      return {
        discovered,
        duplicates,
        recommendations,
        summary
      };
    } catch (error) {
      console.error('Workspace analysis failed:', error);
      throw error;
    }
  }

  private async discoverProjects(rootPath: string): Promise<ConsolidationReport['discovered']> {
    const projects = {
      webProjects: await this.findWebProjects(rootPath),
      pythonProjects: await this.findPythonProjects(rootPath),
      dataProjects: await this.findDataProjects(rootPath),
      documentationProjects: await this.findDocumentationProjects(rootPath),
      configProjects: await this.findConfigProjects(rootPath),
      extensionProjects: await this.findExtensionProjects(rootPath)
    };

    // Enhance projects with analysis
    for (const projectType of Object.values(projects)) {
      for (const project of projectType) {
        project.maturity = await this.assessProjectMaturity(project);
        project.lastActivity = this.getLastActivity(project);
        project.codeQuality = await this.assessCodeQuality(project);
        project.size = this.calculateProjectSize(project);
      }
    }

    return projects;
  }

  private async findWebProjects(rootPath: string): Promise<ProjectAnalysis[]> {
    const webProjects: ProjectAnalysis[] = [];

    await this.scanDirectory(rootPath, (dirPath: string, files: FileInfo[]) => {
      const hasHTML = files.some(f => f.extension === '.html');
      const hasJS = files.some(f => f.extension === '.js' || f.extension === '.ts');
      const hasPackageJson = files.some(f => f.name === 'package.json');
      const hasWebpack = files.some(f => f.name === 'webpack.config.js');

      if (hasHTML || (hasJS && hasPackageJson) || hasWebpack) {
        webProjects.push({
          name: path.basename(dirPath),
          path: dirPath,
          type: 'web',
          files,
          maturity: { level: 'prototype', score: 0, indicators: { hasTests: false, hasDocumentation: false, hasConfiguration: false, hasGitHistory: false, hasTypeScript: false } },
          lastActivity: new Date(),
          codeQuality: { score: 0, issues: [], metrics: { todoCount: 0, commentRatio: 0, avgFileSize: 0, duplicateFiles: 0 } },
          size: { bytes: 0, mb: '0', fileCount: 0, largestFile: '' }
        });
      }
    });

    return webProjects;
  }

  private async findPythonProjects(rootPath: string): Promise<ProjectAnalysis[]> {
    const pythonProjects: ProjectAnalysis[] = [];

    await this.scanDirectory(rootPath, (dirPath: string, files: FileInfo[]) => {
      const hasPython = files.some(f => f.extension === '.py');
      const hasRequirements = files.some(f => f.name === 'requirements.txt' || f.name === 'setup.py');

      if (hasPython) {
        pythonProjects.push({
          name: path.basename(dirPath),
          path: dirPath,
          type: 'python',
          files: files.filter(f => f.extension === '.py' || f.name.includes('requirements') || f.name === 'setup.py'),
          maturity: { level: 'prototype', score: 0, indicators: { hasTests: false, hasDocumentation: false, hasConfiguration: false, hasGitHistory: false, hasTypeScript: false } },
          lastActivity: new Date(),
          codeQuality: { score: 0, issues: [], metrics: { todoCount: 0, commentRatio: 0, avgFileSize: 0, duplicateFiles: 0 } },
          size: { bytes: 0, mb: '0', fileCount: 0, largestFile: '' }
        });
      }
    });

    return pythonProjects;
  }

  private async findDataProjects(rootPath: string): Promise<ProjectAnalysis[]> {
    const dataProjects: ProjectAnalysis[] = [];
    const dataExtensions = ['.csv', '.json', '.xlsx', '.sql', '.db'];

    await this.scanDirectory(rootPath, (dirPath: string, files: FileInfo[]) => {
      const dataFiles = files.filter(f => dataExtensions.includes(f.extension));

      if (dataFiles.length > 2) { // At least 3 data files to be considered a data project
        dataProjects.push({
          name: path.basename(dirPath),
          path: dirPath,
          type: 'data',
          files: dataFiles,
          maturity: { level: 'prototype', score: 0, indicators: { hasTests: false, hasDocumentation: false, hasConfiguration: false, hasGitHistory: false, hasTypeScript: false } },
          lastActivity: new Date(),
          codeQuality: { score: 0, issues: [], metrics: { todoCount: 0, commentRatio: 0, avgFileSize: 0, duplicateFiles: 0 } },
          size: { bytes: 0, mb: '0', fileCount: 0, largestFile: '' }
        });
      }
    });

    return dataProjects;
  }

  private async findDocumentationProjects(rootPath: string): Promise<ProjectAnalysis[]> {
    const docProjects: ProjectAnalysis[] = [];

    await this.scanDirectory(rootPath, (dirPath: string, files: FileInfo[]) => {
      const docFiles = files.filter(f =>
        f.extension === '.md' ||
        f.name.toLowerCase().includes('readme') ||
        f.name.toLowerCase().includes('doc')
      );

      if (docFiles.length > 1) {
        docProjects.push({
          name: path.basename(dirPath),
          path: dirPath,
          type: 'documentation',
          files: docFiles,
          maturity: { level: 'prototype', score: 0, indicators: { hasTests: false, hasDocumentation: false, hasConfiguration: false, hasGitHistory: false, hasTypeScript: false } },
          lastActivity: new Date(),
          codeQuality: { score: 0, issues: [], metrics: { todoCount: 0, commentRatio: 0, avgFileSize: 0, duplicateFiles: 0 } },
          size: { bytes: 0, mb: '0', fileCount: 0, largestFile: '' }
        });
      }
    });

    return docProjects;
  }

  private async findConfigProjects(rootPath: string): Promise<ProjectAnalysis[]> {
    const configProjects: ProjectAnalysis[] = [];
    const configFiles = ['package.json', 'tsconfig.json', 'webpack.config.js', 'docker-compose.yml', '.gitignore'];

    await this.scanDirectory(rootPath, (dirPath: string, files: FileInfo[]) => {
      const configs = files.filter(f => configFiles.includes(f.name));

      if (configs.length > 1) {
        configProjects.push({
          name: path.basename(dirPath),
          path: dirPath,
          type: 'config',
          files: configs,
          maturity: { level: 'prototype', score: 0, indicators: { hasTests: false, hasDocumentation: false, hasConfiguration: false, hasGitHistory: false, hasTypeScript: false } },
          lastActivity: new Date(),
          codeQuality: { score: 0, issues: [], metrics: { todoCount: 0, commentRatio: 0, avgFileSize: 0, duplicateFiles: 0 } },
          size: { bytes: 0, mb: '0', fileCount: 0, largestFile: '' }
        });
      }
    });

    return configProjects;
  }

  private async findExtensionProjects(rootPath: string): Promise<ProjectAnalysis[]> {
    const extensionProjects: ProjectAnalysis[] = [];

    await this.scanDirectory(rootPath, (dirPath: string, files: FileInfo[]) => {
      const hasPackageJson = files.some(f => f.name === 'package.json');
      const hasExtensionManifest = files.some(f => f.name === 'extension.ts' || f.name === 'extension.js');
      const hasVSCodeConfig = files.some(f => f.name.includes('vscode'));

      if (hasPackageJson && (hasExtensionManifest || hasVSCodeConfig)) {
        extensionProjects.push({
          name: path.basename(dirPath),
          path: dirPath,
          type: 'extension',
          files,
          maturity: { level: 'prototype', score: 0, indicators: { hasTests: false, hasDocumentation: false, hasConfiguration: false, hasGitHistory: false, hasTypeScript: false } },
          lastActivity: new Date(),
          codeQuality: { score: 0, issues: [], metrics: { todoCount: 0, commentRatio: 0, avgFileSize: 0, duplicateFiles: 0 } },
          size: { bytes: 0, mb: '0', fileCount: 0, largestFile: '' }
        });
      }
    });

    return extensionProjects;
  }

  private async scanDirectory(rootPath: string, callback: (dirPath: string, files: FileInfo[]) => void): Promise<void> {
    const scan = async (dirPath: string) => {
      try {
        const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
        const files: FileInfo[] = [];

        for (const entry of entries) {
          const fullPath = path.join(dirPath, entry.name);

          if (entry.isFile()) {
            const ext = path.extname(entry.name).toLowerCase();

            if (this.config.supportedExtensions.includes(ext) || this.isConfigFile(entry.name)) {
              const stat = await fs.promises.stat(fullPath);

              if (stat.size <= this.config.maxFileSize) {
                files.push({
                  name: entry.name,
                  path: fullPath,
                  size: stat.size,
                  extension: ext,
                  relativePath: path.relative(rootPath, fullPath)
                });
              }
            }
          } else if (entry.isDirectory() && !this.shouldExcludeDirectory(entry.name)) {
            await scan(fullPath);
          }
        }

        if (files.length > 0) {
          callback(dirPath, files);
        }
      } catch (error) {
        console.warn(`Cannot scan directory ${dirPath}:`, error);
      }
    };

    await scan(rootPath);
  }

  private isConfigFile(fileName: string): boolean {
    const configFiles = [
      'package.json', 'tsconfig.json', 'webpack.config.js', 'rollup.config.js',
      'babel.config.js', '.eslintrc.js', '.prettierrc', 'README.md',
      'requirements.txt', 'setup.py', 'Dockerfile', 'docker-compose.yml'
    ];

    return configFiles.includes(fileName) || fileName.startsWith('.');
  }

  private shouldExcludeDirectory(dirName: string): boolean {
    return this.config.excludePatterns.some(pattern => dirName.includes(pattern));
  }

  private async assessProjectMaturity(project: ProjectAnalysis): Promise<MaturityAssessment> {
    let score = 0;
    const indicators = {
      hasTests: false,
      hasDocumentation: false,
      hasConfiguration: false,
      hasGitHistory: false,
      hasTypeScript: false
    };

    // Check for tests
    indicators.hasTests = project.files.some(f =>
      f.name.includes('test') || f.name.includes('spec') || f.path.includes('/test/')
    );
    if (indicators.hasTests) score++;

    // Check for documentation
    indicators.hasDocumentation = project.files.some(f =>
      f.name.toLowerCase().includes('readme') || f.extension === '.md'
    );
    if (indicators.hasDocumentation) score++;

    // Check for configuration
    indicators.hasConfiguration = project.files.some(f =>
      ['package.json', 'tsconfig.json', 'requirements.txt'].includes(f.name)
    );
    if (indicators.hasConfiguration) score++;

    // Check for Git
    indicators.hasGitHistory = fs.existsSync(path.join(project.path, '.git'));
    if (indicators.hasGitHistory) score++;

    // Check for TypeScript
    indicators.hasTypeScript = project.files.some(f => f.extension === '.ts' || f.name === 'tsconfig.json');
    if (indicators.hasTypeScript) score++;

    let level: MaturityAssessment['level'] = 'abandoned';
    if (score >= 4) level = 'production';
    else if (score >= 3) level = 'development';
    else if (score >= 1) level = 'prototype';

    return { level, score, indicators };
  }

  private getLastActivity(project: ProjectAnalysis): Date {
    let latestDate = new Date(0);

    for (const file of project.files) {
      try {
        const stat = fs.statSync(file.path);
        if (stat.mtime > latestDate) {
          latestDate = stat.mtime;
        }
      } catch (error) {
        // File not accessible
      }
    }

    return latestDate;
  }

  private async assessCodeQuality(project: ProjectAnalysis): Promise<QualityAssessment> {
    let score = 100;
    const issues: string[] = [];
    let todoCount = 0;
    let totalLines = 0;
    let commentLines = 0;
    let totalSize = 0;

    for (const file of project.files) {
      try {
        const content = await fs.promises.readFile(file.path, 'utf8');
        const lines = content.split('\n');
        totalLines += lines.length;
        totalSize += file.size;

        // Count TODOs and FIXMEs
        const todos = content.match(/TODO|FIXME|HACK|XXX/gi);
        if (todos) {
          todoCount += todos.length;
        }

        // Count comment lines
        const commentLinesInFile = lines.filter(line => {
          const trimmed = line.trim();
          return trimmed.startsWith('//') || trimmed.startsWith('#') ||
                 trimmed.startsWith('/*') || trimmed.startsWith('*');
        }).length;
        commentLines += commentLinesInFile;

        // Check for code smells
        if (content.includes('Math.random')) {
          issues.push('Uses Math.random() - consider deterministic approach');
          score -= 10;
        }

        if (file.size > 100000) { // 100KB
          issues.push(`Large file: ${file.name} (${(file.size / 1024).toFixed(1)}KB)`);
          score -= 5;
        }

        if (lines.length > 1000) {
          issues.push(`Long file: ${file.name} (${lines.length} lines)`);
          score -= 5;
        }

      } catch (error) {
        issues.push(`Cannot read file: ${file.name}`);
      }
    }

    const commentRatio = totalLines > 0 ? (commentLines / totalLines) * 100 : 0;
    const avgFileSize = project.files.length > 0 ? totalSize / project.files.length : 0;

    // Adjust score based on comment ratio
    if (commentRatio > 15) score += 10;
    else if (commentRatio < 5) score -= 10;

    return {
      score: Math.max(0, Math.min(100, score)),
      issues,
      metrics: {
        todoCount,
        commentRatio,
        avgFileSize,
        duplicateFiles: 0 // Will be calculated in findDuplicates
      }
    };
  }

  private calculateProjectSize(project: ProjectAnalysis): SizeInfo {
    const totalBytes = project.files.reduce((sum, file) => sum + file.size, 0);
    const largestFile = project.files.reduce((largest, file) =>
      file.size > largest.size ? file : largest, project.files[0] || { size: 0, name: '' }
    );

    return {
      bytes: totalBytes,
      mb: (totalBytes / (1024 * 1024)).toFixed(2),
      fileCount: project.files.length,
      largestFile: largestFile.name
    };
  }

  private async findDuplicates(discovered: ConsolidationReport['discovered']): Promise<DuplicateGroup[]> {
    const duplicates: DuplicateGroup[] = [];
    const fileHashes = new Map<string, Array<{ project: string; file: string; path: string; }>>();

    // Flatten all projects
    const allProjects = [
      ...discovered.webProjects,
      ...discovered.pythonProjects,
      ...discovered.dataProjects,
      ...discovered.documentationProjects,
      ...discovered.configProjects,
      ...discovered.extensionProjects
    ];

    for (const project of allProjects) {
      for (const file of project.files) {
        try {
          const content = await fs.promises.readFile(file.path);
          const hash = crypto.createHash('md5').update(content).digest('hex');

          if (!fileHashes.has(hash)) {
            fileHashes.set(hash, []);
          }

          fileHashes.get(hash)!.push({
            project: project.name,
            file: file.name,
            path: file.path
          });
        } catch (error) {
          // Cannot read file
        }
      }
    }

    // Find actual duplicates
    for (const [hash, instances] of fileHashes) {
      if (instances.length > 1) {
        try {
          const size = fs.statSync(instances[0].path).size;
          duplicates.push({
            hash,
            instances,
            size,
            canDelete: instances.length - 1
          });
        } catch (error) {
          // Cannot get file size
        }
      }
    }

    return duplicates.sort((a, b) => (b.size * b.canDelete) - (a.size * a.canDelete));
  }

  private generateRecommendations(
    discovered: ConsolidationReport['discovered'],
    duplicates: DuplicateGroup[]
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Duplicate cleanup recommendations
    if (duplicates.length > 0) {
      const totalWaste = duplicates.reduce((sum, dup) => sum + dup.size * dup.canDelete, 0);

      recommendations.push({
        type: 'cleanup',
        priority: 'high',
        action: 'Remove duplicate files',
        impact: `Save ${(totalWaste / (1024 * 1024)).toFixed(2)} MB of disk space`,
        effort: 'low',
        details: duplicates.slice(0, 10)
      });
    }

    // Project maturity recommendations
    const allProjects = [
      ...discovered.webProjects,
      ...discovered.pythonProjects,
      ...discovered.dataProjects,
      ...discovered.documentationProjects,
      ...discovered.configProjects,
      ...discovered.extensionProjects
    ];

    const immatureProjects = allProjects.filter(p => p.maturity.level === 'prototype' || p.maturity.level === 'abandoned');

    if (immatureProjects.length > 0) {
      recommendations.push({
        type: 'structure',
        priority: 'medium',
        action: 'Improve project structure',
        impact: `Enhance ${immatureProjects.length} projects with better organization`,
        effort: 'medium',
        details: immatureProjects.slice(0, 5).map(p => ({
          name: p.name,
          missing: Object.entries(p.maturity.indicators)
            .filter(([key, value]) => !value)
            .map(([key]) => key)
        }))
      });
    }

    // Code quality recommendations
    const lowQualityProjects = allProjects.filter(p => p.codeQuality.score < 70);

    if (lowQualityProjects.length > 0) {
      recommendations.push({
        type: 'refactor',
        priority: 'medium',
        action: 'Improve code quality',
        impact: `Enhance code quality in ${lowQualityProjects.length} projects`,
        effort: 'high',
        details: lowQualityProjects.map(p => ({
          name: p.name,
          score: p.codeQuality.score,
          issues: p.codeQuality.issues.slice(0, 3)
        }))
      });
    }

    return recommendations;
  }

  private calculateSummary(
    discovered: ConsolidationReport['discovered'],
    duplicates: DuplicateGroup[]
  ): ConsolidationReport['summary'] {
    const allProjects = [
      ...discovered.webProjects,
      ...discovered.pythonProjects,
      ...discovered.dataProjects,
      ...discovered.documentationProjects,
      ...discovered.configProjects,
      ...discovered.extensionProjects
    ];

    const totalFiles = allProjects.reduce((sum, project) => sum + project.files.length, 0);
    const totalSize = allProjects.reduce((sum, project) => sum + project.size.bytes, 0);
    const duplicateWaste = duplicates.reduce((sum, dup) => sum + dup.size * dup.canDelete, 0);
    const qualityScore = allProjects.length > 0 ?
      allProjects.reduce((sum, project) => sum + project.codeQuality.score, 0) / allProjects.length : 0;

    return {
      totalProjects: allProjects.length,
      totalFiles,
      totalSize,
      duplicateWaste,
      qualityScore
    };
  }

  public async generateDetailedReport(analysis: ConsolidationReport): Promise<string> {
    let report = "# 📊 PROJECT CONSOLIDATION REPORT\n\n";

    report += `## 📈 Summary\n`;
    report += `- **Total Projects**: ${analysis.summary.totalProjects}\n`;
    report += `- **Total Files**: ${analysis.summary.totalFiles}\n`;
    report += `- **Total Size**: ${(analysis.summary.totalSize / (1024 * 1024)).toFixed(2)} MB\n`;
    report += `- **Duplicate Waste**: ${(analysis.summary.duplicateWaste / (1024 * 1024)).toFixed(2)} MB\n`;
    report += `- **Average Quality**: ${analysis.summary.qualityScore.toFixed(1)}/100\n\n`;

    // Project breakdown
    report += `## 🎯 Project Breakdown\n`;
    for (const [type, projects] of Object.entries(analysis.discovered)) {
      if (projects.length > 0) {
        report += `### ${type.charAt(0).toUpperCase() + type.slice(1)}\n`;
        for (const project of projects.slice(0, 5)) {
          report += `- **${project.name}** (${project.maturity.level}) - ${project.size.mb}MB\n`;
        }
        if (projects.length > 5) {
          report += `  ... and ${projects.length - 5} more\n`;
        }
        report += '\n';
      }
    }

    // Duplicates section
    if (analysis.duplicates.length > 0) {
      report += `## 🔄 Duplicate Files (${analysis.duplicates.length} groups)\n`;
      for (const dup of analysis.duplicates.slice(0, 10)) {
        report += `- **${dup.instances[0].file}** - ${dup.instances.length} copies (${(dup.size / 1024).toFixed(1)}KB each)\n`;
      }
      report += '\n';
    }

    // Recommendations
    report += `## 💡 Recommendations\n`;
    for (const rec of analysis.recommendations) {
      report += `### ${rec.action}\n`;
      report += `- **Priority**: ${rec.priority}\n`;
      report += `- **Impact**: ${rec.impact}\n`;
      report += `- **Effort**: ${rec.effort}\n\n`;
    }

    return report;
  }
}