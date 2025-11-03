/**
 * Vincian Score Types
 * Type definitions for the v8.0 Vincian Score analysis system
 */

/**
 * Overall Vincian Score result
 */
export interface VincianScore {
  /** Overall score (0-100) */
  overall: number;

  /** Breakdown by principle */
  breakdown: VincianBreakdown;

  /** Letter grade (A+, A, B+, etc.) */
  grade: string;

  /** Prioritized recommendations for improvement */
  recommendations: Recommendation[];

  /** Confidence in the analysis (0-100) */
  confidence: number;

  /** Analysis metadata */
  metadata: AnalysisMetadata;
}

/**
 * Score breakdown by principle
 */
export interface VincianBreakdown {
  /** Movement (code flow) score */
  movement: number;

  /** Balance (symmetry) score */
  balance: number;

  /** Proportion (right-sizing) score */
  proportion: number;

  /** Contrast (clear distinctions) score */
  contrast: number;

  /** Unity (cohesion) score */
  unity: number;

  /** Simplicity (less is more) score */
  simplicity: number;

  /** Perspective (architectural view) score */
  perspective: number;
}

/**
 * Weights for composite scoring
 */
export interface VincianWeights {
  movement: number;
  balance: number;
  proportion: number;
  contrast: number;
  unity: number;
  simplicity: number;
  perspective: number;
}

/**
 * Default weights (from VINCIAN-SCORE-ALGORITHM.md)
 */
export const DEFAULT_WEIGHTS: VincianWeights = {
  movement: 1.2,
  balance: 1.0,
  proportion: 1.0,
  contrast: 1.1,
  unity: 1.15,
  simplicity: 1.25, // "Simplicity is the ultimate sophistication"
  perspective: 0.9,
};

/**
 * Recommendation for code improvement
 */
export interface Recommendation {
  /** Which principle this affects */
  principle: keyof VincianBreakdown;

  /** Severity level */
  severity: 'critical' | 'warning' | 'info';

  /** Human-readable message */
  message: string;

  /** Location in code (optional) */
  location?: CodeLocation;

  /** Suggested fix (optional) */
  suggestedFix?: string;

  /** Estimated score improvement if fixed */
  estimatedImpact: number;
}

/**
 * Code location reference
 */
export interface CodeLocation {
  file: string;
  line: number;
  column: number;
}

/**
 * Analysis metadata
 */
export interface AnalysisMetadata {
  /** Total lines of code analyzed */
  linesOfCode: number;

  /** Number of files analyzed */
  filesAnalyzed: number;

  /** Time taken for analysis (milliseconds) */
  analysisTime: number;

  /** Timestamp of analysis */
  timestamp: Date;
}

/**
 * Result from a single principle analyzer
 */
export interface PrincipleAnalysisResult {
  /** Score for this principle (0-100) */
  score: number;

  /** Recommendations from this analyzer */
  recommendations: Recommendation[];

  /** Metrics collected by this analyzer */
  metrics: Record<string, number>;
}

/**
 * Abstract Syntax Tree node (simplified)
 */
export interface ASTNode {
  type: string;
  start: number;
  end: number;
  loc?: {
    start: { line: number; column: number };
    end: { line: number; column: number };
  };
  [key: string]: any;
}

/**
 * Parsed code information
 */
export interface ParsedCode {
  /** AST root node */
  ast: ASTNode;

  /** Source code text */
  sourceCode: string;

  /** Programming language */
  language: string;

  /** File path */
  filePath?: string;
}

/**
 * Movement principle metrics
 */
export interface MovementMetrics {
  /** McCabe cyclomatic complexity */
  cyclomaticComplexity: number;

  /** Maximum nesting depth */
  maxNestingDepth: number;

  /** Number of callback chains (.then().then()) */
  callbackChains: number;

  /** Number of early returns */
  earlyReturns: number;

  /** Number of exception jumps (throw/catch) */
  exceptionJumps: number;
}

/**
 * Balance principle metrics
 */
export interface BalanceMetrics {
  /** Variance in file sizes */
  fileSizeVariance: number;

  /** Variance in function sizes */
  functionSizeVariance: number;

  /** Variance in class sizes */
  classSizeVariance: number;

  /** Methods per class distribution */
  methodsPerClass: number[];

  /** Lines per function distribution */
  linesPerFunction: number[];

  /** Coefficient of variation for functions */
  functionCV: number;

  /** Coefficient of variation for classes */
  classCV: number;
}

/**
 * Analysis options
 */
export interface AnalysisOptions {
  /** Custom weights for principles */
  weights?: Partial<VincianWeights>;

  /** Maximum analysis time (ms) */
  timeout?: number;

  /** Include detailed metrics in result */
  includeMetrics?: boolean;

  /** File path for context */
  filePath?: string;
}
