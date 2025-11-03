/**
 * Movement Analyzer
 * Analyzes code flow based on Leonardo da Vinci's principle of Movement
 *
 * Metrics:
 * - Cyclomatic complexity (McCabe)
 * - Nesting depth
 * - Callback chains
 * - Early returns (bonus)
 * - Exception jumps (throw/catch)
 */

import { ASTNode, MovementMetrics, PrincipleAnalysisResult, Recommendation } from '../../../core/types/vincian-types';
import { traverseAST, findAllFunctions, isFunctionNode, getFunctionName } from '../../../core/utils/ast-parser';

export class MovementAnalyzer {
  /**
   * Analyze movement (code flow) for the given AST
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
        cyclomaticComplexity: metrics.cyclomaticComplexity,
        maxNestingDepth: metrics.maxNestingDepth,
        callbackChains: metrics.callbackChains,
        earlyReturns: metrics.earlyReturns,
        exceptionJumps: metrics.exceptionJumps,
      },
    };
  }

  /**
   * Extract movement metrics from AST
   */
  private extractMetrics(ast: ASTNode): MovementMetrics {
    const functions = findAllFunctions(ast);

    let maxComplexity = 1;
    let maxNesting = 0;
    let totalEarlyReturns = 0;
    let totalExceptionJumps = 0;
    let callbackChains = 0;

    // Analyze each function
    functions.forEach(func => {
      const complexity = this.calculateCyclomaticComplexity(func);
      const nesting = this.calculateMaxNesting(func);
      const earlyReturns = this.countEarlyReturns(func);
      const exceptions = this.countExceptionJumps(func);

      maxComplexity = Math.max(maxComplexity, complexity);
      maxNesting = Math.max(maxNesting, nesting);
      totalEarlyReturns += earlyReturns;
      totalExceptionJumps += exceptions;
    });

    // Count callback chains (.then().then().then())
    callbackChains = this.countCallbackChains(ast);

    return {
      cyclomaticComplexity: maxComplexity,
      maxNestingDepth: maxNesting,
      callbackChains,
      earlyReturns: totalEarlyReturns,
      exceptionJumps: totalExceptionJumps,
    };
  }

  /**
   * Calculate McCabe cyclomatic complexity for a function
   * CC = edges - nodes + 2 (for connected graph)
   * Simplified: count decision points + 1
   */
  private calculateCyclomaticComplexity(functionNode: ASTNode): number {
    let complexity = 1; // Base complexity

    const decisionPoints = [
      'IfStatement',
      'ConditionalExpression', // ternary operator
      'SwitchCase',
      'ForStatement',
      'ForInStatement',
      'ForOfStatement',
      'WhileStatement',
      'DoWhileStatement',
      'CatchClause',
      'LogicalExpression', // && and ||
    ];

    traverseAST(functionNode, {
      enter: node => {
        if (decisionPoints.includes(node.type)) {
          complexity++;

          // For logical expressions, only count && and ||
          if (node.type === 'LogicalExpression') {
            if (node.operator === '&&' || node.operator === '||') {
              // Already counted above
            } else {
              complexity--; // Undo if other operator
            }
          }
        }
      },
    });

    return complexity;
  }

  /**
   * Calculate maximum nesting depth
   */
  private calculateMaxNesting(node: ASTNode): number {
    let maxDepth = 0;
    let currentDepth = 0;

    const nestingNodes = [
      'IfStatement',
      'ForStatement',
      'ForInStatement',
      'ForOfStatement',
      'WhileStatement',
      'DoWhileStatement',
      'SwitchStatement',
      'TryStatement',
      'BlockStatement',
    ];

    traverseAST(node, {
      enter: n => {
        if (nestingNodes.includes(n.type)) {
          currentDepth++;
          maxDepth = Math.max(maxDepth, currentDepth);
        }
      },
      exit: n => {
        if (nestingNodes.includes(n.type)) {
          currentDepth--;
        }
      },
    });

    return maxDepth;
  }

  /**
   * Count early returns (return statements before the end)
   */
  private countEarlyReturns(functionNode: ASTNode): number {
    const returns: ASTNode[] = [];

    traverseAST(functionNode, {
      enter: node => {
        if (node.type === 'ReturnStatement') {
          returns.push(node);
        }
      },
    });

    // If more than 1 return, all but the last are "early returns"
    return Math.max(0, returns.length - 1);
  }

  /**
   * Count exception jumps (throw + catch)
   */
  private countExceptionJumps(node: ASTNode): number {
    let count = 0;

    traverseAST(node, {
      enter: n => {
        if (n.type === 'ThrowStatement' || n.type === 'CatchClause') {
          count++;
        }
      },
    });

    return count;
  }

