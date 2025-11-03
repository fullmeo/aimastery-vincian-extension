// ===== UX OPTIMIZATION MODULE - VERSION COMPLÈTE =====

import * as vscode from 'vscode';

/**
 * Interface pour les métriques UX
 */
interface UXMetrics {
    commandResponseTimes: Map<string, number[]>;
    userInteractions: number;
    errorRate: number;
    satisfactionScore: number;
    lastOptimization: Date;
    sessionDuration: number;
    featuresUsed: Set<string>;
    conversionEvents: string[];
}

/**
 * Interface pour la configuration UX
 */
interface UXConfiguration {
    enableAnimations: boolean;
    enableHapticFeedback: boolean;
    enableSmartSuggestions: boolean;
    adaptiveTheme: boolean;
    responsiveLoading: boolean;
    preloadData: boolean;
    cacheSize: number;
    analyticsEnabled: boolean;
    welcomeFlowEnabled: boolean;
    contextualHelpEnabled: boolean;
    performanceMode: 'high' | 'balanced' | 'power_saving';
}

/**
 * Interface pour les données utilisateur
 */
interface UserProfile {
    userId: string;
    installDate: Date;
    lastActiveDate: Date;
    totalSessions: number;
    totalCommands: number;
    favoriteFeatures: string[];
    skillLevel: 'beginner' | 'intermediate' | 'advanced';
    preferences: UserPreferences;
    progression: UserProgression;
}

interface UserPreferences {
    theme: 'dark' | 'light' | 'auto';
    notifications: boolean;
    autoSave: boolean;
    shortcuts: Record<string, string>;
    layout: 'compact' | 'comfortable' | 'spacious';
}

interface UserProgression {
    level: number;
    xp: number;
    badges: string[];
    achievements: Achievement[];
    currentGoals: Goal[];
}

interface Achievement {
    id: string;
    title: string;
    description: string;
    icon: string;
    unlockedAt: Date;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface Goal {
    id: string;
    title: string;
    description: string;
    progress: number;
    target: number;
    reward: string;
    deadline?: Date;
}

/**
 * Gestionnaire principal d'optimisation UX
 */
class UXOptimizer {
    private metrics: UXMetrics;
    private config: UXConfiguration;
    private userProfile: UserProfile;
    private cache = new Map<string, any>();
    private preloadedData = new Map<string, any>();
    private responseTimeThreshold = 200; // ms
    private context: vscode.ExtensionContext;
    private sessionStartTime: Date;
    private performanceObserver?: PerformanceObserver;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.sessionStartTime = new Date();
        this.metrics = this.initializeMetrics();
        this.config = this.loadUXConfiguration();
        this.userProfile = this.loadUserProfile();
        this.setupPerformanceMonitoring();
        this.initializePreloading();
        this.startUXOptimization();
    }

    private initializeMetrics(): UXMetrics {
        return {
            commandResponseTimes: new Map(),
            userInteractions: 0,
            errorRate: 0,
            satisfactionScore: 0.8,
            lastOptimization: new Date(),
            sessionDuration: 0,
            featuresUsed: new Set(),
            conversionEvents: []
        };
    }

    private loadUXConfiguration(): UXConfiguration {
        const config = vscode.workspace.getConfiguration('aiMasteryVincianAnalysis.ux');
        
        return {
            enableAnimations: config.get('enableAnimations', true),
            enableHapticFeedback: config.get('enableHapticFeedback', false),
            enableSmartSuggestions: config.get('enableSmartSuggestions', true),
            adaptiveTheme: config.get('adaptiveTheme', true),
            responsiveLoading: config.get('responsiveLoading', true),
            preloadData: config.get('preloadData', true),
            cacheSize: config.get('cacheSize', 50),
            analyticsEnabled: config.get('analyticsEnabled', true),
            welcomeFlowEnabled: config.get('welcomeFlowEnabled', true),
            contextualHelpEnabled: config.get('contextualHelpEnabled', true),
            performanceMode: config.get('performanceMode', 'balanced')
        };
    }

