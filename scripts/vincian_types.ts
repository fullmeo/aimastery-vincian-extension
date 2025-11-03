// ===== VINCIAN TYPES - INTERFACES POUR L'EXTENSION =====

/**
 * Résultat principal de l'analyse du code
 */
export interface SelfAnalysisResult {
    healthScore: number;                    // Score de santé (0-1)
    workingFunctions: WorkingFunction[];    // Fonctions détectées
    codePatterns: CodePattern[];            // Patterns de code trouvés
    improvementOpportunities: string[];     // Suggestions d'amélioration
    timestamp: Date;                        // Moment de l'analyse
    analysisMetadata: AnalysisMetadata;     // Métadonnées de l'analyse
}

/**
 * Fonction détectée dans le code
 */
export interface WorkingFunction {
    name: string;                   // Nom de la fonction
    startLine: number;              // Ligne de début
    endLine: number;                // Ligne de fin
    lineCount: number;              // Nombre de lignes
    code: string;                   // Code source de la fonction
    hasErrorHandling: boolean;      // Contient try/catch
    returnsSomething: boolean;      // Retourne une valeur
    usesRealLogic: boolean;         // Utilise de la vraie logique
    qualityScore?: number;          // Score de qualité (0-1)
    complexity?: number;            // Complexité cyclomatique
    parameters?: FunctionParameter[]; // Paramètres de la fonction
    annotations?: FunctionAnnotation[]; // Annotations JSDoc, etc.
}

/**
 * Paramètre de fonction
 */
export interface FunctionParameter {
    name: string;
    type?: string;
    optional?: boolean;
    defaultValue?: string;
}

/**
 * Annotation de fonction
 */
export interface FunctionAnnotation {
    type: 'jsdoc' | 'comment' | 'decorator';
    content: string;
    line: number;
}

/**
 * Pattern de code détecté
 */
export interface CodePattern {
    name: string;                   // Nom du pattern
    template?: string;              // Template de reproduction
    useCase: string;                // Cas d'utilisation
    frequency: number;              // Fréquence d'apparition
    quality?: 'good' | 'neutral' | 'bad'; // Qualité du pattern
    examples?: string[];            // Exemples d'utilisation
    relatedPatterns?: string[];     // Patterns liés
}

/**
 * Contexte pour la reproduction de patterns
 */
export interface ReproductionContext {
    commandName?: string;           // Nom de commande à générer
    functionName?: string;          // Nom de fonction à générer
    className?: string;             // Nom de classe à générer
    parameters?: Record<string, any>; // Paramètres additionnels
    language?: string;              // Langage cible
    framework?: string;             // Framework utilisé
    [key: string]: any;            // Propriétés extensibles
}

/**
 * Métadonnées de l'analyse
 */
export interface AnalysisMetadata {
    version: string;                // Version de l'analyseur
    analysisType: string;           // Type d'analyse effectuée
    linesAnalyzed: number;          // Lignes de code analysées
    filesAnalyzed: number;          // Fichiers analysés
    analysisDuration: number;       // Durée de l'analyse (ms)
    aiConfidence: number;           // Confiance de l'IA (0-1)
    language?: string;              // Langage principal détecté
    projectType?: string;           // Type de projet détecté
    frameworks?: string[];          // Frameworks détectés
    totalFunctions?: number;        // Nombre total de fonctions
    totalClasses?: number;          // Nombre total de classes
    totalInterfaces?: number;       // Nombre total d'interfaces
}

/**
 * Configuration de l'analyse
 */
export interface AnalysisConfiguration {
    includeTests: boolean;          // Inclure les fichiers de test
    includeNodeModules: boolean;    // Inclure node_modules
    maxFileSize: number;            // Taille max de fichier (bytes)
    fileExtensions: string[];       // Extensions à analyser
    excludePatterns: string[];      // Patterns d'exclusion
    enableAI: boolean;              // Activer l'analyse IA
    aiConfidenceThreshold: number;  // Seuil de confiance IA
    maxComplexity: number;          // Complexité max acceptée
    enableRealTimeAnalysis: boolean; // Analyse en temps réel
}

/**
 * Issue détectée dans le code
 */
export interface CodeIssue {
    id: string;                     // Identifiant unique
    severity: 'error' | 'warning' | 'info'; // Sévérité
    category: 'security' | 'performance' | 'maintainability' | 'style'; // Catégorie
    message: string;                // Message descriptif
    line: number;                   // Ligne concernée
    column?: number;                // Colonne concernée
    rule: string;                   // Règle violée
    fixable: boolean;               // Peut être corrigé automatiquement
    suggestion?: string;            // Suggestion de correction
    confidence: number;             // Confiance dans la détection (0-1)
    impact: 'low' | 'medium' | 'high'; // Impact de l'issue
}

/**
 * Amélioration suggérée
 */
export interface Improvement {
    id: string;                     // Identifiant unique
    type: 'refactor' | 'optimize' | 'modernize' | 'secure'; // Type d'amélioration
    priority: 'low' | 'medium' | 'high' | 'critical'; // Priorité
    title: string;                  // Titre court
    description: string;            // Description détaillée
    before?: string;                // Code avant amélioration
    after?: string;                 // Code après amélioration
    effort: 'trivial' | 'easy' | 'medium' | 'hard'; // Effort requis
    impact: number;                 // Impact sur le health score (0-1)
    confidence: number;             // Confiance dans la suggestion (0-1)
    automated: boolean;             // Peut être appliqué automatiquement
    tags: string[];                 // Tags pour catégorisation
}

