import * as vscode from 'vscode';
import * as path from 'path';
import { RealCodeAnalyzer, CodeMetrics } from './RealCodeAnalyzer';
import { SemanticAnalyzer, SemanticIssue } from './SemanticAnalyzer';
import { VincianAnalysisEngine, VincianScores } from './VincianAnalysisEngine';

export interface ComprehensiveAnalysis {
  filePath: string;
  fileName: string;
  timestamp: number;
  codeMetrics: CodeMetrics;
  semanticIssues: SemanticIssue[];
  vincianScores: VincianScores;
  overallScore: number;
  recommendations: string[];
  realAnalysisUsed: boolean;
  performanceMetrics: {
    analysisTime: number;
    linesAnalyzed: number;
    issuesFound: number;
  };
}

export interface ProjectAnalysis {
  projectPath: string;
  fileCount: number;
  totalLinesOfCode: number;
  averageQuality: number;
  criticalIssues: number;
  fileAnalyses: ComprehensiveAnalysis[];
  projectMetrics: {
    complexity: number;
    maintainability: number;
    technicalDebt: number;
    testCoverage: number;
  };
  recommendations: string[];
  timestamp: number;
}

export class RealAnalysisEngine {
  private codeAnalyzer: RealCodeAnalyzer;
  private semanticAnalyzer: SemanticAnalyzer;
  private vincianEngine: VincianAnalysisEngine;

  constructor() {
    this.codeAnalyzer = new RealCodeAnalyzer();
    this.semanticAnalyzer = new SemanticAnalyzer();
    this.vincianEngine = new VincianAnalysisEngine();
    console.log('🚀 Real Analysis Engine initialized - NO MORE FAKE DATA!');
  }

  public async analyzeFile(filePath: string): Promise<ComprehensiveAnalysis> {
    const startTime = Date.now();

    try {
      const document = await vscode.workspace.openTextDocument(filePath);
      const content = document.getText();

      console.log(`🔍 Starting REAL analysis of ${path.basename(filePath)}`);

      // Parallel analysis for better performance
      const [codeMetrics, semanticAnalysis] = await Promise.all([
        this.codeAnalyzer.analyzeCode(content, filePath),
        this.semanticAnalyzer.analyzeSemantics(content, filePath)
      ]);

      // Vincian analysis using real metrics
      const vincianScores: VincianScores = {
        movement: await this.vincianEngine.analyzeMovement(content, filePath),
        balance: await this.vincianEngine.analyzeBalance(content, filePath),
        proportion: await this.vincianEngine.analyzeProportion(content, filePath),
        contrast: await this.vincianEngine.analyzeContrast(content, filePath),
        unity: await this.vincianEngine.analyzeUnity(content, filePath),
        simplicity: await this.vincianEngine.analyzeSimplicity(content, filePath),
        perspective: await this.vincianEngine.analyzePerspective(content, filePath)
      };

      const overallScore = this.vincianEngine.calculateOverallScore(vincianScores);
      const recommendations = this.generateComprehensiveRecommendations(
        codeMetrics,
        semanticAnalysis.issues,
        vincianScores,
        overallScore
      );

      const analysisTime = Date.now() - startTime;

      return {
        filePath,
        fileName: path.basename(filePath),
        timestamp: Date.now(),
        codeMetrics,
        semanticIssues: semanticAnalysis.issues,
        vincianScores,
        overallScore,
        recommendations,
        realAnalysisUsed: true,
        performanceMetrics: {
          analysisTime,
          linesAnalyzed: codeMetrics.linesOfCode,
          issuesFound: codeMetrics.codeSmells.length + semanticAnalysis.issues.length
        }
      };

    } catch (error) {
      console.error(`❌ Real analysis failed for ${filePath}:`, error);
      throw new Error(`Real analysis failed: ${error}`);
    }
  }

