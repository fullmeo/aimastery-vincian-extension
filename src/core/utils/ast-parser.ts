/**
 * AST Parser Integration
 * Provides unified interface for parsing TypeScript/JavaScript code
 */

import { parse } from '@typescript-eslint/typescript-estree';
import type { TSESTree } from '@typescript-eslint/typescript-estree';
import { ParsedCode, ASTNode } from '../types/vincian-types';

/**
 * Parse TypeScript/JavaScript code into AST
 * @param sourceCode - Source code to parse
 * @param filePath - Optional file path for better error messages
 * @returns Parsed code with AST
 */
export function parseTypeScript(sourceCode: string, filePath?: string): ParsedCode {
  try {
    const ast = parse(sourceCode, {
      loc: true,
      range: true,
      comment: true,
      tokens: true,
      errorOnUnknownASTType: false,
      jsx: true, // Support JSX/TSX
      filePath: filePath || 'unknown.ts',
    });

    return {
      ast: ast as unknown as ASTNode,
      sourceCode,
      language: 'typescript',
      filePath,
    };
  } catch (error) {
    throw new Error(`Failed to parse TypeScript code: ${(error as Error).message}`);
  }
}

/**
 * Parse JavaScript code into AST
 * @param sourceCode - Source code to parse
 * @param filePath - Optional file path
 * @returns Parsed code with AST
 */
export function parseJavaScript(sourceCode: string, filePath?: string): ParsedCode {
  try {
    const ast = parse(sourceCode, {
      loc: true,
      range: true,
      comment: true,
      tokens: true,
      errorOnUnknownASTType: false,
      jsx: true,
      filePath: filePath || 'unknown.js',
      ecmaVersion: 'latest',
    });

    return {
      ast: ast as unknown as ASTNode,
      sourceCode,
      language: 'javascript',
      filePath,
    };
  } catch (error) {
    throw new Error(`Failed to parse JavaScript code: ${(error as Error).message}`);
  }
}

/**
 * Auto-detect language and parse
 * @param sourceCode - Source code to parse
 * @param filePath - Optional file path (used for language detection)
 * @returns Parsed code with AST
 */
export function parseCode(sourceCode: string, filePath?: string): ParsedCode {
  const language = detectLanguage(filePath);

  if (language === 'typescript') {
    return parseTypeScript(sourceCode, filePath);
  } else {
    return parseJavaScript(sourceCode, filePath);
  }
}

/**
 * Detect programming language from file path
 * @param filePath - File path
 * @returns Detected language
 */
function detectLanguage(filePath?: string): 'typescript' | 'javascript' {
  if (!filePath) {
    return 'javascript'; // Default
  }

  const extension = filePath.split('.').pop()?.toLowerCase();

  if (extension === 'ts' || extension === 'tsx') {
    return 'typescript';
  }

  return 'javascript';
}

/**
 * Traverse AST and visit nodes
 * @param ast - AST root node
 * @param visitor - Visitor functions for different node types
 */
export function traverseAST(
  ast: ASTNode,
  visitor: {
    enter?: (node: ASTNode, parent: ASTNode | null) => void;
    exit?: (node: ASTNode, parent: ASTNode | null) => void;
  }
): void {
  function visit(node: ASTNode, parent: ASTNode | null = null): void {
    if (!node || typeof node !== 'object') {
      return;
    }

    // Enter node
    if (visitor.enter) {
      visitor.enter(node, parent);
    }

    // Visit children
    for (const key in node) {
      if (key === 'type' || key === 'loc' || key === 'range' || key === 'start' || key === 'end') {
        continue;
      }

      const child = node[key];

      if (Array.isArray(child)) {
        child.forEach(c => {
          if (c && typeof c === 'object' && 'type' in c) {
            visit(c as ASTNode, node);
          }
        });
      } else if (child && typeof child === 'object' && 'type' in child) {
        visit(child as ASTNode, node);
      }
    }

    // Exit node
    if (visitor.exit) {
      visitor.exit(node, parent);
    }
  }

  visit(ast);
}

/**
 * Find all nodes of a specific type
 * @param ast - AST root node
 * @param nodeType - Type of node to find
 * @returns Array of matching nodes
 */
export function findNodes(ast: ASTNode, nodeType: string): ASTNode[] {
  const nodes: ASTNode[] = [];

  traverseAST(ast, {
    enter: node => {
      if (node.type === nodeType) {
        nodes.push(node);
      }
    },
  });

  return nodes;
}

/**
 * Find all function declarations (functions, arrow functions, methods)
 * @param ast - AST root node
 * @returns Array of function nodes
 */
export function findAllFunctions(ast: ASTNode): ASTNode[] {
  const functionTypes = [
    'FunctionDeclaration',
    'FunctionExpression',
    'ArrowFunctionExpression',
    'MethodDefinition',
  ];

  const functions: ASTNode[] = [];

  traverseAST(ast, {
    enter: node => {
      if (functionTypes.includes(node.type)) {
        functions.push(node);
      }
    },
  });

  return functions;
}

/**
 * Find all class declarations
 * @param ast - AST root node
 * @returns Array of class nodes
 */
export function findAllClasses(ast: ASTNode): ASTNode[] {
  return findNodes(ast, 'ClassDeclaration');
}

/**
 * Count lines of code in a node
 * @param node - AST node
 * @returns Number of lines (excluding whitespace)
 */
export function countLinesOfCode(node: ASTNode): number {
  if (!node.loc) {
    return 0;
  }

  return node.loc.end.line - node.loc.start.line + 1;
}

/**
 * Get source code for a specific node
 * @param node - AST node
 * @param sourceCode - Full source code
 * @returns Source code snippet for the node
 */
export function getNodeSource(node: ASTNode, sourceCode: string): string {
  if (node.start !== undefined && node.end !== undefined) {
    return sourceCode.substring(node.start, node.end);
  }
  return '';
}

/**
 * Check if node is a function-like node
 * @param node - AST node
 * @returns True if node is a function
 */
export function isFunctionNode(node: ASTNode): boolean {
  const functionTypes = [
    'FunctionDeclaration',
    'FunctionExpression',
    'ArrowFunctionExpression',
    'MethodDefinition',
  ];

  return functionTypes.includes(node.type);
}

/**
 * Get function name from function node
 * @param node - Function AST node
 * @returns Function name or 'anonymous'
 */
export function getFunctionName(node: ASTNode): string {
  if (node.type === 'FunctionDeclaration' && node.id) {
    return node.id.name || 'anonymous';
  }

  if (node.type === 'MethodDefinition' && node.key) {
    return node.key.name || 'anonymous';
  }

  if (node.type === 'FunctionExpression' && node.id) {
    return node.id.name || 'anonymous';
  }

  return 'anonymous';
}
