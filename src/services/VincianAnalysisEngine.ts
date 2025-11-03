import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { RealCodeAnalyzer, CodeMetrics } from './RealCodeAnalyzer';
import { SemanticAnalyzer } from './SemanticAnalyzer';

export interface AudioData {
  filePath: string;
  fileName: string;
  fileSize: number;
  extension: string;
  duration: number;
  quality: number;
  timestamp: number;
}

export interface VincianScores {
  movement: number;
  balance: number;
  proportion: number;
  contrast: number;
  unity: number;
  simplicity: number;
  perspective: number;
}

export class VincianAnalysisEngine {
  private readonly QUALITY_SCORES = {
    '.wav': 100,
    '.flac': 95,
    '.aac': 85,
    '.mp3': 80,
    '.ogg': 75,
  };

  private codeAnalyzer: RealCodeAnalyzer;
  private semanticAnalyzer: SemanticAnalyzer;

  constructor() {
    console.log('🎨 Vincian Analysis Engine initialized with real analysis capabilities');
    this.codeAnalyzer = new RealCodeAnalyzer();
    this.semanticAnalyzer = new SemanticAnalyzer();
  }

  public async loadAudioFile(filePath: string): Promise<AudioData> {
    const stats = fs.statSync(filePath);
    const ext = path.extname(filePath).toLowerCase();

    return {
      filePath,
      fileName: path.basename(filePath),
      fileSize: stats.size,
      extension: ext,
      duration: this.estimateDuration(stats.size, ext),
      quality: this.assessQuality(ext),
      timestamp: Date.now(),
    };
  }

  public async analyzeMovement(codeContent: string, filePath: string): Promise<number> {
    try {
      const metrics = await this.codeAnalyzer.analyzeCode(codeContent, filePath);
      // Movement = Code flow quality (lower complexity = better movement)
      const complexityScore = Math.max(0, 100 - (metrics.cyclomaticComplexity * 2));
      const flowScore = Math.max(0, 100 - (metrics.codeSmells.length * 5));
      return this.normalizeScore((complexityScore + flowScore) / 2);
    } catch (error) {
      console.error('Movement analysis failed:', error);
      return 50; // Default score on error
    }
  }

  public async analyzeBalance(codeContent: string, filePath: string): Promise<number> {
    try {
      const analysis = await this.semanticAnalyzer.analyzeSemantics(codeContent, filePath);
      // Balance = Distribution of functions vs classes vs variables
      const functionCount = analysis.metrics.functions.length;
      const classCount = analysis.metrics.classes.length;
      const totalSymbols = analysis.symbols.length;

      // Good balance: functions and classes present, not too many variables
      const balanceRatio = totalSymbols > 0 ?
        (functionCount + classCount) / totalSymbols : 0;

      return this.normalizeScore(balanceRatio * 100);
    } catch (error) {
      console.error('Balance analysis failed:', error);
      return 50;
    }
  }

  public async analyzeProportion(codeContent: string, filePath: string): Promise<number> {
    try {
      const metrics = await this.codeAnalyzer.analyzeCode(codeContent, filePath);
      // Proportion = Function length distribution
      const avgFunctionLength = metrics.functions.length > 0 ?
        metrics.functions.reduce((sum, fn) => sum + (fn.endLine - fn.startLine), 0) / metrics.functions.length : 0;

      // Good proportion: functions are not too long (ideal 10-30 lines)
      const proportionScore = avgFunctionLength > 0 ?
        Math.max(0, 100 - Math.abs(avgFunctionLength - 20) * 2) : 80;

      return this.normalizeScore(proportionScore);
    } catch (error) {
      console.error('Proportion analysis failed:', error);
      return 50;
    }
  }

  public async analyzeContrast(codeContent: string, filePath: string): Promise<number> {
    try {
      const analysis = await this.semanticAnalyzer.analyzeSemantics(codeContent, filePath);
      // Contrast = Variety in code patterns (functions, conditions, loops)
      const conditionalsCount = analysis.controlFlow.conditionalBlocks.length;
      const loopsCount = analysis.controlFlow.loopBlocks.length;
      const functionsCount = analysis.metrics.functions.length;

      // Good contrast: mix of different code structures
      const contrastScore = (conditionalsCount + loopsCount) > 0 && functionsCount > 0 ?
        Math.min(100, (conditionalsCount + loopsCount + functionsCount) * 10) : 30;

      return this.normalizeScore(contrastScore);
    } catch (error) {
      console.error('Contrast analysis failed:', error);
      return 50;
    }
  }

