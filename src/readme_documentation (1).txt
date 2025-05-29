# 🎨 AIMastery Vincian Analysis

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://marketplace.visualstudio.com/items?itemName=aimastery.vincian-analysis)
[![Leonardo da Vinci](https://img.shields.io/badge/Leonardo-da%20Vinci-gold.svg)](https://en.wikipedia.org/wiki/Leonardo_da_Vinci)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

Une extension VS Code révolutionnaire qui analyse et améliore votre code selon les **7 principes de Léonard de Vinci** appliqués au développement logiciel. Transformez votre approche du codage en combinant art, science et génie créatif.

## ✨ Fonctionnalités Principales

### 🔍 **Analyse Vincienne Multi-Dimensionnelle**
- **Analyse en temps réel** selon les 7 principes de da Vinci
- **Marqueurs interactifs** dans l'éditeur avec explications détaillées
- **Rapports visuels** avec graphiques radar et métriques avancées
- **Analyse de projet complète** avec statistiques globales

### 🎯 **Les 7 Principes Vinciens**

| Principe | Description | Application au Code |
|----------|-------------|-------------------|
| **🔬 Curiosità** | Exploration et expérimentation | Patterns exploratoires, alternatives créatives |
| **✅ Dimostrazione** | Validation et preuve | Tests, assertions, validation robuste |
| **🎨 Sensazione** | Clarté et esthétique | Lisibilité, documentation, style cohérent |
| **🌫️ Sfumato** | Gestion de l'ambiguïté | Gestion d'erreurs, cas limites, robustesse |
| **⚖️ Arte/Scienza** | Équilibre art/science | Créativité technique, innovation structurée |
| **🏗️ Corporalità** | Structure et robustesse | Architecture solide, encapsulation, patterns |
| **🔗 Connessione** | Interconnexion et modularité | Modules, APIs, réutilisabilité |

### 🚀 **Génération de Code Intelligente**
- **Code Generator Vincien** - Transformez votre code selon un principe spécifique
- **Refactoring guidé** avec suggestions contextuelles
- **Templates adaptatifs** pour différents langages
- **Optimisation multi-principes**

### 📊 **Tableau de Bord Interactif**
- **Vue d'ensemble** du projet avec métriques visuelles
- **Historique des analyses** et évolution des scores
- **Recommandations personnalisées** basées sur l'IA
- **Export multi-format** (JSON, Markdown, HTML, CSV)

## 🎯 Installation

1. Ouvrez VS Code
2. Allez dans l'onglet Extensions (`Ctrl+Shift+X`)
3. Recherchez "AIMastery Vincian Analysis"
4. Cliquez sur "Install"
5. Redémarrez VS Code si nécessaire

## 🚀 Démarrage Rapide

### Première Analyse
1. **Ouvrez un fichier de code** (JS, TS, Python, Java, etc.)
2. **Utilisez le raccourci** `Ctrl+Shift+A` (ou `Cmd+Shift+A` sur Mac)
3. **Consultez les résultats** dans le panneau qui s'ouvre
4. **Explorez les suggestions** pour chaque principe

### Tableau de Bord
1. **Ouvrez la palette de commandes** (`Ctrl+Shift+P`)
2. **Tapez** "AIMastery: Afficher le tableau de bord"
3. **Explorez** les statistiques et outils disponibles

### Analyse Interactive
1. **Utilisez** `Ctrl+Shift+M` pour l'analyse avec marqueurs
2. **Survolez** les zones colorées pour voir les explications
3. **Utilisez les contrôles** pour filtrer par principe

## 📋 Commandes Disponibles

| Commande | Raccourci | Description |
|----------|-----------|-------------|
| **Analyser le fichier** | `Ctrl+Shift+A` | Analyse Vincienne du fichier actuel |
| **Analyse interactive** | `Ctrl+Shift+M` | Analyse avec marqueurs visuels |
| **Générer du code** | `Ctrl+Shift+G` | Génération selon un principe Vincien |
| **Tableau de bord** | `Ctrl+Shift+D` | Interface principale de l'extension |
| **Nouveau projet** | `Ctrl+Shift+N` | Créer un projet Vincien |
| **Exporter résultats** | `Ctrl+Shift+E` | Export des analyses |

## ⚙️ Configuration

### Paramètres Principaux

```json
{
  // Mode d'analyse par défaut
  "aimastery-vincian-analysis.analysisMode": "comprehensive",
  
  // Niveau d'assistance IA
  "aimastery-vincian-analysis.aiAssistanceLevel": "basic",
  
  // Types de fichiers à analyser
  "aimastery-vincian-analysis.includeFileTypes": [
    "js", "ts", "jsx", "tsx", "py", "java", "c", "cpp", "cs", "php", "go", "rs", "rb"
  ],
  
  // Patterns à exclure
  "aimastery-vincian-analysis.excludePatterns": [
    "node_modules/**", "*.min.js", "*.map", "dist/**", "build/**"
  ],
  
  // Analyse automatique à la sauvegarde
  "aimastery-vincian-analysis.autoAnalyzeOnSave": false,
  
  // Affichage du score dans la barre d'état
  "aimastery-vincian-analysis.showScoreInStatusBar": true
}
```

### Personnalisation Avancée

- **Seuil de confiance IA** : Ajustez la sensibilité des recommandations
- **Format d'export** : Choisissez le format par défaut pour les rapports
- **Thème** : Interface claire, sombre ou automatique
- **Notifications** : Contrôlez le niveau de feedback

## 📈 Interprétation des Scores

### Scores Globaux
- **90-100** : Code exceptionnel, excellence vincienne
- **80-89** : Très bon code, quelques améliorations possibles
- **70-79** : Bon code, plusieurs axes d'amélioration
- **60-69** : Code correct, améliorations importantes nécessaires
- **50-59** : Code fonctionnel, refactoring recommandé
- **0-49** : Code nécessitant une révision majeure

### Scores par Principe (sur 10)
- **8-10** : Excellent - Principe bien maîtrisé
- **6-7** : Bon - Améliorations mineures possibles
- **4-5** : Moyen - Points d'amélioration identifiés
- **2-3** : Faible - Attention particulière requise
- **0-1** : Critique - Révision nécessaire

## 🎨 Exemples d'Utilisation

### Analyse d'une Fonction JavaScript

```javascript
// Code original
function processData(data) {
    return data.map(item => item.value * 2);
}

// Après optimisation Vincienne (Sensazione + Corporalità)
/**
 * Traite les données en doublant chaque valeur
 * @param {Array<{value: number}>} data - Tableau d'objets avec propriété value
 * @returns {Array<number>} Tableau des valeurs doublées
 */
function processDataWithValidation(data) {
    // Validation d'entrée (Dimostrazione)
    if (!Array.isArray(data)) {
        throw new Error('Les données doivent être un tableau');
    }
    
    // Traitement avec gestion d'erreurs (Sfumato)
    return data
        .filter(item => item && typeof item.value === 'number')
        .map(item => item.value * 2);
}
```

### Analyse d'une Classe Python

```python
# Analyse Vincienne révèle :
# ✅ Corporalità : 8/10 - Bonne structure
# ⚠️ Dimostrazione : 4/10 - Manque de tests
# ✅ Connessione : 7/10 - Bonne modularité
# ⚠️ Sfumato : 3/10 - Gestion d'erreurs insuffisante

class DataProcessor:
    def __init__(self, config):
        self.config = config
    
    def process(self, data):
        # Suggestions d'amélioration :
        # 1. Ajouter validation des entrées
        # 2. Implémenter gestion d'exceptions
        # 3. Ajouter tests unitaires
        return [item * 2 for item in data]
```

## 📊 Rapports et Exports

### Types de Rapports Disponibles

1. **JSON** - Données structurées pour intégration
2. **Markdown** - Rapport lisible pour documentation
3. **HTML** - Rapport interactif avec graphiques
4. **CSV** - Données tabulaires pour analyse

### Contenu des Rapports

- **Scores détaillés** par fichier et par principe
- **Graphiques radar** montrant l'équilibre des principes
- **Recommandations personnalisées** basées sur l'analyse
- **Historique d'évolution** des métriques
- **Statistiques de projet** globales

## 🔧 Développement et Contribution

### Architecture de l'Extension

```
src/
├── extension.ts              # Point d'entrée principal
├── aIMasteryTools.ts        # Outils intégrés avancés
├── vincianAnalyzer.ts       # Analyseur de base
├── treeViewProviders.ts     # Vues d'arborescence
└── webviews/               # Interfaces utilisateur
    ├── dashboard.html
    ├── results.html
    └── settings.html
```

### Contribuer au Projet

1. **Fork** le repository
2. **Créez** une branche pour votre fonctionnalité
3. **Développez** en suivant les principes Vinciens
4. **Testez** votre code
5. **Soumettez** une Pull Request

## 🐛 Résolution de Problèmes

### Problèmes Courants

**L'analyse ne se lance pas**
- Vérifiez que le fichier est dans un format supporté
- Consultez les paramètres d'inclusion/exclusion

**Pas de marqueurs interactifs**
- Activez l'option dans les paramètres
- Redémarrez VS Code si nécessaire

**Export qui échoue**
- Vérifiez les permissions du dossier de destination
- Assurez-vous qu'il y a des résultats à exporter

### Support et Assistance

- 📖 **Documentation complète** : [Wiki du projet](https://github.com/votre-organisation/aimastery-vincian-analysis/wiki)
- 🐛 **Signaler un bug** : [Issues GitHub](https://github.com/votre-organisation/aimastery-vincian-analysis/issues)
- 💬 **Discussions** : [GitHub Discussions](https://github.com/votre-organisation/aimastery-vincian-analysis/discussions)
- 📧 **Contact** : contact@aimastery.com

## 🎓 En Savoir Plus sur les Principes Vinciens

### Ressources Recommandées

- 📚 **"How to Think Like Leonardo da Vinci"** - Michael J. Gelb
- 🎨 **"Leonardo da Vinci"** - Walter Isaacson
- 🧠 **Études sur l'innovation créative** et l'approche multidisciplinaire
- 🔬 **Méthodes de pensée design** et résolution créative de problèmes

### Applications Pratiques

Les principes Vinciens s'appliquent à tous les aspects du développement :

- **Architecture logicielle** (Corporalità)
- **Tests et qualité** (Dimostrazione)
- **Expérience utilisateur** (Sensazione)
- **Gestion d'erreurs** (Sfumato)
- **Innovation technique** (Arte/Scienza)
- **Modularité** (Connessione)
- **R&D et prototypage** (Curiosità)

## 📜 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 🙏 Remerciements

- **Léonard de Vinci** pour l'inspiration éternelle
- **La communauté VS Code** pour l'écosystème extraordinaire
- **Contributeurs** qui font évoluer le projet
- **Utilisateurs** qui appliquent les principes Vinciens dans leur code

---

## 🌟 Transformez Votre Code Aujourd'hui

> *"La simplicité est la sophistication suprême."* - Léonard de Vinci

Découvrez comment les principes intemporels du maître de la Renaissance peuvent révolutionner votre approche du développement logiciel. Chaque ligne de code devient une œuvre d'art technique.

**[Installer l'extension maintenant](https://marketplace.visualstudio.com/items?itemName=aimastery.vincian-analysis)**

---

<div align="center">

**Fait avec 🎨 par l'équipe AIMastery**

[Site Web](https://aimastery.com) • [Documentation](https://docs.aimastery.com) • [Community](https://community.aimastery.com)

</div>