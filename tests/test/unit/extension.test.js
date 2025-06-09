"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert = __importStar(require("assert"));
const vscode = __importStar(require("vscode"));
describe('AIMasteryExtension', () => {
    let extension;
    before(() => {
        // Active l'extension avant d'exécuter les tests
        extension = vscode.extensions.getExtension('Serigne-Diagne.aimastery-vincian-analysis');
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
            assert.ok(registeredCommands.includes(cmd), `La commande ${cmd} n'est pas enregistrée`);
        });
    });
    describe('Méthodes utilitaires', () => {
        let instance;
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
//# sourceMappingURL=extension.test.js.map