  /**
   * Count callback chains (.then().then().then())
   */
  private countCallbackChains(ast: ASTNode): number {
    let chains = 0;

    traverseAST(ast, {
      enter: node => {
        // Look for .then() chains
        if (node.type === 'CallExpression' && node.callee) {
          const callee = node.callee;

          // Check if it's a member expression (e.g., promise.then)
          if (callee.type === 'MemberExpression' && callee.property) {
            const propertyName = callee.property.name;

            // Check for chaining patterns
            if (propertyName === 'then' || propertyName === 'catch' || propertyName === 'finally') {
              // Count the chain depth
              let depth = 1;
              let current = callee.object;

              while (
                current &&
                current.type === 'CallExpression' &&
                current.callee &&
                current.callee.type === 'MemberExpression'
              ) {
                const calleeProperty = current.callee.property;
                if (
                  calleeProperty &&
                  (calleeProperty.name === 'then' ||
                    calleeProperty.name === 'catch' ||
                    calleeProperty.name === 'finally')
                ) {
                  depth++;
                  current = current.callee.object;
                } else {
                  break;
                }
              }

              if (depth > 2) {
                chains++;
              }
            }
          }
        }
      },
    });

    return chains;
  }

  /**
   * Calculate movement score based on metrics
   */
  private calculateScore(metrics: MovementMetrics): number {
    let score = 100;

    // Cyclomatic complexity penalty (1-10: excellent, 11-20: good, 21+: poor)
    if (metrics.cyclomaticComplexity > 10) {
      const penalty = Math.min(30, (metrics.cyclomaticComplexity - 10) * 2);
      score -= penalty;
    }

    // Nesting depth penalty (1-3: good, 4-5: ok, 6+: bad)
    if (metrics.maxNestingDepth > 3) {
      const penalty = Math.min(20, (metrics.maxNestingDepth - 3) * 5);
      score -= penalty;
    }

    // Callback hell penalty
    if (metrics.callbackChains > 2) {
      const penalty = Math.min(15, (metrics.callbackChains - 2) * 5);
      score -= penalty;
    }

    // Early returns are good (bonus)
    const bonus = Math.min(10, metrics.earlyReturns * 2);
    score += bonus;

    // Exception jumps penalty
    const exceptionPenalty = Math.min(10, metrics.exceptionJumps * 2);
    score -= exceptionPenalty;

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Generate recommendations based on metrics
   */
  private generateRecommendations(metrics: MovementMetrics, ast: ASTNode): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // High complexity
    if (metrics.cyclomaticComplexity > 10) {
      recommendations.push({
        principle: 'movement',
        severity: metrics.cyclomaticComplexity > 20 ? 'critical' : 'warning',
        message: `Cyclomatic complexity is ${metrics.cyclomaticComplexity} (max recommended: 10). Split function into smaller units.`,
        estimatedImpact: Math.min(20, (metrics.cyclomaticComplexity - 10) * 2),
        suggestedFix: 'Extract complex logic into separate functions',
      });
    }

    // Deep nesting
    if (metrics.maxNestingDepth > 3) {
      recommendations.push({
        principle: 'movement',
        severity: metrics.maxNestingDepth > 5 ? 'critical' : 'warning',
        message: `Maximum nesting depth is ${metrics.maxNestingDepth} (recommended: 3). Extract nested logic into separate functions.`,
        estimatedImpact: Math.min(15, (metrics.maxNestingDepth - 3) * 5),
        suggestedFix: 'Use early returns or extract nested blocks into helper functions',
      });
    }

    // Callback chains
    if (metrics.callbackChains > 2) {
      recommendations.push({
        principle: 'movement',
        severity: 'warning',
        message: `Found ${metrics.callbackChains} callback chains. Use async/await instead of promise chains.`,
        estimatedImpact: Math.min(10, (metrics.callbackChains - 2) * 5),
        suggestedFix: 'Convert .then() chains to async/await syntax',
      });
    }

    // No early returns (potential for improvement)
    if (metrics.earlyReturns === 0) {
      const functions = findAllFunctions(ast);
      if (functions.length > 0 && functions.some(f => this.calculateCyclomaticComplexity(f) > 3)) {
        recommendations.push({
          principle: 'movement',
          severity: 'info',
          message: 'Consider using early returns to simplify control flow',
          estimatedImpact: 5,
          suggestedFix: 'Return early for edge cases instead of nesting',
        });
      }
    }

    return recommendations;
  }
}
