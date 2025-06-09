import * as assert from 'assert';
import * as vscode from 'vscode';
import { AIMasteryExtension } from '../../src/extension';

describe('AIMasteryExtension', () => {
  let extension: vscode.Extension<AIMasteryExtension>;

  before(() => {
    // Active l'extension avant d'exécuter les tests
    extension = vscode.extensions.getExtension('Serigne-Diagne.aimastery-vincian-analysis')!;
  });

  it('devrait être activé', async () => {
    // Vérifie que l'extension est bien activée
    await extension.activate();
    assert.strictEqual(extension.isActive, true);
  });

  it('devrait enregistrer toutes les commandes', async () => {
    // Vérifie que les commandes sont bien enregistrées
    const commands = await vscode.commands.getCommands(true);
    const expectedCommands = [
      'aimastery.testStripe',
      'aimastery.analytics',
      'aimastery.vincianAnalysis',
      'aimastery.fuzzySync',
      'aimastery.creatorPro',
      'aimastery.autoCode',
      'aimastery.blockchainGaming'
    ];

    const registeredCommands = commands.filter(cmd => cmd.startsWith('aimastery.'));
    expectedCommands.forEach(cmd => {
      assert.ok(
        registeredCommands.includes(cmd),
        `La commande ${cmd} n'est pas enregistrée`
      );
    });
  });

  describe('Méthodes utilitaires', () => {
    let instance: AIMasteryExtension;

    before(() => {
      instance = extension.exports;
    });

    it('devrait gérer la sélection de plan', async () => {
      // Test de la méthode handlePlanSelection
      const plan = 'basic';
      const result = await instance['handlePlanSelection'](plan);
      
      // Vérifie que la méthode renvoie un booléen
      assert.ok(typeof result === 'boolean');
    });
  });
});