  public async analyzeUnity(codeContent: string, filePath: string): Promise<number> {
    try {
      const metrics = await this.codeAnalyzer.analyzeCode(codeContent, filePath);
      // Unity = Consistency in naming, structure, and dependencies
      const criticalSmells = metrics.codeSmells.filter(smell => smell.severity === 'critical').length;
      const dependencyCount = metrics.dependencies.length;

      // Good unity: few critical issues, reasonable dependencies
      const unityScore = Math.max(0, 100 - (criticalSmells * 15) - Math.max(0, dependencyCount - 10) * 2);

      return this.normalizeScore(unityScore);
    } catch (error) {
      console.error('Unity analysis failed:', error);
      return 50;
    }
  }

  public async analyzeSimplicity(codeContent: string, filePath: string): Promise<number> {
    try {
      const metrics = await this.codeAnalyzer.analyzeCode(codeContent, filePath);
      // Simplicity = Low cognitive complexity, readable code
      const avgCognitiveComplexity = metrics.functions.length > 0 ?
        metrics.functions.reduce((sum, fn) => sum + fn.cognitiveComplexity, 0) / metrics.functions.length : 0;

      // Good simplicity: low cognitive complexity
      const simplicityScore = Math.max(0, 100 - (avgCognitiveComplexity * 5));

      return this.normalizeScore(simplicityScore);
    } catch (error) {
      console.error('Simplicity analysis failed:', error);
      return 50;
    }
  }

  public async analyzePerspective(codeContent: string, filePath: string): Promise<number> {
    try {
      const metrics = await this.codeAnalyzer.analyzeCode(codeContent, filePath);
      // Perspective = Maintainability and future-proofing
      const maintainabilityScore = metrics.maintainabilityIndex;
      const technicalDebtPenalty = Math.min(30, metrics.technicalDebt * 2);

      const perspectiveScore = Math.max(0, maintainabilityScore - technicalDebtPenalty);

      return this.normalizeScore(perspectiveScore);
    } catch (error) {
      console.error('Perspective analysis failed:', error);
      return 50;
    }
  }

  public calculateOverallScore(scores: VincianScores): number {
    const weights = {
      movement: 0.15,
      balance: 0.15,
      proportion: 0.15,
      contrast: 0.1,
      unity: 0.15,
      simplicity: 0.15,
      perspective: 0.15,
    };

    return parseFloat(
      Object.entries(scores)
        .reduce((sum, [key, value]) => sum + value * weights[key as keyof VincianScores], 0)
        .toFixed(2)
    );
  }

  public generateRecommendations(overallScore: number): string[] {
    const recommendations: string[] = [];

    if (overallScore < 50) {
      recommendations.push('Envisagez de retravailler la structure globale de votre composition');
      recommendations.push('Étudiez les œuvres de référence pour améliorer votre approche');
    } else if (overallScore < 75) {
      recommendations.push('Bon travail ! Quelques ajustements pourraient améliorer votre score');
      recommendations.push("Expérimentez avec différents niveaux de contraste pour plus d'impact");
    } else {
      recommendations.push(
        'Excellente composition ! Votre travail démontre une maîtrise des principes vinciens'
      );
      recommendations.push('Envisagez de partager votre travail avec la communauté AIMastery');
    }

    return recommendations;
  }

  private estimateDuration(fileSize: number, extension: string): number {
    // Estimation très basique - à remplacer par une analyse réelle
    const bitrate =
      {
        '.wav': 1411200, // 16-bit 44.1kHz stéréo
        '.flac': 1000000, // FLAC typique
        '.mp3': 128000, // 128 kbps
        '.aac': 128000, // 128 kbps
        '.ogg': 96000, // 96 kbps
      }[extension] || 128000;

    return Math.round((fileSize * 8) / bitrate);
  }

  private assessQuality(extension: string): number {
    return this.QUALITY_SCORES[extension as keyof typeof this.QUALITY_SCORES] || 50;
  }

  private normalizeScore(score: number): number {
    return Math.min(100, Math.max(0, Math.round(score)));
  }
}
