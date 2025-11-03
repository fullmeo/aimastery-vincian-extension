/**
 * Test file for AI Mastery v7.1.3 analysis
 * This file tests the caching system and analysis features
 */

// Import statements for analysis
import * as vscode from 'vscode';
import * as path from 'path';

/**
 * Example class to test analysis
 */
export class TestAnalyzer {
  private cache: Map<string, any> = new Map();

  /**
   * Method with moderate complexity (should trigger analysis)
   */
  public analyzeCode(content: string): number {
    // Check cache first
    if (this.cache.has(content)) {
      return this.cache.get(content);
    }

    // Calculate complexity
    let complexity = 0;

    // Branch 1
    if (content.length > 100) {
      complexity += 1;
    }

    // Branch 2
    if (content.includes('function')) {
      complexity += 2;
    }

    // Branch 3
    for (let i = 0; i < content.length; i++) {
      if (content[i] === '{') {
        complexity += 1;
      }
    }

    // Store in cache
    this.cache.set(content, complexity);

    return complexity;
  }

  /**
   * Method with high complexity (for testing)
   */
  public complexMethod(input: any): void {
    if (input.type === 'a') {
      if (input.value > 10) {
        for (let i = 0; i < input.count; i++) {
          if (i % 2 === 0) {
            console.log('Even');
          } else {
            console.log('Odd');
          }
        }
      } else {
        console.log('Low value');
      }
    } else if (input.type === 'b') {
      switch (input.subtype) {
        case 'x':
          console.log('X');
          break;
        case 'y':
          console.log('Y');
          break;
        default:
          console.log('Unknown');
      }
    }
  }

  /**
   * Simple method (low complexity)
   */
  public simpleMethod(): string {
    return 'Hello, World!';
  }
}

// Test array operations
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(n => n * 2);
const filtered = doubled.filter(n => n > 5);

// Test async operations
async function fetchData(url: string): Promise<any> {
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Fetch failed:', error);
    throw error;
  }
}

// Export for testing
export { fetchData };