/**
 * Métriques de code
 */
export interface CodeMetrics {
    linesOfCode: number;            // Lignes de code
    linesOfComments: number;        // Lignes de commentaires
    blankLines: number;             // Lignes vides
    complexity: number;             // Complexité cyclomatique
    maintainabilityIndex: number;   // Index de maintenabilité
    technicalDebt: number;          // Dette technique (heures)
    testCoverage?: number;          // Couverture de tests (%)
    duplicatedLines?: number;       // Lignes dupliquées
    functionCount: number;          // Nombre de fonctions
    classCount: number;             // Nombre de classes
    interfaceCount: number;         // Nombre d'interfaces
    dependencyCount: number;        // Nombre de dépendances
}

/**
 * Résultat d'analyse de workspace complet
 */
export interface WorkspaceAnalysisResult extends SelfAnalysisResult {
    files: FileAnalysisResult[];    // Résultats par fichier
    dependencies: DependencyInfo[]; // Informations sur les dépendances
    architecture: ArchitectureInfo; // Informations architecturales
    recommendations: Recommendation[]; // Recommandations globales
}

/**
 * Résultat d'analyse d'un fichier
 */
export interface FileAnalysisResult {
    filePath: string;               // Chemin du fichier
    relativePath: string;           // Chemin relatif au workspace
    language: string;               // Langage détecté
    size: number;                   // Taille en bytes
    metrics: CodeMetrics;           // Métriques du fichier
    issues: CodeIssue[];            // Issues détectées
    functions: WorkingFunction[];   // Fonctions du fichier
    patterns: CodePattern[];        // Patterns du fichier
    healthScore: number;            // Score de santé du fichier
    lastModified: Date;             // Dernière modification
}

/**
 * Information sur une dépendance
 */
export interface DependencyInfo {
    name: string;                   // Nom de la dépendance
    version: string;                // Version installée
    type: 'dev' | 'prod' | 'peer'; // Type de dépendance
    outdated: boolean;              // Version obsolète
    latestVersion?: string;         // Dernière version disponible
    vulnerabilities?: VulnerabilityInfo[]; // Vulnérabilités connues
    usage: number;                  // Nombre d'utilisations
    size: number;                   // Taille de la dépendance
}

/**
 * Information sur une vulnérabilité
 */
export interface VulnerabilityInfo {
    id: string;                     // Identifiant CVE
    severity: 'low' | 'moderate' | 'high' | 'critical'; // Sévérité
    title: string;                  // Titre de la vulnérabilité
    description: string;            // Description
    fixedIn?: string;               // Version corrigée
    patchAvailable: boolean;        // Patch disponible
}

/**
 * Information architecturale
 */
export interface ArchitectureInfo {
    projectType: 'library' | 'application' | 'extension' | 'tool'; // Type de projet
    frameworks: string[];           // Frameworks utilisés
    patterns: ArchitecturalPattern[]; // Patterns architecturaux
    layers: string[];               // Couches architecturales
    coupling: 'low' | 'medium' | 'high'; // Niveau de couplage
    cohesion: 'low' | 'medium' | 'high'; // Niveau de cohésion
    complexity: number;             // Complexité architecturale
}

/**
 * Pattern architectural
 */
export interface ArchitecturalPattern {
    name: string;                   // Nom du pattern
    confidence: number;             // Confiance dans la détection
    description: string;            // Description du pattern
    benefits: string[];             // Bénéfices du pattern
    drawbacks: string[];            // Inconvénients du pattern
}

/**
 * Recommandation globale
 */
export interface Recommendation {
    id: string;                     // Identifiant unique
    category: 'architecture' | 'security' | 'performance' | 'maintainability'; // Catégorie
    priority: 'low' | 'medium' | 'high' | 'critical'; // Priorité
    title: string;                  // Titre
    description: string;            // Description détaillée
    rationale: string;              // Justification
    implementation: string;         // Guide d'implémentation
    effort: 'hours' | 'days' | 'weeks'; // Effort estimé
    impact: 'low' | 'medium' | 'high'; // Impact attendu
    resources: string[];            // Ressources utiles
}

/**
 * Configuration avancée de l'IA
 */
export interface AIConfiguration {
    enabled: boolean;               // IA activée
    modelName: string;              // Nom du modèle
    confidenceThreshold: number;    // Seuil de confiance
    maxSuggestions: number;         // Nombre max de suggestions
    languageSupport: string[];      // Langages supportés
    customRules: AIRule[];          // Règles personnalisées
    learningEnabled: boolean;       // Apprentissage activé
    contextWindow: number;          // Taille de la fenêtre de contexte
}

/**
 * Règle d'IA personnalisée
 */
export interface AIRule {
    id: string;                     // Identifiant unique
    name: string;                   // Nom de la règle
    pattern: string;                // Pattern regex ou AST
    message: string;                // Message d'erreur
    severity: 'error' | 'warning' | 'info'; // Sévérité
    autoFix?: string;               // Auto-correction si possible
    enabled: boolean;               // Règle activée
    confidence: number;             // Confiance dans la règle
}

/**
 * Export des types principaux pour utilisation externe
 */
export type {
    SelfAnalysisResult as AnalysisResult,
    WorkingFunction as DetectedFunction,
    CodePattern as Pattern,
    CodeIssue as Issue,
    Improvement as Suggestion,
    CodeMetrics as Metrics
};