#!/bin/bash
# ===== AIMASTERY QUICK START TOOLKIT =====

echo "🚀 AIMastery Extension Toolkit Setup"
echo "======================================"

# 1. ESSENTIAL VS CODE TOOLS
echo "📦 Installing VS Code essentials..."
npm install -g vsce yo generator-code
npm install --save-dev @types/vscode @vscode/test-runner

# 2. CODE ANALYSIS TOOLKIT
echo "🔍 Installing code analysis tools..."
npm install typescript prettier eslint
npm install ts-morph @babel/parser complexity-report
npm install --save-dev @typescript-eslint/parser @typescript-eslint/eslint-plugin

# 3. AUDIO ANALYSIS TOOLKIT (pour Vincian features)
echo "🎵 Installing audio analysis tools..."
npm install tone meyda pitchfinder wavefile
npm install fft-js ml-peak-finding audio-buffer-utils

# 4. AI/ML TOOLKIT
echo "🤖 Installing AI/ML tools..."
npm install @tensorflow/tfjs-node openai
npm install natural brain.js ml-kmeans
npm install @huggingface/inference

# 5. UI/UX TOOLKIT
echo "🎨 Installing UI/UX tools..."
npm install @vscode/webview-ui-toolkit @vscode/codicons
npm install chart.js highlight.js animate.css

# 6. BUILD TOOLKIT
echo "🔨 Installing build tools..."
npm install --save-dev webpack webpack-cli ts-loader
npm install --save-dev esbuild rollup @rollup/plugin-typescript
npm install --save-dev husky lint-staged

# 7. MONETIZATION TOOLKIT
echo "💰 Installing monetization tools..."
npm install @amplitude/analytics-node stripe firebase
npm install @sentry/node posthog-node

# 8. SETUP CONFIGURATION FILES
echo "⚙️ Creating configuration files..."

# Webpack config
cat > webpack.config.js << 'EOF'
const path = require('path');

module.exports = {
  target: 'node',
  entry: './src/extension.ts',
  output: {
    path: path.resolve(__dirname, 'out'),
    filename: 'extension.js',
    libraryTarget: 'commonjs2',
    devtoolModuleFilenameTemplate: '../[resource-path]'
  },
  devtool: 'source-map',
  externals: {
    vscode: 'commonjs vscode'
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: 'ts-loader'
      }
    ]
  }
};
EOF

# ESLint config
cat > .eslintrc.json << 'EOF'
{
  "root": true,
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": 6,
    "sourceType": "module"
  },
  "plugins": ["@typescript-eslint"],
  "rules": {
    "@typescript-eslint/naming-convention": "warn",
    "@typescript-eslint/semi": "warn",
    "curly": "warn",
    "eqeqeq": "warn",
    "no-throw-literal": "warn",
    "semi": "off"
  }
}
EOF

# Prettier config
cat > .prettierrc << 'EOF'
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false
}
EOF

# GitHub Actions workflow
mkdir -p .github/workflows
cat > .github/workflows/release.yml << 'EOF'
name: Release Extension

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Compile
        run: npm run compile
      
      - name: Package extension
        run: vsce package
      
      - name: Publish to marketplace
        run: vsce publish -p ${{ secrets.VSCE_TOKEN }}
EOF

# Update package.json scripts
echo "📝 Updating package.json scripts..."
npm pkg set scripts.build="webpack --mode production"
npm pkg set scripts.dev="webpack --mode development --watch"
npm pkg set scripts.analyze="webpack-bundle-analyzer out/extension.js"
npm pkg set scripts.test="npm run compile && node ./out/test/runTest.js"
npm pkg set scripts.lint="eslint src --ext ts"
npm pkg set scripts.format="prettier --write 'src/**/*.ts'"

# 9. SETUP HUSKY HOOKS
echo "🔧 Setting up Git hooks..."
npx husky install
npx husky add .husky/pre-commit "npm run lint && npm run format"
npx husky add .husky/pre-push "npm run test"

# 10. CREATE TOOLKIT HELPER SCRIPTS
mkdir -p scripts

cat > scripts/analyze-code.js << 'EOF'
const { SelfAnalyzer } = require('../out/self-analyzing-extension');
const analyzer = new SelfAnalyzer({ extensionPath: __dirname });

async function analyzeProject() {
  console.log('🔍 Analyzing project...');
  const analysis = analyzer.analyzeSelf();
  console.log(`Health Score: ${(analysis.healthScore * 100).toFixed(1)}%`);
  console.log(`Functions: ${analysis.workingFunctions.length}`);
  console.log(`Patterns: ${analysis.codePatterns.length}`);
}

analyzeProject().catch(console.error);
EOF

cat > scripts/build-release.sh << 'EOF'
#!/bin/bash
echo "🚀 Building AIMastery release..."

# Clean
rm -rf out *.vsix

# Lint and format
npm run lint
npm run format

# Test
npm run test

# Build
npm run build

# Package
vsce package

echo "✅ Release ready!"
ls -la *.vsix
EOF

chmod +x scripts/build-release.sh

# 11. FINAL SETUP
echo "✅ AIMastery Toolkit Setup Complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Run: npm run compile"
echo "2. Test: npm run test"
echo "3. Build: npm run build"
echo "4. Package: vsce package"
echo "5. Publish: vsce publish"
echo ""
echo "🔧 Available Commands:"
echo "- npm run dev       # Development mode"
echo "- npm run lint      # Code linting"
echo "- npm run format    # Code formatting"
echo "- npm run analyze   # Bundle analysis"
echo "- ./scripts/build-release.sh  # Full release build"
echo ""
echo "🎯 Your AIMastery extension is now equipped with professional-grade tooling!"