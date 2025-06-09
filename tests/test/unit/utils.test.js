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
const analysis_1 = require("../../src/utils/analysis");
describe('Utils - Analysis', () => {
    describe('analyzeCodeWithVincianPrinciples', () => {
        it('devrait retourner une analyse pour du code simple', async () => {
            const code = 'function test() { return "Hello, World!"; }';
            const analysis = await (0, analysis_1.analyzeCodeWithVincianPrinciples)(code);
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
            const expectedScore = (analysis.curiosita +
                analysis.dimostrazione +
                analysis.sfumato +
                analysis.arte_scienza +
                analysis.corporalita +
                analysis.connessione +
                analysis.creazione) / 7;
            assert.strictEqual(analysis.score, expectedScore);
        });
        it('devrait gérer le code vide', async () => {
            const code = '';
            const analysis = await (0, analysis_1.analyzeCodeWithVincianPrinciples)(code);
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
//# sourceMappingURL=utils.test.js.map