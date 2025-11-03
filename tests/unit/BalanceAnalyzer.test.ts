import { BalanceAnalyzer } from '../../src/features/vincian-analysis/analyzers/BalanceAnalyzer';
import { parseTypeScript } from '../../src/core/utils/ast-parser';
import * as fs from 'fs';
import * as path from 'path';

describe('BalanceAnalyzer', () => {
  let analyzer: BalanceAnalyzer;

  beforeEach(() => {
    analyzer = new BalanceAnalyzer();
  });

  describe('Function Size Consistency', () => {
    test('should score high for consistent function sizes', () => {
      const code = `
        function func1() { const a = 1; const b = 2; return a + b; }
        function func2() { const x = 10; const y = 20; return x * y; }
        function func3() { const m = 5; const n = 3; return m - n; }
        function func4() { const p = 8; const q = 4; return p / q; }
      `;

      const { ast } = parseTypeScript(code);
      const result = analyzer.analyze(ast, code);

      expect(result.score).toBeGreaterThanOrEqual(85);
      expect(result.metrics.functionCV).toBeLessThan(0.5); // Low coefficient of variation
    });

    test('should penalize inconsistent function sizes', () => {
      const code = `
        function tiny() { return 1; }

        function huge() {
          const a = 1;
          const b = 2;
          const c = 3;
          const d = 4;
          const e = 5;
          const f = 6;
          const g = 7;
          const h = 8;
          const i = 9;
          const j = 10;
          // ... 100+ lines
          return a + b + c + d + e + f + g + h + i + j;
        }

        function medium() {
          const x = 1;
          const y = 2;
          const z = 3;
          return x + y + z;
        }
      `;

      const { ast } = parseTypeScript(code);
      const result = analyzer.analyze(ast, code);

      expect(result.score).toBeLessThan(80);
      expect(result.metrics.functionCV).toBeGreaterThan(0.5);
    });
  });

  describe('Coefficient of Variation', () => {
    test('should calculate CV correctly', () => {
      const code = `
        function f1() { return 1; }
        function f2() { return 2; }
        function f3() { return 3; }
      `;

      const { ast } = parseTypeScript(code);
      const result = analyzer.analyze(ast, code);

      // All functions are 1 line, so CV should be 0
      expect(result.metrics.functionCV).toBe(0);
    });

    test('should calculate high CV for varying sizes', () => {
      const code = `
        function short() { return 1; }

        function long() {
          const a = 1;
          const b = 2;
          const c = 3;
          const d = 4;
          const e = 5;
          const f = 6;
          const g = 7;
          const h = 8;
          return a + b + c + d + e + f + g + h;
        }
      `;

      const { ast } = parseTypeScript(code);
      const result = analyzer.analyze(ast, code);

      expect(result.metrics.functionCV).toBeGreaterThan(0.8);
    });
  });

  describe('Class Balance', () => {
    test('should score high for balanced classes', () => {
      const code = `
        class Service1 {
          method1() { return 1; }
          method2() { return 2; }
          method3() { return 3; }
        }

        class Service2 {
          method1() { return 'a'; }
          method2() { return 'b'; }
          method3() { return 'c'; }
        }
      `;

      const { ast } = parseTypeScript(code);
      const result = analyzer.analyze(ast, code);

      expect(result.score).toBeGreaterThanOrEqual(85);
      expect(result.metrics.classCV).toBeLessThan(0.3);
    });

    test('should penalize unbalanced classes', () => {
      const code = `
        class TinyClass {
          method1() { return 1; }
        }

        class HugeClass {
          method1() { return 1; }
          method2() { return 2; }
          method3() { return 3; }
          method4() { return 4; }
          method5() { return 5; }
          method6() { return 6; }
          method7() { return 7; }
          method8() { return 8; }
          method9() { return 9; }
          method10() { return 10; }
        }
      `;

      const { ast } = parseTypeScript(code);
      const result = analyzer.analyze(ast, code);

      expect(result.metrics.classCV).toBeGreaterThan(0.6);
    });
  });

  describe('Long Functions', () => {
    test('should detect and penalize very long functions', () => {
      // Create a function with 110 lines
      const longFunction = `
        function veryLong() {
          ${Array(108)
            .fill('')
            .map((_, i) => `const var${i} = ${i};`)
            .join('\n')}
          return 1;
        }
      `;

      const { ast } = parseTypeScript(longFunction);
      const result = analyzer.analyze(ast, longFunction);

      expect(result.recommendations).toContainEqual(
        expect.objectContaining({
          principle: 'balance',
          message: expect.stringContaining('100+ lines'),
        })
      );
    });

    test('should not penalize appropriately-sized functions', () => {
      const code = `
        function appropriate1() {
          const a = 1;
          const b = 2;
          const c = 3;
          return a + b + c;
        }

        function appropriate2() {
          const x = 10;
          const y = 20;
          const z = 30;
          return x + y + z;
        }
      `;

      const { ast } = parseTypeScript(code);
      const result = analyzer.analyze(ast, code);

      const longFunctionWarning = result.recommendations.find(r =>
        r.message.includes('100+ lines')
      );

      expect(longFunctionWarning).toBeUndefined();
    });
  });

  describe('Tiny Functions', () => {
    test('should detect too many tiny functions', () => {
      const code = `
        function f1() { return 1; }
        function f2() { return 2; }
        function f3() { return 3; }
        function f4() { return 4; }
        function f5() { return 5; }
        function f6() { return 6; }
        function f7() { return 7; }
        function f8() { return 8; }
        function f9() { return 9; }
        function f10() { return 10; }
      `;

      const { ast } = parseTypeScript(code);
      const result = analyzer.analyze(ast, code);

      const tinyFunctionWarning = result.recommendations.find(r =>
        r.message.includes('very small')
      );

      // Most functions are < 3 LOC, should trigger warning
      expect(tinyFunctionWarning).toBeDefined();
    });
  });

  describe('Positive Feedback', () => {
    test('should give positive feedback for excellent balance', () => {
      const code = `
        function func1() {
          const a = 1;
          const b = 2;
          const c = 3;
          return a + b + c;
        }

        function func2() {
          const x = 10;
          const y = 20;
          const z = 30;
          return x + y + z;
        }

        function func3() {
          const m = 100;
          const n = 200;
          const o = 300;
          return m + n + o;
        }

        function func4() {
          const p = 5;
          const q = 10;
          const r = 15;
          return p + q + r;
        }

        function func5() {
          const u = 8;
          const v = 16;
          const w = 24;
          return u + v + w;
        }

        function func6() {
          const i = 3;
          const j = 6;
          const k = 9;
          return i + j + k;
        }
      `;

      const { ast } = parseTypeScript(code);
      const result = analyzer.analyze(ast, code);

      const positiveRecommendation = result.recommendations.find(r =>
        r.message.includes('Excellent consistency')
      );

      expect(positiveRecommendation).toBeDefined();
      expect(result.score).toBeGreaterThanOrEqual(85);
    });
  });

  describe('Real-world Code', () => {
    test('should analyze balanced class from corpus', () => {
      const goodCodePath = path.join(__dirname, '../corpus/good/balanced-class.ts');
      if (fs.existsSync(goodCodePath)) {
        const code = fs.readFileSync(goodCodePath, 'utf-8');
        const { ast } = parseTypeScript(code);
        const result = analyzer.analyze(ast, code);

        expect(result.score).toBeGreaterThanOrEqual(80);
        expect(result.metrics.functionCV).toBeLessThan(0.6);
      }
    });

    test('should analyze unbalanced class from corpus', () => {
      const badCodePath = path.join(__dirname, '../corpus/bad/unbalanced-class.ts');
      if (fs.existsSync(badCodePath)) {
        const code = fs.readFileSync(badCodePath, 'utf-8');
        const { ast } = parseTypeScript(code);
        const result = analyzer.analyze(ast, code);

        expect(result.score).toBeLessThan(75);
        expect(result.recommendations.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Edge Cases', () => {
    test('should handle code with no functions', () => {
      const code = `
        const x = 1;
        const y = 2;
      `;

      const { ast } = parseTypeScript(code);
      const result = analyzer.analyze(ast, code);

      // Should return default score
      expect(result.score).toBeGreaterThanOrEqual(90);
      expect(result.metrics.functionCV).toBe(0);
    });

    test('should handle single function', () => {
      const code = `
        function single() {
          return 42;
        }
      `;

      const { ast } = parseTypeScript(code);
      const result = analyzer.analyze(ast, code);

      // Single function has CV=0 (no variance)
      expect(result.metrics.functionCV).toBe(0);
      expect(result.score).toBeGreaterThanOrEqual(90);
    });
  });

  describe('Recommendations', () => {
    test('should recommend splitting large functions', () => {
      const longFunction = `
        function huge() {
          ${Array(110)
            .fill('')
            .map((_, i) => `const var${i} = ${i};`)
            .join('\n')}
          return 1;
        }
      `;

      const { ast } = parseTypeScript(longFunction);
      const result = analyzer.analyze(ast, longFunction);

      expect(result.recommendations).toContainEqual(
        expect.objectContaining({
          principle: 'balance',
          severity: expect.any(String),
          suggestedFix: expect.stringContaining('Break down'),
        })
      );
    });

    test('should provide actionable recommendations', () => {
      const code = `
        function a() { return 1; }
        function b() { ${Array(50)
          .fill('')
          .map(() => 'const x = 1;')
          .join('\n')} return 1; }
      `;

      const { ast } = parseTypeScript(code);
      const result = analyzer.analyze(ast, code);

      expect(result.recommendations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            principle: 'balance',
            message: expect.any(String),
            estimatedImpact: expect.any(Number),
          }),
        ])
      );
    });
  });
});
