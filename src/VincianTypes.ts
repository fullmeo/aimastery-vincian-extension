export interface SfumatoAnalysisResult {
  variableNamingScore: number;
  commentQualityScore: number;
  complexityAreas: ComplexityArea[];
  ambiguousConstructs: AmbiguousConstruct[];
  recommendations: Recommendation[];
  overallScore: number;
}

export interface ComplexityArea {
  type: string;
  complexity: number;
  description: string;
  startLine: number;
  endLine: number;
}

export interface AmbiguousConstruct {
  id: string;
  type: string;
  location: {
    line: number;
    column: number;
  };
  description: string;
  severity: 'low' | 'medium' | 'high';
}

export interface Recommendation {
  id: string;
  principle: string;
  description: string;
  codeSnippet?: string;
  priority: 'low' | 'medium' | 'high';
}

export interface SelfAnalysisResult {
  workingFunctions: WorkingFunction[];
  codePatterns: CodePattern[];
  healthScore: number;
  improvementOpportunities: string[];
  timestamp?: Date; // Ajouter pour compatibilité
  analysisMetadata?: AnalysisMetadata; // Ajouter pour extension
}

export interface WorkingFunction {
  name: string;
  startLine: number;
  endLine: number;
  lineCount: number;
  code: string;
  hasErrorHandling: boolean;
  returnsSomething: boolean;
  usesRealLogic: boolean;
  qualityScore?: number; // Optionnel pour analyses avancées
  complexity?: number; // Optionnel pour métriques
}

export interface CodePattern {
  name: string;
  template: string;
  useCase: string;
  frequency: number;
  confidence?: number; // Ajouter pour AI analysis
  category?: PatternCategory; // Ajouter pour classification
}

export interface ReproductionContext {
  commandName: string;
  context: string;
  targetLanguage?: string; // Ajouter pour multi-language
  framework?: string; // Ajouter pour framework support
}

// 🆕 AJOUTS NÉCESSAIRES pour votre LocalAIAnalyzer

// Categories de patterns
export enum PatternCategory {
  SECURITY = 'security',
  PERFORMANCE = 'performance',
  DESIGN = 'design',
  MODERN = 'modern',
  LEGACY = 'legacy',
}

// Métadonnées d'analyse
export interface AnalysisMetadata {
  version: string;
  analysisDuration: number;
  linesAnalyzed: number;
  filesAnalyzed?: number;
  aiConfidence?: number;
  analysisType?: string;
}

// Risques de sécurité (pour LocalAIAnalyzer)
export interface SecurityRisk {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  location: CodeLocation;
  confidence: number;
}

// Location dans le code
export interface CodeLocation {
  line: number;
  column: number;
  length?: number;
  snippet?: string;
}

// Problèmes de performance
export interface PerformanceIssue {
  type: string;
  impact: 'low' | 'medium' | 'high';
  message: string;
  location: CodeLocation;
  suggestion: string;
}

// Suggestions d'amélioration
export interface ImprovementSuggestion {
  category: string;
  priority: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  beforeCode?: string;
  afterCode?: string;
  estimatedEffort?: string;
}

// Résultat d'analyse enrichie (pour AI)
export interface EnhancedAnalysisResult extends SelfAnalysisResult {
  securityRisks?: SecurityRisk[];
  performanceIssues?: PerformanceIssue[];
  improvementSuggestions?: ImprovementSuggestion[];
  vincianScore?: number;
  principes?: VincianPrinciple[];
}

// Principes de Da Vinci
export interface VincianPrinciple {
  name: string;
  score: number;
  description: string;
  examples?: string[];
}

// Configuration pour l'analyse
export interface AnalysisConfig {
  enableAI: boolean;
  analysisDepth: 'quick' | 'standard' | 'deep';
  includePerformance: boolean;
  includeSecurity: boolean;
  autoFix: boolean;
}

// Types pour learning et patterns
export interface LearningData {
  patterns: Map<string, any>;
  improvements: Map<string, any>;
  userPreferences: Map<string, any>;
}

// Context d'apprentissage
export interface LearningContext {
  userId?: string;
  projectType?: string;
  language?: string;
  framework?: string;
  previousAnalyses?: SelfAnalysisResult[];
}

// Résultat de reproduction de pattern
export interface ReproductionResult {
  success: boolean;
  generatedCode?: string;
  errors?: string[];
  suggestions?: string[];
  context: ReproductionContext;
}

// Export de constantes utiles
export const VINCIAN_PRINCIPLES = [
  'Curiosità',
  'Dimostrazione',
  'Sensazione',
  'Sfumato',
  'Arte/Scienza',
  'Corporalità',
  'Connessione',
] as const;

export const ANALYSIS_THRESHOLDS = {
  HEALTH_WARNING: 0.7,
  COMPLEXITY_LIMIT: 10,
  SECURITY_TOLERANCE: 'medium' as const,
  PERFORMANCE_THRESHOLD: 0.8,
} as const;

// Types helper pour TypeScript
export type AnalysisFunction = (code: string) => Promise<SelfAnalysisResult>;
export type PatternDetector = (code: string) => CodePattern[];
export type SecurityAnalyzer = (code: string) => SecurityRisk[];
export type PerformanceAnalyzer = (code: string) => PerformanceIssue[];
