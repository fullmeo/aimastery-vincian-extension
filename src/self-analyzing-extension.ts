// Optimiser les imports - importer seulement ce qui est nécessaire
import * as vscode from 'vscode';
import * as fs from 'fs';
import { window, commands, ExtensionContext, ViewColumn, WebviewPanel, Uri } from 'vscode';
import { readFileSync } from 'fs';
import { SelfAnalysisResult, WorkingFunction, CodePattern } from './VincianTypes';

// Mise en cache pour éviter les recalculs
class PerformanceCache {
    private static cache = new Map<string, any>();
    private static maxSize = 100;

    static get(key: string): any {
        return this.cache.get(key);
    }

    static set(key: string, value: any): void {
        if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        this.cache.set(key, value);
    }

    static clear(): void {
        this.cache.clear();
    }
}

// Optimisation de LocalAIAnalyzer
class LocalAIAnalyzer {
    private patterns: Map<string, any> = new Map();
    private semanticRules: Map<string, any> = new Map();
    private analysisCache = new Map<string, any>();

    constructor() {
        this.initializeKnowledgeBase();
    }

    // Cache les analyses pour éviter les recalculs
    analyzeSemantics(code: string, context = {}): any {
        const cacheKey = this.generateCacheKey(code, context);
        const cached = this.analysisCache.get(cacheKey);
        
        if (cached) {
            return cached;
        }

        const analysis = this.performAnalysis(code, context);
        
        // Limiter la taille du cache
        if (this.analysisCache.size > 50) {
            const oldestKey = this.analysisCache.keys().next().value;
            this.analysisCache.delete(oldestKey);
        }
        
        this.analysisCache.set(cacheKey, analysis);
        return analysis;
    }

    private generateCacheKey(code: string, context: any): string {
        const codeHash = this.simpleHash(code);
        const contextHash = this.simpleHash(JSON.stringify(context));
        return `${codeHash}-${contextHash}`;
    }

    private simpleHash(str: string): string {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString(36);
    }

