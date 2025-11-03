#!/bin/bash

# 🚀 Script de Publication Automatique - AI Mastery Vincian Analysis Extension
# Usage: ./automation_script.sh

echo "🧬 AI Mastery Vincian Analysis - Publication Automatique"
echo "======================================================"

# Variables de configuration
PROJECT_PATH="C:/Users/diase/OneDrive/Musique/Documents/aimastery/vincian_analyzer_vs-extension/aimastery-vincian-analysis"
EXTENSION_NAME="aimastery-vincian-analysis"
PUBLISHER="aimastery"
DISPLAY_NAME="AI Mastery - Vincian Code Analysis"

# Naviguer vers le répertoire du projet
cd "$PROJECT_PATH" || {
    echo "❌ Impossible de naviguer vers le répertoire du projet"
    echo "Chemin: $PROJECT_PATH"
    exit 1
}

echo "📍 Répertoire de travail: $(pwd)"

# Vérifications préliminaires
echo "📋 Vérification des prérequis..."

# Vérifier si vsce est installé
if ! command -v vsce &> /dev/null; then
    echo "❌ vsce n'est pas installé. Installation..."
    npm install -g @vscode/vsce
fi

# Vérifier package.json
if [ ! -f "package.json" ]; then
    echo "❌ package.json non trouvé dans ce dossier"
    exit 1
fi

echo "✅ package.json trouvé"

# Vérifier les fichiers essentiels
required_files=(
    "src/extension.ts"
    "src/self-analyzing-extension.ts"
    "src/VincianTypes.ts"
    "src/ux_optimization.ts"
)

for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ $file non trouvé"
        exit 1
    else
        echo "✅ $file trouvé"
    fi
done

# Vérifier le dossier providers
if [ ! -d "src/providers" ]; then
    echo "📁 Création du dossier src/providers..."
    mkdir -p src/providers
fi

# Créer ViewProviders.ts s'il n'existe pas
if [ ! -f "src/providers/ViewProviders.ts" ]; then
    echo "📝 Création de ViewProviders.ts..."
    cat > src/providers/ViewProviders.ts << 'EOF'
import * as vscode from 'vscode';
import { SelfAnalyzer } from '../self-analyzing-extension';

export class CodeHealthProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined | null | void> = new vscode.EventEmitter<vscode.TreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor(private analyzer: SelfAnalyzer) {}

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: vscode.TreeItem): Thenable<vscode.TreeItem[]> {
        const analysis = this.analyzer.analyzeSelf();
        const healthScore = (analysis.healthScore * 100).toFixed(1);
        
        return Promise.resolve([
            new vscode.TreeItem(`Health Score: ${healthScore}%`, vscode.TreeItemCollapsibleState.None),
            new vscode.TreeItem(`Functions: ${analysis.workingFunctions.length}`, vscode.TreeItemCollapsibleState.None),
            new vscode.TreeItem(`Patterns: ${analysis.codePatterns.length}`, vscode.TreeItemCollapsibleState.None)
        ]);
    }
}

export class PatternsProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined | null | void> = new vscode.EventEmitter<vscode.TreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor(private analyzer: SelfAnalyzer) {}

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: vscode.TreeItem): Thenable<vscode.TreeItem[]> {
        const analysis = this.analyzer.analyzeSelf();
        
        return Promise.resolve(
            analysis.codePatterns.map(pattern => 
                new vscode.TreeItem(`${pattern.name} (${pattern.frequency}x)`, vscode.TreeItemCollapsibleState.None)
            )
        );
    }
}

export class ImprovementsProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined | null | void> = new vscode.EventEmitter<vscode.TreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor(private analyzer: SelfAnalyzer) {}

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: vscode.TreeItem): Thenable<vscode.TreeItem[]> {
        const analysis = this.analyzer.analyzeSelf();
        
        return Promise.resolve(
            analysis.improvementOpportunities.slice(0, 10).map(improvement => 
                new vscode.TreeItem(improvement, vscode.TreeItemCollapsibleState.None)
            )
        );
    }
}
EOF
    echo "✅ ViewProviders.ts créé"
fi