    private loadUserProfile(): UserProfile {
        const saved = this.context.globalState.get<UserProfile>('userProfile');
        
        if (saved) {
            return {
                ...saved,
                lastActiveDate: new Date()
            };
        }

        // Nouveau profil utilisateur
        const newProfile: UserProfile = {
            userId: vscode.env.machineId,
            installDate: new Date(),
            lastActiveDate: new Date(),
            totalSessions: 1,
            totalCommands: 0,
            favoriteFeatures: [],
            skillLevel: 'beginner',
            preferences: {
                theme: 'auto',
                notifications: true,
                autoSave: true,
                shortcuts: {},
                layout: 'comfortable'
            },
            progression: {
                level: 1,
                xp: 0,
                badges: [],
                achievements: [],
                currentGoals: this.generateInitialGoals()
            }
        };

        this.saveUserProfile(newProfile);
        return newProfile;
    }

    private generateInitialGoals(): Goal[] {
        return [
            {
                id: 'first_analysis',
                title: 'Première Analyse',
                description: 'Effectuer votre première analyse de code',
                progress: 0,
                target: 1,
                reward: 'Badge "Explorateur"'
            },
            {
                id: 'daily_user',
                title: 'Utilisateur Quotidien',
                description: 'Utiliser AIMastery 3 jours consécutifs',
                progress: 0,
                target: 3,
                reward: '50 XP + Badge "Régulier"'
            },
            {
                id: 'feature_explorer',
                title: 'Explorateur de Fonctionnalités',
                description: 'Tester 5 fonctionnalités différentes',
                progress: 0,
                target: 5,
                reward: 'Déblocage mode Premium (7 jours gratuits)'
            }
        ];
    }

