# Tests pour AIMastery Vincian Analysis

Ce dossier contient les tests automatisés pour l'extension VS Code AIMastery Vincian Analysis.

## Structure des tests

```
tests/
├── unit/                # Tests unitaires
│   ├── services/        # Tests des services
│   └── utils/           # Tests des utilitaires
├── integration/         # Tests d'intégration
└── fixtures/            # Données de test
```

## Exécution des tests

### Prérequis

- Node.js (version 14.x ou supérieure)
- npm (version 6.x ou supérieure)
- VS Code (version 1.60.0 ou supérieure)

### Installation des dépendances de test

```bash
npm install --save-dev @types/mocha @types/node @vscode/test-electron
```

### Exécuter tous les tests

```bash
npm test
```

### Exécuter les tests en mode watch

```bash
npm run test:watch
```

### Générer un rapport de couverture de code

```bash
npm run test:coverage
```

## Écrire de nouveaux tests

1. Créez un nouveau fichier de test avec le suffixe `.test.ts`
2. Utilisez le framework Mocha avec la syntaxe BDD :

```typescript
import * as assert from 'assert';
import { someFunction } from '../../src/utils/helpers';

describe('Helpers', () => {
  describe('someFunction()', () => {
    it('should return expected value', () => {
      const result = someFunction('input');
      assert.strictEqual(result, 'expected output');
    });
  });
});
```

## Bonnes pratiques

- Un test = une assertion
- Nommez clairement vos tests
- Utilisez des fixtures pour les données de test
- Écrivez des tests indépendants
- Testez les cas limites et les erreurs

## Débogage des tests

1. Dans VS Code, ouvrez le fichier de test
2. Placez des points d'arrêt
3. Utilisez la configuration de débogage "Debug Current Test File"

## Couverture de code

La couverture de code est générée automatiquement avec `nyc` et peut être consultée dans le dossier `coverage/` après l'exécution des tests.
