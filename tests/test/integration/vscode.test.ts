import * as assert from 'assert';
import * as vscode from 'vscode';

describe('Extension Tests', () => {
  let extension: vscode.Extension<any>;

  before(() => {
    extension = vscode.extensions.getExtension('Serigne-Diagne.aimastery-vincian-analysis')!;
  });

  it('devrait être présent', () => {
    assert.ok(extension);
  });

  it('devrait activer l\'extension', async () => {
    await extension.activate();
    assert.strictEqual(extension.isActive, true);
  });

  it('devrait enregistrer les commandes', async () => {
    const commands = await vscode.commands.getCommands(true);
    const COMMANDS = [
      'aimastery.testStripe',
      'aimastery.analytics',
      'aimastery.vincianAnalysis',
      'aimastery.fuzzySync',
      'aimastery.creatorPro',
      'aimastery.autoCode',
      'aimastery.blockchainGaming'
    ];

    COMMANDS.forEach(command => {
      assert.ok(
        commands.includes(command),
        `La commande ${command} n'est pas enregistrée`
      );
    });
  });
});
