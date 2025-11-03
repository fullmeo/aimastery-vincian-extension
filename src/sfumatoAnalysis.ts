import * as vscode from 'vscode';

export interface SfumatoIssue {
  line: number;
  column: number;
  type: 'variable' | 'function' | 'comment' | 'complexity' | 'ambiguity';
  severity: 'low' | 'medium' | 'high';
  message: string;
  suggestion?: string;
  originalText: string;
}

export interface SfumatoAnalysisResult {
  overallScore: number;
  issues: SfumatoIssue[];
  metrics: {
    variableClarity: number;
    functionClarity: number;
    commentQuality: number;
    complexityScore: number;
    ambiguityScore: number;
  };
  recommendations: string[];
}

export class SfumatoAnalysis {
  private readonly ambiguousWords = [
    'data',
    'info',
    'temp',
    'tmp',
    'obj',
    'item',
    'thing',
    'stuff',
    'value',
    'val',
    'var',
    'x',
    'y',
    'z',
    'i',
    'j',
    'k',
    'foo',
    'bar',
    'baz',
    'test',
    'example',
  ];

  private readonly complexityPatterns = [
    /if\s*\([^)]*\)\s*{[^}]*if\s*\([^)]*\)/g, // Nested ifs
    /for\s*\([^)]*\)\s*{[^}]*for\s*\([^)]*\)/g, // Nested loops
    /while\s*\([^)]*\)\s*{[^}]*while\s*\([^)]*\)/g, // Nested while
    /try\s*{[^}]*catch[^}]*finally/g, // Complex error handling
    /\?\s*[^:]*:[^;]*\?\s*[^:]*:/g, // Nested ternary
  ];

  async analyzeSfumato(code: string, languageId: string): Promise<SfumatoAnalysisResult> {
    const lines = code.split('\n');
    const issues: SfumatoIssue[] = [];

    // Analyser chaque ligne
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNumber = i + 1;

      // Analyser les variables
      issues.push(...this.analyzeVariables(line, lineNumber, languageId));

      // Analyser les fonctions
      issues.push(...this.analyzeFunctions(line, lineNumber, languageId));

      // Analyser les commentaires
      issues.push(...this.analyzeComments(line, lineNumber, languageId));

      // Analyser la complexité
      issues.push(...this.analyzeComplexity(line, lineNumber));

      // Analyser l'ambiguïté
      issues.push(...this.analyzeAmbiguity(line, lineNumber));
    }

    // Calculer les métriques
    const metrics = this.calculateMetrics(issues, code);

    // Calculer le score global
    const overallScore = this.calculateOverallScore(metrics);

    // Générer les recommandations
    const recommendations = this.generateRecommendations(issues, metrics);

    return {
      overallScore,
      issues,
      metrics,
      recommendations,
    };
  }

  private analyzeVariables(line: string, lineNumber: number, languageId: string): SfumatoIssue[] {
    const issues: SfumatoIssue[] = [];

    // Patterns pour détecter les déclarations de variables
    const variablePatterns = {
      typescript: [
        /(?:let|const|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g,
        /([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, // Type annotations
      ],
      javascript: [/(?:let|const|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g],
      python: [/^([a-zA-Z_][a-zA-Z0-9_]*)\s*=/g],
      java: [/(?:int|String|boolean|double|float|char|long)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g],
    };

    const patterns =
      variablePatterns[languageId as keyof typeof variablePatterns] ||
      variablePatterns['javascript'];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(line)) !== null) {
        const variableName = match[1];
        const column = match.index || 0;

        // Vérifier si le nom est ambigu
        if (this.ambiguousWords.includes(variableName.toLowerCase())) {
          issues.push({
            line: lineNumber,
            column,
            type: 'variable',
            severity: 'medium',
            message: `Nom de variable ambigu: "${variableName}"`,
            suggestion: this.suggestBetterVariableName(variableName, line),
            originalText: variableName,
          });
        }

        // Vérifier la longueur (trop court ou trop long)
        if (variableName.length === 1 && !['i', 'j', 'k'].includes(variableName)) {
          issues.push({
            line: lineNumber,
            column,
            type: 'variable',
            severity: 'low',
            message: `Nom de variable trop court: "${variableName}"`,
            suggestion: 'Utilisez un nom plus descriptif',
            originalText: variableName,
          });
        } else if (variableName.length > 50) {
          issues.push({
            line: lineNumber,
            column,
            type: 'variable',
            severity: 'low',
            message: `Nom de variable trop long: "${variableName}"`,
            suggestion: 'Raccourcissez tout en gardant la clarté',
            originalText: variableName,
          });
        }

        // Vérifier la convention de nommage
        if (!this.followsNamingConvention(variableName, languageId)) {
          issues.push({
            line: lineNumber,
            column,
            type: 'variable',
            severity: 'low',
            message: `Convention de nommage non respectée: "${variableName}"`,
            suggestion: this.suggestProperNaming(variableName, languageId),
            originalText: variableName,
          });
        }
      }
    }

    return issues;
  }

  private analyzeFunctions(line: string, lineNumber: number, languageId: string): SfumatoIssue[] {
    const issues: SfumatoIssue[] = [];

    // Patterns pour détecter les déclarations de fonctions
    const functionPatterns = {
      typescript: [
        /function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g,
        /([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g,
        /const\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*\(/g,
      ],
      javascript: [
        /function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g,
        /([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g,
        /const\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*\(/g,
      ],
      python: [/def\s+([a-zA-Z_][a-zA-Z0-9_]*)/g],
      java: [
        /(?:public|private|protected)?\s*(?:static)?\s*(?:\w+)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g,
      ],
    };

    const patterns =
      functionPatterns[languageId as keyof typeof functionPatterns] ||
      functionPatterns['javascript'];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(line)) !== null) {
        const functionName = match[1];
        const column = match.index || 0;

        // Ignorer les fonctions communes/built-in
        if (['log', 'push', 'pop', 'slice', 'map', 'filter', 'reduce'].includes(functionName)) {
          continue;
        }

        // Vérifier si le nom est descriptif
        if (this.ambiguousWords.includes(functionName.toLowerCase())) {
          issues.push({
            line: lineNumber,
            column,
            type: 'function',
            severity: 'medium',
            message: `Nom de fonction ambigu: "${functionName}"`,
            suggestion: "Utilisez un verbe d'action descriptif",
            originalText: functionName,
          });
        }

        // Vérifier si le nom contient un verbe d'action
        if (!this.containsActionVerb(functionName)) {
          issues.push({
            line: lineNumber,
            column,
            type: 'function',
            severity: 'low',
            message: `Le nom de fonction "${functionName}" devrait contenir un verbe d'action`,
            suggestion: 'Exemple: getData, processResult, validateInput',
            originalText: functionName,
          });
        }
      }
    }

    return issues;
  }

  private analyzeComments(line: string, lineNumber: number, languageId: string): SfumatoIssue[] {
    const issues: SfumatoIssue[] = [];

    // Détecter les commentaires
    const commentPatterns = {
      typescript: [/\/\/\s*(.+)/, /\/\*\s*(.+?)\s*\*\//],
      javascript: [/\/\/\s*(.+)/, /\/\*\s*(.+?)\s*\*\//],
      python: [/#\s*(.+)/],
      java: [/\/\/\s*(.+)/, /\/\*\s*(.+?)\s*\*\//],
    };

    const patterns =
      commentPatterns[languageId as keyof typeof commentPatterns] || commentPatterns['javascript'];

    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match) {
        const comment = match[1].trim();
        const column = line.indexOf(match[0]);

        // Vérifier la qualité du commentaire
        if (comment.length < 3) {
          issues.push({
            line: lineNumber,
            column,
            type: 'comment',
            severity: 'low',
            message: 'Commentaire trop court pour être utile',
            suggestion: 'Expliquez le "pourquoi", pas le "quoi"',
            originalText: comment,
          });
        }

        // Détecter les commentaires obsolètes (TODO, FIXME, etc.)
        if (/TODO|FIXME|HACK|XXX/i.test(comment)) {
          issues.push({
            line: lineNumber,
            column,
            type: 'comment',
            severity: 'medium',
            message: 'Commentaire de tâche détecté',
            suggestion: 'Résolvez ou planifiez cette tâche',
            originalText: comment,
          });
        }

        // Détecter les commentaires qui répètent le code
        if (this.commentRepeatsCode(comment, line)) {
          issues.push({
            line: lineNumber,
            column,
            type: 'comment',
            severity: 'low',
            message: 'Le commentaire répète ce que fait le code',
            suggestion: "Expliquez plutôt l'intention ou le contexte",
            originalText: comment,
          });
        }
      }
    }

    return issues;
  }

  private analyzeComplexity(line: string, lineNumber: number): SfumatoIssue[] {
    const issues: SfumatoIssue[] = [];

    // Détecter les structures complexes
    for (const pattern of this.complexityPatterns) {
      const matches = line.match(pattern);
      if (matches) {
        issues.push({
          line: lineNumber,
          column: 0,
          type: 'complexity',
          severity: 'high',
          message: 'Structure de code complexe détectée',
          suggestion: 'Considérez refactoriser en fonctions plus petites',
          originalText: matches[0],
        });
      }
    }

    // Détecter les lignes trop longues
    if (line.length > 120) {
      issues.push({
        line: lineNumber,
        column: 120,
        type: 'complexity',
        severity: 'medium',
        message: 'Ligne trop longue, difficile à lire',
        suggestion: 'Divisez en plusieurs lignes',
        originalText: line.substring(120),
      });
    }

    return issues;
  }

  private analyzeAmbiguity(line: string, lineNumber: number): SfumatoIssue[] {
    const issues: SfumatoIssue[] = [];

    // Détecter les opérateurs ternaires imbriqués
    const nestedTernary = line.match(/\?\s*[^:]*:[^;]*\?\s*[^:]*:/);
    if (nestedTernary) {
      issues.push({
        line: lineNumber,
        column: line.indexOf(nestedTernary[0]),
        type: 'ambiguity',
        severity: 'high',
        message: 'Opérateur ternaire imbriqué difficile à comprendre',
        suggestion: 'Utilisez des if/else ou une fonction séparée',
        originalText: nestedTernary[0],
      });
    }

    // Détecter les conditions complexes
    const complexCondition = line.match(/if\s*\([^)]{50,}\)/);
    if (complexCondition) {
      issues.push({
        line: lineNumber,
        column: line.indexOf(complexCondition[0]),
        type: 'ambiguity',
        severity: 'medium',
        message: 'Condition complexe difficile à comprendre',
        suggestion: 'Divisez en variables booléennes nommées',
        originalText: complexCondition[0],
      });
    }

    return issues;
  }

  private calculateMetrics(issues: SfumatoIssue[], code: string) {
    const totalLines = code.split('\n').length;

    const variableIssues = issues.filter(i => i.type === 'variable');
    const functionIssues = issues.filter(i => i.type === 'function');
    const commentIssues = issues.filter(i => i.type === 'comment');
    const complexityIssues = issues.filter(i => i.type === 'complexity');
    const ambiguityIssues = issues.filter(i => i.type === 'ambiguity');

    return {
      variableClarity: Math.max(0, 100 - (variableIssues.length / totalLines) * 100),
      functionClarity: Math.max(0, 100 - (functionIssues.length / totalLines) * 100),
      commentQuality: Math.max(0, 100 - (commentIssues.length / totalLines) * 100),
      complexityScore: Math.max(0, 100 - (complexityIssues.length / totalLines) * 200),
      ambiguityScore: Math.max(0, 100 - (ambiguityIssues.length / totalLines) * 150),
    };
  }

  private calculateOverallScore(metrics: any): number {
    const weights = {
      variableClarity: 0.25,
      functionClarity: 0.25,
      commentQuality: 0.2,
      complexityScore: 0.2,
      ambiguityScore: 0.1,
    };

    return Math.round(
      metrics.variableClarity * weights.variableClarity +
        metrics.functionClarity * weights.functionClarity +
        metrics.commentQuality * weights.commentQuality +
        metrics.complexityScore * weights.complexityScore +
        metrics.ambiguityScore * weights.ambiguityScore
    );
  }

  private generateRecommendations(issues: SfumatoIssue[], metrics: any): string[] {
    const recommendations: string[] = [];

    if (metrics.variableClarity < 70) {
      recommendations.push('🏷️ Améliorez la clarté des noms de variables');
    }

    if (metrics.functionClarity < 70) {
      recommendations.push('⚡ Utilisez des noms de fonction plus descriptifs');
    }

    if (metrics.commentQuality < 60) {
      recommendations.push('💬 Ajoutez des commentaires expliquant le "pourquoi"');
    }

    if (metrics.complexityScore < 60) {
      recommendations.push('🔧 Refactorisez les parties trop complexes');
    }

    if (metrics.ambiguityScore < 70) {
      recommendations.push('🔍 Clarifiez les expressions ambiguës');
    }

    const highSeverityIssues = issues.filter(i => i.severity === 'high');
    if (highSeverityIssues.length > 0) {
      recommendations.push(`⚠️ Corrigez ${highSeverityIssues.length} problème(s) critique(s)`);
    }

    return recommendations;
  }

  // Méthodes utilitaires
  private suggestBetterVariableName(currentName: string, line: string): string {
    // Logique simplifiée pour suggérer de meilleurs noms
    const context = line.toLowerCase();

    if (context.includes('user')) return 'userData, userInfo, currentUser';
    if (context.includes('file')) return 'fileName, filePath, fileContent';
    if (context.includes('count') || context.includes('length')) return 'itemCount, totalItems';
    if (context.includes('result')) return 'processedResult, calculationResult';

    return "Utilisez un nom descriptif basé sur l'usage";
  }

  private followsNamingConvention(name: string, languageId: string): boolean {
    const conventions = {
      typescript: /^[a-z][a-zA-Z0-9]*$/, // camelCase
      javascript: /^[a-z][a-zA-Z0-9]*$/, // camelCase
      python: /^[a-z][a-z0-9_]*$/, // snake_case
      java: /^[a-z][a-zA-Z0-9]*$/, // camelCase
    };

    const pattern =
      conventions[languageId as keyof typeof conventions] || conventions['javascript'];
    return pattern.test(name);
  }

  private suggestProperNaming(name: string, languageId: string): string {
    const suggestions = {
      typescript: 'Utilisez camelCase: myVariable',
      javascript: 'Utilisez camelCase: myVariable',
      python: 'Utilisez snake_case: my_variable',
      java: 'Utilisez camelCase: myVariable',
    };

    return suggestions[languageId as keyof typeof suggestions] || suggestions['javascript'];
  }

  private containsActionVerb(functionName: string): boolean {
    const actionVerbs = [
      'get',
      'set',
      'create',
      'delete',
      'update',
      'add',
      'remove',
      'calculate',
      'process',
      'validate',
      'parse',
      'format',
      'convert',
      'transform',
      'generate',
      'build',
      'execute',
      'handle',
      'manage',
      'check',
      'verify',
      'confirm',
    ];

    return actionVerbs.some(verb => functionName.toLowerCase().includes(verb));
  }

  private commentRepeatsCode(comment: string, line: string): boolean {
    // Vérification simple si le commentaire répète le code
    const codeWords = line
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2);
    const commentWords = comment.split(/\s+/).filter(w => w.length > 2);

    const commonWords = commentWords.filter(word =>
      codeWords.some(
        codeWord =>
          codeWord.toLowerCase().includes(word.toLowerCase()) ||
          word.toLowerCase().includes(codeWord.toLowerCase())
      )
    );

    return commonWords.length > commentWords.length * 0.6;
  }

  getSfumatoMirrorHtml(analysisResult: SfumatoAnalysisResult, originalCode: string): string {
    const issuesByType = {
      variable: analysisResult.issues.filter(i => i.type === 'variable'),
      function: analysisResult.issues.filter(i => i.type === 'function'),
      comment: analysisResult.issues.filter(i => i.type === 'comment'),
      complexity: analysisResult.issues.filter(i => i.type === 'complexity'),
      ambiguity: analysisResult.issues.filter(i => i.type === 'ambiguity'),
    };

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Miroir de Sfumato - Analyse de Clarté</title>
            <style>
                body { margin: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #1e1e1e; color: #fff; }
                .container { display: flex; height: 100vh; }
                .sidebar { width: 350px; background: #252526; padding: 20px; overflow-y: auto; border-right: 1px solid #464647; }
                .main-content { flex: 1; padding: 20px; overflow-y: auto; }
                
                .score-card { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 12px; margin-bottom: 20px; text-align: center; }
                .score-number { font-size: 3em; font-weight: bold; margin-bottom: 10px; }
                .score-label { font-size: 1.2em; opacity: 0.9; }
                
                .metrics { background: #2d2d30; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
                .metric { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
                .metric-bar { width: 100px; height: 8px; background: #464647; border-radius: 4px; overflow: hidden; }
                .metric-fill { height: 100%; transition: width 0.3s ease; }
                
                .recommendations { background: #0e2f44; border-left: 4px solid #0078d4; padding: 15px; border-radius: 4px; margin-bottom: 20px; }
                .recommendations h3 { margin-top: 0; color: #0078d4; }
                .recommendations ul { margin: 0; padding-left: 20px; }
                
                .filters { margin-bottom: 20px; }
                .filter-btn { background: #464647; color: white; border: none; padding: 8px 16px; margin-right: 10px; border-radius: 4px; cursor: pointer; }
                .filter-btn.active { background: #0078d4; }
                
                .code-container { background: #1e1e1e; border: 1px solid #464647; border-radius: 8px; overflow: hidden; }
                .code-header { background: #2d2d30; padding: 15px; border-bottom: 1px solid #464647; }
                .code-content { position: relative; }
                .code-display { font-family: 'Consolas', 'Monaco', monospace; padding: 20px; white-space: pre-wrap; line-height: 1.6; font-size: 14px; }
                
                .line-number { display: inline-block; width: 40px; color: #858585; text-align: right; margin-right: 20px; user-select: none; }
                .code-line { display: block; }
                .issue-highlight { position: relative; }
                .issue-highlight.variable { background-color: rgba(255, 193, 7, 0.2); }
                .issue-highlight.function { background-color: rgba(40, 167, 69, 0.2); }
                .issue-highlight.comment { background-color: rgba(108, 117, 125, 0.2); }
                .issue-highlight.complexity { background-color: rgba(220, 53, 69, 0.2); }
                .issue-highlight.ambiguity { background-color: rgba(255, 87, 34, 0.2); }
                
                .tooltip { position: absolute; background: rgba(0,0,0,0.9); color: white; padding: 10px; border-radius: 4px; font-size: 12px; max-width: 300px; z-index: 1000; pointer-events: none; }
                
                .issue-list { max-height: 400px; overflow-y: auto; }
                .issue-item { background: #2d2d30; margin-bottom: 10px; padding: 12px; border-radius: 6px; border-left: 4px solid; cursor: pointer; }
                .issue-item.variable { border-left-color: #ffc107; }
                .issue-item.function { border-left-color: #28a745; }
                .issue-item.comment { border-left-color: #6c757d; }
                .issue-item.complexity { border-left-color: #dc3545; }
                .issue-item.ambiguity { border-left-color: #ff5722; }
                
                .issue-header { font-weight: bold; margin-bottom: 5px; }
                .issue-message { font-size: 0.9em; margin-bottom: 5px; }
                .issue-suggestion { font-size: 0.8em; color: #0078d4; font-style: italic; }
                .issue-location { font-size: 0.8em; color: #858585; }
                
                .action-buttons { margin-top: 20px; }
                .btn { background: #0078d4; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; margin-right: 10px; }
                .btn:hover { background: #106ebe; }
                .btn.secondary { background: #6c757d; }
                .btn.secondary:hover { background: #545b62; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="sidebar">
                    <div class="score-card">
                        <div class="score-number">${analysisResult.overallScore}</div>
                        <div class="score-label">Score Sfumato</div>
                    </div>
                    
                    <div class="metrics">
                        <h3>📊 Métriques de Clarté</h3>
                        <div class="metric">
                            <span>Variables</span>
                            <div class="metric-bar">
                                <div class="metric-fill" style="width: ${analysisResult.metrics.variableClarity}%; background: #ffc107;"></div>
                            </div>
                            <span>${Math.round(analysisResult.metrics.variableClarity)}%</span>
                        </div>
                        <div class="metric">
                            <span>Fonctions</span>
                            <div class="metric-bar">
                                <div class="metric-fill" style="width: ${analysisResult.metrics.functionClarity}%; background: #28a745;"></div>
                            </div>
                            <span>${Math.round(analysisResult.metrics.functionClarity)}%</span>
                        </div>
                        <div class="metric">
                            <span>Commentaires</span>
                            <div class="metric-bar">
                                <div class="metric-fill" style="width: ${analysisResult.metrics.commentQuality}%; background: #6c757d;"></div>
                            </div>
                            <span>${Math.round(analysisResult.metrics.commentQuality)}%</span>
                        </div>
                        <div class="metric">
                            <span>Complexité</span>
                            <div class="metric-bar">
                                <div class="metric-fill" style="width: ${analysisResult.metrics.complexityScore}%; background: #dc3545;"></div>
                            </div>
                            <span>${Math.round(analysisResult.metrics.complexityScore)}%</span>
                        </div>
                        <div class="metric">
                            <span>Ambiguïté</span>
                            <div class="metric-bar">
                                <div class="metric-fill" style="width: ${analysisResult.metrics.ambiguityScore}%; background: #ff5722;"></div>
                            </div>
                            <span>${Math.round(analysisResult.metrics.ambiguityScore)}%</span>
                        </div>
                    </div>
                    
                    ${
                      analysisResult.recommendations.length > 0
                        ? `
                    <div class="recommendations">
                        <h3>💡 Recommandations</h3>
                        <ul>
                            ${analysisResult.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                        </ul>
                    </div>
                    `
                        : ''
                    }
                    
                    <div class="filters">
                        <h3>🔍 Filtrer les problèmes</h3>
                        <button class="filter-btn active" onclick="filterIssues('all')">Tous (${analysisResult.issues.length})</button>
                        <button class="filter-btn" onclick="filterIssues('variable')">Variables (${issuesByType.variable.length})</button>
                        <button class="filter-btn" onclick="filterIssues('function')">Fonctions (${issuesByType.function.length})</button>
                        <button class="filter-btn" onclick="filterIssues('comment')">Commentaires (${issuesByType.comment.length})</button>
                        <button class="filter-btn" onclick="filterIssues('complexity')">Complexité (${issuesByType.complexity.length})</button>
                        <button class="filter-btn" onclick="filterIssues('ambiguity')">Ambiguïté (${issuesByType.ambiguity.length})</button>
                    </div>
                    
                    <div class="issue-list" id="issueList">
                        ${analysisResult.issues
                          .map(
                            issue => `
                            <div class="issue-item ${issue.type}" onclick="highlightIssue(${issue.line}, '${issue.type}')" data-type="${issue.type}">
                                <div class="issue-header">Ligne ${issue.line} - ${issue.type}</div>
                                <div class="issue-message">${issue.message}</div>
                                ${issue.suggestion ? `<div class="issue-suggestion">💡 ${issue.suggestion}</div>` : ''}
                                <div class="issue-location">Sévérité: ${issue.severity}</div>
                            </div>
                        `
                          )
                          .join('')}
                    </div>
                    
                    <div class="action-buttons">
                        <button class="btn" onclick="suggestImprovements()">🔧 Suggérer des améliorations</button>
                        <button class="btn secondary" onclick="exportReport()">📊 Exporter le rapport</button>
                    </div>
                </div>
                
                <div class="main-content">
                    <div class="code-container">
                        <div class="code-header">
                            <h2>🔍 Code analysé avec marqueurs Sfumato</h2>
                            <p>Survolez les zones colorées pour voir les détails des problèmes détectés.</p>
                        </div>
                        <div class="code-content">
                            <div class="code-display" id="codeDisplay">
                                ${this.generateHighlightedCode(originalCode, analysisResult.issues)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="tooltip" id="tooltip" style="display: none;"></div>
            
            <script>
                const vscode = acquireVsCodeApi();
                let currentFilter = 'all';
                
                function filterIssues(type) {
                    currentFilter = type;
                    
                    // Update button states
                    document.querySelectorAll('.filter-btn').forEach(btn => {
                        btn.classList.remove('active');
                    });
                    event.target.classList.add('active');
                    
                    // Filter issue list
                    const issues = document.querySelectorAll('.issue-item');
                    issues.forEach(issue => {
                        if (type === 'all' || issue.dataset.type === type) {
                            issue.style.display = 'block';
                        } else {
                            issue.style.display = 'none';
                        }
                    });
                    
                    // Filter code highlights
                    const highlights = document.querySelectorAll('.issue-highlight');
                    highlights.forEach(highlight => {
                        if (type === 'all' || highlight.classList.contains(type)) {
                            highlight.style.display = 'inline';
                        } else {
                            highlight.style.display = 'none';
                        }
                    });
                }
                
                function highlightIssue(lineNumber, type) {
                    // Scroll to line in code
                    const codeLine = document.querySelector(\`[data-line="\${lineNumber}"]\`);
                    if (codeLine) {
                        codeLine.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        
                        // Briefly highlight the line
                        codeLine.style.backgroundColor = 'rgba(0, 120, 212, 0.3)';
                        setTimeout(() => {
                            codeLine.style.backgroundColor = '';
                        }, 2000);
                    }
                }
                
                function suggestImprovements() {
                    vscode.postMessage({
                        command: 'suggest-improvements',
                        analysisResult: ${JSON.stringify(analysisResult)}
                    });
                }
                
                function exportReport() {
                    vscode.postMessage({
                        command: 'export-sfumato-report',
                        analysisResult: ${JSON.stringify(analysisResult)}
                    });
                }
                
                // Tooltip functionality
                document.addEventListener('mouseover', (event) => {
                    if (event.target.classList.contains('issue-highlight')) {
                        const tooltip = document.getElementById('tooltip');
                        const issue = JSON.parse(event.target.dataset.issue);
                        
                        tooltip.innerHTML = \`
                            <strong>\${issue.type.toUpperCase()}</strong><br>
                            \${issue.message}<br>
                            \${issue.suggestion ? '<em>' + issue.suggestion + '</em>' : ''}
                        \`;
                        tooltip.style.display = 'block';
                        tooltip.style.left = (event.pageX + 10) + 'px';
                        tooltip.style.top = (event.pageY - 10) + 'px';
                    }
                });
                
                document.addEventListener('mouseout', (event) => {
                    if (event.target.classList.contains('issue-highlight')) {
                        document.getElementById('tooltip').style.display = 'none';
                    }
                });
            </script>
        </body>
        </html>
        `;
  }

  private generateHighlightedCode(code: string, issues: SfumatoIssue[]): string {
    const lines = code.split('\n');
    const issuesByLine = new Map<number, SfumatoIssue[]>();

    // Grouper les problèmes par ligne
    issues.forEach(issue => {
      if (!issuesByLine.has(issue.line)) {
        issuesByLine.set(issue.line, []);
      }
      issuesByLine.get(issue.line)!.push(issue);
    });

    return lines
      .map((line, index) => {
        const lineNumber = index + 1;
        const lineIssues = issuesByLine.get(lineNumber) || [];

        let highlightedLine = this.escapeHtml(line);

        // Appliquer les surlignages pour chaque problème sur cette ligne
        lineIssues.forEach(issue => {
          highlightedLine = highlightedLine.replace(
            this.escapeHtml(issue.originalText),
            `<span class="issue-highlight ${issue.type}" data-issue='${JSON.stringify(issue)}'>${this.escapeHtml(issue.originalText)}</span>`
          );
        });

        return `<div class="code-line" data-line="${lineNumber}">
                <span class="line-number">${lineNumber}</span>
                ${highlightedLine}
            </div>`;
      })
      .join('');
  }

  // Fonction utilitaire pour échapper le HTML
  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