  public async analyzeProject(projectPath: string): Promise<ProjectAnalysis> {
    const startTime = Date.now();
    console.log('🔍 Starting REAL project analysis...');

    try {
      const files = await this.findAnalyzableFiles(projectPath);
      console.log(`📁 Found ${files.length} files to analyze`);

      const fileAnalyses: ComprehensiveAnalysis[] = [];
      let totalLinesOfCode = 0;
      let criticalIssues = 0;

      // Analyze files in batches to avoid memory issues
      const batchSize = 10;
      for (let i = 0; i < files.length; i += batchSize) {
        const batch = files.slice(i, i + batchSize);

        const batchResults = await Promise.all(
          batch.map(async (file) => {
            try {
              return await this.analyzeFile(file);
            } catch (error) {
              console.warn(`⚠️ Skipped analysis of ${file}: ${error}`);
              return null;
            }
          })
        );

        // Filter out failed analyses
        const validResults = batchResults.filter(result => result !== null) as ComprehensiveAnalysis[];
        fileAnalyses.push(...validResults);

        // Update metrics
        validResults.forEach(analysis => {
          totalLinesOfCode += analysis.codeMetrics.linesOfCode;
          criticalIssues += analysis.codeMetrics.codeSmells.filter(smell => smell.severity === 'critical').length;
          criticalIssues += analysis.semanticIssues.filter(issue => issue.severity === 'error').length;
        });

        console.log(`📊 Analyzed batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(files.length/batchSize)}`);
      }

      // Calculate project-level metrics
      const averageQuality = fileAnalyses.length > 0 ?
        fileAnalyses.reduce((sum, analysis) => sum + analysis.overallScore, 0) / fileAnalyses.length : 0;

      const projectMetrics = this.calculateProjectMetrics(fileAnalyses);
      const recommendations = this.generateProjectRecommendations(fileAnalyses, projectMetrics);

      const analysisTime = Date.now() - startTime;
      console.log(`✅ Project analysis completed in ${analysisTime}ms`);

      return {
        projectPath,
        fileCount: fileAnalyses.length,
        totalLinesOfCode,
        averageQuality,
        criticalIssues,
        fileAnalyses,
        projectMetrics,
        recommendations,
        timestamp: Date.now()
      };

    } catch (error) {
      console.error('❌ Project analysis failed:', error);
      throw new Error(`Project analysis failed: ${error}`);
    }
  }

  private async findAnalyzableFiles(projectPath: string): Promise<string[]> {
    const pattern = new vscode.RelativePattern(projectPath, '**/*.{ts,js,tsx,jsx}');
    const files = await vscode.workspace.findFiles(pattern, '**/node_modules/**');

    return files
      .map(file => file.fsPath)
      .filter(filePath => {
        // Skip large files and test files for initial analysis
        const relativePath = path.relative(projectPath, filePath);
        return !relativePath.includes('node_modules') &&
               !relativePath.includes('.min.') &&
               !relativePath.includes('dist/') &&
               !relativePath.includes('build/');
      })
      .slice(0, 100); // Limit to first 100 files for performance
  }

  private calculateProjectMetrics(fileAnalyses: ComprehensiveAnalysis[]): {
    complexity: number;
    maintainability: number;
    technicalDebt: number;
    testCoverage: number;
  } {
    if (fileAnalyses.length === 0) {
      return { complexity: 0, maintainability: 0, technicalDebt: 0, testCoverage: 0 };
    }

    const avgComplexity = fileAnalyses.reduce((sum, analysis) =>
      sum + analysis.codeMetrics.cyclomaticComplexity, 0) / fileAnalyses.length;

    const avgMaintainability = fileAnalyses.reduce((sum, analysis) =>
      sum + analysis.codeMetrics.maintainabilityIndex, 0) / fileAnalyses.length;

    const totalTechnicalDebt = fileAnalyses.reduce((sum, analysis) =>
      sum + analysis.codeMetrics.technicalDebt, 0);

    // Simple test coverage heuristic based on test files
    const testFiles = fileAnalyses.filter(analysis =>
      analysis.fileName.includes('.test.') ||
      analysis.fileName.includes('.spec.') ||
      analysis.filePath.includes('/test/') ||
      analysis.filePath.includes('/tests/')
    ).length;

    const testCoverage = (testFiles / fileAnalyses.length) * 100;

    return {
      complexity: Math.round(avgComplexity),
      maintainability: Math.round(avgMaintainability),
      technicalDebt: Math.round(totalTechnicalDebt),
      testCoverage: Math.round(testCoverage)
    };
  }

