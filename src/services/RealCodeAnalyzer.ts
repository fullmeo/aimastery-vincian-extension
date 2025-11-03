import * as vscode from 'vscode';
import { parse as parseTypeScript } from '@typescript-eslint/typescript-estree';
import { parse as parseBabel } from '@babel/parser';
import * as t from '@babel/types';
import { AnalysisCache } from '../core/AnalysisCache';

export interface CodeMetrics {
  cyclomaticComplexity: number;
  linesOfCode: number;
  maintainabilityIndex: number;
  cognitiveComplexity: number;
  technicalDebt: number;
  codeSmells: CodeSmell[];
  dependencies: string[];
  functions: FunctionAnalysis[];
  classes: ClassAnalysis[];
}

export interface CodeSmell {
  type: 'long_method' | 'large_class' | 'duplicate_code' | 'dead_code' | 'complex_condition' | 'magic_number';
  severity: 'low' | 'medium' | 'high' | 'critical';
  line: number;
  column: number;
  message: string;
  suggestion: string;
}

export interface FunctionAnalysis {
  name: string;
  startLine: number;
  endLine: number;
  cyclomaticComplexity: number;
  cognitiveComplexity: number;
  parameters: number;
  returnStatements: number;
  hasErrors: boolean;
  usesRealLogic: boolean;
}

export interface ClassAnalysis {
  name: string;
  startLine: number;
  endLine: number;
  methods: number;
  properties: number;
  complexity: number;
  cohesion: number;
}

export class RealCodeAnalyzer {
  private readonly MAX_CYCLOMATIC_COMPLEXITY = 10;
  private readonly MAX_COGNITIVE_COMPLEXITY = 15;
  private readonly MAX_FUNCTION_LENGTH = 50;
  private readonly MAX_CLASS_LENGTH = 300;

  // Caching system for performance optimization
  private cache: AnalysisCache = new AnalysisCache();

  public async analyzeCode(content: string, filePath: string): Promise<CodeMetrics> {
    // Check cache first (10x faster for repeated analyses)
    const cachedResult = this.cache.get(filePath, content);
    if (cachedResult) {
      console.log(`✅ Cache HIT for ${filePath}`);
      return cachedResult;
    }

    console.log(`⏳ Cache MISS for ${filePath} - analyzing...`);

    try {
      const language = this.detectLanguage(filePath);
      const ast = this.parseCode(content, language);

      const metrics: CodeMetrics = {
        cyclomaticComplexity: this.calculateCyclomaticComplexity(ast),
        linesOfCode: this.countLinesOfCode(content),
        maintainabilityIndex: this.calculateMaintainabilityIndex(ast, content),
        cognitiveComplexity: this.calculateCognitiveComplexity(ast),
        technicalDebt: this.calculateTechnicalDebt(ast, content),
        codeSmells: this.detectCodeSmells(ast, content),
        dependencies: this.extractDependencies(ast),
        functions: this.analyzeFunctions(ast),
        classes: this.analyzeClasses(ast)
      };

      // Store in cache for future use
      this.cache.set(filePath, content, metrics);

      return metrics;
    } catch (error) {
      console.error('Code analysis failed:', error);
      throw new Error(`Real analysis failed: ${error}`);
    }
  }

  /**
   * Clear cache for a specific file (call on file save/change)
   */
  public invalidateCache(filePath: string): void {
    this.cache.invalidate(filePath);
  }

  /**
   * Get cache statistics for monitoring
   */
  public getCacheStats() {
    return this.cache.getStats();
  }

