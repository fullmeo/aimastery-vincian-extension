# Guide des tests pour AIMastery Vincian Analysis

Ce guide explique comment exécuter et déboguer les tests pour l'extension VS Code AIMastery Vincian Analysis.

## Structure des tests

- `tests/unit/` - Tests unitaires pour les composants individuels
- `tests/integration/` - Tests d'intégration avec VS Code
- `tests/fixtures/` - Données de test et mocks

## Exécution des tests

### Prérequis

- Node.js (version 14.x ou supérieure)
- npm (version 6.x ou supérieure)
- VS Code (version 1.60.0 ou supérieure)

### Installation des dépendances

```bash
npm install
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

## Débogage des tests

### Déboguer les tests unitaires

1. Ouvrez le fichier de test dans VS Code
2. Placez des points d'arrêt dans votre code de test ou votre code source
3. Sélectionnez la configuration de débogage "Debug Current Test File"
4. Appuyez sur F5 pour démarrer le débogage

### Déboguer les tests d'intégration

1. Ouvrez le fichier de test d'intégration dans VS Code
2. Placez des points d'arrêt dans votre code de test
3. Sélectionnez la configuration de débogage "Extension Tests"
4. Appuyez sur F5 pour démarrer le débogage

## Bonnes pratiques

- Un test = une assertion
- Nommez clairement vos tests
- Utilisez des fixtures pour les données de test
- Écrivez des tests indépendants
- Testez les cas limites et les erreurs

## Couverture de code

La couverture de code est générée automatiquement avec `nyc` et peut être consultée dans le dossier `coverage/` après l'exécution des tests.

## Ressources utiles

- [Documentation Mocha](https://mochajs.org/)
- [Documentation Chai](https://www.chaijs.com/)
- [Guide de test VS Code](https://code.visualstudio.com/api/working-with-extensions/testing-extension)
