/**
 * Balance Analyzer
 * Analyzes code symmetry based on Leonardo da Vinci's principle of Balance
 *
 * Metrics:
 * - File size variance
 * - Function size variance (coefficient of variation)
 * - Class size variance
 * - Consistent sizing across codebase
 */

import { ASTNode, BalanceMetrics, PrincipleAnalysisResult, Recommendation } from '../../../core/types/vincian-types';
import { findAllFunctions, findAllClasses, countLinesOfCode, getFunctionName } from '../../../core/utils/ast-parser';

export class BalanceAnalyzer {
  /**
   * Analyze balance (symmetry) for the given AST
   * @param ast - Abstract Syntax Tree
   * @param sourceCode - Source code text
   * @returns Analysis result with score and recommendations
   */
  analyze(ast: ASTNode, sourceCode: string): PrincipleAnalysisResult {
    const metrics = this.extractMetrics(ast);
    const score = this.calculateScore(metrics);
    const recommendations = this.generateRecommendations(metrics, ast);

    return {
      score,
      recommendations,
      metrics: {
        functionSizeVariance: metrics.functionSizeVariance,
        classSizeVariance: metrics.classSizeVariance,
        functionCV: metrics.functionCV,
        classCV: metrics.classCV,
        avgFunctionSize:
          metrics.linesPerFunction.length > 0
            ? metrics.linesPerFunction.reduce((a, b) => a + b, 0) / metrics.linesPerFunction.length
            : 0,
        avgClassSize:
          metrics.methodsPerClass.length > 0
            ? metrics.methodsPerClass.reduce((a, b) => a + b, 0) / metrics.methodsPerClass.length
            : 0,
      },
    };
  }

  /**
   * Extract balance metrics from AST
   */
  private extractMetrics(ast: ASTNode): BalanceMetrics {
    const functions = findAllFunctions(ast);
    const classes = findAllClasses(ast);

    // Calculate lines per function
    const linesPerFunction = functions.map(func => countLinesOfCode(func));

    // Calculate methods per class
    const methodsPerClass = classes.map(cls => {
      const methods = this.countMethodsInClass(cls);
      return methods;
    });

    // Calculate coefficient of variation
    const functionCV = this.coefficientOfVariation(linesPerFunction);
    const classCV =
      methodsPerClass.length > 0 ? this.coefficientOfVariation(methodsPerClass) : 0;

    // Calculate variance
    const functionSizeVariance = this.variance(linesPerFunction);
    const classSizeVariance = this.variance(methodsPerClass);

    return {
      fileSizeVariance: 0, // Single file analysis for now
      functionSizeVariance,
      classSizeVariance,
      methodsPerClass,
      linesPerFunction,
      functionCV,
      classCV,
    };
  }

  /**
   * Count methods in a class
   */
  private countMethodsInClass(classNode: ASTNode): number {
    if (!classNode.body || !classNode.body.body) {
      return 0;
    }

    const methods = classNode.body.body.filter(
      (member: ASTNode) => member.type === 'MethodDefinition'
    );

    return methods.length;
  }

  /**
   * Calculate coefficient of variation (CV = std_dev / mean)
   * Lower CV = more consistent sizing
   */
  private coefficientOfVariation(values: number[]): number {
    if (values.length === 0) {
      return 0;
    }

    const mean = values.reduce((a, b) => a + b, 0) / values.length;

    if (mean === 0) {
      return 0;
    }

    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    return stdDev / mean;
  }

  /**
   * Calculate variance
   */
  private variance(values: number[]): number {
    if (values.length === 0) {
      return 0;
    }

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  }

  /**
   * Calculate balance score based on metrics
   */
  private calculateScore(metrics: BalanceMetrics): number {
    let score = 100;

    // Function size variance penalty (CV < 0.5: excellent, 0.5-1.0: good, >1.0: poor)
    if (metrics.functionCV > 0.5) {
      const penalty = Math.min(25, (metrics.functionCV - 0.5) * 30);
      score -= penalty;
    }

    // Class size variance penalty
    if (metrics.classCV > 0.6) {
      const penalty = Math.min(20, (metrics.classCV - 0.6) * 25);
      score -= penalty;
    }

    // Bonus for consistent sizing (CV < 0.3)
    if (metrics.functionCV < 0.3 && metrics.linesPerFunction.length > 3) {
      score += 10;
    }

    // Penalty for extreme outliers (functions > 100 LOC)
    const longFunctions = metrics.linesPerFunction.filter(loc => loc > 100).length;
    score -= longFunctions * 5;

    // Penalty for very small functions (< 3 LOC) if too many
    const tinyFunctions = metrics.linesPerFunction.filter(loc => loc < 3).length;
    if (tinyFunctions > metrics.linesPerFunction.length * 0.3) {
      // More than 30% are tiny
      score -= 10;
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Generate recommendations based on metrics
   */
  private generateRecommendations(metrics: BalanceMetrics, ast: ASTNode): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // High function variance
    if (metrics.functionCV > 1.0) {
      recommendations.push({
        principle: 'balance',
        severity: 'warning',
        message: `Function sizes vary widely (CV: ${metrics.functionCV.toFixed(2)}). Split large functions to match average size.`,
        estimatedImpact: Math.min(20, Math.round((metrics.functionCV - 0.5) * 20)),
        suggestedFix: 'Refactor large functions into smaller, more focused functions',
      });
    }

    // High class variance
    if (metrics.classCV > 0.8 && metrics.methodsPerClass.length > 0) {
      recommendations.push({
        principle: 'balance',
        severity: 'warning',
        message: `Class sizes vary widely (CV: ${metrics.classCV.toFixed(2)}). Consider splitting large classes.`,
        estimatedImpact: Math.min(15, Math.round((metrics.classCV - 0.6) * 20)),
        suggestedFix: 'Extract responsibilities from large classes into separate classes',
      });
    }

    // Very long functions
    const longFunctions = metrics.linesPerFunction.filter(loc => loc > 100);
    if (longFunctions.length > 0) {
      const avgLongSize = longFunctions.reduce((a, b) => a + b, 0) / longFunctions.length;

      recommendations.push({
        principle: 'balance',
        severity: longFunctions.length > 2 ? 'warning' : 'info',
        message: `Found ${longFunctions.length} function(s) with 100+ lines (avg: ${Math.round(avgLongSize)} LOC). Consider extracting logic.`,
        estimatedImpact: longFunctions.length * 5,
        suggestedFix: 'Break down long functions into smaller helper functions',
      });
    }

    // Too many tiny functions
    const tinyFunctions = metrics.linesPerFunction.filter(loc => loc < 3);
    const tinyPercentage =
      metrics.linesPerFunction.length > 0
        ? (tinyFunctions.length / metrics.linesPerFunction.length) * 100
        : 0;

    if (tinyPercentage > 30) {
      recommendations.push({
        principle: 'balance',
        severity: 'info',
        message: `${Math.round(tinyPercentage)}% of functions are very small (< 3 LOC). Consider if they're adding value or just noise.`,
        estimatedImpact: 5,
        suggestedFix: 'Review tiny functions - some may be better as inline code',
      });
    }

    // Good balance (positive feedback)
    if (metrics.functionCV < 0.3 && metrics.linesPerFunction.length > 5) {
      recommendations.push({
        principle: 'balance',
        severity: 'info',
        message: '✓ Excellent consistency in function sizes!',
        estimatedImpact: 0,
      });
    }

    return recommendations;
  }
}