# Créer tsconfig.json optimisé
if [ ! -f "tsconfig.json" ]; then
    echo "📝 Création de tsconfig.json optimisé..."
    cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "module": "commonjs",
    "target": "ES2020",
    "outDir": "out",
    "lib": ["ES2020"],
    "sourceMap": true,
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", ".vscode-test", "out"]
}
EOF
    echo "✅ tsconfig.json créé"
fi

# Créer README.md adapté
if [ ! -f "README.md" ]; then
    echo "📝 Création de README.md..."
    cat > README.md << 'EOF'
# 🧬 AI Mastery - Vincian Code Analysis

**Leonardo da Vinci-inspired AI code analysis for VS Code**

Transform your code with the wisdom of the Renaissance master himself. This extension combines advanced AI analysis with Leonardo's observational genius to provide unprecedented insights into your codebase.

## ✨ Features

### 🧠 **Vincian AI Analysis**
- **Self-Analyzing Extension**: The extension analyzes its own code in real-time
- **Health Scoring**: Comprehensive code health metrics (30-100%)
- **Pattern Recognition**: Identifies and catalogs code patterns automatically
- **AI-Powered Insights**: Advanced semantic analysis with confidence scoring

### 🎯 **Smart Analysis Tools**
- **Function Detection**: Automatically finds and scores all functions
- **Quality Metrics**: Real-time quality assessment for each function
- **Improvement Suggestions**: AI-generated recommendations with priorities
- **Project Overview**: Complete workspace analysis

### 🔧 **Auto-Improvement**
- **Self-Improvement**: Extension improves its own code automatically
- **Auto-Fix**: One-click fixes for common issues
- **Pattern Reproduction**: Generate code from detected patterns
- **Continuous Monitoring**: Background health monitoring

### 📊 **Rich Visualizations**
- **Interactive Reports**: Beautiful HTML analysis reports
- **Health Dashboard**: Real-time metrics in VS Code sidebar
- **Progress Tracking**: Monitor code improvements over time
- **Pattern Gallery**: Visual representation of code patterns

## 🚀 Getting Started

### Installation
```bash
# Install from VS Code Marketplace
ext install aimastery.aimastery-vincian-analysis

# Or via command line
code --install-extension aimastery.aimastery-vincian-analysis
```

### Quick Start
1. **Self-Analysis**: `Ctrl+Shift+P` → "AI Mastery: Self Analysis"
2. **Analyze File**: `Ctrl+Shift+P` → "AI Mastery: Analyze Current File"
3. **Auto-Fix**: `Ctrl+Shift+P` → "AI Mastery: Auto Fix"
4. **Workspace Analysis**: `Ctrl+Shift+P` → "AI Mastery: Analyze Workspace"

## 🎨 Commands

| Command | Shortcut | Description |
|---------|----------|-------------|
| Self Analysis | - | Analyze the extension's own code |
| Self Improve | - | Auto-improve the extension |
| Analyze File | - | Analyze current file with AI |
| Auto Fix | - | Apply automatic fixes |
| Analyze Workspace | - | Complete project analysis |

## 🧬 The Vincian Approach

Inspired by Leonardo da Vinci's systematic observation methods:

- **Detailed Observation**: Every line of code is analyzed
- **Pattern Recognition**: Natural patterns emerge from analysis
- **Continuous Learning**: The AI improves with each analysis
- **Holistic View**: Understanding code as a complete system

## 📈 Health Scoring

The extension uses a sophisticated health scoring system:

- **🟢 90-100%**: Excellent code quality
- **🟡 70-89%**: Good code with minor issues
- **🟠 50-69%**: Moderate issues, improvement recommended
- **🔴 30-49%**: Significant issues, requires attention
- **⚫ <30%**: Critical issues, immediate action needed

## 🔧 Configuration

```json
{
  "aimastery.autoImprove.enabled": true,
  "aimastery.autoImprove.intervalHours": 1,
  "aimastery.autoImprove.healthThreshold": 0.8
}
```

## 🤝 Contributing

We welcome contributions! This extension is designed to improve itself, and we encourage the community to help it evolve.

## 📜 License

MIT License - See LICENSE file for details

## 🎯 About