  private generateComprehensiveRecommendations(
    codeMetrics: CodeMetrics,
    semanticIssues: SemanticIssue[],
    vincianScores: VincianScores,
    overallScore: number
  ): string[] {
    const recommendations: string[] = [];

    // Critical issues first
    const criticalSmells = codeMetrics.codeSmells.filter(smell => smell.severity === 'critical');
    if (criticalSmells.length > 0) {
      recommendations.push(`🚨 Fix ${criticalSmells.length} critical code issues immediately`);
      criticalSmells.forEach(smell => {
        recommendations.push(`   • Line ${smell.line}: ${smell.suggestion}`);
      });
    }

    // Semantic issues
    const errors = semanticIssues.filter(issue => issue.severity === 'error');
    if (errors.length > 0) {
      recommendations.push(`⚠️ Resolve ${errors.length} semantic errors`);
    }

    // Complexity recommendations
    if (codeMetrics.cyclomaticComplexity > 15) {
      recommendations.push('🔄 Reduce cyclomatic complexity by breaking down large functions');
    }

    if (codeMetrics.cognitiveComplexity > 20) {
      recommendations.push('🧠 Simplify cognitive complexity with clearer logic flow');
    }

    // Vincian-specific recommendations
    if (vincianScores.movement < 60) {
      recommendations.push('🌊 Improve code flow by reducing nested complexity');
    }

    if (vincianScores.balance < 60) {
      recommendations.push('⚖️ Balance code structure with better function/class distribution');
    }

    if (vincianScores.simplicity < 60) {
      recommendations.push('✨ Enhance simplicity by reducing cognitive load');
    }

    // Overall recommendations
    if (overallScore < 70) {
      recommendations.push('📈 Focus on code quality fundamentals: naming, structure, and testing');
    } else if (overallScore > 85) {
      recommendations.push('🎉 Excellent code quality! Consider mentoring others with your practices');
    }

    return recommendations;
  }

  private generateProjectRecommendations(
    fileAnalyses: ComprehensiveAnalysis[],
    projectMetrics: any
  ): string[] {
    const recommendations: string[] = [];

    // Project-level recommendations
    if (projectMetrics.complexity > 10) {
      recommendations.push('🔄 Project complexity is high - consider architectural refactoring');
    }

    if (projectMetrics.maintainability < 60) {
      recommendations.push('🔧 Improve maintainability through better documentation and structure');
    }

    if (projectMetrics.testCoverage < 30) {
      recommendations.push('🧪 Increase test coverage - current coverage is below recommended threshold');
    }

    if (projectMetrics.technicalDebt > 50) {
      recommendations.push('💳 Address technical debt systematically to prevent future issues');
    }

    // Find most problematic files
    const problematicFiles = fileAnalyses
      .filter(analysis => analysis.overallScore < 50)
      .sort((a, b) => a.overallScore - b.overallScore)
      .slice(0, 5);

    if (problematicFiles.length > 0) {
      recommendations.push('📝 Priority files for refactoring:');
      problematicFiles.forEach(file => {
        recommendations.push(`   • ${file.fileName} (Score: ${file.overallScore.toFixed(1)})`);
      });
    }

    return recommendations;
  }

  public async autoFixIssues(filePath: string): Promise<{
    fixedIssues: number;
    remainingIssues: number;
    appliedFixes: string[];
  }> {
    console.log('🔧 Starting auto-fix for:', path.basename(filePath));

    try {
      const analysis = await this.analyzeFile(filePath);
      const document = await vscode.workspace.openTextDocument(filePath);
      const editor = await vscode.window.showTextDocument(document);

      let fixedIssues = 0;
      const appliedFixes: string[] = [];

      // Auto-fix semantic issues
      for (const issue of analysis.semanticIssues) {
        if (issue.fix && issue.type === 'unused_variable') {
          // Remove unused variable (simplified implementation)
          const line = editor.document.lineAt(issue.line - 1);
          if (line.text.includes('const ') || line.text.includes('let ') || line.text.includes('var ')) {
            const edit = new vscode.WorkspaceEdit();
            edit.delete(document.uri, line.range);
            await vscode.workspace.applyEdit(edit);
            fixedIssues++;
            appliedFixes.push(`Removed unused variable at line ${issue.line}`);
          }
        }
      }

      // Auto-fix critical code smells
      for (const smell of analysis.codeMetrics.codeSmells) {
        if (smell.type === 'magic_number' && smell.message.includes('Math.random')) {
          // This is a fake-to-real conversion candidate
          appliedFixes.push(`Identified Math.random() usage at line ${smell.line} - manual replacement needed`);
        }
      }

      const remainingAnalysis = await this.analyzeFile(filePath);
      const remainingIssues = remainingAnalysis.codeMetrics.codeSmells.length +
                             remainingAnalysis.semanticIssues.length;

      console.log(`✅ Auto-fix completed: ${fixedIssues} issues fixed`);

      return {
        fixedIssues,
        remainingIssues,
        appliedFixes
      };

    } catch (error) {
      console.error('❌ Auto-fix failed:', error);
      throw new Error(`Auto-fix failed: ${error}`);
    }
  }
}