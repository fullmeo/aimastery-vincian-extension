# 🎨 Vincian Score Algorithm - Technical Specifications

**Version**: 1.0
**Date**: November 3, 2025
**Status**: Design Phase
**Target Release**: v8.0 (Week 4-6)

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [The 7 Principles - Detailed Algorithms](#the-7-principles---detailed-algorithms)
4. [Composite Scoring](#composite-scoring)
5. [Implementation Details](#implementation-details)
6. [Performance Considerations](#performance-considerations)
7. [Examples](#examples)
8. [Testing Strategy](#testing-strategy)

---

## Overview

### Purpose

The **Vincian Score** is an objective, reproducible metric that measures code quality through the lens of Leonardo da Vinci's artistic principles. It provides a single 0-100 score composed of 7 sub-scores.

### Key Principles

```
Vincian Score = Σ(weight_i × principle_i) / Σ(weight_i)

Where:
- principle_i ∈ {Movement, Balance, Proportion, Contrast, Unity, Simplicity, Perspective}
- weight_i = importance multiplier for each principle
- All scores normalized to 0-100 range
```

### Design Goals

- ✅ **Objective**: Same code → same score (deterministic)
- ✅ **Fast**: < 100ms for 1000 LOC
- ✅ **Explainable**: Show why a score is what it is
- ✅ **Actionable**: Suggest improvements
- ✅ **Language-agnostic**: Works for TypeScript, JavaScript, Python, Java, etc.

---

## Architecture

### Class Diagram

```
┌─────────────────────────┐
│   VincianScoreEngine    │
├─────────────────────────┤
│ + calculateScore()      │
│ + explainScore()        │
│ - parseAST()            │
└─────────────────────────┘
            │
            │ uses
            ▼
┌─────────────────────────┐
│  PrincipleAnalyzer      │ (abstract)
├─────────────────────────┤
│ + analyze()             │
│ + getScore()            │
│ + getRecommendations()  │
└─────────────────────────┘
            △
            │ implements
            │
    ┌───────┴────────┬──────────┬─────────┬──────────┬──────────┬──────────┐
    │                │          │         │          │          │          │
┌───┴───┐   ┌────┴────┐  ┌──┴───┐  ┌──┴───┐  ┌───┴───┐  ┌───┴───┐  ┌───┴───┐
│Movement│  │ Balance │  │Propor│  │Contra│  │ Unity │  │Simpli │  │Perspe │
│Analyzer│  │Analyzer │  │tion  │  │st    │  │Analyze│  │city   │  │ctive  │
└────────┘  └─────────┘  └──────┘  └──────┘  └───────┘  └───────┘  └───────┘
```

### Data Flow

```
Source Code
    │
    ├──> AST Parser (TypeScript/Babel)
    │
    ├──> 7 Principle Analyzers (parallel)
    │       │
    │       ├──> Movement:    0-100
    │       ├──> Balance:     0-100
    │       ├──> Proportion:  0-100
    │       ├──> Contrast:    0-100
    │       ├──> Unity:       0-100
    │       ├──> Simplicity:  0-100
    │       └──> Perspective: 0-100
    │
    └──> Composite Score Calculator
            │
            └──> Final Vincian Score: 0-100
                  + Detailed breakdown
                  + Recommendations
```

---

## The 7 Principles - Detailed Algorithms

### 1. Movement (Code Flow)

**Definition**: How smoothly does control flow through the code?

**Metrics**:
```typescript
MovementScore = 100 - (
  cyclomatic_complexity_penalty +
  callback_hell_penalty +
  goto_penalty +
  exception_flow_penalty
)
```

**Algorithm**:

```typescript
interface MovementMetrics {
  cyclomaticComplexity: number;      // McCabe complexity
  maxNestingDepth: number;           // Deepest nesting level
  callbackChains: number;            // .then().then().then() count
  earlyReturns: number;              // Early return statements
  exceptionJumps: number;            // throw/catch jumps
}

function analyzeMovement(ast: AST): MovementScore {
  const metrics: MovementMetrics = {
    cyclomaticComplexity: calculateMcCabe(ast),
    maxNestingDepth: findMaxNesting(ast),
    callbackChains: countCallbackChains(ast),
    earlyReturns: countEarlyReturns(ast),
    exceptionJumps: countExceptionJumps(ast)
  };

  // Penalties
  let score = 100;

  // Cyclomatic complexity penalty (1-10: excellent, 11-20: good, 21+: poor)
  if (metrics.cyclomaticComplexity > 10) {
    score -= Math.min(30, (metrics.cyclomaticComplexity - 10) * 2);
  }

  // Nesting depth penalty (1-3: good, 4-5: ok, 6+: bad)
  if (metrics.maxNestingDepth > 3) {
    score -= Math.min(20, (metrics.maxNestingDepth - 3) * 5);
  }

  // Callback hell penalty
  if (metrics.callbackChains > 2) {
    score -= Math.min(15, (metrics.callbackChains - 2) * 5);
  }

  // Early returns are good (bonus)
  score += Math.min(10, metrics.earlyReturns * 2);

  // Exception jumps penalty
  score -= Math.min(10, metrics.exceptionJumps * 2);

  return Math.max(0, Math.min(100, score));
}
```

**Recommendations**:
- CC > 10: "Split function into smaller units"
- Nesting > 3: "Extract nested logic into separate functions"
- Callbacks > 2: "Use async/await instead of callback chains"

---

### 2. Balance (Symmetry)

**Definition**: Are responsibilities distributed evenly?

**Metrics**:
```typescript
BalanceScore = 100 - (
  file_size_variance_penalty +
  function_size_variance_penalty +
  class_size_variance_penalty +
  responsibility_clustering_penalty
)
```

**Algorithm**:

```typescript
interface BalanceMetrics {
  fileSizeVariance: number;          // Variance in file sizes
  functionSizeVariance: number;      // Variance in function LOC
  classSizeVariance: number;         // Variance in class LOC
  methodsPerClass: number[];         // Methods per class distribution
  linesPerFunction: number[];        // Lines per function distribution
}

function analyzeBalance(ast: AST): BalanceScore {
  const metrics = extractBalanceMetrics(ast);

  let score = 100;

  // Calculate coefficient of variation (CV = std_dev / mean)
  const functionCV = coefficientOfVariation(metrics.linesPerFunction);
  const classCV = metrics.methodsPerClass.length > 0
    ? coefficientOfVariation(metrics.methodsPerClass)
    : 0;

  // Function size variance penalty (CV < 0.5: excellent, 0.5-1.0: good, >1.0: poor)
  if (functionCV > 0.5) {
    score -= Math.min(25, (functionCV - 0.5) * 30);
  }

  // Class size variance penalty
  if (classCV > 0.6) {
    score -= Math.min(20, (classCV - 0.6) * 25);
  }

  // Bonus for consistent sizing
  if (functionCV < 0.3) {
    score += 10;
  }

  // Penalty for extreme outliers (functions > 100 LOC)
  const longFunctions = metrics.linesPerFunction.filter(loc => loc > 100).length;
  score -= longFunctions * 5;

  return Math.max(0, Math.min(100, score));
}

function coefficientOfVariation(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  return stdDev / mean;
}
```

**Recommendations**:
- Function CV > 1.0: "Split large functions to match average size"
- Long functions: "Function X has 150 LOC, consider extracting logic"

---

### 3. Proportion (Right-Sizing)

**Definition**: Is each component the right size for its purpose?

**Metrics**:
```typescript
ProportionScore = 100 - (
  god_class_penalty +
  god_function_penalty +
  anemic_class_penalty +
  parameter_list_penalty
)
```

**Algorithm**:

```typescript
interface ProportionMetrics {
  avgFunctionSize: number;           // Average function LOC
  avgClassSize: number;              // Average class LOC
  avgParameterCount: number;         // Average parameters per function
  singleResponsibilityViolations: number;
}

function analyzeProportion(ast: AST): ProportionScore {
  const metrics = extractProportionMetrics(ast);

  let score = 100;

  // Ideal ranges
  const idealFunctionSize = { min: 5, max: 25 };
  const idealClassSize = { min: 50, max: 300 };
  const idealParams = { min: 0, max: 3 };

  // Function size penalty
  if (metrics.avgFunctionSize < idealFunctionSize.min) {
    score -= 10; // Too granular
  } else if (metrics.avgFunctionSize > idealFunctionSize.max) {
    score -= Math.min(30, (metrics.avgFunctionSize - idealFunctionSize.max) * 2);
  }

  // Class size penalty
  if (metrics.avgClassSize > idealClassSize.max) {
    score -= Math.min(25, (metrics.avgClassSize - idealClassSize.max) / 10);
  }

  // Parameter count penalty (> 3 params = code smell)
  if (metrics.avgParameterCount > idealParams.max) {
    score -= Math.min(20, (metrics.avgParameterCount - idealParams.max) * 5);
  }

  // SRP violations
  score -= metrics.singleResponsibilityViolations * 5;

  return Math.max(0, Math.min(100, score));
}
```

**Recommendations**:
- Avg function > 25 LOC: "Functions are too large, extract logic"
- Avg params > 3: "Use parameter objects instead of long parameter lists"
- Class > 300 LOC: "Class X is too large, consider splitting"

---

### 4. Contrast (Clear Distinctions)

**Definition**: Are boundaries and roles clearly defined?

**Metrics**:
```typescript
ContrastScore = 100 - (
  naming_ambiguity_penalty +
  type_confusion_penalty +
  visibility_violation_penalty +
  boundary_blur_penalty
)
```

**Algorithm**:

```typescript
interface ContrastMetrics {
  namingClarity: number;             // 0-100, higher = clearer
  typeAnnotationCoverage: number;    // % of functions with types
  publicPrivateRatio: number;        // public/private members ratio
  interfaceCompliance: number;       // % adherence to declared interfaces
  layerViolations: number;           // Cross-layer boundary violations
}

function analyzeContrast(ast: AST): ContrastScore {
  const metrics = extractContrastMetrics(ast);

  let score = 100;

  // Naming clarity (based on semantic analysis)
  // Variables named a, b, x, tmp = low clarity
  // Variables named userRepository, totalPrice = high clarity
  score -= (100 - metrics.namingClarity) * 0.2;

  // Type annotation coverage (TypeScript only)
  if (metrics.typeAnnotationCoverage < 80) {
    score -= (80 - metrics.typeAnnotationCoverage) / 4; // Max 20 penalty
  }

  // Public/private ratio (ideal: 30% public, 70% private)
  const idealRatio = 0.43; // 30/70
  const ratioDiff = Math.abs(metrics.publicPrivateRatio - idealRatio);
  if (ratioDiff > 0.2) {
    score -= Math.min(15, ratioDiff * 30);
  }

  // Layer violations (e.g., UI calling DB directly)
  score -= metrics.layerViolations * 10;

  return Math.max(0, Math.min(100, score));
}
```

**Recommendations**:
- Naming clarity < 60: "Use more descriptive variable names"
- Type coverage < 80%: "Add type annotations for better clarity"
- Layer violations > 0: "Respect architectural boundaries"

---

### 5. Unity (Cohesion)

**Definition**: Do related things stay together?

**Metrics**:
```typescript
UnityScore = (
  lack_of_cohesion_metric +
  module_coupling_metric +
  data_class_detection +
  feature_envy_detection
)
```

**Algorithm**:

```typescript
interface UnityMetrics {
  lackOfCohesion: number;            // LCOM4 metric (0-1, lower = better)
  afferentCoupling: number;          // Ca (incoming dependencies)
  efferentCoupling: number;          // Ce (outgoing dependencies)
  featureEnvyCases: number;          // Methods using external data more than own
  dataClassCount: number;            // Classes with only getters/setters
}

function analyzeUnity(ast: AST): UnityScore {
  const metrics = extractUnityMetrics(ast);

  let score = 100;

  // LCOM4 penalty (Lack of Cohesion of Methods)
  // LCOM4 = 0: perfect cohesion, LCOM4 = 1: no cohesion
  score -= metrics.lackOfCohesion * 40; // Max 40 penalty

  // Coupling penalty (ideal: low efferent, high afferent)
  const instability = metrics.efferentCoupling /
    (metrics.afferentCoupling + metrics.efferentCoupling + 1);

  if (instability > 0.7) {
    score -= (instability - 0.7) * 50; // Max 15 penalty
  }

  // Feature envy penalty (method using more external than internal data)
  score -= metrics.featureEnvyCases * 5;

  // Data class penalty (anemic domain model)
  score -= metrics.dataClassCount * 3;

  return Math.max(0, Math.min(100, score));
}
```

**Recommendations**:
- LCOM > 0.5: "Class has low cohesion, consider splitting"
- Feature envy: "Method X accesses Class Y more than its own data, move it"
- Data classes: "Add behavior to data classes"

---

### 6. Simplicity (Less is More)

**Definition**: Is the code as simple as it can be?

**Metrics**:
```typescript
SimplicityScore = 100 - (
  unnecessary_abstraction_penalty +
  premature_optimization_penalty +
  over_engineering_penalty +
  dead_code_penalty
)
```

**Algorithm**:

```typescript
interface SimplicityMetrics {
  abstractionLayers: number;         // Number of abstraction layers
  designPatternCount: number;        // Number of design patterns used
  deadCodePercentage: number;        // % of unreachable/unused code
  unnecessaryInterfaces: number;     // Interfaces with single implementation
  magicNumbers: number;              // Literals without meaning
}

function analyzeSimplicity(ast: AST): SimplicityScore {
  const metrics = extractSimplicityMetrics(ast);

  let score = 100;

  // Abstraction layers penalty (ideal: 2-4 layers)
  if (metrics.abstractionLayers > 5) {
    score -= (metrics.abstractionLayers - 5) * 5;
  }

  // Over-engineering penalty (too many patterns for codebase size)
  const loc = getTotalLOC(ast);
  const patternsPerKLOC = (metrics.designPatternCount / loc) * 1000;
  if (patternsPerKLOC > 3) { // More than 3 patterns per 1000 LOC
    score -= Math.min(20, (patternsPerKLOC - 3) * 5);
  }

  // Dead code penalty
  score -= metrics.deadCodePercentage * 0.3; // Max 30 if 100% dead code

  // Unnecessary interfaces (single implementation)
  score -= metrics.unnecessaryInterfaces * 3;

  // Magic numbers penalty
  score -= Math.min(15, metrics.magicNumbers * 0.5);

  return Math.max(0, Math.min(100, score));
}
```

**Recommendations**:
- Abstraction layers > 5: "Reduce indirection, simplify call chain"
- Dead code > 10%: "Remove unused code"
- Magic numbers: "Extract constants for literal values"

---

### 7. Perspective (Architectural View)

**Definition**: Can you see the big picture from any point?

**Metrics**:
```typescript
PerspectiveScore = (
  documentation_quality +
  architectural_clarity +
  dependency_graph_health +
  module_structure_score
)
```

**Algorithm**:

```typescript
interface PerspectiveMetrics {
  documentationCoverage: number;     // % of public APIs documented
  architecturalPatternAdherence: number; // 0-100, follows declared pattern
  circularDependencies: number;      // Circular dependency count
  moduleDepth: number;               // Max depth of module tree
  namespaceClarity: number;          // 0-100, namespace organization
}

function analyzePerspective(ast: AST): PerspectiveScore {
  const metrics = extractPerspectiveMetrics(ast);

  let score = 100;

  // Documentation coverage (ideal: 80%+)
  if (metrics.documentationCoverage < 80) {
    score -= (80 - metrics.documentationCoverage) / 4; // Max 20 penalty
  }

  // Architectural pattern adherence
  score -= (100 - metrics.architecturalPatternAdherence) * 0.2; // Max 20

  // Circular dependencies (each is a major issue)
  score -= metrics.circularDependencies * 10;

  // Module depth penalty (ideal: 3-5 levels)
  if (metrics.moduleDepth > 6) {
    score -= (metrics.moduleDepth - 6) * 5;
  }

  // Namespace clarity bonus
  score += (metrics.namespaceClarity - 70) * 0.1; // Bonus if > 70

  return Math.max(0, Math.min(100, score));
}
```

**Recommendations**:
- Doc coverage < 80%: "Add documentation to public APIs"
- Circular deps: "Break circular dependency between Module A and B"
- Module depth > 6: "Flatten module hierarchy"

---

## Composite Scoring

### Weighted Average

```typescript
interface VincianWeights {
  movement: number;
  balance: number;
  proportion: number;
  contrast: number;
  unity: number;
  simplicity: number;
  perspective: number;
}

// Default weights (tuned based on industry research)
const DEFAULT_WEIGHTS: VincianWeights = {
  movement: 1.2,      // Slightly higher (affects readability most)
  balance: 1.0,
  proportion: 1.0,
  contrast: 1.1,      // Important for maintainability
  unity: 1.15,        // Cohesion is critical
  simplicity: 1.25,   // "Simplicity is the ultimate sophistication" - da Vinci
  perspective: 0.9    // Important but less immediate impact
};

function calculateVincianScore(
  scores: Record<string, number>,
  weights: VincianWeights = DEFAULT_WEIGHTS
): VincianScore {
  const weightedSum =
    scores.movement * weights.movement +
    scores.balance * weights.balance +
    scores.proportion * weights.proportion +
    scores.contrast * weights.contrast +
    scores.unity * weights.unity +
    scores.simplicity * weights.simplicity +
    scores.perspective * weights.perspective;

  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);

  const finalScore = Math.round(weightedSum / totalWeight);

  return {
    overall: finalScore,
    breakdown: scores,
    grade: getGrade(finalScore),
    recommendations: generateRecommendations(scores),
    confidence: calculateConfidence(scores)
  };
}

function getGrade(score: number): string {
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
```

### Confidence Score

Indicates how confident the algorithm is in its assessment:

```typescript
function calculateConfidence(scores: Record<string, number>): number {
  // Higher variance in scores = lower confidence
  const values = Object.values(scores);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, val) =>
    sum + Math.pow(val - mean, 2), 0
  ) / values.length;
  const stdDev = Math.sqrt(variance);

  // Low variance = high confidence
  // High variance = low confidence
  const confidence = Math.max(0, 100 - (stdDev * 2));

  return Math.round(confidence);
}
```

---

## Implementation Details

### Interface Definitions

```typescript
interface VincianScore {
  overall: number;                   // 0-100
  breakdown: {
    movement: number;
    balance: number;
    proportion: number;
    contrast: number;
    unity: number;
    simplicity: number;
    perspective: number;
  };
  grade: string;                     // 'A+', 'A', 'B+', etc.
  recommendations: Recommendation[];
  confidence: number;                // 0-100
  metadata: {
    linesOfCode: number;
    filesAnalyzed: number;
    analysisTime: number;            // milliseconds
    timestamp: Date;
  };
}

interface Recommendation {
  principle: string;                 // Which principle triggered this
  severity: 'critical' | 'warning' | 'info';
  message: string;
  location?: {
    file: string;
    line: number;
    column: number;
  };
  suggestedFix?: string;
  estimatedImpact: number;           // +X points if fixed
}
```

### Main Engine

```typescript
class VincianScoreEngine {
  private analyzers: Map<string, PrincipleAnalyzer>;
  private weights: VincianWeights;

  constructor(weights?: VincianWeights) {
    this.weights = weights || DEFAULT_WEIGHTS;
    this.initializeAnalyzers();
  }

  private initializeAnalyzers(): void {
    this.analyzers = new Map([
      ['movement', new MovementAnalyzer()],
      ['balance', new BalanceAnalyzer()],
      ['proportion', new ProportionAnalyzer()],
      ['contrast', new ContrastAnalyzer()],
      ['unity', new UnityAnalyzer()],
      ['simplicity', new SimplicityAnalyzer()],
      ['perspective', new PerspectiveAnalyzer()]
    ]);
  }

  async calculateScore(
    sourceCode: string,
    language: string
  ): Promise<VincianScore> {
    const startTime = Date.now();

    // Parse AST
    const ast = await this.parseAST(sourceCode, language);

    // Run all analyzers in parallel
    const scores: Record<string, number> = {};
    const recommendations: Recommendation[] = [];

    await Promise.all(
      Array.from(this.analyzers.entries()).map(async ([name, analyzer]) => {
        const result = await analyzer.analyze(ast);
        scores[name] = result.score;
        recommendations.push(...result.recommendations);
      })
    );

    // Calculate composite score
    const vincianScore = calculateVincianScore(scores, this.weights);

    // Add metadata
    vincianScore.metadata = {
      linesOfCode: sourceCode.split('\n').length,
      filesAnalyzed: 1,
      analysisTime: Date.now() - startTime,
      timestamp: new Date()
    };

    vincianScore.recommendations = this.prioritizeRecommendations(recommendations);

    return vincianScore;
  }

  private async parseAST(sourceCode: string, language: string): Promise<AST> {
    // Use TypeScript compiler API or Babel parser
    // Implementation depends on language
    switch (language) {
      case 'typescript':
      case 'javascript':
        return parseTypeScriptAST(sourceCode);
      case 'python':
        return parsePythonAST(sourceCode);
      default:
        throw new Error(`Language ${language} not supported`);
    }
  }

  private prioritizeRecommendations(
    recommendations: Recommendation[]
  ): Recommendation[] {
    return recommendations
      .sort((a, b) => {
        // Sort by severity first
        const severityOrder = { critical: 0, warning: 1, info: 2 };
        const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
        if (severityDiff !== 0) return severityDiff;

        // Then by estimated impact
        return (b.estimatedImpact || 0) - (a.estimatedImpact || 0);
      })
      .slice(0, 10); // Top 10 recommendations
  }
}
```

---

## Performance Considerations

### Caching Strategy

```typescript
class VincianScoreCache {
  private cache: Map<string, CacheEntry>;
  private ttl: number = 5 * 60 * 1000; // 5 minutes

  async getOrCompute(
    key: string,
    computeFn: () => Promise<VincianScore>
  ): Promise<VincianScore> {
    const cached = this.cache.get(key);

    if (cached && Date.now() - cached.timestamp < this.ttl) {
      return cached.score;
    }

    const score = await computeFn();
    this.cache.set(key, { score, timestamp: Date.now() });

    return score;
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }
}
```

### Performance Targets

| Codebase Size | Target Time | Max Memory |
|---------------|-------------|------------|
| < 1K LOC      | < 50ms      | < 50MB     |
| 1K-10K LOC    | < 500ms     | < 200MB    |
| 10K-100K LOC  | < 5s        | < 500MB    |
| 100K+ LOC     | < 30s       | < 1GB      |

### Optimization Techniques

1. **Parallel Analysis**: Run all 7 analyzers concurrently
2. **Incremental Analysis**: Only re-analyze changed files
3. **AST Caching**: Cache parsed ASTs with content hash
4. **Early Exit**: Stop analysis if file is too large (> 10K LOC per file)
5. **Worker Threads**: Use Web Workers for CPU-intensive calculations

---

## Examples

### Example 1: Perfect Score (95+)

```typescript
/**
 * Calculates the total price of items in a shopping cart
 *
 * @param items - Array of cart items
 * @returns Total price in cents
 */
export function calculateTotalPrice(items: CartItem[]): number {
  if (items.length === 0) {
    return 0;
  }

  return items.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);
}

interface CartItem {
  price: number;
  quantity: number;
}
```

**Vincian Score**: 96/100

**Breakdown**:
- Movement: 100 (CC=1, no nesting)
- Balance: 95 (perfectly sized)
- Proportion: 98 (8 LOC, 1 param)
- Contrast: 100 (clear types, good naming)
- Unity: 95 (single responsibility)
- Simplicity: 98 (no unnecessary abstraction)
- Perspective: 95 (well documented)

---

### Example 2: Poor Score (< 50)

```typescript
function proc(d) {
  var r = 0;
  for (var i = 0; i < d.length; i++) {
    if (d[i].t == 'A') {
      if (d[i].s) {
        if (d[i].q > 0) {
          r += d[i].p * d[i].q;
        } else {
          console.log('err');
        }
      }
    } else if (d[i].t == 'B') {
      r += d[i].p;
    }
  }
  return r;
}
```

**Vincian Score**: 38/100

**Breakdown**:
- Movement: 25 (CC=6, deep nesting)
- Balance: 60 (acceptable size but poor structure)
- Proportion: 45 (function doing too much)
- Contrast: 15 (terrible naming, no types)
- Unity: 40 (low cohesion, mixed concerns)
- Simplicity: 30 (nested ifs, magic strings)
- Perspective: 0 (no documentation)

**Recommendations**:
1. CRITICAL: Add type annotations (+20 points)
2. CRITICAL: Use descriptive variable names (+15 points)
3. WARNING: Extract nested logic into separate functions (+10 points)
4. WARNING: Replace magic strings with enums (+5 points)
5. INFO: Add JSDoc documentation (+5 points)

---

## Testing Strategy

### Unit Tests

```typescript
describe('VincianScoreEngine', () => {
  describe('Movement Analyzer', () => {
    test('should score 100 for linear flow', () => {
      const code = `
        function add(a: number, b: number): number {
          return a + b;
        }
      `;
      const score = new MovementAnalyzer().analyze(parse(code));
      expect(score.score).toBe(100);
    });

    test('should penalize deep nesting', () => {
      const code = `
        function nested() {
          if (a) {
            if (b) {
              if (c) {
                if (d) {
                  return x;
                }
              }
            }
          }
        }
      `;
      const score = new MovementAnalyzer().analyze(parse(code));
      expect(score.score).toBeLessThan(50);
    });
  });

  // Similar tests for other analyzers...
});
```

### Integration Tests

```typescript
describe('End-to-End Scoring', () => {
  test('should score real-world code correctly', async () => {
    const engine = new VincianScoreEngine();
    const sourceCode = await readFile('examples/good-code.ts');

    const result = await engine.calculateScore(sourceCode, 'typescript');

    expect(result.overall).toBeGreaterThan(80);
    expect(result.breakdown.movement).toBeGreaterThan(75);
    expect(result.recommendations.length).toBeLessThan(5);
  });
});
```

### Regression Tests

Maintain a corpus of 100+ code samples with known scores to prevent regressions.

---

## Next Steps

1. **Week 4**: Implement core engine + Movement analyzer
2. **Week 5**: Implement remaining 6 analyzers
3. **Week 6**: Integration, testing, optimization
4. **Week 7**: VS Code UI integration

---

**Status**: ✅ Specification Complete
**Next**: Implementation Phase

*"Simplicity is the ultimate sophistication." - Leonardo da Vinci*