Created with the philosophy that code analysis should be as thorough and insightful as Leonardo's notebooks. Every function, every pattern, every improvement opportunity is cataloged with the same attention to detail that Leonardo brought to his anatomical studies.

---

*"Obstacles cannot crush me; every obstacle yields to stern resolve."* - Leonardo da Vinci
EOF
    echo "✅ README.md créé"
fi

# Créer .vscodeignore optimisé
if [ ! -f ".vscodeignore" ]; then
    echo "📝 Création de .vscodeignore..."
    cat > .vscodeignore << 'EOF'
.vscode/**
.vscode-test/**
src/**
.gitignore
.yarnrc
vsc-extension-quickstart.md
**/tsconfig.json
**/.eslintrc.json
**/*.map
**/*.ts
node_modules/**
automation_script.sh
*.sh
.DS_Store
EOF
    echo "✅ .vscodeignore créé"
fi

# Vérifier et optimiser package.json
echo "🔍 Vérification de package.json..."

# Backup du package.json original
cp package.json package.json.backup

# Mise à jour du package.json avec Python
python3 << 'EOF'
import json
import sys

try:
    with open('package.json', 'r', encoding='utf-8') as f:
        package = json.load(f)
    
    # Corrections essentielles
    package['name'] = 'aimastery-vincian-analysis'
    package['displayName'] = 'AI Mastery - Vincian Code Analysis'
    package['publisher'] = 'aimastery'
    package['description'] = 'Leonardo da Vinci-inspired AI code analysis with self-improvement capabilities'
    package['version'] = package.get('version', '1.0.0')
    package['license'] = 'MIT'
    package['repository'] = {
        'type': 'git',
        'url': 'https://github.com/aimastery/vincian-analyzer'
    }
    
    # Keywords
    package['keywords'] = [
        'code analysis', 'ai', 'typescript', 'quality', 'vincian',
        'self-improvement', 'patterns', 'health scoring', 'leonardo'
    ]
    
    # Engines
    package['engines'] = {
        'vscode': '^1.74.0'
    }
    
    # Main entry point
    package['main'] = './out/extension.js'
    
    # Scripts
    package['scripts'] = {
        'vscode:prepublish': 'npm run compile',
        'compile': 'tsc -p ./',
        'watch': 'tsc -watch -p ./',
        'pretest': 'npm run compile && npm run lint',
        'lint': 'eslint src --ext ts',
        'test': 'node ./out/test/runTest.js',
        'clean': 'rimraf out'
    }
    
    # DevDependencies
    package['devDependencies'] = {
        '@types/vscode': '^1.74.0',
        '@types/node': '16.x',
        'typescript': '^4.9.4',
        'rimraf': '^3.0.2'
    }
    
    # Categories
    package['categories'] = ['Other', 'Linters', 'Formatters']
    
    # Activation events
    package['activationEvents'] = ['onStartupFinished']
    
    # Contributes
    if 'contributes' not in package:
        package['contributes'] = {}
    
    package['contributes']['commands'] = [
        {
            'command': 'aimastery.selfAnalysis',
            'title': '🧬 Self Analysis',
            'category': 'AI Mastery'
        },
        {
            'command': 'aimastery.selfImprove',
            'title': '🔄 Self Improve',
            'category': 'AI Mastery'
        },
        {
            'command': 'aimastery.analyzeCurrentFile',
            'title': '📊 Analyze Current File',
            'category': 'AI Mastery'
        },
        {
            'command': 'aimastery.autoFix',
            'title': '🔧 Auto Fix',
            'category': 'AI Mastery'
        },
        {
            'command': 'aimastery.analyzeWorkspace',
            'title': '🏗️ Analyze Workspace',
            'category': 'AI Mastery'
        },
        {
            'command': 'aimastery.refreshData',
            'title': '🔄 Refresh Data',
            'category': 'AI Mastery'
        }
    ]
    
    package['contributes']['views'] = {
        'explorer': [
            {
                'id': 'aimastery-health',
                'name': '🧬 Code Health',
                'when': 'true'
            },
            {
                'id': 'aimastery-patterns',
                'name': '🔍 Code Patterns',
                'when': 'true'
            },
            {
                'id': 'aimastery-improvements',
                'name': '💡 Improvements',
                'when': 'true'
            }
        ]
    }
    
    package['contributes']['configuration'] = {
        'title': 'AI Mastery',
        'properties': {
            'aimastery.autoImprove.enabled': {
                'type': 'boolean',
                'default': true,  # ✅ CORRIGÉ: true au lieu de True
                'description': 'Enable automatic self-improvement'
            },
            'aimastery.autoImprove.intervalHours': {
                'type': 'number',
                'default': 1,
                'description': 'Auto-improvement interval in hours'
            },
            'aimastery.autoImprove.healthThreshold': {
                'type': 'number',
                'default': 0.8,
                'description': 'Health threshold for auto-improvement'
            }
        }
    }
    
    with open('package.json', 'w', encoding='utf-8') as f:
        json.dump(package, f, indent=2, ensure_ascii=False)
    
    print("✅ package.json mis à jour avec succès")
    
except Exception as e:
    print(f"❌ Erreur lors de la mise à jour de package.json: {e}")
    sys.exit(1)
EOF

# Installer les dépendances
echo "📦 Installation des dépendances..."
npm install

# Nettoyage et compilation
echo "🧹 Nettoyage des anciens fichiers..."
rm -rf out/
mkdir -p out/

echo "🔨 Compilation TypeScript..."
npm run compile

# Vérifier que la compilation a réussi
if [ ! -f "out/extension.js" ]; then
    echo "❌ Échec de la compilation - out/extension.js non créé"
    echo "Vérifiez les erreurs TypeScript ci-dessus"
    exit 1
fi

echo "✅ Compilation réussie"

# Créer le package VSIX
echo "📦 Création du package VSIX..."
vsce package

# Vérifier que le package a été créé
VSIX_FILE=$(ls *.vsix 2>/dev/null | head -n 1)
if [ -z "$VSIX_FILE" ]; then
    echo "❌ Échec de la création du package VSIX"
    exit 1
fi

echo "✅ Package créé: $VSIX_FILE"

# Demander confirmation avant publication
echo ""
echo "🚀 Prêt pour la publication !"
echo "Extension: $DISPLAY_NAME"
echo "Version: $(grep '"version"' package.json | cut -d'"' -f4)"
echo "Publisher: $PUBLISHER"
echo "Package: $VSIX_FILE"
echo ""

read -p "Voulez-vous continuer avec la publication ? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Publication annulée"
    echo "💡 Vous pouvez installer localement avec:"
    echo "   code --install-extension $VSIX_FILE"
    exit 1
fi

# Vérifier l'authentification
echo "🔐 Vérification de l'authentification..."
if ! vsce ls &> /dev/null; then
    echo "❌ Non authentifié. Connexion requise..."
    echo "Vous allez être invité à vous connecter avec votre token Azure DevOps"
    vsce login $PUBLISHER
fi

# Publication
echo "🚀 Publication en cours..."
vsce publish

# Vérification post-publication
if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Publication réussie !"
    echo "📱 Votre extension sera disponible dans 2-5 minutes sur :"
    echo "   https://marketplace.visualstudio.com/items?itemName=$PUBLISHER.$EXTENSION_NAME"
    echo ""
    echo "📋 Test d'installation :"
    echo "   code --install-extension $PUBLISHER.$EXTENSION_NAME"
    echo ""
    echo "🧬 Commandes disponibles :"
    echo "   - AI Mastery: Self Analysis"
    echo "   - AI Mastery: Analyze Current File"
    echo "   - AI Mastery: Auto Fix"
    echo "   - AI Mastery: Analyze Workspace"
    echo ""
    echo "🎯 L'extension inclut :"
    echo "   - Analyse en temps réel avec scoring de santé"
    echo "   - Auto-amélioration continue"
    echo "   - Détection de patterns intelligente"
    echo "   - Rapports HTML interactifs"
else
    echo "❌ Échec de la publication"
    echo "💡 Vous pouvez toujours installer localement avec:"
    echo "   code --install-extension $VSIX_FILE"
    exit 1
fi

echo ""
echo "🧬 AI Mastery Vincian Analysis est maintenant publié !"
echo "🎨 Que Leonardo soit fier de cette création ! 🎨"