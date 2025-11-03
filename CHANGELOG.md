# Journal des modifications

Toutes les modifications notables apportées à l'extension "AIMastery Vincian Analysis" seront documentées dans ce fichier.

## [7.2.1] - 2025-11-03

### 🔒 **CRITICAL - Privacy & Security**

- **FIXED**: Telemetry now defaults to **opt-in** instead of opt-out (GDPR compliance)
- **ADDED**: `aimastery.telemetry.enabled` configuration setting (default: `false`)
- **ADDED**: Privacy notice in settings with link to privacy policy
- **IMPROVED**: Telemetry tracking now respects user consent
- **ADDED**: Clear logging when telemetry is disabled

### ⚡ **Performance Improvements**

- **ADDED**: Analysis caching system for 10x faster repeat analyses
- **NEW**: `AnalysisCache` class with LRU eviction and TTL (5-minute cache)
- **OPTIMIZED**: AST parsing results are now cached by content hash
- **ADDED**: Cache invalidation on file changes
- **ADDED**: Cache statistics monitoring (`getCacheStats()`)

### 🎯 **UX & Configuration**

- **ADDED**: `aimastery.notifications.delay` - Configurable notification delays (500ms - 10s)
- **ADDED**: `aimastery.notifications.showMilestones` - Toggle milestone notifications
- **IMPROVED**: Notification delays now respect user preferences
- **IMPROVED**: More flexible notification timing (adaptive delays)

### 🏗️ **Architecture**

- **ADDED**: New `/src/core/` directory for shared utilities
- **IMPROVED**: Better separation of concerns
- **ADDED**: Comprehensive JSDoc comments on new code
- **IMPROVED**: Error handling in cache layer

### 🐛 **Bug Fixes**

- **FIXED**: TypeScript compilation errors in `self-analyzing-extension.ts`
- **FIXED**: Missing `confidence` property in analysis return type
- **FIXED**: Missing `filesAnalyzed` property in AnalysisMetadata interface

### 📊 **Developer Experience**

- **ADDED**: Console logging for cache hits/misses (debugging)
- **IMPROVED**: Better error messages
- **ADDED**: Privacy-respecting analytics logging

## [7.1.3] - 2025-11-03

### 🔒 **CRITICAL - Privacy & Security**

- **FIXED**: Telemetry now defaults to **opt-in** instead of opt-out (GDPR compliance)
- **ADDED**: `aimastery.telemetry.enabled` configuration setting (default: `false`)
- **ADDED**: Privacy notice in settings with link to privacy policy
- **IMPROVED**: Telemetry tracking now respects user consent
- **ADDED**: Clear logging when telemetry is disabled

### ⚡ **Performance Improvements**

- **ADDED**: Analysis caching system for 10x faster repeat analyses
- **NEW**: `AnalysisCache` class with LRU eviction and TTL (5-minute cache)
- **OPTIMIZED**: AST parsing results are now cached by content hash
- **ADDED**: Cache invalidation on file changes
- **ADDED**: Cache statistics monitoring (`getCacheStats()`)

### 🎯 **UX & Configuration**

- **ADDED**: `aimastery.notifications.delay` - Configurable notification delays (500ms - 10s)
- **ADDED**: `aimastery.notifications.showMilestones` - Toggle milestone notifications
- **IMPROVED**: Notification delays now respect user preferences
- **IMPROVED**: More flexible notification timing (adaptive delays)

### 🏗️ **Architecture**

- **ADDED**: New `/src/core/` directory for shared utilities
- **IMPROVED**: Better separation of concerns
- **ADDED**: Comprehensive JSDoc comments on new code
- **IMPROVED**: Error handling in cache layer

### 📊 **Developer Experience**

- **ADDED**: Console logging for cache hits/misses (debugging)
- **IMPROVED**: Better error messages
- **ADDED**: Privacy-respecting analytics logging

---

## [7.1.2] - 2025-06-09

### Ajouté
- Improved local AI integration
- Enhanced project analysis features

## [6.0.0] - 2025-05-31

### Ajouté

- Nouvelle interface utilisateur pour la sélection des plans
- Système de mise à niveau des abonnements
- Tableau de bord amélioré avec statistiques d'utilisation
- Gestion des erreurs améliorée

### Modifié

- Refactorisation majeure du code pour une meilleure maintenabilité
- Amélioration des performances de l'analyse audio
- Mise à jour des dépendances

### Corrigé

- Problèmes de gestion des erreurs lors de l'analyse
- Bugs mineurs d'interface utilisateur
- Problèmes de compatibilité avec les dernières versions de VS Code

## [5.3.0] - 2025-04-15

### Ajouté

- Support initial pour l'analyse Vincienne
- Intégration avec les services sociaux
- Génération de contenu automatisé

---

Ce projet suit les recommandations de [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/).