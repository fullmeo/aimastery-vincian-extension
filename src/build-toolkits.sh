# ===== BUILD & DEPLOYMENT TOOLKITS =====

# 1. WEBPACK - Bundling avancé
npm install --save-dev webpack webpack-cli webpack-merge
npm install --save-dev ts-loader css-loader
# Bundle optimisé pour webviews

# 2. ROLLUP - Bundle plus léger
npm install --save-dev rollup @rollup/plugin-typescript
# Alternative à webpack

# 3. ESBUILD - Build ultra-rapide
npm install --save-dev esbuild
# Compilation TypeScript rapide

# 4. GITHUB ACTIONS - CI/CD
# Créer .github/workflows/release.yml
# Automatisation deployment

# 5. SEMANTIC-RELEASE - Versioning auto
npm install --save-dev semantic-release
# Gestion versions automatique

# 6. HUSKY - Git hooks
npm install --save-dev husky
npx husky install
# Pre-commit hooks

# 7. LINT-STAGED - Linting staged files
npm install --save-dev lint-staged
# Lint seulement fichiers modifiés

# 8. COMMITIZEN - Commits standardisés
npm install --save-dev commitizen cz-conventional-changelog
# Commits conventional

# 9. CHANGELOG GENERATOR - Documentation
npm install --save-dev conventional-changelog-cli
# Génération CHANGELOG.md

# 10. BUNDLE ANALYZER - Analyse taille
npm install --save-dev webpack-bundle-analyzer
# Optimisation taille bundle

# EXEMPLE CONFIGURATION:
# package.json scripts:
# {
#   "scripts": {
#     "build": "webpack --mode production",
#     "dev": "webpack --mode development --watch",
#     "analyze": "webpack-bundle-analyzer dist/bundle.js",
#     "release": "semantic-release"
#   }
# }