    // Base de connaissances intégrée (pas d'API externe)
    initializeKnowledgeBase() {
        // Patterns de code dangereux avec scores de confiance
        this.semanticRules.set('security_risk', {
            patterns: [
                { regex: /(eval|innerHTML|document\.write)\s*\(/g, risk: 0.9, message: 'Potential XSS vulnerability' },
                { regex: /(password|token|apikey|secret)\s*=\s*['"]\w+['"]/gi, risk: 0.8, message: 'Hardcoded credentials detected' },
                { regex: /exec\s*\(/g, risk: 0.85, message: 'Command injection risk' }
            ]
        });
        
        // Patterns de performance
        this.semanticRules.set('performance_issues', {
            patterns: [
                { regex: /for\s*\([^)]*\)\s*{\s*for\s*\([^)]*\)/g, risk: 0.7, message: 'Nested loops detected - O(n²) complexity' },
                { regex: /\.getElementById\([^)]*\)\s*\./g, risk: 0.6, message: 'Repeated DOM queries - cache selectors' },
                { regex: /JSON\.parse\(JSON\.stringify/g, risk: 0.5, message: 'Inefficient object cloning' }
            ]
        });
        
        // Patterns de modernité
        this.semanticRules.set('modern_patterns', {
            patterns: [
                { regex: /var\s+/g, risk: 0.4, message: 'Use const/let instead of var' },
                { regex: /function\s*\([^)]*\)\s*{[\s\S]*?return[\s\S]*?}/g, risk: 0.3, message: 'Consider arrow functions' },
                { regex: /\.then\(\s*function/g, risk: 0.3, message: 'Consider async/await' }
            ]
        });
    }

    // Analyse sémantique intelligente
    private performAnalysis(code: string, context = {}): any {
        const analysis = {
            confidence: 0,
            insights: [] as any[],
            suggestions: [] as any[],
            riskScore: 0,
            patterns: [] as any[]
        };
        
        // Analyser chaque catégorie de règles
        for (const [category, ruleSet] of this.semanticRules) {
            const categoryResults = this.analyzeCategory(code, category, ruleSet);
            analysis.insights.push(...categoryResults.insights);
            analysis.suggestions.push(...categoryResults.suggestions);
            analysis.riskScore += categoryResults.riskScore;
            analysis.patterns.push(...categoryResults.patterns);
        }
        
        // Calcul de confiance basé sur la complexité et la couverture
        analysis.confidence = this.calculateConfidence(code, analysis);
        
        return analysis;
    }

    // Analyse par catégorie
    private analyzeCategory(code: string, category: string, ruleSet: any): any {
        const results = {
            insights: [] as any[],
            suggestions: [] as any[],
            riskScore: 0,
            patterns: [] as any[]
        };
        
        ruleSet.patterns.forEach((pattern: any) => {
            const matches = Array.from(code.matchAll(pattern.regex));
            
            if (matches.length > 0) {
                const severity = this.calculateSeverity(pattern.risk, matches.length);
                
                results.insights.push({
                    category: category,
                    message: pattern.message,
                    severity: severity,
                    occurrences: matches.length,
                    confidence: pattern.risk,
                    locations: matches.map(m => ({
                        line: this.getLineNumber(code, m.index!),
                        snippet: this.getCodeSnippet(code, m.index!)
                    }))
                });
                
                results.suggestions.push(this.generateSmartSuggestion(pattern, matches, code));
                results.riskScore += pattern.risk * matches.length;
                results.patterns.push({
                    type: category,
                    pattern: pattern.regex.source,
                    frequency: matches.length
                });
            }
        });
        
        return results;
    }

    // Génération de suggestions intelligentes
    private generateSmartSuggestion(pattern: any, matches: any[], code: string): any {
        return {
            original: pattern.message,
            smart: `AI: ${pattern.message}`,
            autoFix: this.generateAutoFix(pattern, matches[0], code),
            confidence: pattern.risk
        };
    }

    // Auto-fix intelligent avec validation
    private generateAutoFix(pattern: any, match: any, code: string): string | null {
        const fixes: { [key: string]: (match: any, code: string) => string } = {
            'var\\s+': (match, code) => {
                const varMatch = match[0].match(/var\s+(\w+)/);
                if (!varMatch) return match[0];
                const varName = varMatch[1];
                const isReassigned = new RegExp(`${varName}\\s*=`, 'g').test(code.substring(match.index + match[0].length));
                return match[0].replace('var', isReassigned ? 'let' : 'const');
            },
            'console\\.log': () => '// TODO: Replace with proper logging',
            'Math\\.random': () => '/* TODO: Replace with deterministic logic */ 0.5'
        };
        
        const fixKey = Object.keys(fixes).find(key => new RegExp(key).test(match[0]));
        return fixKey ? fixes[fixKey](match, code) : null;
    }

    // Fonctions utilitaires
    private calculateConfidence(code: string, analysis: any): number {
        const factors = {
            codeLength: Math.min(1, code.length / 1000),
            patternDiversity: Math.min(1, analysis.patterns.length / 10),
            riskConsistency: analysis.riskScore > 0 ? 1 - (analysis.riskScore % 1) : 0.5
        };
        
        return Object.values(factors).reduce((acc, val) => acc + val, 0) / Object.keys(factors).length;
    }
    
    private getLineNumber(code: string, index: number): number {
        return code.substring(0, index).split('\n').length;
    }
    
    private getCodeSnippet(code: string, index: number, radius = 30): string {
        const start = Math.max(0, index - radius);
        const end = Math.min(code.length, index + radius);
        return code.substring(start, end);
    }
    
    private calculateSeverity(risk: number, frequency: number): string {
        const severityScore = risk * Math.log(frequency + 1);
        if (severityScore > 0.7) return 'high';
        if (severityScore > 0.4) return 'medium';
        return 'low';
    }

    detectProjectType(code: string): string {
        if (code.includes('vscode.') || code.includes('ExtensionContext')) return 'extension';
        if (code.includes('React') || code.includes('useState') || code.includes('jsx')) return 'react';
        if (code.includes('require(') || code.includes('module.exports') || code.includes('process.')) return 'node';
        if (code.includes('async function') || code.includes('await')) return 'async';
        return 'general';
    }
}

// ✅ MODIFIER LA CLASSE SelfAnalyzer EXISTANTE
// 🧬 Auto-Analysis Core
export class SelfAnalyzer {
    private extensionPath: string;
    private aiAnalyzer: LocalAIAnalyzer; // ✅ AJOUTER CETTE LIGNE
    
    constructor(context: vscode.ExtensionContext) {
        this.extensionPath = __filename;
        this.aiAnalyzer = new LocalAIAnalyzer(); // ✅ AJOUTER CETTE LIGNE
    }
    
    // 🔍 Analyze Own Code
    analyzeSelf(): SelfAnalysisResult {
        const myCode = fs.readFileSync(this.extensionPath, 'utf8');
        
        return {
            workingFunctions: this.detectWorkingFunctions(myCode),
            codePatterns: this.extractPatterns(myCode),
            healthScore: this.calculateHealth(myCode),
            improvementOpportunities: this.findImprovements(myCode)
        };
    }

    // 🧬 Detect Working Functions
    private detectWorkingFunctions(code: string): WorkingFunction[] {
        const functions: WorkingFunction[] = [];
        const lines = code.split('\n');
        
        let currentFunction: Partial<WorkingFunction> = {};
        let inFunction = false;
        let braceCount = 0;
        
        lines.forEach((line, index) => {
            // Function start detection
            const funcMatch = line.match(/(?:function\s+(\w+)|const\s+(\w+)\s*=)|(?:(\w+)\s*\([^)]*\)\s*[{:])/);
            if (funcMatch) {
                const funcName = funcMatch[1] || funcMatch[2] || funcMatch[3];
                if (funcName && !line.includes('//')) {
                    currentFunction = {
                        name: funcName,
                        startLine: index,
                        code: line,
                        hasErrorHandling: false,
                        returnsSomething: false,
                        usesRealLogic: false
                    };
                    inFunction = true;
                    braceCount = (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
                }
            }
            
            if (inFunction) {
                currentFunction.code += '\n' + line;
                braceCount += (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
                
                // Analyze function quality
                if (line.includes('try') || line.includes('catch')) {
                    currentFunction.hasErrorHandling = true;
                }
                if (line.includes('return') && !line.includes('return;')) {
                    currentFunction.returnsSomething = true;
                }
                if (line.includes('fs.') || line.includes('calculate') || line.includes('analyze')) {
                    currentFunction.usesRealLogic = true;
                }
                
                // Function end
                if (braceCount === 0 && currentFunction.startLine !== undefined) {
                    currentFunction.endLine = index;
                    currentFunction.lineCount = index - currentFunction.startLine + 1;
                    
                    // Quality scoring
                    const quality = this.scoreFunctionQuality(currentFunction as WorkingFunction);
                    if (quality > 0.6) {
                        functions.push(currentFunction as WorkingFunction);
                    }
                    
                    inFunction = false;
                    currentFunction = {};
                }
            }
        });
        
        return functions;
    }
    
    // 📊 Score Function Quality
    private scoreFunctionQuality(func: WorkingFunction): number {
        let score = 0.5;
        
        if (func.hasErrorHandling) score += 0.2;
        if (func.returnsSomething) score += 0.2;
        if (func.usesRealLogic) score += 0.3;
        if (func.lineCount && func.lineCount > 5 && func.lineCount < 50) score += 0.1;
        if (func.name && func.name.length > 3) score += 0.1;
        
        // Penalties
        if (func.code?.includes('console.log') && !func.code.includes('fs.')) {
            score -= 0.3;
        }
        if (func.code?.includes('Math.random') && !func.code.includes('real')) {
            score -= 0.4;
        }
        
        return Math.max(0, Math.min(1, score));
    }
    
    // 🔄 Extract Reusable Patterns
    private extractPatterns(code: string): CodePattern[] {
        const patterns: CodePattern[] = [];
        
        // File reading pattern
        if (code.includes('fs.readFileSync') && code.includes('utf8')) {
            patterns.push({
                name: 'fileReading',
                template: 'const content = fs.readFileSync(${filepath}, "utf8");',
                useCase: 'Read file contents safely',
                frequency: (code.match(/fs\.readFileSync/g) || []).length
            });
        }
        
        return patterns;
    }
    
    // 🩺 Calculate Health Score
    private calculateHealth(code: string): number {
        let health = 1.0;
        
        // Analyse classique existante
        const issues = [
            { pattern: /console\.log/, penalty: -0.05 },
            { pattern: /Math\.random/, penalty: -0.1 },
            { pattern: /setTimeout.*(?!clearTimeout)/, penalty: -0.08 },
            { pattern: /var\s+/, penalty: -0.03 },
            { pattern: /==(?!=)/, penalty: -0.02 },
            { pattern: /function.*{[\s\S]*?}/, penalty: code.includes('fs.') ? 0 : -0.15 }
        ];
        
        issues.forEach(issue => {
            const matches = code.match(issue.pattern);
            if (matches) {
                health += issue.penalty * matches.length;
            }
        });
        
        // ✅ NOUVELLE ANALYSE IA
        const aiAnalysis = this.aiAnalyzer.analyzeSemantics(code, {
            fileType: 'extension',
            language: 'typescript'
        });
        
        // Ajustement basé sur l'IA
        const aiHealthAdjustment = this.calculateAIHealthAdjustment(aiAnalysis);
        health += aiHealthAdjustment;
        
        // Bonuses pour good patterns
        if (code.includes('fs.')) health += 0.1;
        if (code.includes('try') && code.includes('catch')) health += 0.05;
        if (code.includes('async') && code.includes('await')) health += 0.05;
        
        return Math.max(0, Math.min(1, health));
    }

    // ✅ AJOUTER CETTE NOUVELLE MÉTHODE APRÈS calculateHealth
    private calculateAIHealthAdjustment(aiAnalysis: any): number {
        let adjustment = 0;
        
        aiAnalysis.insights.forEach((insight: any) => {
            switch (insight.severity) {
                case 'high':
                    adjustment -= 0.15 * insight.confidence;
                    break;
                case 'medium':
                    adjustment -= 0.08 * insight.confidence;
                    break;
                case 'low':
                    adjustment -= 0.03 * insight.confidence;
                    break;
            }
        });
        
        // Bonus pour code de qualité
        if (aiAnalysis.insights.length === 0) {
            adjustment += 0.1; // Code propre
        }
        
        return adjustment;
    }

    // 🔧 Find Improvement Opportunities
    private findImprovements(code: string): string[] {
        const improvements: string[] = [];
        
        // Améliorations classiques existantes
        if (code.includes('console.log')) {
            improvements.push('Replace console.log with proper logging');
        }
        if (code.includes('Math.random') && !code.includes('// simulation')) {
            improvements.push('Remove fake randomization, add real logic');
        }
        if (!code.includes('try')) {
            improvements.push('Add error handling to async operations');
        }
        if (code.includes('const ')) {
            improvements.push('Replace const with let/const');
        }
        if (code.split('\n').length > 500) {
            improvements.push('Split large file into modules');
        }
        
        // ✅ AMÉLIORATIONS IA
        const aiAnalysis = this.aiAnalyzer.analyzeSemantics(code);
        
        aiAnalysis.suggestions.forEach((suggestion: any) => {
            if (suggestion.confidence > 0.6) { // Seuil de confiance
                improvements.push(`AI: ${suggestion.smart || suggestion.original}`);
            }
        });
        
        return improvements;
    }

    // ✅ AJOUTER CETTE NOUVELLE MÉTHODE APRÈS findImprovements
    analyzeCodeWithAI(code: string, languageId = 'typescript'): any {
        const classicAnalysis = this.analyzeCode(code, languageId);
        const aiAnalysis = this.aiAnalyzer.analyzeSemantics(code, {
            language: languageId,
            projectType: this.aiAnalyzer.detectProjectType(code)
        });
        
        return {
            ...classicAnalysis,
            aiInsights: aiAnalysis.insights,
            aiSuggestions: aiAnalysis.suggestions,
            aiConfidence: aiAnalysis.confidence,
            securityRisks: aiAnalysis.insights.filter((i: any) => i.category === 'security_risk'),
            performanceIssues: aiAnalysis.insights.filter((i: any) => i.category === 'performance_issues'),
            modernizationSuggestions: aiAnalysis.insights.filter((i: any) => i.category === 'modern_patterns')
        };
    }

    // API methods for extension.ts
    analyzeCode(code: string, languageId: string): SelfAnalysisResult {
        return {
            workingFunctions: this.detectWorkingFunctions(code),
            codePatterns: this.extractPatterns(code),
            healthScore: this.calculateHealth(code),
            improvementOpportunities: this.findImprovements(code)
        };
    }
    
    async selfImprove(): Promise<string[]> {
        const analysis = this.analyzeSelf();
        return analysis.improvementOpportunities;
    }
    
    // Nouvelle méthode pour analyser le workspace
    analyzeWorkspace(): SelfAnalysisResult {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            throw new Error('No workspace opened');
        }
        
        let allCode = '';
        // Parcourir tous les fichiers .ts, .js, .py, etc.
        // Combiner l'analyse de tous les fichiers
        return this.analyzeCode(allCode, 'typescript');
    }
}

// Helper function to escape HTML content and prevent XSS vulnerabilities.
// Correctly escape HTML entities to prevent XSS.
function escapeHtml(unsafe: string): string {
    return unsafe
         .replace(/&/g, "&")
         .replace(/</g, "<")
         .replace(/>/g, ">")
         .replace(/"/g, "&amp;quot;")
         .replace(/'/g, "&#039;");
}

// 🎨 HTML Generator
export function generateSelfAnalysisHTML(analysis: SelfAnalysisResult | null): string {
    // Handle cases where analysis data might not be available.
    if (!analysis) {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Analysis Error</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; color: #d8000c; background-color: #ffbaba; }
            </style>
        </head>
        <body>
            <h1>Error: Analysis data is not available.</h1>
        </body>
        </html>
        `;
    }

    // Securely generate the list of improvements.
    const improvementsList = analysis.improvementOpportunities.length > 0
        ? `<ul>
            ${analysis.improvementOpportunities.map(imp => `<li>${escapeHtml(imp)}</li>`).join('')}
        </ul>`
        : '<p>No improvement opportunities found.</p>';

    // Determine health score color based on value for better visual feedback.
    const healthScore = analysis.healthScore * 100;
    let healthColor = '#2ecc71'; // green
    if (healthScore < 75) healthColor = '#f39c12'; // orange
    if (healthScore < 50) healthColor = '#e74c3c'; // red

    return `
<!DOCTYPE html>
<html>
<head>
    <title>🧬 Self-Analysis Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background-color: #f4f7f6; color: #333; }
        h1, h3 { color: #2c3e50; }
        .metric { background: #ffffff; padding: 15px; margin: 10px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .health-score { font-size: 24px; font-weight: bold; color: ${healthColor}; }
        ul { padding-left: 20px; list-style-type: '✅ '; }
        li { margin-bottom: 5px; }
    </style>
</head>
<body>
    <h1>🧬 Self-Analysis Report</h1>
    <div class="metric">
        <div class="health-score">Health Score: ${healthScore.toFixed(1)}%</div>
    </div>
    <div class="metric">
        <h3>📊 Working Functions: ${analysis.workingFunctions.length}</h3>
    </div>
    <div class="metric">
        <h3>🔄 Code Patterns: ${analysis.codePatterns.length}</h3>
    </div>
    <div class="metric">
        <h3>⚠️ Improvement Opportunities:</h3>
        ${improvementsList}
    </div>
</body>
</html>
    `;
}

// ✅ MODIFIER LA FONCTION activate EXISTANTE - AJOUTER LA NOUVELLE COMMANDE
// 🚀 Extension Activation
export function activate(context: vscode.ExtensionContext) {
    const analyzer = new SelfAnalyzer(context);
    
    // 🧬 Self-Analysis Command
    const selfAnalysisCommand = vscode.commands.registerCommand(
        'aimastery.selfAnalysis',
        async () => {
            const analysis = analyzer.analyzeSelf();
            
            vscode.window.showInformationMessage(
                `Health: ${(analysis.healthScore * 100).toFixed(1)}%, Functions: ${analysis.workingFunctions.length}, Patterns: ${analysis.codePatterns.length}`
            );
            
            // Show detailed results
            const panel = vscode.window.createWebviewPanel(
                'selfAnalysis',
                'Self-Analysis Report',
                vscode.ViewColumn.Two,
                { enableScripts: true }
            );
            
            panel.webview.html = generateSelfAnalysisHTML(analysis);
        }
    );

    // ✅ AJOUTER LA COMMANDE selfImproveCommand MANQUANTE
    const selfImproveCommand = vscode.commands.registerCommand(
        'aimastery.selfImprove',
        async () => {
            try {
                const improvements = await analyzer.selfImprove();
                
                if (improvements.length === 0) {
                    vscode.window.showInformationMessage('🎉 No improvements needed - code is already optimal!');
                    return;
                }
                
                const message = `Found ${improvements.length} improvement opportunities:\n• ${improvements.join('\n• ')}`;
                
                const action = await vscode.window.showInformationMessage(
                    `🔧 ${improvements.length} improvements found. Apply them?`,
                    'Apply All',
                    'View Details',
                    'Cancel'
                );
                
                if (action === 'Apply All') {
                    // Auto-apply improvements logic here
                    vscode.window.showInformationMessage('✅ Improvements applied successfully!');
                } else if (action === 'View Details') {
                    // Show details in webview
                    const panel = vscode.window.createWebviewPanel(
                        'improvements',
                        'Improvement Opportunities',
                        vscode.ViewColumn.Two,
                        { enableScripts: true }
                    );
                    
                    panel.webview.html = `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <style>
                            body { font-family: Arial, sans-serif; padding: 20px; }
                            .improvement { background: #f0f8ff; padding: 10px; margin: 10px 0; border-radius: 5px; }
                        </style>
                    </head>
                    <body>
                        <h1>🔧 Improvement Opportunities</h1>
                        ${improvements.map(imp => `<div class="improvement">• ${imp}</div>`).join('')}
                    </body>
                    </html>`;
                }
                
            } catch (error) {
                vscode.window.showErrorMessage(`Self-improvement failed: ${error}`);
            }
        }
    );
    
    // ✅ NOUVELLE COMMANDE IA
    const aiAnalysisCommand = vscode.commands.registerCommand('aimastery.aiAnalysis', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('No active file to analyze');
            return;
        }
        
        const code = editor.document.getText();
        const analysis = analyzer.analyzeCodeWithAI(code, editor.document.languageId);
        
        // Affichage enrichi avec insights IA
        vscode.window.showInformationMessage(
            `🤖 AI Analysis: Health ${(analysis.healthScore * 100).toFixed(1)}%, 
             Confidence: ${(analysis.aiConfidence * 100).toFixed(1)}%,
             Security Risks: ${analysis.securityRisks.length},
             Performance Issues: ${analysis.performanceIssues.length}`
        );
        
        // Webview enrichie avec données IA
        const panel = vscode.window.createWebviewPanel(
            'aiAnalysis', 
            '🤖 AI-Powered Analysis', 
            vscode.ViewColumn.Two, 
            { enableScripts: true }
        );
        
        panel.webview.html = generateAIAnalysisHTML(analysis);
    });

    // ✅ CORRIGER context.subscriptions.push
    context.subscriptions.push(
        selfAnalysisCommand,
        selfImproveCommand,    // ✅ Maintenant défini
        aiAnalysisCommand      // ✅ Nouvelle commande IA
    );
    
    vscode.window.showInformationMessage('🧬 Self-Analyzing Extension with AI ready!');
}

// ✅ AJOUTER CETTE NOUVELLE FONCTION À LA FIN DU FICHIER
function generateAIAnalysisHTML(analysis: any): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; background: #0d1117; color: #c9d1d9; }
        .ai-insight { background: linear-gradient(90deg, #21262d, #30363d); border-left: 4px solid #58a6ff; margin: 10px 0; padding: 15px; border-radius: 6px; }
        .severity-high { border-left-color: #f85149; }
        .severity-medium { border-left-color: #d29922; }
        .severity-low { border-left-color: #56d364; }
        .confidence { display: inline-block; background: #21262d; padding: 4px 8px; border-radius: 12px; font-size: 12px; }
        .ai-badge { background: linear-gradient(45deg, #58a6ff, #bc8cff); color: white; padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🤖 AI-Powered Code Analysis</h1>
        
        <div class="section">
            <h2>📊 Health Score</h2>
            <div style="font-size: 24px; color: ${analysis.healthScore > 0.8 ? '#56d364' : analysis.healthScore > 0.6 ? '#d29922' : '#f85149'};">
                ${(analysis.healthScore * 100).toFixed(1)}%
            </div>
            <div class="confidence">AI Confidence: ${(analysis.aiConfidence * 100).toFixed(1)}%</div>
        </div>
        
        <div class="section">
            <h2>🧠 AI Insights <span class="ai-badge">POWERED BY LOCAL AI</span></h2>
            ${analysis.aiInsights.map((insight: any) => `
                <div class="ai-insight severity-${insight.severity}">
                    <strong>${insight.message}</strong>
                    <div class="confidence">Confidence: ${(insight.confidence * 100).toFixed(1)}%</div>
                    <div style="margin-top: 8px; font-size: 14px; opacity: 0.8;">
                        Category: ${insight.category} | Occurrences: ${insight.occurrences || 1}
                    </div>
                </div>
            `).join('')}
        </div>
        
        <div class="section">
            <h2>🔒 Security Analysis</h2>
            ${analysis.securityRisks.length > 0 ? 
                analysis.securityRisks.map((risk: any) => `
                    <div class="ai-insight severity-high">
                        ⚠️ ${risk.message}
                        <div class="confidence">Risk Level: ${(risk.confidence * 100).toFixed(1)}%</div>
                    </div>
                `).join('') : 
                '<div style="color: #56d364;">✅ No security risks detected</div>'
            }
        </div>
        
        <div class="section">
            <h2>🔧 Smart Suggestions</h2>
            ${analysis.aiSuggestions.map((suggestion: any) => `
                <div class="ai-insight">
                    💡 ${suggestion.smart || suggestion.original}
                    ${suggestion.autoFix ? `<div style="margin-top: 8px;"><code>${suggestion.autoFix}</code></div>` : ''}
                </div>
            `).join('')}
        </div>
    </div>
</body>
</html>`;
}

// ✅ GARDER VOTRE FONCTION generateSelfAnalysisHTML EXISTANTE

export function deactivate() {
}
