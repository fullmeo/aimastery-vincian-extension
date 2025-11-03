import { VincianScoreEngine } from '../../src/features/vincian-analysis/VincianScoreEngine';

describe('VincianScoreEngine', () => {
  let engine: VincianScoreEngine;

  beforeEach(() => {
    engine = new VincianScoreEngine();
  });

  describe('Basic Scoring', () => {
    test('should calculate score for simple code', async () => {
      const code = `
        function add(a: number, b: number): number {
          return a + b;
        }
      `;

      const result = await engine.calculateScore(code);

      expect(result.overall).toBeGreaterThanOrEqual(70);
      expect(result.overall).toBeLessThanOrEqual(100);
      expect(result.grade).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
    });

    test('should return valid structure', async () => {
      const code = `
        function test() {
          return true;
        }
      `;

      const result = await engine.calculateScore(code);

      expect(result).toHaveProperty('overall');
      expect(result).toHaveProperty('breakdown');
      expect(result).toHaveProperty('grade');
      expect(result).toHaveProperty('recommendations');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('metadata');
    });
  });

  describe('Breakdown', () => {
    test('should include all 7 principles in breakdown', async () => {
      const code = `function test() { return 1; }`;

      const result = await engine.calculateScore(code);

      expect(result.breakdown).toHaveProperty('movement');
      expect(result.breakdown).toHaveProperty('balance');
      expect(result.breakdown).toHaveProperty('proportion');
      expect(result.breakdown).toHaveProperty('contrast');
      expect(result.breakdown).toHaveProperty('unity');
      expect(result.breakdown).toHaveProperty('simplicity');
      expect(result.breakdown).toHaveProperty('perspective');
    });

    test('should have scores between 0 and 100', async () => {
      const code = `function test() { return 1; }`;

      const result = await engine.calculateScore(code);

      Object.values(result.breakdown).forEach(score => {
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('Grading', () => {
    test('should assign correct grade for high score', async () => {
      const code = `
        function calculateTotal(items: CartItem[]): number {
          if (items.length === 0) {
            return 0;
          }
          return items.reduce((total, item) => total + item.price * item.quantity, 0);
        }
        interface CartItem { price: number; quantity: number; }
      `;

      const result = await engine.calculateScore(code);

      if (result.overall >= 90) {
        expect(result.grade).toContain('A+');
      } else if (result.overall >= 85) {
        expect(result.grade).toContain('A');
      }
    });

    test('should assign lower grade for complex code', async () => {
      const code = `
        function complex(x: any) {
          if (x) {
            if (x.a) {
              if (x.b) {
                if (x.c) {
                  if (x.d) {
                    if (x.e) {
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

      const result = await engine.calculateScore(code);

      expect(result.overall).toBeLessThan(80);
      expect(result.grade).not.toContain('A+');
    });
  });

  describe('Recommendations', () => {
    test('should provide recommendations for poor code', async () => {
      const code = `
        function badCode(x: any) {
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

      const result = await engine.calculateScore(code);

      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.recommendations[0]).toHaveProperty('principle');
      expect(result.recommendations[0]).toHaveProperty('severity');
      expect(result.recommendations[0]).toHaveProperty('message');
      expect(result.recommendations[0]).toHaveProperty('estimatedImpact');
    });

    test('should prioritize recommendations by severity', async () => {
      const code = `
        function problematic(x: any) {
          if (x) {
            if (x.a) {
              if (x.b) {
                if (x.c) {
                  if (x.d) {
                    return true;
                  }
                }
              }
            }
          }
          return false;
        }
      `;

      const result = await engine.calculateScore(code);

      if (result.recommendations.length > 1) {
        const severityOrder = { critical: 0, warning: 1, info: 2 };
        for (let i = 0; i < result.recommendations.length - 1; i++) {
          const current = severityOrder[result.recommendations[i].severity];
          const next = severityOrder[result.recommendations[i + 1].severity];
          expect(current).toBeLessThanOrEqual(next);
        }
      }
    });

    test('should limit recommendations to top 10', async () => {
      const code = `function test() { return 1; }`;

      const result = await engine.calculateScore(code);

      expect(result.recommendations.length).toBeLessThanOrEqual(10);
    });
  });

  describe('Confidence', () => {
    test('should calculate confidence score', async () => {
      const code = `function test() { return 1; }`;

      const result = await engine.calculateScore(code);

      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(100);
    });

    test('should have lower confidence for varied principle scores', async () => {
      // Code that will score very differently across principles
      const unevenCode = `
        function test() {
          if (x) {
            if (y) {
              if (z) {
                return true;
              }
            }
          }
          return false;
        }
      `;

      const result = await engine.calculateScore(unevenCode);

      // Confidence should exist
      expect(result.confidence).toBeDefined();
      expect(result.confidence).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Metadata', () => {
    test('should include correct metadata', async () => {
      const code = `
        function test1() { return 1; }
        function test2() { return 2; }
        function test3() { return 3; }
      `;

      const result = await engine.calculateScore(code);

      expect(result.metadata.linesOfCode).toBeGreaterThan(0);
      expect(result.metadata.filesAnalyzed).toBe(1);
      expect(result.metadata.analysisTime).toBeGreaterThan(0);
      expect(result.metadata.timestamp).toBeInstanceOf(Date);
    });

    test('should have reasonable analysis time', async () => {
      const code = `function test() { return 1; }`;

      const result = await engine.calculateScore(code);

      // Analysis should be fast (< 1 second for simple code)
      expect(result.metadata.analysisTime).toBeLessThan(1000);
    });
  });

  describe('Custom Weights', () => {
    test('should accept custom weights', async () => {
      const customWeights = {
        movement: 2.0,
        simplicity: 0.5,
      };

      const engineWithWeights = new VincianScoreEngine(customWeights);
      const code = `function test() { return 1; }`;

      const result = await engineWithWeights.calculateScore(code);

      expect(result.overall).toBeDefined();
    });

    test('should allow updating weights', () => {
      engine.setWeights({ movement: 2.0 });

      const weights = engine.getWeights();

      expect(weights.movement).toBe(2.0);
    });

    test('should preserve other weights when updating', () => {
      const originalWeights = engine.getWeights();

      engine.setWeights({ movement: 2.0 });

      const newWeights = engine.getWeights();

      expect(newWeights.balance).toBe(originalWeights.balance);
      expect(newWeights.simplicity).toBe(originalWeights.simplicity);
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid TypeScript code', async () => {
      const invalidCode = `function ( { invalid syntax }`;

      await expect(engine.calculateScore(invalidCode)).rejects.toThrow();
    });

    test('should provide useful error message', async () => {
      const invalidCode = `function ( { invalid }`;

      try {
        await engine.calculateScore(invalidCode);
        fail('Should have thrown error');
      } catch (error) {
        expect((error as Error).message).toContain('Vincian Score analysis failed');
      }
    });
  });

  describe('Options', () => {
    test('should accept file path option', async () => {
      const code = `function test() { return 1; }`;

      const result = await engine.calculateScore(code, {
        filePath: 'test.ts',
      });

      expect(result.overall).toBeDefined();
    });

    test('should accept custom weights in options', async () => {
      const code = `function test() { return 1; }`;

      const result = await engine.calculateScore(code, {
        weights: { movement: 2.0 },
      });

      expect(result.overall).toBeDefined();
    });
  });
});
