module.exports = {
  // Spécifie le répertoire racine des tests
  require: ['ts-node/register'],
  extension: ['ts'],
  spec: ['tests/**/*.test.ts'],
  timeout: 10000,
  exit: true,
  color: true,
  // Utilise le reporter spécifié
  reporter: 'spec',
  // Exécute les tests de manière récursive
  recursive: true,
  // Active les couleurs dans la sortie
  colors: true,
  // Affiche les différences complètes pour les échecs
  inlineDiffs: true,
  // Ignore les fichiers de couverture
  exclude: ['**/coverage/**', '**/node_modules/**'],
  // Configuration pour les rapports de couverture
  'check-leaks': true,
  'full-trace': true,
  // Configuration pour les tests TypeScript
  'require': ['ts-node/register', 'source-map-support/register'],
  // Configuration pour les tests VS Code
  'extensionDevelopmentPath': '.',
  // Configuration pour les tests d'extension VS Code
  'extensionTestsPath': './out/test/suite/index',
  // Désactive les tests en attente
  'forbid-only': Boolean(process.env.CI),
  // Échoue s'il n'y a pas de tests
  'forbid-pending': Boolean(process.env.CI),
  // Affiche les tests les plus lents
  'slow': 1000,
  // Délai d'attente pour les tests
  'timeout': 10000,
  // Affiche les détails des tests
  'v': true,
  // Affiche les tests en cours d'exécution
  'reporter-options': [
    'mocha-junit-reporter.outputFile=test-results.xml',
    'mocha-junit-reporter.testCaseSwitchClassname=true',
    'mocha-junit-reporter.suiteTitleSeparatedBy="."',
    'mocha-junit-reporter.useFullSuiteTitle=true',
    'mocha-junit-reporter.title=[name]'
  ]
};
