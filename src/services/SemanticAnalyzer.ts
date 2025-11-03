import * as vscode from 'vscode';
import { RealCodeAnalyzer, CodeMetrics } from './RealCodeAnalyzer';

export interface SemanticIssue {
  type: 'unused_variable' | 'undefined_reference' | 'type_mismatch' | 'unreachable_code' | 'infinite_loop' | 'memory_leak';
  severity: 'error' | 'warning' | 'info';
  line: number;
  column: number;
  message: string;
  fix?: string;
}

export interface SymbolInfo {
  name: string;
  type: string;
  scope: string;
  usage: number;
  defined: boolean;
  exported: boolean;
  deprecated: boolean;
}

export interface DataFlowAnalysis {
  definedVariables: Map<string, number[]>;
  usedVariables: Map<string, number[]>;
  deadCode: number[];
  unreachableCode: number[];
}

export interface ControlFlowAnalysis {
  entryPoints: number[];
  exitPoints: number[];
  conditionalBlocks: number[];
  loopBlocks: number[];
  unreachableBlocks: number[];
}

export class SemanticAnalyzer {
  private codeAnalyzer: RealCodeAnalyzer;
  private symbols: Map<string, SymbolInfo> = new Map();

  constructor() {
    this.codeAnalyzer = new RealCodeAnalyzer();
  }

  public async analyzeSemantics(content: string, filePath: string): Promise<{
    issues: SemanticIssue[];
    symbols: SymbolInfo[];
    dataFlow: DataFlowAnalysis;
    controlFlow: ControlFlowAnalysis;
    metrics: CodeMetrics;
  }> {
    try {
      // Get AST and basic metrics
      const metrics = await this.codeAnalyzer.analyzeCode(content, filePath);

      // Parse for semantic analysis
      const ast = this.parseForSemantics(content, filePath);

      // Perform semantic analyses
      const symbols = this.buildSymbolTable(ast);
      const dataFlow = this.analyzeDataFlow(ast);
      const controlFlow = this.analyzeControlFlow(ast);
      const issues = this.detectSemanticIssues(ast, symbols, dataFlow, controlFlow);

      return {
        issues,
        symbols: Array.from(symbols.values()),
        dataFlow,
        controlFlow,
        metrics
      };
    } catch (error) {
      console.error('Semantic analysis failed:', error);
      throw new Error(`Semantic analysis failed: ${error}`);
    }
  }

  private parseForSemantics(content: string, filePath: string): any {
    const language = this.detectLanguage(filePath);

    if (language === 'typescript') {
      const { parse } = require('@typescript-eslint/typescript-estree');
      return parse(content, {
        loc: true,
        range: true,
        tokens: true,
        comments: true,
        sourceType: 'module',
        ecmaVersion: 2022
      });
    } else {
      const { parse } = require('@babel/parser');
      return parse(content, {
        sourceType: 'module',
        allowImportExportEverywhere: true,
        plugins: ['jsx', 'typescript', 'decorators-legacy'],
        ranges: true,
        tokens: true
      });
    }
  }

  private detectLanguage(filePath: string): 'typescript' | 'javascript' {
    const ext = filePath.split('.').pop()?.toLowerCase();
    return (ext === 'ts' || ext === 'tsx') ? 'typescript' : 'javascript';
  }

  private buildSymbolTable(ast: any): Map<string, SymbolInfo> {
    const symbols = new Map<string, SymbolInfo>();
    const scopes: string[] = ['global'];

    const traverse = (node: any, currentScope: string = 'global') => {
      if (!node || typeof node !== 'object') return;

      // Variable declarations
      if (node.type === 'VariableDeclarator' && node.id?.name) {
        symbols.set(node.id.name, {
          name: node.id.name,
          type: this.inferType(node.init),
          scope: currentScope,
          usage: 0,
          defined: true,
          exported: false,
          deprecated: false
        });
      }

      // Function declarations
      if (node.type === 'FunctionDeclaration' && node.id?.name) {
        symbols.set(node.id.name, {
          name: node.id.name,
          type: 'function',
          scope: currentScope,
          usage: 0,
          defined: true,
          exported: false,
          deprecated: false
        });

        // New scope for function body
        if (node.body) {
          traverse(node.body, `${currentScope}.${node.id.name}`);
          return; // Don't traverse body again
        }
      }

      // Class declarations
      if (node.type === 'ClassDeclaration' && node.id?.name) {
        symbols.set(node.id.name, {
          name: node.id.name,
          type: 'class',
          scope: currentScope,
          usage: 0,
          defined: true,
          exported: false,
          deprecated: false
        });
      }

      // Parameter declarations
      if (node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression') {
        if (node.params) {
          node.params.forEach((param: any) => {
            if (param.type === 'Identifier') {
              symbols.set(param.name, {
                name: param.name,
                type: 'parameter',
                scope: currentScope,
                usage: 0,
                defined: true,
                exported: false,
                deprecated: false
              });
            }
          });
        }
      }

      // Identifier usage
      if (node.type === 'Identifier' && symbols.has(node.name)) {
        const symbol = symbols.get(node.name)!;
        symbol.usage++;
        symbols.set(node.name, symbol);
      }

      // Export declarations
      if (node.type === 'ExportNamedDeclaration' || node.type === 'ExportDefaultDeclaration') {
        this.markAsExported(node, symbols);
      }

      // Traverse child nodes
      for (const key in node) {
        if (Array.isArray(node[key])) {
          node[key].forEach((child: any) => traverse(child, currentScope));
        } else if (node[key] && typeof node[key] === 'object') {
          traverse(node[key], currentScope);
        }
      }
    };

    traverse(ast);
    return symbols;
  }

