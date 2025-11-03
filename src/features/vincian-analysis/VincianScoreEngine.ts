/**
 * Vincian Score Engine
 * Main engine for calculating Vincian Score
 * Orchestrates all principle analyzers and computes composite score
 */

import {
  VincianScore,
  VincianBreakdown,
  VincianWeights,
  DEFAULT_WEIGHTS,
  AnalysisOptions,
  PrincipleAnalysisResult,
  Recommendation,
} from '../../core/types/vincian-types';
import { parseCode } from '../../core/utils/ast-parser';
import { MovementAnalyzer } from './analyzers/MovementAnalyzer';
import { BalanceAnalyzer } from './analyzers/BalanceAnalyzer';

export class VincianScoreEngine {
  private movementAnalyzer: MovementAnalyzer;
  private balanceAnalyzer: BalanceAnalyzer;
  private weights: VincianWeights;

  constructor(weights?: Partial<VincianWeights>) {
    this.movementAnalyzer = new MovementAnalyzer();
    this.balanceAnalyzer = new BalanceAnalyzer();
    this.weights = { ...DEFAULT_WEIGHTS, ...weights };
  }

  /**
   * Calculate Vincian Score for source code
   * @param sourceCode - Source code to analyze
   * @param options - Analysis options
   * @returns Complete Vincian Score result
   */
  async calculateScore(sourceCode: string, options?: AnalysisOptions): Promise<VincianScore> {
    const startTime = Date.now();

    try {
      // Parse AST
      const parsed = parseCode(sourceCode, options?.filePath);
      const { ast } = parsed;

      // Run analyzers (in parallel for future - for now sequential)
      const movementResult = this.movementAnalyzer.analyze(ast, sourceCode);
      const balanceResult = this.balanceAnalyzer.analyze(ast, sourceCode);

      // Placeholder scores for other principles (Week 3)
      const proportionResult: PrincipleAnalysisResult = {
        score: 85,
        recommendations: [],
        metrics: {},
      };
      const contrastResult: PrincipleAnalysisResult = {
        score: 85,
        recommendations: [],
        metrics: {},
      };
      const unityResult: PrincipleAnalysisResult = {
        score: 85,
        recommendations: [],
        metrics: {},
      };
      const simplicityResult: PrincipleAnalysisResult = {
        score: 85,
        recommendations: [],
        metrics: {},
      };
      const perspectiveResult: PrincipleAnalysisResult = {
        score: 85,
        recommendations: [],
        metrics: {},
      };

      // Build breakdown
      const breakdown: VincianBreakdown = {
        movement: movementResult.score,
        balance: balanceResult.score,
        proportion: proportionResult.score,
        contrast: contrastResult.score,
        unity: unityResult.score,
        simplicity: simplicityResult.score,
        perspective: perspectiveResult.score,
      };

      // Calculate composite score
      const overall = this.calculateCompositeScore(breakdown, options?.weights);

      // Combine recommendations
      const allRecommendations = [
        ...movementResult.recommendations,
        ...balanceResult.recommendations,
        ...proportionResult.recommendations,
        ...contrastResult.recommendations,
        ...unityResult.recommendations,
        ...simplicityResult.recommendations,
        ...perspectiveResult.recommendations,
      ];

      // Prioritize recommendations
      const prioritizedRecommendations = this.prioritizeRecommendations(allRecommendations);

      // Calculate confidence
      const confidence = this.calculateConfidence(breakdown);

      // Get grade
      const grade = this.getGrade(overall);

      // Build result
      const result: VincianScore = {
        overall,
        breakdown,
        grade,
        recommendations: prioritizedRecommendations,
        confidence,
        metadata: {
          linesOfCode: sourceCode.split('\n').length,
          filesAnalyzed: 1,
          analysisTime: Date.now() - startTime,
          timestamp: new Date(),
        },
      };

      return result;
    } catch (error) {
      throw new Error(`Vincian Score analysis failed: ${(error as Error).message}`);
    }
  }

  /**
   * Calculate composite score from breakdown
   */
  private calculateCompositeScore(
    breakdown: VincianBreakdown,
    customWeights?: Partial<VincianWeights>
  ): number {
    const weights = { ...this.weights, ...customWeights };

    const weightedSum =
      breakdown.movement * weights.movement +
      breakdown.balance * weights.balance +
      breakdown.proportion * weights.proportion +
      breakdown.contrast * weights.contrast +
      breakdown.unity * weights.unity +
      breakdown.simplicity * weights.simplicity +
      breakdown.perspective * weights.perspective;

    const totalWeight =
      weights.movement +
      weights.balance +
      weights.proportion +
      weights.contrast +
      weights.unity +
      weights.simplicity +
      weights.perspective;

    return Math.round(weightedSum / totalWeight);
  }

  /**
   * Prioritize recommendations by severity and impact
   */
  private prioritizeRecommendations(recommendations: Recommendation[]): Recommendation[] {
    const severityOrder = { critical: 0, warning: 1, info: 2 };

    return recommendations
      .sort((a, b) => {
        // Sort by severity first
        const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
        if (severityDiff !== 0) {
          return severityDiff;
        }

        // Then by estimated impact (higher first)
        return (b.estimatedImpact || 0) - (a.estimatedImpact || 0);
      })
      .slice(0, 10); // Top 10 recommendations
  }

  /**
   * Calculate confidence in the analysis
   * Higher variance in scores = lower confidence
   */
  private calculateConfidence(breakdown: VincianBreakdown): number {
    const scores = Object.values(breakdown);
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance =
      scores.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);

    // Low variance = high confidence
    // High variance = low confidence
    const confidence = Math.max(0, 100 - stdDev * 2);

    return Math.round(confidence);
  }

  /**
   * Get letter grade from score
   */
  private getGrade(score: number): string {
    if (score >= 90) return 'A+ (Masterpiece)';
    if (score >= 85) return 'A (Excellent)';
    if (score >= 80) return 'A- (Very Good)';
    if (score >= 75) return 'B+ (Good)';
    if (score >= 70) return 'B (Above Average)';
    if (score >= 65) return 'B- (Average)';
    if (score >= 60) return 'C+ (Below Average)';
    if (score >= 55) return 'C (Needs Improvement)';
    if (score >= 50) return 'C- (Poor)';
    return 'D (Critical Issues)';
  }

  /**
   * Update weights for this engine
   */
  setWeights(weights: Partial<VincianWeights>): void {
    this.weights = { ...this.weights, ...weights };
  }

  /**
   * Get current weights
   */
  getWeights(): VincianWeights {
    return { ...this.weights };
  }
}
