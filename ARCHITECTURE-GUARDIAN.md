# 🛡️ Architecture Guardian - Technical Specifications

**Version**: 1.0
**Date**: November 3, 2025
**Status**: Design Phase
**Target Release**: v8.0 (Week 7-9)

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [The 12 Commandments](#the-12-commandments)
3. [Detection Algorithms](#detection-algorithms)
4. [Enforcement System](#enforcement-system)
5. [Auto-Fix Engine](#auto-fix-engine)
6. [Integration with Vincian Score](#integration-with-vincian-score)
7. [Implementation Details](#implementation-details)
8. [Examples](#examples)

---

## Overview

### Purpose

The **Architecture Guardian** is an intelligent system that monitors code changes in real-time and enforces architectural best practices. It acts as a "guardian angel" that prevents architectural decay before it happens.

### Core Concept

```
Real-time Code Change
    ↓
Architecture Guardian Analysis (< 100ms)
    ↓
Violation Detected?
    ├─ YES → Show Warning + Suggest Fix → One-Click Fix Available
    └─ NO  → Allow Change
```

### Design Goals

- ✅ **Real-time**: Detect violations as code is written (< 100ms)
- ✅ **Proactive**: Prevent issues before they're committed
- ✅ **Educational**: Explain WHY something is wrong
- ✅ **Actionable**: Provide one-click fixes
- ✅ **Non-intrusive**: Can be disabled per project/rule

---

## The 12 Commandments

### 1. Thou Shalt Respect Layer Boundaries

**Rule**: Code in layer N shall not access layer N+2 or higher directly.

**Example Violation**:
```typescript
// ❌ VIOLATION: UI layer accessing Database directly
// src/ui/components/UserProfile.tsx
import { executeQuery } from '../../database/query-executor';

function UserProfile() {
  const userData = executeQuery('SELECT * FROM users'); // BAD!
}
```

**Correct Approach**:
```typescript
// ✅ CORRECT: UI → Service → Repository → Database
// src/ui/components/UserProfile.tsx
import { userService } from '../../services/user-service';

function UserProfile() {
  const userData = userService.getCurrentUser(); // GOOD!
}
```

**Detection Algorithm**:
```typescript
interface LayerRule {
  layer: string;
  canImportFrom: string[];
  cannotImportFrom: string[];
}

const LAYER_RULES: LayerRule[] = [
  {
    layer: 'ui',
    canImportFrom: ['services', 'shared', 'types'],
    cannotImportFrom: ['database', 'infrastructure']
  },
  {
    layer: 'services',
    canImportFrom: ['repositories', 'shared', 'types'],
    cannotImportFrom: ['ui', 'database']
  },
  {
    layer: 'repositories',
    canImportFrom: ['database', 'shared', 'types'],
    cannotImportFrom: ['ui', 'services']
  }
];

function detectLayerViolation(
  file: string,
  importPath: string
): Violation | null {
  const currentLayer = getLayerFromPath(file);
  const importedLayer = getLayerFromPath(importPath);

  const rule = LAYER_RULES.find(r => r.layer === currentLayer);
  if (!rule) return null;

  if (rule.cannotImportFrom.includes(importedLayer)) {
    return {
      commandment: 1,
      severity: 'error',
      message: `Layer violation: ${currentLayer} cannot import from ${importedLayer}`,
      file,
      suggestedFix: generateLayerFix(file, importPath)
    };
  }

  return null;
}
```

---

### 2. Thou Shalt Not Create Circular Dependencies

**Rule**: Module A shall not depend on Module B if B already depends on A (directly or transitively).

**Example Violation**:
```typescript
// ❌ VIOLATION: Circular dependency
// src/services/user-service.ts
import { OrderService } from './order-service';

// src/services/order-service.ts
import { UserService } from './user-service'; // CIRCULAR!
```

**Correct Approach**:
```typescript
// ✅ CORRECT: Extract shared logic to new module
// src/services/shared/user-order-bridge.ts
export class UserOrderBridge {
  constructor(
    private userService: UserService,
    private orderService: OrderService
  ) {}
}
```

**Detection Algorithm**:
```typescript
class DependencyGraph {
  private graph: Map<string, Set<string>> = new Map();

  addDependency(from: string, to: string): void {
    if (!this.graph.has(from)) {
      this.graph.set(from, new Set());
    }
    this.graph.get(from)!.add(to);
  }

  detectCycles(): string[][] {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const cycles: string[][] = [];

    const dfs = (node: string, path: string[]): void => {
      visited.add(node);
      recursionStack.add(node);
      path.push(node);

      const neighbors = this.graph.get(node) || new Set();

      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          dfs(neighbor, [...path]);
        } else if (recursionStack.has(neighbor)) {
          // Cycle detected!
          const cycleStart = path.indexOf(neighbor);
          cycles.push(path.slice(cycleStart));
        }
      }

      recursionStack.delete(node);
    };

    for (const node of this.graph.keys()) {
      if (!visited.has(node)) {
        dfs(node, []);
      }
    }

    return cycles;
  }
}

function detectCircularDependencies(
  workspace: string
): Violation[] {
  const graph = buildDependencyGraph(workspace);
  const cycles = graph.detectCycles();

  return cycles.map(cycle => ({
    commandment: 2,
    severity: 'error',
    message: `Circular dependency detected: ${cycle.join(' → ')}`,
    affectedFiles: cycle,
    suggestedFix: generateCircularDependencyFix(cycle)
  }));
}
```

---

### 3. Thou Shalt Maintain High Cohesion

**Rule**: Classes/modules shall have a single, well-defined purpose (LCOM < 0.5).

**Example Violation**:
```typescript
// ❌ VIOLATION: Low cohesion (God class)
class UserManager {
  createUser() { }
  deleteUser() { }
  sendEmail() { }           // Email logic doesn't belong here
  generateReport() { }      // Reporting doesn't belong here
  validateCreditCard() { }  // Payment logic doesn't belong here
}
```

**Correct Approach**:
```typescript
// ✅ CORRECT: High cohesion (single responsibility)
class UserService {
  createUser() { }
  deleteUser() { }
}

class EmailService {
  sendEmail() { }
}

class ReportService {
  generateReport() { }
}

class PaymentService {
  validateCreditCard() { }
}
```

**Detection Algorithm**:
```typescript
function calculateLCOM4(classNode: ClassDeclaration): number {
  // LCOM4: Lack of Cohesion of Methods
  // Lower is better (0 = perfect cohesion)

  const methods = classNode.methods;
  const fields = classNode.fields;

  // Build graph of method-field relationships
  const methodFieldUsage: Map<string, Set<string>> = new Map();

  for (const method of methods) {
    const usedFields = findFieldsUsedInMethod(method);
    methodFieldUsage.set(method.name, usedFields);
  }

  // Count connected components
  const components = findConnectedComponents(methodFieldUsage);

  // LCOM4 = (number of components - 1) / (number of methods - 1)
  const lcom4 = methods.length > 1
    ? (components - 1) / (methods.length - 1)
    : 0;

  return lcom4;
}

function detectLowCohesion(classNode: ClassDeclaration): Violation | null {
  const lcom4 = calculateLCOM4(classNode);

  if (lcom4 > 0.5) {
    return {
      commandment: 3,
      severity: 'warning',
      message: `Class "${classNode.name}" has low cohesion (LCOM4: ${lcom4.toFixed(2)})`,
      location: classNode.location,
      suggestedFix: generateCohesionFix(classNode)
    };
  }

  return null;
}
```

---

### 4. Thou Shalt Minimize Coupling

**Rule**: Modules shall depend on abstractions, not concrete implementations (Dependency Inversion Principle).

**Example Violation**:
```typescript
// ❌ VIOLATION: High coupling to concrete class
class OrderService {
  private logger = new ConsoleLogger(); // Tightly coupled!

  createOrder() {
    this.logger.log('Creating order');
  }
}
```

**Correct Approach**:
```typescript
// ✅ CORRECT: Depend on abstraction
interface ILogger {
  log(message: string): void;
}

class OrderService {
  constructor(private logger: ILogger) { } // Injected dependency

  createOrder() {
    this.logger.log('Creating order');
  }
}
```

**Detection Algorithm**:
```typescript
function detectTightCoupling(classNode: ClassDeclaration): Violation[] {
  const violations: Violation[] = [];

  // Check for "new" instantiations (tight coupling)
  const newExpressions = findNewExpressions(classNode);

  for (const newExpr of newExpressions) {
    // Allow "new" for value objects, data classes
    if (!isValueObject(newExpr.type)) {
      violations.push({
        commandment: 4,
        severity: 'warning',
        message: `Tight coupling detected: using "new ${newExpr.type}" instead of dependency injection`,
        location: newExpr.location,
        suggestedFix: generateDependencyInjectionFix(classNode, newExpr)
      });
    }
  }

  return violations;
}
```

---

### 5. Thou Shalt Write Tests

**Rule**: Every public function shall have at least one test (minimum 80% coverage).

**Example Violation**:
```typescript
// ❌ VIOLATION: No tests
// src/services/payment-service.ts
export class PaymentService {
  processPayment(amount: number) {
    // Critical business logic with NO TESTS!
  }
}
```

**Correct Approach**:
```typescript
// ✅ CORRECT: Tests exist
// src/services/payment-service.test.ts
describe('PaymentService', () => {
  test('should process payment successfully', () => {
    const service = new PaymentService();
    const result = service.processPayment(100);
    expect(result.success).toBe(true);
  });
});
```

**Detection Algorithm**:
```typescript
function detectMissingTests(
  sourceFiles: string[],
  testFiles: string[]
): Violation[] {
  const violations: Violation[] = [];

  for (const sourceFile of sourceFiles) {
    const expectedTestFile = getTestFilePath(sourceFile);

    if (!testFiles.includes(expectedTestFile)) {
      violations.push({
        commandment: 5,
        severity: 'warning',
        message: `Missing test file for ${sourceFile}`,
        file: sourceFile,
        suggestedFix: generateTestBoilerplate(sourceFile)
      });
    }
  }

  return violations;
}
```

---

### 6. Thou Shalt Document Public APIs

**Rule**: All public classes, methods, and interfaces shall have JSDoc/TSDoc documentation.

**Example Violation**:
```typescript
// ❌ VIOLATION: No documentation
export function calculateTax(amount: number, rate: number): number {
  return amount * rate;
}
```

**Correct Approach**:
```typescript
// ✅ CORRECT: Well documented
/**
 * Calculates the tax amount based on the given amount and rate
 *
 * @param amount - The base amount to calculate tax on
 * @param rate - The tax rate (e.g., 0.08 for 8%)
 * @returns The calculated tax amount
 * @example
 * calculateTax(100, 0.08) // Returns 8
 */
export function calculateTax(amount: number, rate: number): number {
  return amount * rate;
}
```

**Detection Algorithm**:
```typescript
function detectMissingDocumentation(
  node: FunctionDeclaration | ClassDeclaration
): Violation | null {
  // Only check public/exported members
  if (!isPublic(node)) return null;

  const hasJSDoc = node.jsDoc && node.jsDoc.length > 0;

  if (!hasJSDoc) {
    return {
      commandment: 6,
      severity: 'info',
      message: `Missing documentation for public ${node.kind} "${node.name}"`,
      location: node.location,
      suggestedFix: generateDocumentationTemplate(node)
    };
  }

  return null;
}
```

---

### 7. Thou Shalt Not Commit Dead Code

**Rule**: No unreachable code, unused imports, or commented-out code shall remain in the codebase.

**Example Violation**:
```typescript
// ❌ VIOLATION: Dead code
import { OldService } from './old-service'; // Unused import

function calculate() {
  return 42;
  console.log('This will never run'); // Unreachable code
}

// function oldImplementation() {
//   return 0;
// } // Commented-out code
```

**Correct Approach**:
```typescript
// ✅ CORRECT: Clean code
function calculate() {
  return 42;
}
```

**Detection Algorithm**:
```typescript
function detectDeadCode(ast: AST): Violation[] {
  const violations: Violation[] = [];

  // 1. Unused imports
  const unusedImports = findUnusedImports(ast);
  for (const imp of unusedImports) {
    violations.push({
      commandment: 7,
      severity: 'info',
      message: `Unused import: ${imp.name}`,
      location: imp.location,
      suggestedFix: { type: 'remove', range: imp.range }
    });
  }

  // 2. Unreachable code
  const unreachableCode = findUnreachableCode(ast);
  for (const code of unreachableCode) {
    violations.push({
      commandment: 7,
      severity: 'warning',
      message: 'Unreachable code detected',
      location: code.location,
      suggestedFix: { type: 'remove', range: code.range }
    });
  }

  // 3. Commented-out code
  const commentedCode = findCommentedCode(ast);
  for (const comment of commentedCode) {
    violations.push({
      commandment: 7,
      severity: 'info',
      message: 'Commented-out code detected',
      location: comment.location,
      suggestedFix: { type: 'remove', range: comment.range }
    });
  }

  return violations;
}
```

---

### 8. Thou Shalt Keep Functions Small

**Rule**: Functions shall be no longer than 25 lines (excluding whitespace and comments).

**Example Violation**:
```typescript
// ❌ VIOLATION: Function too long (50+ lines)
function processOrder(order: Order) {
  // ... 50 lines of logic
}
```

**Correct Approach**:
```typescript
// ✅ CORRECT: Extracted into smaller functions
function processOrder(order: Order) {
  validateOrder(order);
  calculateTotals(order);
  applyDiscounts(order);
  finalizeOrder(order);
}

function validateOrder(order: Order) { /* ... */ }
function calculateTotals(order: Order) { /* ... */ }
function applyDiscounts(order: Order) { /* ... */ }
function finalizeOrder(order: Order) { /* ... */ }
```

**Detection Algorithm**:
```typescript
function detectLongFunctions(
  functionNode: FunctionDeclaration
): Violation | null {
  const lineCount = countLinesOfCode(functionNode); // Excludes comments/whitespace

  if (lineCount > 25) {
    return {
      commandment: 8,
      severity: 'warning',
      message: `Function "${functionNode.name}" is too long (${lineCount} lines, max: 25)`,
      location: functionNode.location,
      suggestedFix: generateFunctionExtractionSuggestions(functionNode)
    };
  }

  return null;
}
```

---

### 9. Thou Shalt Use Meaningful Names

**Rule**: Variables, functions, and classes shall have descriptive names (minimum 3 characters, no abbreviations except standard ones).

**Example Violation**:
```typescript
// ❌ VIOLATION: Cryptic names
function calc(u, p) {
  const t = u * p;
  return t;
}
```

**Correct Approach**:
```typescript
// ✅ CORRECT: Descriptive names
function calculateTotal(unitPrice: number, quantity: number): number {
  const total = unitPrice * quantity;
  return total;
}
```

**Detection Algorithm**:
```typescript
function detectPoorNaming(identifier: Identifier): Violation | null {
  const name = identifier.name;

  // Check for single-letter names (except common loop vars)
  if (name.length === 1 && !['i', 'j', 'k', 'x', 'y', 'z'].includes(name)) {
    return {
      commandment: 9,
      severity: 'warning',
      message: `Single-letter variable name "${name}" should be more descriptive`,
      location: identifier.location,
      suggestedFix: { type: 'rename', suggestions: generateNameSuggestions(identifier) }
    };
  }

  // Check for abbreviations
  const commonAbbreviations = ['http', 'url', 'api', 'id', 'db'];
  if (name.length < 3 && !commonAbbreviations.includes(name.toLowerCase())) {
    return {
      commandment: 9,
      severity: 'info',
      message: `Abbreviated name "${name}" should be spelled out`,
      location: identifier.location,
      suggestedFix: { type: 'rename', suggestions: [] }
    };
  }

  return null;
}
```

---

### 10. Thou Shalt Handle Errors Gracefully

**Rule**: All async operations and external calls shall have proper error handling.

**Example Violation**:
```typescript
// ❌ VIOLATION: No error handling
async function fetchUserData(userId: string) {
  const response = await fetch(`/api/users/${userId}`); // What if this fails?
  return response.json();
}
```

**Correct Approach**:
```typescript
// ✅ CORRECT: Proper error handling
async function fetchUserData(userId: string): Promise<User | null> {
  try {
    const response = await fetch(`/api/users/${userId}`);

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to fetch user data:', error);
    return null;
  }
}
```

**Detection Algorithm**:
```typescript
function detectMissingErrorHandling(
  functionNode: FunctionDeclaration
): Violation[] {
  const violations: Violation[] = [];

  // Find all async operations
  const asyncCalls = findAsyncOperations(functionNode);

  for (const call of asyncCalls) {
    const hasTryCatch = isWrappedInTryCatch(call);

    if (!hasTryCatch) {
      violations.push({
        commandment: 10,
        severity: 'warning',
        message: `Async operation "${call.name}" lacks error handling`,
        location: call.location,
        suggestedFix: generateErrorHandlingWrapper(call)
      });
    }
  }

  return violations;
}
```

---

### 11. Thou Shalt Not Repeat Thyself (DRY)

**Rule**: Code duplication shall not exceed 5% of the codebase.

**Example Violation**:
```typescript
// ❌ VIOLATION: Duplicated logic
function calculateShippingCostForUSA(weight: number) {
  const baseRate = 5;
  const perKg = 2;
  return baseRate + (weight * perKg);
}

function calculateShippingCostForCanada(weight: number) {
  const baseRate = 5; // DUPLICATE!
  const perKg = 2;    // DUPLICATE!
  return baseRate + (weight * perKg); // DUPLICATE!
}
```

**Correct Approach**:
```typescript
// ✅ CORRECT: Extracted common logic
function calculateShippingCost(weight: number, baseRate: number, perKg: number) {
  return baseRate + (weight * perKg);
}

const USA_RATES = { base: 5, perKg: 2 };
const CANADA_RATES = { base: 5, perKg: 2 };
```

**Detection Algorithm**:
```typescript
function detectCodeDuplication(files: string[]): Violation[] {
  const violations: Violation[] = [];

  // Use Abstract Syntax Tree (AST) similarity detection
  const astHashes: Map<string, ASTNode[]> = new Map();

  for (const file of files) {
    const ast = parseFile(file);
    const nodes = getAllNodes(ast);

    for (const node of nodes) {
      const hash = calculateASTHash(node);

      if (!astHashes.has(hash)) {
        astHashes.set(hash, []);
      }

      astHashes.get(hash)!.push(node);
    }
  }

  // Find duplicates (hash with 2+ nodes)
  for (const [hash, nodes] of astHashes.entries()) {
    if (nodes.length > 1) {
      violations.push({
        commandment: 11,
        severity: 'warning',
        message: `Code duplication detected (${nodes.length} instances)`,
        affectedFiles: nodes.map(n => n.file),
        suggestedFix: generateDuplicationFix(nodes)
      });
    }
  }

  return violations;
}
```

---

### 12. Thou Shalt Use Types (TypeScript Only)

**Rule**: All function parameters and return values shall have explicit type annotations.

**Example Violation**:
```typescript
// ❌ VIOLATION: No types
function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price, 0);
}
```

**Correct Approach**:
```typescript
// ✅ CORRECT: Explicit types
interface CartItem {
  price: number;
}

function calculateTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}
```

**Detection Algorithm**:
```typescript
function detectMissingTypes(
  functionNode: FunctionDeclaration
): Violation[] {
  const violations: Violation[] = [];

  // Check parameters
  for (const param of functionNode.parameters) {
    if (!param.type) {
      violations.push({
        commandment: 12,
        severity: 'error',
        message: `Parameter "${param.name}" is missing type annotation`,
        location: param.location,
        suggestedFix: generateTypeInference(param)
      });
    }
  }

  // Check return type
  if (!functionNode.returnType) {
    violations.push({
      commandment: 12,
      severity: 'error',
      message: `Function "${functionNode.name}" is missing return type`,
      location: functionNode.location,
      suggestedFix: inferReturnType(functionNode)
    });
  }

  return violations;
}
```

---

## Enforcement System

### Real-time Monitoring

```typescript
class ArchitectureGuardian {
  private watchers: Map<number, Watcher> = new Map();
  private violations: Map<string, Violation[]> = new Map();

  startMonitoring(workspace: string): void {
    // Watch file changes
    const watcher = vscode.workspace.createFileSystemWatcher(
      '**/*.{ts,tsx,js,jsx}'
    );

    watcher.onDidChange(uri => this.analyzeFile(uri));
    watcher.onDidCreate(uri => this.analyzeFile(uri));

    this.watchers.set(workspace.id, watcher);
  }

  private async analyzeFile(uri: vscode.Uri): Promise<void> {
    const startTime = Date.now();

    // Parse file
    const content = await vscode.workspace.fs.readFile(uri);
    const ast = parseTypeScript(content.toString());

    // Run all commandment checks
    const violations: Violation[] = [];

    violations.push(...this.checkCommandment1(ast));
    violations.push(...this.checkCommandment2(ast));
    // ... all 12 commandments

    // Update violations map
    this.violations.set(uri.toString(), violations);

    // Show diagnostics in editor
    this.updateDiagnostics(uri, violations);

    console.log(`Guardian analysis: ${Date.now() - startTime}ms`);
  }

  private updateDiagnostics(
    uri: vscode.Uri,
    violations: Violation[]
  ): void {
    const diagnostics = violations.map(v => {
      const severity = v.severity === 'error'
        ? vscode.DiagnosticSeverity.Error
        : v.severity === 'warning'
          ? vscode.DiagnosticSeverity.Warning
          : vscode.DiagnosticSeverity.Information;

      return new vscode.Diagnostic(
        v.location.range,
        `[Commandment ${v.commandment}] ${v.message}`,
        severity
      );
    });

    this.diagnosticCollection.set(uri, diagnostics);
  }
}
```

### Violation Severity Levels

```typescript
enum ViolationSeverity {
  ERROR = 'error',       // Blocks commit (if pre-commit hook enabled)
  WARNING = 'warning',   // Shows warning but allows commit
  INFO = 'info'          // Informational only
}

const COMMANDMENT_SEVERITIES: Record<number, ViolationSeverity> = {
  1: ViolationSeverity.ERROR,     // Layer violations
  2: ViolationSeverity.ERROR,     // Circular dependencies
  3: ViolationSeverity.WARNING,   // Low cohesion
  4: ViolationSeverity.WARNING,   // Tight coupling
  5: ViolationSeverity.INFO,      // Missing tests
  6: ViolationSeverity.INFO,      // Missing documentation
  7: ViolationSeverity.INFO,      // Dead code
  8: ViolationSeverity.WARNING,   // Long functions
  9: ViolationSeverity.WARNING,   // Poor naming
  10: ViolationSeverity.WARNING,  // Missing error handling
  11: ViolationSeverity.WARNING,  // Code duplication
  12: ViolationSeverity.ERROR     // Missing types (TS)
};
```

---

## Auto-Fix Engine

### One-Click Fixes

```typescript
class AutoFixEngine {
  async applyFix(violation: Violation): Promise<void> {
    const fix = violation.suggestedFix;

    switch (fix.type) {
      case 'remove':
        await this.removeCode(fix.range);
        break;

      case 'replace':
        await this.replaceCode(fix.range, fix.newCode);
        break;

      case 'insert':
        await this.insertCode(fix.position, fix.newCode);
        break;

      case 'refactor':
        await this.performRefactoring(fix.refactorType, fix.params);
        break;

      case 'generate':
        await this.generateCode(fix.template, fix.params);
        break;
    }
  }

  private async performRefactoring(
    type: RefactoringType,
    params: any
  ): Promise<void> {
    switch (type) {
      case 'extractFunction':
        await this.extractFunction(params);
        break;

      case 'extractVariable':
        await this.extractVariable(params);
        break;

      case 'inlineFunction':
        await this.inlineFunction(params);
        break;

      case 'moveToModule':
        await this.moveToModule(params);
        break;
    }
  }
}
```

### Fix Examples

**Fix 1: Layer Violation**
```typescript
// Before (violation)
import { db } from '../../database/connection';

// After (auto-fixed)
import { userRepository } from '../../repositories/user-repository';
```

**Fix 2: Missing Error Handling**
```typescript
// Before (violation)
async function fetchData() {
  const response = await fetch('/api/data');
  return response.json();
}

// After (auto-fixed)
async function fetchData() {
  try {
    const response = await fetch('/api/data');

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('Failed to fetch data:', error);
    throw error;
  }
}
```

---

## Integration with Vincian Score

### How Guardian Affects Score

Each commandment violation reduces the Vincian Score:

```typescript
interface GuardianImpact {
  commandment: number;
  affectedPrinciples: string[];
  scoreImpact: number;
}

const GUARDIAN_IMPACTS: GuardianImpact[] = [
  {
    commandment: 1, // Layer boundaries
    affectedPrinciples: ['perspective', 'unity'],
    scoreImpact: -10
  },
  {
    commandment: 2, // Circular dependencies
    affectedPrinciples: ['perspective', 'unity', 'simplicity'],
    scoreImpact: -15
  },
  {
    commandment: 3, // High cohesion
    affectedPrinciples: ['unity', 'proportion'],
    scoreImpact: -8
  },
  // ... etc
];
```

### Combined Analysis

```typescript
class CombinedAnalyzer {
  async analyzeCodebase(workspace: string): Promise<FullAnalysis> {
    // 1. Calculate Vincian Score
    const vincianScore = await this.vincianEngine.calculateScore(workspace);

    // 2. Run Architecture Guardian
    const violations = await this.guardian.analyzeWorkspace(workspace);

    // 3. Adjust Vincian Score based on violations
    const adjustedScore = this.adjustScoreForViolations(
      vincianScore,
      violations
    );

    return {
      vincianScore: adjustedScore,
      violations,
      recommendations: this.mergeRecommendations(vincianScore, violations)
    };
  }

  private adjustScoreForViolations(
    score: VincianScore,
    violations: Violation[]
  ): VincianScore {
    const adjustedScore = { ...score };

    for (const violation of violations) {
      const impact = GUARDIAN_IMPACTS.find(i => i.commandment === violation.commandment);

      if (impact) {
        for (const principle of impact.affectedPrinciples) {
          adjustedScore.breakdown[principle] -= impact.scoreImpact;
          adjustedScore.breakdown[principle] = Math.max(0, adjustedScore.breakdown[principle]);
        }
      }
    }

    // Recalculate overall score
    adjustedScore.overall = calculateVincianScore(
      adjustedScore.breakdown,
      DEFAULT_WEIGHTS
    ).overall;

    return adjustedScore;
  }
}
```

---

## Implementation Details

### VS Code Integration

```typescript
// extension.ts
export function activate(context: vscode.ExtensionContext) {
  const guardian = new ArchitectureGuardian();

  // Start monitoring
  guardian.startMonitoring(vscode.workspace.workspaceFolders[0].uri.fsPath);

  // Register quick fix provider
  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider(
      { pattern: '**/*.{ts,tsx,js,jsx}' },
      new GuardianQuickFixProvider(guardian)
    )
  );

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand('aimastery.fixAllViolations', () => {
      guardian.fixAllViolations();
    })
  );
}
```

---

## Examples

### Example 1: Layer Violation Detection

**Input**:
```typescript
// src/ui/components/Dashboard.tsx
import { executeQuery } from '../../database/query-executor';

function Dashboard() {
  const data = executeQuery('SELECT * FROM analytics');
  return <div>{data}</div>;
}
```

**Guardian Output**:
```
❌ [Commandment 1] Layer violation detected
   ui/components/Dashboard.tsx:2

   UI layer cannot import from database layer directly.

   Suggested fix: Use AnalyticsService instead

   [Fix Now] [Learn More] [Dismiss]
```

**After Fix**:
```typescript
// src/ui/components/Dashboard.tsx
import { analyticsService } from '../../services/analytics-service';

function Dashboard() {
  const data = analyticsService.getAnalytics();
  return <div>{data}</div>;
}
```

---

### Example 2: Circular Dependency Detection

**Input**:
```typescript
// src/services/user-service.ts
import { OrderService } from './order-service';

export class UserService {
  constructor(private orderService: OrderService) {}
}

// src/services/order-service.ts
import { UserService } from './user-service';

export class OrderService {
  constructor(private userService: UserService) {}
}
```

**Guardian Output**:
```
❌ [Commandment 2] Circular dependency detected
   services/user-service.ts ↔ services/order-service.ts

   UserService → OrderService → UserService

   Suggested fix: Extract shared logic to UserOrderBridge

   [Fix Now] [Learn More] [Dismiss]
```

---

**Status**: ✅ Specification Complete
**Next**: Integration Design + Implementation Plan

*"Prevention is better than cure." - Architecture Guardian motto*