  private inferType(node: any): string {
    if (!node) return 'unknown';

    switch (node.type) {
      case 'Literal':
        return typeof node.value;
      case 'ArrayExpression':
        return 'array';
      case 'ObjectExpression':
        return 'object';
      case 'FunctionExpression':
      case 'ArrowFunctionExpression':
        return 'function';
      case 'NewExpression':
        return node.callee?.name || 'object';
      case 'CallExpression':
        if (node.callee?.name === 'require') {
          return 'module';
        }
        return 'unknown';
      default:
        return 'unknown';
    }
  }

  private markAsExported(node: any, symbols: Map<string, SymbolInfo>) {
    if (node.declaration) {
      if (node.declaration.type === 'VariableDeclaration') {
        node.declaration.declarations.forEach((decl: any) => {
          if (decl.id?.name && symbols.has(decl.id.name)) {
            const symbol = symbols.get(decl.id.name)!;
            symbol.exported = true;
            symbols.set(decl.id.name, symbol);
          }
        });
      } else if (node.declaration.id?.name && symbols.has(node.declaration.id.name)) {
        const symbol = symbols.get(node.declaration.id.name)!;
        symbol.exported = true;
        symbols.set(node.declaration.id.name, symbol);
      }
    }
  }

  private analyzeDataFlow(ast: any): DataFlowAnalysis {
    const definedVariables = new Map<string, number[]>();
    const usedVariables = new Map<string, number[]>();
    const deadCode: number[] = [];
    const unreachableCode: number[] = [];

    const traverse = (node: any) => {
      if (!node || typeof node !== 'object') return;

      // Variable definitions
      if (node.type === 'VariableDeclarator' && node.id?.name) {
        const line = node.loc?.start?.line || 0;
        const varName = node.id.name;

        if (!definedVariables.has(varName)) {
          definedVariables.set(varName, []);
        }
        definedVariables.get(varName)!.push(line);
      }

      // Variable usage
      if (node.type === 'Identifier' && node.name) {
        const line = node.loc?.start?.line || 0;
        const varName = node.name;

        if (!usedVariables.has(varName)) {
          usedVariables.set(varName, []);
        }
        usedVariables.get(varName)!.push(line);
      }

      // Dead code detection after return statements
      if (node.type === 'ReturnStatement') {
        this.findUnreachableAfterReturn(node, unreachableCode);
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

    // Find dead variables (defined but never used)
    for (const [varName, defLines] of definedVariables.entries()) {
      if (!usedVariables.has(varName) || usedVariables.get(varName)!.length === 0) {
        deadCode.push(...defLines);
      }
    }

    return {
      definedVariables,
      usedVariables,
      deadCode,
      unreachableCode
    };
  }

  private findUnreachableAfterReturn(returnNode: any, unreachableCode: number[]) {
    // Simple heuristic: if return statement is not the last statement in block
    // TODO: Implement more sophisticated unreachable code detection
    const line = returnNode.loc?.end?.line;
    if (line) {
      unreachableCode.push(line + 1);
    }
  }

  private analyzeControlFlow(ast: any): ControlFlowAnalysis {
    const entryPoints: number[] = [];
    const exitPoints: number[] = [];
    const conditionalBlocks: number[] = [];
    const loopBlocks: number[] = [];
    const unreachableBlocks: number[] = [];

    const traverse = (node: any) => {
      if (!node || typeof node !== 'object') return;

      const line = node.loc?.start?.line || 0;

      // Entry points (function declarations, top-level code)
      if (node.type === 'FunctionDeclaration' || node.type === 'Program') {
        entryPoints.push(line);
      }

      // Exit points (return statements, end of functions)
      if (node.type === 'ReturnStatement') {
        exitPoints.push(line);
      }

      // Conditional blocks
      if (node.type === 'IfStatement' || node.type === 'SwitchStatement') {
        conditionalBlocks.push(line);
      }

      // Loop blocks
      if (node.type === 'WhileStatement' ||
          node.type === 'DoWhileStatement' ||
          node.type === 'ForStatement' ||
          node.type === 'ForInStatement' ||
          node.type === 'ForOfStatement') {
        loopBlocks.push(line);
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

    return {
      entryPoints,
      exitPoints,
      conditionalBlocks,
      loopBlocks,
      unreachableBlocks
    };
  }

  private detectSemanticIssues(
    ast: any,
    symbols: Map<string, SymbolInfo>,
    dataFlow: DataFlowAnalysis,
    controlFlow: ControlFlowAnalysis
  ): SemanticIssue[] {
    const issues: SemanticIssue[] = [];

    // Unused variables
    for (const [varName, symbol] of symbols.entries()) {
      if (symbol.usage === 0 && !symbol.exported && symbol.type !== 'parameter') {
        issues.push({
          type: 'unused_variable',
          severity: 'warning',
          line: 0, // TODO: Get actual line from symbol
          column: 0,
          message: `Variable '${varName}' is declared but never used`,
          fix: `Remove unused variable '${varName}'`
        });
      }
    }

    // Undefined references
    for (const [varName, lines] of dataFlow.usedVariables.entries()) {
      if (!symbols.has(varName) && !this.isBuiltInOrImported(varName)) {
        lines.forEach(line => {
          issues.push({
            type: 'undefined_reference',
            severity: 'error',
            line,
            column: 0,
            message: `'${varName}' is not defined`,
            fix: `Define '${varName}' or import it`
          });
        });
      }
    }

    // Dead code
    dataFlow.deadCode.forEach(line => {
      issues.push({
        type: 'unreachable_code',
        severity: 'warning',
        line,
        column: 0,
        message: 'Unreachable code detected',
        fix: 'Remove unreachable code'
      });
    });

    // Detect potential infinite loops
    this.detectInfiniteLoops(ast, issues);

    // Detect potential memory leaks
    this.detectMemoryLeaks(ast, issues);

    return issues;
  }

  private isBuiltInOrImported(varName: string): boolean {
    const builtIns = [
      'console', 'process', 'global', 'window', 'document',
      'Math', 'Date', 'Array', 'Object', 'String', 'Number',
      'Boolean', 'RegExp', 'Error', 'JSON', 'setTimeout',
      'setInterval', 'clearTimeout', 'clearInterval'
    ];

    return builtIns.includes(varName);
  }

  private detectInfiniteLoops(ast: any, issues: SemanticIssue[]) {
    const traverse = (node: any) => {
      if (!node || typeof node !== 'object') return;

      // Detect while(true) or for(;;) without break
      if (node.type === 'WhileStatement' && this.isAlwaysTrue(node.test)) {
        if (!this.hasBreakStatement(node.body)) {
          issues.push({
            type: 'infinite_loop',
            severity: 'warning',
            line: node.loc?.start?.line || 0,
            column: node.loc?.start?.column || 0,
            message: 'Potential infinite loop detected',
            fix: 'Add break condition or modify loop condition'
          });
        }
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

  private isAlwaysTrue(node: any): boolean {
    return node?.type === 'Literal' && node.value === true;
  }

  private hasBreakStatement(node: any): boolean {
    if (!node) return false;

    if (node.type === 'BreakStatement') return true;

    if (Array.isArray(node)) {
      return node.some(child => this.hasBreakStatement(child));
    }

    if (typeof node === 'object') {
      for (const key in node) {
        if (this.hasBreakStatement(node[key])) {
          return true;
        }
      }
    }

    return false;
  }

  private detectMemoryLeaks(ast: any, issues: SemanticIssue[]) {
    const traverse = (node: any) => {
      if (!node || typeof node !== 'object') return;

      // Detect event listeners without removal
      if (node.type === 'CallExpression' &&
          node.callee?.property?.name === 'addEventListener') {
        issues.push({
          type: 'memory_leak',
          severity: 'info',
          line: node.loc?.start?.line || 0,
          column: node.loc?.start?.column || 0,
          message: 'Event listener added - ensure it is removed to prevent memory leaks',
          fix: 'Add corresponding removeEventListener call'
        });
      }

      // Detect timers without clearing
      if (node.type === 'CallExpression' &&
          (node.callee?.name === 'setTimeout' || node.callee?.name === 'setInterval')) {
        issues.push({
          type: 'memory_leak',
          severity: 'info',
          line: node.loc?.start?.line || 0,
          column: node.loc?.start?.column || 0,
          message: 'Timer created - ensure it is cleared to prevent memory leaks',
          fix: 'Store timer ID and call clearTimeout/clearInterval'
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
}