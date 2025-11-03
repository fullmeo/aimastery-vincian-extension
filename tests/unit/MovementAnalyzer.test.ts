import { MovementAnalyzer } from '../../src/features/vincian-analysis/analyzers/MovementAnalyzer';
import { parseTypeScript } from '../../src/core/utils/ast-parser';
import * as fs from 'fs';
import * as path from 'path';

describe('MovementAnalyzer', () => {
  let analyzer: MovementAnalyzer;

  beforeEach(() => {
    analyzer = new MovementAnalyzer();
  });

  describe('Simple Linear Flow', () => {
    test('should score 100 for simple linear function', () => {
      const code = `
        function add(a: number, b: number): number {
          return a + b;
        }
      `;

      const { ast } = parseTypeScript(code);
      const result = analyzer.analyze(ast, code);

      expect(result.score).toBeGreaterThanOrEqual(95);
      expect(result.metrics.cyclomaticComplexity).toBe(1);
      expect(result.metrics.maxNestingDepth).toBeLessThanOrEqual(1);
    });

    test('should score high for function with early return', () => {
      const code = `
        function validateUser(user: any): boolean {
          if (!user) {
            return false;
          }

          if (!user.email) {
            return false;
          }

          return true;
        }
      `;

      const { ast } = parseTypeScript(code);
      const result = analyzer.analyze(ast, code);

      expect(result.score).toBeGreaterThanOrEqual(85);
      expect(result.metrics.earlyReturns).toBeGreaterThan(0);
    });
  });

  describe('Cyclomatic Complexity', () => {
    test('should calculate complexity=1 for simple function', () => {
      const code = `
        function simple() {
          console.log('hello');
        }
      `;

      const { ast } = parseTypeScript(code);
      const result = analyzer.analyze(ast, code);

      expect(result.metrics.cyclomaticComplexity).toBe(1);
    });

    test('should calculate complexity for if statements', () => {
      const code = `
        function withIf(x: number) {
          if (x > 0) {
            return 'positive';
          }
          return 'non-positive';
        }
      `;

      const { ast } = parseTypeScript(code);
      const result = analyzer.analyze(ast, code);

      expect(result.metrics.cyclomaticComplexity).toBe(2); // 1 + 1 if
    });

    test('should calculate complexity for multiple branches', () => {
      const code = `
        function complex(x: number) {
          if (x > 10) {
            return 'large';
          } else if (x > 5) {
            return 'medium';
          } else if (x > 0) {
            return 'small';
          }
          return 'zero or negative';
        }
      `;

      const { ast } = parseTypeScript(code);
      const result = analyzer.analyze(ast, code);

      expect(result.metrics.cyclomaticComplexity).toBeGreaterThanOrEqual(3);
    });

    test('should penalize high complexity (CC > 10)', () => {
      const code = `
        function veryComplex(x: number) {
          if (x === 1) return 'one';
          if (x === 2) return 'two';
          if (x === 3) return 'three';
          if (x === 4) return 'four';
          if (x === 5) return 'five';
          if (x === 6) return 'six';
          if (x === 7) return 'seven';
          if (x === 8) return 'eight';
          if (x === 9) return 'nine';
          if (x === 10) return 'ten';
          if (x === 11) return 'eleven';
          return 'other';
        }
      `;

      const { ast } = parseTypeScript(code);
      const result = analyzer.analyze(ast, code);

      expect(result.metrics.cyclomaticComplexity).toBeGreaterThan(10);
      expect(result.score).toBeLessThan(80); // Should be penalized
      expect(result.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('Nesting Depth', () => {
    test('should calculate nesting depth=0 for flat code', () => {
      const code = `
        function flat() {
          const a = 1;
          const b = 2;
          return a + b;
        }
      `;

      const { ast } = parseTypeScript(code);
      const result = analyzer.analyze(ast, code);

      expect(result.metrics.maxNestingDepth).toBeLessThanOrEqual(1);
    });

    test('should calculate nesting depth for nested ifs', () => {
      const code = `
        function nested(x: number) {
          if (x > 0) {
            if (x > 5) {
              if (x > 10) {
                return 'large';
              }
            }
          }
          return 'small';
        }
      `;

      const { ast } = parseTypeScript(code);
      const result = analyzer.analyze(ast, code);

      expect(result.metrics.maxNestingDepth).toBeGreaterThanOrEqual(3);
    });

    test('should penalize deep nesting (> 3 levels)', () => {
      const code = `
        function deeplyNested(data: any) {
          if (data) {
            if (data.user) {
              if (data.user.address) {
                if (data.user.address.city) {
                  if (data.user.address.city.zipCode) {
                    if (data.user.address.city.zipCode.length === 5) {
                      return true;
                    }
                  }
                }
              }
            }
          }
          return false;
        }
      `;

      const { ast } = parseTypeScript(code);
      const result = analyzer.analyze(ast, code);

      expect(result.metrics.maxNestingDepth).toBeGreaterThan(3);
      expect(result.score).toBeLessThan(80);
      expect(result.recommendations).toContainEqual(
        expect.objectContaining({
          principle: 'movement',
          severity: expect.stringMatching(/warning|critical/),
        })
      );
    });
  });

  describe('Callback Chains', () => {
    test('should detect promise chains', () => {
      const code = `
        function fetchData() {
          return fetch('/api/data')
            .then(response => response.json())
            .then(data => data.items)
            .then(items => items.filter(x => x.active))
            .then(active => active.map(x => x.name));
        }
      `;

      const { ast } = parseTypeScript(code);
      const result = analyzer.analyze(ast, code);

      expect(result.metrics.callbackChains).toBeGreaterThan(0);
      if (result.metrics.callbackChains > 2) {
        expect(result.recommendations).toContainEqual(
          expect.objectContaining({
            principle: 'movement',
            message: expect.stringContaining('async/await'),
          })
        );
      }
    });

    test('should not penalize short promise chains', () => {
      const code = `
        function shortChain() {
          return fetch('/api/data')
            .then(response => response.json());
        }
      `;

      const { ast } = parseTypeScript(code);
      const result = analyzer.analyze(ast, code);

      // Short chains (<=2) shouldn't be penalized
      expect(result.score).toBeGreaterThanOrEqual(90);
    });
  });

  describe('Early Returns', () => {
    test('should count early returns', () => {
      const code = `
        function validate(input: any) {
          if (!input) return false;
          if (!input.name) return false;
          if (!input.email) return false;
          return true;
        }
      `;

      const { ast } = parseTypeScript(code);
      const result = analyzer.analyze(ast, code);

      expect(result.metrics.earlyReturns).toBe(3); // 4 returns total, 3 are "early"
    });

    test('should give bonus for early returns', () => {
      const codeWithoutEarlyReturns = `
        function validateNested(input: any) {
          let isValid = false;
          if (input) {
            if (input.name) {
              if (input.email) {
                isValid = true;
              }
            }
          }
          return isValid;
        }
      `;

      const codeWithEarlyReturns = `
        function validateEarly(input: any) {
          if (!input) return false;
          if (!input.name) return false;
          if (!input.email) return false;
          return true;
        }
      `;

      const { ast: ast1 } = parseTypeScript(codeWithoutEarlyReturns);
      const { ast: ast2 } = parseTypeScript(codeWithEarlyReturns);

      const result1 = analyzer.analyze(ast1, codeWithoutEarlyReturns);
      const result2 = analyzer.analyze(ast2, codeWithEarlyReturns);

      // Early returns version should score higher
      expect(result2.score).toBeGreaterThanOrEqual(result1.score);
    });
  });

  describe('Exception Jumps', () => {
    test('should count throw and catch statements', () => {
      const code = `
        function riskyOperation(x: number) {
          try {
            if (x < 0) {
              throw new Error('Negative number');
            }
            return x * 2;
          } catch (error) {
            console.error(error);
            throw error;
          }
        }
      `;

      const { ast } = parseTypeScript(code);
      const result = analyzer.analyze(ast, code);

      expect(result.metrics.exceptionJumps).toBeGreaterThan(0);
    });
  });

  describe('Real-world Code', () => {
    test('should analyze good code from corpus', () => {
      const goodCodePath = path.join(__dirname, '../corpus/good/simple-function.ts');
      if (fs.existsSync(goodCodePath)) {
        const code = fs.readFileSync(goodCodePath, 'utf-8');
        const { ast } = parseTypeScript(code);
        const result = analyzer.analyze(ast, code);

        expect(result.score).toBeGreaterThanOrEqual(85);
        expect(result.metrics.cyclomaticComplexity).toBeLessThanOrEqual(3);
      }
    });

    test('should analyze bad code from corpus', () => {
      const badCodePath = path.join(__dirname, '../corpus/bad/complex-function.ts');
      if (fs.existsSync(badCodePath)) {
        const code = fs.readFileSync(badCodePath, 'utf-8');
        const { ast } = parseTypeScript(code);
        const result = analyzer.analyze(ast, code);

        expect(result.score).toBeLessThan(60);
        expect(result.recommendations.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Recommendations', () => {
    test('should provide recommendations for complex code', () => {
      const code = `
        function complexFunction(data: any) {
          if (data) {
            if (data.items) {
              for (let i = 0; i < data.items.length; i++) {
                if (data.items[i].active) {
                  if (data.items[i].price > 0) {
                    console.log(data.items[i]);
                  }
                }
              }
            }
          }
        }
      `;

      const { ast } = parseTypeScript(code);
      const result = analyzer.analyze(ast, code);

      expect(result.recommendations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            principle: 'movement',
            severity: expect.any(String),
            message: expect.any(String),
            estimatedImpact: expect.any(Number),
          }),
        ])
      );
    });

    test('should suggest early returns for deeply nested code', () => {
      const code = `
        function checkConditions(x: any) {
          if (x) {
            if (x.a) {
              if (x.b) {
                if (x.c) {
                  return true;
                }
              }
            }
          }
          return false;
        }
      `;

      const { ast } = parseTypeScript(code);
      const result = analyzer.analyze(ast, code);

      const recommendation = result.recommendations.find(r =>
        r.message.toLowerCase().includes('early return') || r.suggestedFix?.toLowerCase().includes('early return')
      );

      expect(recommendation).toBeDefined();
    });
  });
});
