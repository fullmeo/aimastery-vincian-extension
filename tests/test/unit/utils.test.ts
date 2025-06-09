import * as assert from 'assert';
import { analyzeCodeWithVincianPrinciples } from '../../src/utils/analysis';

describe('Utils - Analysis', () => {
  describe('analyzeCodeWithVincianPrinciples', () => {
    it('devrait retourner une analyse pour du code simple', async () => {
      const code = 'function test() { return "Hello, World!"; }';
      const analysis = await analyzeCodeWithVincianPrinciples(code);
      
      // Vérifie que l'analyse contient les champs attendus
      assert.ok(analysis);
      assert.ok(analysis.curiosita >= 0 && analysis.curiosita <= 100);
      assert.ok(analysis.dimostrazione >= 0 && analysis.dimostrazione <= 100);
      assert.ok(analysis.sfumato >= 0 && analysis.sfumato <= 100);
      assert.ok(analysis.arte_scienza >= 0 && analysis.arte_scienza <= 100);
      assert.ok(analysis.corporalita >= 0 && analysis.corporalita <= 100);
      assert.ok(analysis.connessione >= 0 && analysis.connessione <= 100);
      assert.ok(analysis.creazione >= 0 && analysis.creazione <= 100);
      
      // Vérifie que le score global est calculé correctement
      const expectedScore = (
        analysis.curiosita +
        analysis.dimostrazione +
        analysis.sfumato +
        analysis.arte_scienza +
        analysis.corporalita +
        analysis.connessione +
        analysis.creazione
      ) / 7;
      
      assert.strictEqual(analysis.score, expectedScore);
    });

    it('devrait gérer le code vide', async () => {
      const code = '';
      const analysis = await analyzeCodeWithVincianPrinciples(code);
      
      // Vérifie que l'analyse retourne des scores à 0 pour un code vide
      assert.strictEqual(analysis.curiosita, 0);
      assert.strictEqual(analysis.dimostrazione, 0);
      assert.strictEqual(analysis.sfumato, 0);
      assert.strictEqual(analysis.arte_scienza, 0);
      assert.strictEqual(analysis.corporalita, 0);
      assert.strictEqual(analysis.connessione, 0);
      assert.strictEqual(analysis.creazione, 0);
      assert.strictEqual(analysis.score, 0);
    });
  });
});
