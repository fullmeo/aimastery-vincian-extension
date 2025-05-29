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