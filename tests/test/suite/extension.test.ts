import * as assert from 'assert';
import * as vscode from 'vscode';
import { AIMasteryExtension } from '../../extension';

// Helper function to wait for the extension to be activated
const waitForExtensionActivation = async (context: vscode.ExtensionContext) => {
  const extension = vscode.extensions.getExtension<AIMasteryExtension>('Serigne-Diagne.aimastery-vincian-analysis');
  if (!extension) {
    throw new Error('Extension not found');
  }
  
  // Wait for the extension to activate
  const api = await extension.activate();
  if (!api) {
    throw new Error('Failed to activate extension');
  }
  
  return { extension, api };
};

describe('Extension Test Suite', () => {
  let context: vscode.ExtensionContext;
  let extension: vscode.Extension<AIMasteryExtension>;
  let api: AIMasteryExtension;

  before(async () => {
    // This will be set by the test runner
    context = global.__extensionContext as vscode.ExtensionContext;
    
    // Wait for the extension to be activated
    const result = await waitForExtensionActivation(context);
    extension = result.extension;
    api = result.api;
  });

  it('should be present', () => {
    assert.ok(extension);
  });

  it('should be activated', () => {
    assert.strictEqual(extension.isActive, true);
  });

  it('should register all commands', async () => {
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
        `Command ${cmd} is not registered`
      );
    });
  });

  it('should have access to the extension API', () => {
    assert.ok(api);
    assert.ok(typeof api.activate === 'function');
    assert.ok(typeof api.deactivate === 'function');
  });

  // Add more tests for specific functionality here
  describe('Vincian Analysis', () => {
    it('should analyze code with Vincian principles', async () => {
      // This is a basic test - you'll need to implement the actual analysis
      const result = await vscode.commands.executeCommand('aimastery.vincianAnalysis');
      assert.ok(result !== undefined);
    });
  });
});