    private setupPerformanceMonitoring(): void {
        // Surveillance des performances en temps réel
        if (typeof PerformanceObserver !== 'undefined') {
            this.performanceObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (entry.entryType === 'measure') {
                        this.trackCommandPerformance(entry.name, entry.duration);
                    }
                }
            });

            this.performanceObserver.observe({ entryTypes: ['measure'] });
        }

        // Monitoring de la mémoire
        setInterval(() => {
            if (process.memoryUsage) {
                const memory = process.memoryUsage();
                if (memory.heapUsed > 100 * 1024 * 1024) { // 100MB
                    this.optimizeMemoryUsage();
                }
            }
        }, 30000); // Toutes les 30 secondes
    }

    private initializePreloading(): void {
        if (!this.config.preloadData) return;

        // Précharger les données communes
        setTimeout(() => {
            this.preloadCommonData();
        }, 1000);
    }

    private async preloadCommonData(): Promise<void> {
        try {
            // Précharger templates de code
            this.preloadedData.set('codeTemplates', await this.loadCodeTemplates());
            
            // Précharger règles d'analyse
            this.preloadedData.set('analysisRules', await this.loadAnalysisRules());
            
            // Précharger suggestions fréquentes
            this.preloadedData.set('suggestions', await this.loadFrequentSuggestions());
            
        } catch (error) {
            console.warn('Preloading failed:', error);
        }
    }

    private async loadCodeTemplates(): Promise<any[]> {
        // Simulation - à remplacer par vraie logique
        return [
            { name: 'function', template: 'function ${name}(${params}) {\n  ${body}\n}' },
            { name: 'class', template: 'class ${name} {\n  constructor(${params}) {\n    ${body}\n  }\n}' }
        ];
    }

    private async loadAnalysisRules(): Promise<any[]> {
        // Simulation - à remplacer par vraie logique
        return [
            { rule: 'no-eval', severity: 'error', message: 'Avoid using eval()' },
            { rule: 'prefer-const', severity: 'warning', message: 'Use const when variable is not reassigned' }
        ];
    }

    private async loadFrequentSuggestions(): Promise<string[]> {
        return [
            'Add error handling with try-catch',
            'Extract this to a separate function',
            'Use async/await instead of promises',
            'Add JSDoc documentation',
            'Consider using TypeScript'
        ];
    }

    private startUXOptimization(): void {
        // Optimisation continue en arrière-plan
        setInterval(() => {
            this.performUXOptimization();
        }, 60000); // Toutes les minutes

        // Sauvegarder le profil utilisateur périodiquement
        setInterval(() => {
            this.saveUserProfile(this.userProfile);
        }, 30000); // Toutes les 30 secondes
    }

    private performUXOptimization(): void {
        // Ajuster les performances selon l'utilisation
        this.optimizeBasedOnUsage();
        
        // Nettoyer le cache si nécessaire
        this.cleanupCache();
        
        // Ajuster les suggestions selon le profil utilisateur
        this.personalizeExperience();
        
        // Mettre à jour les métriques
        this.updateMetrics();
    }

    private optimizeBasedOnUsage(): void {
        const avgResponseTime = this.getAverageResponseTime();
        
        if (avgResponseTime > this.responseTimeThreshold * 2) {
            // Performance dégradée - activer le mode performance
            this.enablePerformanceMode();
        } else if (avgResponseTime < this.responseTimeThreshold / 2) {
            // Performance excellente - activer plus de fonctionnalités
            this.enableEnhancedMode();
        }
    }

    private getAverageResponseTime(): number {
        let total = 0;
        let count = 0;
        
        this.metrics.commandResponseTimes.forEach(times => {
            times.forEach(time => {
                total += time;
                count++;
            });
        });
        
        return count > 0 ? total / count : 0;
    }

    private enablePerformanceMode(): void {
        this.config.enableAnimations = false;
        this.config.preloadData = false;
        this.config.cacheSize = Math.max(10, this.config.cacheSize / 2);
        
        vscode.window.showInformationMessage(
            '⚡ Mode Performance activé pour améliorer la réactivité',
            'OK'
        );
    }

    private enableEnhancedMode(): void {
        this.config.enableAnimations = true;
        this.config.preloadData = true;
        this.config.enableSmartSuggestions = true;
        
        // Pas de notification pour éviter le spam
    }

    private cleanupCache(): void {
        if (this.cache.size > this.config.cacheSize) {
            // Supprimer les entrées les plus anciennes
            const entries = Array.from(this.cache.entries());
            const toDelete = entries.slice(0, entries.length - this.config.cacheSize);
            
            toDelete.forEach(([key]) => {
                this.cache.delete(key);
            });
        }
    }

    private personalizeExperience(): void {
        // Adapter l'expérience selon le niveau de l'utilisateur
        switch (this.userProfile.skillLevel) {
            case 'beginner':
                this.config.contextualHelpEnabled = true;
                this.config.enableSmartSuggestions = true;
                break;
            case 'intermediate':
                this.config.contextualHelpEnabled = false;
                this.config.enableSmartSuggestions = true;
                break;
            case 'advanced':
                this.config.contextualHelpEnabled = false;
                this.config.enableSmartSuggestions = false;
                break;
        }
    }

    private updateMetrics(): void {
        this.metrics.sessionDuration = Date.now() - this.sessionStartTime.getTime();
        this.metrics.lastOptimization = new Date();
        
        // Calculer le score de satisfaction basé sur l'utilisation
        const satisfactionFactors = [
            this.getAverageResponseTime() < this.responseTimeThreshold ? 0.3 : 0,
            this.metrics.errorRate < 0.05 ? 0.2 : 0,
            this.metrics.userInteractions > 10 ? 0.2 : 0,
            this.metrics.featuresUsed.size > 3 ? 0.3 : 0
        ];
        
        this.metrics.satisfactionScore = satisfactionFactors.reduce((a, b) => a + b, 0);
    }

    private optimizeMemoryUsage(): void {
        // Forcer le garbage collection si possible
        if (global.gc) {
            global.gc();
        }
        
        // Nettoyer les caches
        this.cache.clear();
        this.preloadedData.clear();
        
        // Réinitialiser les métriques anciennes
        this.metrics.commandResponseTimes.clear();
        
        vscode.window.showWarningMessage(
            '🧹 Nettoyage mémoire effectué pour optimiser les performances',
            'OK'
        );
    }

    // Méthodes publiques pour l'intégration
    
    public trackCommandPerformance(commandId: string, duration: number): void {
        if (!this.metrics.commandResponseTimes.has(commandId)) {
            this.metrics.commandResponseTimes.set(commandId, []);
        }
        
        const times = this.metrics.commandResponseTimes.get(commandId)!;
        times.push(duration);
        
        // Garder seulement les 100 dernières mesures
        if (times.length > 100) {
            times.splice(0, times.length - 100);
        }
        
        // Tracking pour progression utilisateur
        this.trackFeatureUsage(commandId);
    }

    public trackUserInteraction(interactionType: string, data?: any): void {
        this.metrics.userInteractions++;
        this.metrics.featuresUsed.add(interactionType);
        
        // Mettre à jour le profil utilisateur
        this.userProfile.totalCommands++;
        this.userProfile.lastActiveDate = new Date();
        
        // Vérifier les objectifs
        this.checkGoalProgress(interactionType, data);
        
        // Analytics si activées
        if (this.config.analyticsEnabled) {
            this.sendAnalyticsEvent(interactionType, data);
        }
    }

    public trackError(error: Error, context?: string): void {
        this.metrics.errorRate = Math.min(this.metrics.errorRate + 0.01, 1);
        
        // Log pour debugging
        console.error('UX Error tracked:', error.message, context);
        
        // Envoyer aux analytics si configuré
        if (this.config.analyticsEnabled) {
            this.sendAnalyticsEvent('error', {
                message: error.message,
                context,
                timestamp: new Date().toISOString()
            });
        }
    }

    private trackFeatureUsage(feature: string): void {
        this.metrics.featuresUsed.add(feature);
        
        if (!this.userProfile.favoriteFeatures.includes(feature)) {
            this.userProfile.favoriteFeatures.push(feature);
            
            // Garder seulement les 10 features les plus utilisées
            if (this.userProfile.favoriteFeatures.length > 10) {
                this.userProfile.favoriteFeatures.splice(0, 1);
            }
        }
    }

    private checkGoalProgress(action: string, data?: any): void {
        this.userProfile.progression.currentGoals.forEach(goal => {
            let progressIncrement = 0;
            
            switch (goal.id) {
                case 'first_analysis':
                    if (action.includes('analysis') || action.includes('analyze')) {
                        progressIncrement = 1;
                    }
                    break;
                case 'daily_user':
                    // Logique pour utilisateur quotidien
                    progressIncrement = this.checkDailyUsage() ? 1 : 0;
                    break;
                case 'feature_explorer':
                    if (this.metrics.featuresUsed.size >= goal.progress + 1) {
                        progressIncrement = 1;
                    }
                    break;
            }
            
            if (progressIncrement > 0) {
                goal.progress = Math.min(goal.progress + progressIncrement, goal.target);
                
                if (goal.progress >= goal.target) {
                    this.completeGoal(goal);
                }
            }
        });
    }

    private checkDailyUsage(): boolean {
        const today = new Date().toDateString();
        const lastActive = this.userProfile.lastActiveDate.toDateString();
        return today !== lastActive;
    }

    private completeGoal(goal: Goal): void {
        // Ajouter l'achievement
        const achievement: Achievement = {
            id: `goal_${goal.id}`,
            title: goal.title,
            description: `Objectif accompli: ${goal.description}`,
            icon: '🏆',
            unlockedAt: new Date(),
            rarity: 'common'
        };
        
        this.userProfile.progression.achievements.push(achievement);
        this.userProfile.progression.xp += 50;
        
        // Notification à l'utilisateur
        vscode.window.showInformationMessage(
            `🎉 Objectif accompli: ${goal.title}!`,
            'Voir Récompenses'
        ).then(selection => {
            if (selection === 'Voir Récompenses') {
                this.showAchievements();
            }
        });
        
        // Retirer l'objectif des objectifs actuels
        this.userProfile.progression.currentGoals = 
            this.userProfile.progression.currentGoals.filter(g => g.id !== goal.id);
        
        // Ajouter de nouveaux objectifs
        this.addNewGoals();
    }

    private addNewGoals(): void {
        const availableGoals = this.getAvailableGoals();
        const currentGoalIds = this.userProfile.progression.currentGoals.map(g => g.id);
        
        // Ajouter jusqu'à 3 objectifs simultanés
        while (this.userProfile.progression.currentGoals.length < 3 && availableGoals.length > 0) {
            const randomGoal = availableGoals.splice(
                Math.floor(Math.random() * availableGoals.length), 1
            )[0];
            
            if (!currentGoalIds.includes(randomGoal.id)) {
                this.userProfile.progression.currentGoals.push(randomGoal);
            }
        }
    }

    private getAvailableGoals(): Goal[] {
        return [
            {
                id: 'code_improver',
                title: 'Améliorateur de Code',
                description: 'Utiliser la fonction auto-amélioration 5 fois',
                progress: 0,
                target: 5,
                reward: 'Badge "Optimiseur" + 100 XP'
            },
            {
                id: 'audio_analyzer',
                title: 'Analyste Audio',
                description: 'Analyser 3 fichiers audio différents',
                progress: 0,
                target: 3,
                reward: 'Badge "Vincien" + Unlock Premium Audio'
            },
            {
                id: 'social_creator',
                title: 'Créateur Social',
                description: 'Générer 10 social media packs',
                progress: 0,
                target: 10,
                reward: 'Badge "Influenceur" + Templates exclusifs'
            }
        ];
    }

    private showAchievements(): void {
        const achievements = this.userProfile.progression.achievements;
        const goals = this.userProfile.progression.currentGoals;
        
        const panel = vscode.window.createWebviewPanel(
            'achievements',
            '🏆 Vos Accomplissements',
            vscode.ViewColumn.Two,
            { enableScripts: true }
        );

        panel.webview.html = this.generateAchievementsHTML(achievements, goals);
    }

    private generateAchievementsHTML(achievements: Achievement[], goals: Goal[]): string {
        const achievementsList = achievements.map(a => `
            <div class="achievement ${a.rarity}">
                <span class="icon">${a.icon}</span>
                <div class="details">
                    <h3>${a.title}</h3>
                    <p>${a.description}</p>
                    <small>Débloqué le ${a.unlockedAt.toLocaleDateString()}</small>
                </div>
            </div>
        `).join('');

        const goalsList = goals.map(g => `
            <div class="goal">
                <div class="progress-bar">
                    <div class="progress" style="width: ${(g.progress / g.target) * 100}%"></div>
                </div>
                <div class="details">
                    <h3>${g.title}</h3>
                    <p>${g.description}</p>
                    <span class="progress-text">${g.progress}/${g.target}</span>
                    <small>Récompense: ${g.reward}</small>
                </div>
            </div>
        `).join('');

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { 
                        font-family: -apple-system, sans-serif; 
                        padding: 20px; 
                        background: #1e1e1e; 
                        color: #d4d4d4; 
                    }
                    .section { margin: 30px 0; }
                    .achievement, .goal { 
                        display: flex; 
                        margin: 15px 0; 
                        padding: 15px; 
                        background: rgba(255,255,255,0.05); 
                        border-radius: 8px; 
                        align-items: center;
                    }
                    .achievement.legendary { border-left: 4px solid #ff6b35; }
                    .achievement.epic { border-left: 4px solid #9b59b6; }
                    .achievement.rare { border-left: 4px solid #3498db; }
                    .achievement.common { border-left: 4px solid #2ecc71; }
                    .icon { font-size: 2rem; margin-right: 15px; }
                    .details h3 { margin: 0; color: #ffd700; }
                    .details p { margin: 5px 0; opacity: 0.8; }
                    .details small { opacity: 0.6; }
                    .progress-bar { 
                        width: 100px; 
                        height: 8px; 
                        background: rgba(255,255,255,0.1); 
                        border-radius: 4px; 
                        margin-right: 15px; 
                        overflow: hidden;
                    }
                    .progress { 
                        height: 100%; 
                        background: linear-gradient(90deg, #667eea, #764ba2); 
                        transition: width 0.3s ease;
                    }
                    .progress-text { 
                        font-weight: bold; 
                        color: #667eea; 
                    }
                </style>
            </head>
            <body>
                <h1>🏆 Vos Accomplissements AIMastery</h1>
                
                <div class="section">
                    <h2>✨ Achievements Débloqués (${achievements.length})</h2>
                    ${achievementsList || '<p>Aucun achievement débloqué pour le moment.</p>'}
                </div>
                
                <div class="section">
                    <h2>🎯 Objectifs Actuels (${goals.length})</h2>
                    ${goalsList || '<p>Aucun objectif actuel.</p>'}
                </div>
                
                <div class="section">
                    <h2>📊 Statistiques</h2>
                    <div class="stats">
                        <p><strong>Niveau:</strong> ${this.userProfile.progression.level}</p>
                        <p><strong>XP:</strong> ${this.userProfile.progression.xp}</p>
                        <p><strong>Commandes exécutées:</strong> ${this.userProfile.totalCommands}</p>
                        <p><strong>Fonctionnalités explorées:</strong> ${this.userProfile.favoriteFeatures.length}</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    private sendAnalyticsEvent(event: string, data?: any): void {
        // Simulation d'envoi analytics
        // En production, remplacer par vraie intégration analytics
        if (!this.config.analyticsEnabled) return;
        
        const eventData = {
            event,
            data,
            userId: this.userProfile.userId,
            timestamp: new Date().toISOString(),
            sessionId: this.sessionStartTime.getTime(),
            userLevel: this.userProfile.skillLevel,
            version: '1.0.0'
        };
        
        // Log local pour développement
        console.log('Analytics Event:', eventData);
        
        // En production, envoyer vers service analytics
        // fetch('https://analytics.aimastery.dev/track', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify(eventData)
        // }).catch(err => console.warn('Analytics failed:', err));
    }

    private saveUserProfile(profile: UserProfile): void {
        this.context.globalState.update('userProfile', profile);
    }

    // Méthodes publiques pour l'interface
    
    public getMetrics(): UXMetrics {
        return { ...this.metrics };
    }

    public getConfiguration(): UXConfiguration {
        return { ...this.config };
    }

    public getUserProfile(): UserProfile {
        return { ...this.userProfile };
    }

    public updateConfiguration(updates: Partial<UXConfiguration>): void {
        this.config = { ...this.config, ...updates };
        
        // Sauvegarder la configuration
        const vscodeConfig = vscode.workspace.getConfiguration('aiMasteryVincianAnalysis.ux');
        Object.entries(updates).forEach(([key, value]) => {
            vscodeConfig.update(key, value, vscode.ConfigurationTarget.Global);
        });
    }

    public dispose(): void {
        // Nettoyage avant destruction
        this.saveUserProfile(this.userProfile);
        
        if (this.performanceObserver) {
            this.performanceObserver.disconnect();
        }
        
        this.cache.clear();
        this.preloadedData.clear();
    }
}

/**
 * Gestionnaire de progression utilisateur simplifié
 */
export class ProgressTracker {
    private uxOptimizer: UXOptimizer;

    constructor(context: vscode.ExtensionContext) {
        this.uxOptimizer = new UXOptimizer(context);
    }

    async trackUserAction(action: string, data?: any): Promise<void> {
        this.uxOptimizer.trackUserInteraction(action, data);
    }

    getProgress(): UserProgression {
        return this.uxOptimizer.getUserProfile().progression;
    }
}

/**
 * Gestionnaire UX principal simplifié pour export
 */
export class UXOptimizationManager {
    private uxOptimizer: UXOptimizer;
    public progressTracker: ProgressTracker;

    constructor(context: vscode.ExtensionContext) {
        this.uxOptimizer = new UXOptimizer(context);
        this.progressTracker = new ProgressTracker(context);
    }

    async initialize(): Promise<void> {
        // L'initialisation est déjà faite dans le constructeur UXOptimizer
        const userProfile = this.uxOptimizer.getUserProfile();
        
        // Afficher le welcome flow pour les nouveaux utilisateurs
        if (this.shouldShowWelcomeFlow(userProfile)) {
            setTimeout(() => {
                this.showWelcomeFlow();
            }, 2000);
        }
    }

    private shouldShowWelcomeFlow(profile: UserProfile): boolean {
        const config = this.uxOptimizer.getConfiguration();
        const daysSinceInstall = (Date.now() - profile.installDate.getTime()) / (1000 * 60 * 60 * 24);
        
        return config.welcomeFlowEnabled && 
               profile.totalCommands < 3 && 
               daysSinceInstall < 7;
    }

    private async showWelcomeFlow(): Promise<void> {
        const choice = await vscode.window.showInformationMessage(
            '🎉 Bienvenue dans AIMastery Vincian Analysis !',
            {
                detail: 'Extension révolutionnaire combinant analyse de code et analyse audio inspirée de Léonard de Vinci.',
                modal: false
            },
            '🚀 Tour Guidé',
            '💻 Analyser Code',
            '🎵 Analyser Audio',
            '⚙️ Configurer'
        );

        switch (choice) {
            case '🚀 Tour Guidé':
                await this.startGuidedTour();
                break;
            case '💻 Analyser Code':
                vscode.commands.executeCommand('aimastery.selfAnalysis');
                break;
            case '🎵 Analyser Audio':
                vscode.commands.executeCommand('aimastery.analyzeAudio');
                break;
            case '⚙️ Configurer':
                vscode.commands.executeCommand('workbench.action.openSettings', 'aiMasteryVincianAnalysis');
                break;
        }
    }

    private async startGuidedTour(): Promise<void> {
        const steps = [
            {
                title: '🧬 Analyse de Code Avancée',
                message: 'Analysez la santé de votre code avec des métriques sophistiquées et des suggestions d\'amélioration automatiques.',
                command: 'aimastery.selfAnalysis',
                action: 'Essayer Maintenant'
            },
            {
                title: '🎵 Analyse Vincienne (Audio)',
                message: 'Analysez vos fichiers audio selon les principes cymatiques de Léonard de Vinci pour créer du contenu viral.',
                command: 'aimastery.analyzeAudio',
                action: 'Tester l\'Audio'
            },
            {
                title: '🚀 Mode Unifié',
                message: 'Combinez analyse de code et audio pour des insights uniques et générez automatiquement du contenu social media.',
                command: 'aimastery.unifiedAnalysis',
                action: 'Mode Complet'
            },
            {
                title: '⚡ Auto-Amélioration',
                message: 'Laissez l\'IA améliorer automatiquement votre code en temps réel avec des suggestions contextuelles.',
                command: 'aimastery.selfImprove',
                action: 'Auto-Optimiser'
            }
        ];

        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            const isLast = i === steps.length - 1;
            
            const buttons = [step.action];
            if (!isLast) buttons.push('Suivant');
            buttons.push('Terminer le Tour');
            
            const choice = await vscode.window.showInformationMessage(
                `${step.title} (${i + 1}/${steps.length})`,
                { detail: step.message },
                ...buttons
            );

            if (choice === step.action) {
                vscode.commands.executeCommand(step.command);
                // Permettre à l'utilisateur d'essayer la fonctionnalité
                await new Promise(resolve => setTimeout(resolve, 2000));
            } else if (choice === 'Terminer le Tour' || (!choice && isLast)) {
                break;
            }
            // Si "Suivant", continue la boucle
        }

        // Marquer le tour comme terminé
        vscode.window.showInformationMessage(
            '✨ Tour terminé ! Explorez AIMastery à votre rythme.',
            'Voir Achievements'
        ).then(selection => {
            if (selection === 'Voir Achievements') {
                vscode.commands.executeCommand('aimastery.showAchievements');
            }
        });

        // Débloquer l'achievement "Tour Completed"
        this.progressTracker.trackUserAction('tour_completed');
    }
}

/**
 * Fonction d'activation principale pour export
 */
export function activateUXOptimization(context: vscode.ExtensionContext): UXOptimizationManager {
    const manager = new UXOptimizationManager(context);
    manager.initialize();
    
    // Enregistrer la commande pour afficher les achievements
    const showAchievementsCommand = vscode.commands.registerCommand(
        'aimastery.showAchievements',
        () => {
            (manager as any).uxOptimizer.showAchievements();
        }
    );
    
    context.subscriptions.push(showAchievementsCommand);
    
    return manager;
}

// Export des types pour utilisation externe
export type {
    UXMetrics,
    UXConfiguration,
    UserProfile,
    UserPreferences,
    UserProgression,
    Achievement,
    Goal
};