  private detectLanguage(filePath: string): 'typescript' | 'javascript' | 'python' {
    const ext = filePath.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'ts': case 'tsx': return 'typescript';
      case 'js': case 'jsx': return 'javascript';
      case 'py': return 'python';
      default: return 'typescript';
    }
  }

  private parseCode(content: string, language: string): any {
    try {
      if (language === 'typescript') {
        return parseTypeScript(content, {
          loc: true,
          range: true,
          tokens: true,
          comments: true,
          sourceType: 'module',
          ecmaVersion: 2022,
          project: './tsconfig.json'
        });
      } else if (language === 'javascript') {
        return parseBabel(content, {
          sourceType: 'module',
          allowImportExportEverywhere: true,
          allowReturnOutsideFunction: true,
          plugins: ['jsx', 'typescript', 'decorators-legacy'],
          ranges: true,
          tokens: true
        });
      }
      throw new Error(`Unsupported language: ${language}`);
    } catch (error) {
      console.error('Parsing failed:', error);
      throw error;
    }
  }

  private calculateCyclomaticComplexity(ast: any): number {
    let complexity = 1; // Base complexity

    const traverse = (node: any) => {
      if (!node || typeof node !== 'object') return;

      // TypeScript/JavaScript complexity nodes
      const complexityNodes = [
        'IfStatement', 'ConditionalExpression', 'SwitchCase',
        'WhileStatement', 'DoWhileStatement', 'ForStatement', 'ForInStatement', 'ForOfStatement',
        'CatchClause', 'LogicalExpression'
      ];

      if (complexityNodes.includes(node.type)) {
        complexity++;
      }

      // Special case for logical expressions
      if (node.type === 'LogicalExpression' && (node.operator === '&&' || node.operator === '||')) {
        complexity++;
      }

      // Traverse child nodes
      for (const key in node) {
        if (Array.isArray(node[key])) {
          node[key].forEach((child: any) => traverse(child));
        } else if (node[key] && typeof node[key] === 'object') {
          traverse(node[key]);
        }
      }
    };

    traverse(ast);
    return complexity;
  }

  private calculateCognitiveComplexity(ast: any): number {
    let complexity = 0;
    let depth = 0;

    const traverse = (node: any, currentDepth: number = 0) => {
      if (!node || typeof node !== 'object') return;

      const incrementingNodes = [
        'IfStatement', 'ConditionalExpression', 'SwitchStatement',
        'WhileStatement', 'DoWhileStatement', 'ForStatement', 'ForInStatement', 'ForOfStatement',
        'CatchClause'
      ];

      const nestingNodes = [
        'IfStatement', 'SwitchStatement', 'WhileStatement', 'DoWhileStatement',
        'ForStatement', 'ForInStatement', 'ForOfStatement', 'FunctionDeclaration',
        'FunctionExpression', 'ArrowFunctionExpression'
      ];

      if (incrementingNodes.includes(node.type)) {
        complexity += 1 + currentDepth;
      }

      const newDepth = nestingNodes.includes(node.type) ? currentDepth + 1 : currentDepth;

      // Traverse child nodes
      for (const key in node) {
        if (Array.isArray(node[key])) {
          node[key].forEach((child: any) => traverse(child, newDepth));
        } else if (node[key] && typeof node[key] === 'object') {
          traverse(node[key], newDepth);
        }
      }
    };

    traverse(ast);
    return complexity;
  }

  private countLinesOfCode(content: string): number {
    const lines = content.split('\n');
    let loc = 0;

    for (const line of lines) {
      const trimmed = line.trim();
      // Skip empty lines and comments
      if (trimmed && !trimmed.startsWith('//') && !trimmed.startsWith('/*') && !trimmed.startsWith('*')) {
        loc++;
      }
    }

    return loc;
  }

  private calculateMaintainabilityIndex(ast: any, content: string): number {
    const volume = this.calculateHalsteadVolume(ast);
    const complexity = this.calculateCyclomaticComplexity(ast);
    const loc = this.countLinesOfCode(content);

    // Maintainability Index formula
    let mi = 171 - 5.2 * Math.log(volume) - 0.23 * complexity - 16.2 * Math.log(loc);

    // Normalize to 0-100 scale
    return Math.max(0, Math.min(100, mi));
  }

  private calculateHalsteadVolume(ast: any): number {
    const operators = new Set<string>();
    const operands = new Set<string>();
    let operatorCount = 0;
    let operandCount = 0;

    const traverse = (node: any) => {
      if (!node || typeof node !== 'object') return;

      // Count operators
      if (node.type === 'BinaryExpression' || node.type === 'LogicalExpression') {
        operators.add(node.operator);
        operatorCount++;
      }

      // Count operands (identifiers, literals)
      if (node.type === 'Identifier') {
        operands.add(node.name);
        operandCount++;
      } else if (node.type === 'Literal') {
        operands.add(String(node.value));
        operandCount++;
      }

      // Traverse child nodes
      for (const key in node) {
        if (Array.isArray(node[key])) {
          node[key].forEach((child: any) => traverse(child));
        } else if (node[key] && typeof node[key] === 'object') {
          traverse(node[key]);
        }
      }
    };

    traverse(ast);

    const n1 = operators.size; // unique operators
    const n2 = operands.size; // unique operands
    const N1 = operatorCount; // total operators
    const N2 = operandCount; // total operands

    const length = N1 + N2;
    const vocabulary = n1 + n2;

    return length * Math.log2(vocabulary || 1);
  }

  private calculateTechnicalDebt(ast: any, content: string): number {
    let debt = 0;
    const issues = this.detectCodeSmells(ast, content);

    const debtWeights = {
      'critical': 8,
      'high': 4,
      'medium': 2,
      'low': 1
    };

    for (const issue of issues) {
      debt += debtWeights[issue.severity];
    }

    return debt;
  }

  private detectCodeSmells(ast: any, content: string): CodeSmell[] {
    const smells: CodeSmell[] = [];

    // Detect Math.random usage (fake logic)
    if (content.includes('Math.random')) {
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        if (line.includes('Math.random')) {
          smells.push({
            type: 'magic_number',
            severity: 'critical',
            line: index + 1,
            column: line.indexOf('Math.random'),
            message: 'Math.random() detected - replace with deterministic logic',
            suggestion: 'Implement real calculation logic instead of random generation'
          });
        }
      });
    }

    // Detect hardcoded values and placeholder logic
    const hardcodedPatterns = [
      'hardcoded',
      'placeholder',
      'TODO',
      'FIXME',
      'fake',
      'mock',
      'dummy'
    ];

    const lines = content.split('\n');
    lines.forEach((line, index) => {
      const lowerLine = line.toLowerCase();
      hardcodedPatterns.forEach(pattern => {
        if (lowerLine.includes(pattern.toLowerCase())) {
          smells.push({
            type: 'dead_code',
            severity: 'high',
            line: index + 1,
            column: line.indexOf(pattern),
            message: `${pattern} logic detected`,
            suggestion: 'Replace with production-ready implementation'
          });
        }
      });
    });

    // Analyze AST for complex methods and classes
    this.analyzeASTForSmells(ast, smells);

    return smells;
  }

  private analyzeASTForSmells(ast: any, smells: CodeSmell[]) {
    const traverse = (node: any) => {
      if (!node || typeof node !== 'object') return;

      // Long method detection
      if (node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression' || node.type === 'ArrowFunctionExpression') {
        const functionLength = this.getFunctionLength(node);
        if (functionLength > this.MAX_FUNCTION_LENGTH) {
          smells.push({
            type: 'long_method',
            severity: 'medium',
            line: node.loc?.start?.line || 0,
            column: node.loc?.start?.column || 0,
            message: `Function too long (${functionLength} lines)`,
            suggestion: 'Break down into smaller functions'
          });
        }
      }

      // Complex condition detection
      if (node.type === 'IfStatement' && this.isComplexCondition(node.test)) {
        smells.push({
          type: 'complex_condition',
          severity: 'medium',
          line: node.loc?.start?.line || 0,
          column: node.loc?.start?.column || 0,
          message: 'Complex conditional logic',
          suggestion: 'Extract condition to well-named function'
        });
      }

      // Traverse child nodes
      for (const key in node) {
        if (Array.isArray(node[key])) {
          node[key].forEach((child: any) => traverse(child));
        } else if (node[key] && typeof node[key] === 'object') {
          traverse(node[key]);
        }
      }
    };

    traverse(ast);
  }

  private getFunctionLength(node: any): number {
    if (node.loc && node.loc.start && node.loc.end) {
      return node.loc.end.line - node.loc.start.line + 1;
    }
    return 0;
  }

  private isComplexCondition(node: any): boolean {
    if (!node) return false;

    // Count logical operators
    let complexity = 0;
    const traverse = (n: any) => {
      if (n?.type === 'LogicalExpression') {
        complexity++;
        traverse(n.left);
        traverse(n.right);
      }
    };

    traverse(node);
    return complexity > 3;
  }

  private extractDependencies(ast: any): string[] {
    const dependencies = new Set<string>();

    const traverse = (node: any) => {
      if (!node || typeof node !== 'object') return;

      // Import declarations
      if (node.type === 'ImportDeclaration' && node.source) {
        dependencies.add(node.source.value);
      }

      // Require calls
      if (node.type === 'CallExpression' &&
          node.callee?.name === 'require' &&
          node.arguments?.[0]?.type === 'Literal') {
        dependencies.add(node.arguments[0].value);
      }

      // Traverse child nodes
      for (const key in node) {
        if (Array.isArray(node[key])) {
          node[key].forEach((child: any) => traverse(child));
        } else if (node[key] && typeof node[key] === 'object') {
          traverse(node[key]);
        }
      }
    };

    traverse(ast);
    return Array.from(dependencies);
  }

  private analyzeFunctions(ast: any): FunctionAnalysis[] {
    const functions: FunctionAnalysis[] = [];

    const traverse = (node: any) => {
      if (!node || typeof node !== 'object') return;

      if (node.type === 'FunctionDeclaration' ||
          node.type === 'FunctionExpression' ||
          node.type === 'ArrowFunctionExpression') {

        const name = node.id?.name || 'anonymous';
        const startLine = node.loc?.start?.line || 0;
        const endLine = node.loc?.end?.line || 0;

        functions.push({
          name,
          startLine,
          endLine,
          cyclomaticComplexity: this.calculateFunctionComplexity(node),
          cognitiveComplexity: this.calculateCognitiveComplexity(node),
          parameters: node.params?.length || 0,
          returnStatements: this.countReturnStatements(node),
          hasErrors: this.hasPotentialErrors(node),
          usesRealLogic: this.usesRealLogic(node)
        });
      }

      // Traverse child nodes
      for (const key in node) {
        if (Array.isArray(node[key])) {
          node[key].forEach((child: any) => traverse(child));
        } else if (node[key] && typeof node[key] === 'object') {
          traverse(node[key]);
        }
      }
    };

    traverse(ast);
    return functions;
  }

  private analyzeClasses(ast: any): ClassAnalysis[] {
    const classes: ClassAnalysis[] = [];

    const traverse = (node: any) => {
      if (!node || typeof node !== 'object') return;

      if (node.type === 'ClassDeclaration') {
        const name = node.id?.name || 'anonymous';
        const startLine = node.loc?.start?.line || 0;
        const endLine = node.loc?.end?.line || 0;

        const methods = this.countClassMethods(node);
        const properties = this.countClassProperties(node);

        classes.push({
          name,
          startLine,
          endLine,
          methods,
          properties,
          complexity: this.calculateCyclomaticComplexity(node),
          cohesion: this.calculateClassCohesion(node)
        });
      }

      // Traverse child nodes
      for (const key in node) {
        if (Array.isArray(node[key])) {
          node[key].forEach((child: any) => traverse(child));
        } else if (node[key] && typeof node[key] === 'object') {
          traverse(node[key]);
        }
      }
    };

    traverse(ast);
    return classes;
  }

  private calculateFunctionComplexity(node: any): number {
    return this.calculateCyclomaticComplexity(node);
  }

  private countReturnStatements(node: any): number {
    let count = 0;

    const traverse = (n: any) => {
      if (!n || typeof n !== 'object') return;

      if (n.type === 'ReturnStatement') {
        count++;
      }

      for (const key in n) {
        if (Array.isArray(n[key])) {
          n[key].forEach((child: any) => traverse(child));
        } else if (n[key] && typeof n[key] === 'object') {
          traverse(n[key]);
        }
      }
    };

    traverse(node);
    return count;
  }

  private hasPotentialErrors(node: any): boolean {
    // Check for potential error patterns
    const nodeString = JSON.stringify(node);
    return nodeString.includes('Math.random') ||
           nodeString.includes('TODO') ||
           nodeString.includes('FIXME');
  }

  private usesRealLogic(node: any): boolean {
    const nodeString = JSON.stringify(node);
    // Function uses real logic if it doesn't contain fake patterns
    return !nodeString.includes('Math.random') &&
           !nodeString.includes('setTimeout') &&
           !nodeString.includes('hardcoded') &&
           !nodeString.includes('placeholder');
  }

  private countClassMethods(node: any): number {
    let count = 0;

    if (node.body?.body) {
      for (const member of node.body.body) {
        if (member.type === 'MethodDefinition') {
          count++;
        }
      }
    }

    return count;
  }

  private countClassProperties(node: any): number {
    let count = 0;

    if (node.body?.body) {
      for (const member of node.body.body) {
        if (member.type === 'PropertyDefinition' || member.type === 'ClassProperty') {
          count++;
        }
      }
    }

    return count;
  }

  private calculateClassCohesion(node: any): number {
    // Simplified cohesion calculation
    // Real implementation would analyze method-field relationships
    const methods = this.countClassMethods(node);
    const properties = this.countClassProperties(node);

    if (methods === 0 || properties === 0) return 0;

    // Basic heuristic: higher ratio of methods to properties suggests better cohesion
    return Math.min(100, (methods / (methods + properties)) * 100);
  }
}