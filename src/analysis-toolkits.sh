# ===== CODE ANALYSIS TOOLKITS =====

# 1. TYPESCRIPT COMPILER API
npm install typescript
# AST parsing et analysis direct

# 2. BABEL PARSER - JavaScript AST
npm install @babel/parser @babel/traverse @babel/types
# Parse et analyse JS/TS moderne

# 3. ESLINT ENGINE - Linting programmable
npm install eslint
# Créer rules custom et analysis

# 4. PRETTIER - Code formatting
npm install prettier
# Auto-formatting intégré

# 5. JSCODESHIFT - Code transformation
npm install jscodeshift
# Automated refactoring

# 6. DEPENDENCY-CRUISER - Dependency analysis
npm install dependency-cruiser
# Analyse dépendances projets

# 7. COMPLEXITY-REPORT - Métriques complexité
npm install complexity-report
# Calcul McCabe, Halstead

# 8. SONARJS - Quality analysis
npm install eslint-plugin-sonarjs
# Détection code smells

# 9. MADGE - Module dependency graph
npm install madge
# Visualisation dépendances

# 10. TS-MORPH - TypeScript manipulation
npm install ts-morph
# Manipulation AST TypeScript

# USAGE EXAMPLE pour votre extension:
# const { Project } = require('ts-morph');
# const project = new Project();
# const sourceFile = project.addSourceFileAtPath('file.ts');
# const classes = sourceFile.getClasses();