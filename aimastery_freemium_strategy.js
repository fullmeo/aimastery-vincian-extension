// ================================
// AIMASTERY - STRATÉGIE FREEMIUM
// ================================

// Configuration des plans
const AIMASTERY_PLANS = {
    FREE: {
        name: "AIMastery Free",
        price: 0,
        currency: "EUR",
        billing: "permanent",
        features: {
            monthly_credits: 10,
            platforms: ["instagram", "linkedin"],
            templates: "basic",
            ai_model: "vincian_basic",
            export: "manual",
            support: "community",
            analytics: false,
            priority_features: false
        },
        limits: {
            generations_per_month: 10,
            platforms_count: 2,
            templates_count: 5,
            export_formats: ["text", "image"],
            api_calls_per_day: 0
        },
        marketing: {
            cta: "Parfait pour découvrir AIMastery",
            badge: "Gratuit",
            color: "#6B7280"
        }
    },

    SOCIAL_PACK: {
        name: "Social Media Pack",
        price: 9.00,
        currency: "EUR", 
        billing: "monthly",
        stripe_price_id: "price_1RSa8kH4EiD1KYdGcmW7A5",
        features: {
            monthly_credits: 100,
            platforms: ["instagram", "linkedin", "tiktok", "youtube"],
            templates: "premium",
            ai_model: "vincian_pro",
            export: "automatic",
            support: "email",
            analytics: "basic",
            priority_features: false
        },
        limits: {
            generations_per_month: 100,
            platforms_count: 4,
            templates_count: 50,
            export_formats: ["text", "image", "video", "carousel"],
            api_calls_per_day: 200
        },
        marketing: {
            cta: "Idéal pour créateurs de contenu",
            badge: "Populaire",
            color: "#3B82F6",
            trial_days: 7
        }
    },

    PRO_VINCIEN: {
        name: "Pro Vincien",
        price: 15.00,
        currency: "EUR",
        billing: "monthly", 
        stripe_price_id: "price_xxxxxxxxxxxxx", // À créer
        features: {
            monthly_credits: "unlimited",
            platforms: ["instagram", "linkedin", "tiktok", "youtube", "pinterest", "twitter"],
            templates: "premium_plus",
            ai_model: "vincian_advanced",
            export: "automatic_batch",
            support: "priority",
            analytics: "advanced",
            priority_features: true
        },
        limits: {
            generations_per_month: 999999,
            platforms_count: 6,
            templates_count: 200,
            export_formats: ["all"],
            api_calls_per_day: 1000,
            custom_templates: true,
            api_access: true
        },
        marketing: {
            cta: "Pour les professionnels du marketing",
            badge: "Pro",
            color: "#8B5CF6",
            trial_days: 14
        }
    }
};

// ================================
// GESTION DES FONCTIONNALITÉS
// ================================

class AIMasteryPlanManager {
    static async getUserPlan(userId) {
        // Vérifier l'abonnement Stripe
        const subscription = await this.getActiveSubscription(userId);
        
        if (!subscription) {
            return AIMASTERY_PLANS.FREE;
        }
        
        // Identifier le plan selon le price_id
        for (const [planKey, plan] of Object.entries(AIMASTERY_PLANS)) {
            if (plan.stripe_price_id === subscription.price_id) {
                return plan;
            }
        }
        
        return AIMASTERY_PLANS.FREE; // Fallback
    }

    static async checkFeatureAccess(userId, feature) {
        const userPlan = await this.getUserPlan(userId);
        return userPlan.features[feature] || false;
    }

    static async checkUsageLimit(userId, action) {
        const userPlan = await this.getUserPlan(userId);
        const currentUsage = await this.getCurrentMonthUsage(userId, action);
        
        const limit = userPlan.limits[`${action}_per_month`];
        
        if (limit === 999999) return true; // Unlimited
        return currentUsage < limit;
    }

    static async getAvailableUpgrades(userId) {
        const currentPlan = await this.getUserPlan(userId);
        const upgrades = [];
        
        if (currentPlan === AIMASTERY_PLANS.FREE) {
            upgrades.push(AIMASTERY_PLANS.SOCIAL_PACK);
            upgrades.push(AIMASTERY_PLANS.PRO_VINCIEN);
        } else if (currentPlan === AIMASTERY_PLANS.SOCIAL_PACK) {
            upgrades.push(AIMASTERY_PLANS.PRO_VINCIEN);
        }
        
        return upgrades;
    }
}

// ================================
// INTERFACE VS CODE AMÉLIORÉE
// ================================

class AIMasteryFreemiumUI {
    constructor() {
        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right, 100
        );
        this.updateUI();
    }

    async updateUI() {
        const userPlan = await AIMasteryPlanManager.getUserPlan(this.userId);
        const usage = await this.getCurrentUsage();
        
        // Status bar adaptatif
        switch (userPlan.name) {
            case "AIMastery Free":
                this.statusBarItem.text = `$(star) AIMastery (${usage}/10)`;
                this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
                this.statusBarItem.command = 'aimastery.showUpgradeOptions';
                break;
                
            case "Social Media Pack":
                this.statusBarItem.text = `$(package) AIMastery Pro (${usage}/100)`;
                this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.activeBackground');
                this.statusBarItem.command = 'aimastery.showAccountInfo';
                break;
                
            case "Pro Vincien":
                this.statusBarItem.text = `$(rocket) AIMastery Pro+`;
                this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.prominentBackground');
                this.statusBarItem.command = 'aimastery.showAccountInfo';
                break;
        }
        
        this.statusBarItem.show();
    }

    async showUpgradeOptions() {
        const currentPlan = await AIMasteryPlanManager.getUserPlan(this.userId);
        const availableUpgrades = await AIMasteryPlanManager.getAvailableUpgrades(this.userId);
        
        const options = availableUpgrades.map(plan => ({
            label: `$(${plan.marketing.color === '#3B82F6' ? 'package' : 'rocket'}) ${plan.name}`,
            description: `${plan.price}€/mois - ${plan.marketing.trial_days} jours gratuits`,
            detail: this.getFeaturesSummary(plan),
            plan: plan
        }));

        // Ajouter option "Comparer les plans"
        options.push({
            label: '$(list-unordered) Comparer tous les plans',
            description: 'Voir le tableau détaillé',
            detail: 'Free vs Social Pack vs Pro Vincien',
            action: 'compare'
        });

        const choice = await vscode.window.showQuickPick(options, {
            placeHolder: `Plan actuel: ${currentPlan.name} - Choisissez votre upgrade`
        });

        if (choice) {
            if (choice.action === 'compare') {
                await this.showPlanComparison();
            } else {
                await this.createCheckoutSession(choice.plan);
            }
        }
    }

    getFeaturesSummary(plan) {
        const credits = plan.features.monthly_credits === "unlimited" 
            ? "Illimité" 
            : `${plan.features.monthly_credits} crédits/mois`;
        
        return `${credits} • ${plan.features.platforms.length} plateformes • Support ${plan.features.support}`;
    }

    async showPlanComparison() {
        const panel = vscode.window.createWebviewPanel(
            'aimasteryPlans',
            'AIMastery - Comparaison des plans',
            vscode.ViewColumn.One,
            { enableScripts: true }
        );

        panel.webview.html = this.getPlanComparisonHTML();
    }

    getPlanComparisonHTML() {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: var(--vscode-font-family); padding: 20px; }
                .plans-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-top: 20px; }
                .plan-card { border: 1px solid var(--vscode-panel-border); border-radius: 8px; padding: 20px; }
                .plan-free { border-color: #6B7280; }
                .plan-social { border-color: #3B82F6; border-width: 2px; }
                .plan-pro { border-color: #8B5CF6; }
                .plan-price { font-size: 24px; font-weight: bold; margin: 10px 0; }
                .plan-features { list-style: none; padding: 0; }
                .plan-features li { margin: 8px 0; }
                .plan-features li:before { content: "✅ "; }
                .upgrade-btn { 
                    background: var(--vscode-button-background); 
                    color: var(--vscode-button-foreground);
                    border: none; padding: 10px 20px; border-radius: 4px; margin-top: 15px;
                    cursor: pointer; width: 100%;
                }
            </style>
        </head>
        <body>
            <h1>🚀 Choisissez votre plan AIMastery</h1>
            <div class="plans-grid">
                <div class="plan-card plan-free">
                    <h3>AIMastery Free</h3>
                    <div class="plan-price">0€<small>/mois</small></div>
                    <ul class="plan-features">
                        <li>10 générations IA/mois</li>
                        <li>Instagram + LinkedIn</li>
                        <li>Templates de base</li>
                        <li>Export manuel</li>
                        <li>Support communautaire</li>
                    </ul>
                    <button class="upgrade-btn" disabled>Plan actuel</button>
                </div>
                
                <div class="plan-card plan-social">
                    <h3>Social Media Pack 🏆</h3>
                    <div class="plan-price">9€<small>/mois</small></div>
                    <small>7 jours gratuits</small>
                    <ul class="plan-features">
                        <li>100 générations/mois</li>
                        <li>4 plateformes complètes</li>
                        <li>Templates premium</li>
                        <li>Export automatique</li>
                        <li>Support email</li>
                        <li>Analytics de base</li>
                    </ul>
                    <button class="upgrade-btn" onclick="upgrade('social')">Commencer l'essai</button>
                </div>
                
                <div class="plan-card plan-pro">
                    <h3>Pro Vincien</h3>
                    <div class="plan-price">15€<small>/mois</small></div>
                    <small>14 jours gratuits</small>
                    <ul class="plan-features">
                        <li>Générations illimitées</li>
                        <li>6 plateformes + futures</li>
                        <li>Templates exclusifs</li>
                        <li>Analytics avancés</li>
                        <li>Support prioritaire</li>
                        <li>API access</li>
                        <li>Features en avant-première</li>
                    </ul>
                    <button class="upgrade-btn" onclick="upgrade('pro')">Commencer l'essai</button>
                </div>
            </div>
            
            <script>
                const vscode = acquireVsCodeApi();
                function upgrade(plan) {
                    vscode.postMessage({ command: 'upgrade', plan: plan });
                }
            </script>
        </body>
        </html>`;
    }
}

// ================================
// LOGIQUE DE LIMITATION INTELLIGENTE
// ================================

class AIMasteryUsageEnforcer {
    static async enforceGenerationLimit(userId) {
        const canUse = await AIMasteryPlanManager.checkUsageLimit(userId, 'generations');
        
        if (!canUse) {
            const currentPlan = await AIMasteryPlanManager.getUserPlan(userId);
            
            if (currentPlan === AIMASTERY_PLANS.FREE) {
                return await this.showFreePlanLimitReached(userId);
            } else {
                return await this.showPaidPlanLimitReached(userId);
            }
        }
        
        return true;
    }

    static async showFreePlanLimitReached(userId) {
        const choice = await vscode.window.showWarningMessage(
            '🚀 Limite du plan gratuit atteinte (10/10)',
            'Voir les plans payants',
            'Rappeler demain',
            'Plus tard'
        );

        switch (choice) {
            case 'Voir les plans payants':
                await new AIMasteryFreemiumUI().showUpgradeOptions();
                return false;
            case 'Rappeler demain':
                await this.scheduleReminder(userId, 24);
                return false;
            default:
                return false;
        }
    }

    static async showPaidPlanLimitReached(userId) {
        const currentPlan = await AIMasteryPlanManager.getUserPlan(userId);
        
        await vscode.window.showInformationMessage(
            `Limite mensuelle atteinte (${currentPlan.limits.generations_per_month}).`,
            'Passer à Pro Vincien (illimité)',
            'OK'
        );
        
        return false;
    }

    static async showGentleUpgradePrompt(userId, feature) {
        // Prompt non-intrusif après quelques utilisations
        const usage = await this.getCurrentMonthUsage(userId, 'generations');
        
        if (usage === 5) { // Après 5 générations sur 10
            const choice = await vscode.window.showInformationMessage(
                '🎉 Vous utilisez beaucoup AIMastery ! Découvrez les plans premium',
                'Voir les avantages',
                'Plus tard'
            );
            
            if (choice === 'Voir les avantages') {
                await new AIMasteryFreemiumUI().showUpgradeOptions();
            }
        }
    }
}

// ================================
// COMMANDES VS CODE PRINCIPALES
// ================================

// Commande de génération avec freemium
vscode.commands.registerCommand('aimastery.generateContent', async () => {
    const userId = await this.getUserId();
    
    // Vérifier les limites
    const canGenerate = await AIMasteryUsageEnforcer.enforceGenerationLimit(userId);
    if (!canGenerate) return;
    
    // Générer le contenu
    await this.performAIGeneration(userId);
    
    // Increment usage
    await this.incrementUsage(userId, 'generations');
    
    // Gentle upsell si plan gratuit
    const plan = await AIMasteryPlanManager.getUserPlan(userId);
    if (plan === AIMASTERY_PLANS.FREE) {
        await AIMasteryUsageEnforcer.showGentleUpgradePrompt(userId, 'generations');
    }
});

// Fonction d'activation mise à jour
function activate(context) {
    const freemiumUI = new AIMasteryFreemiumUI();
    
    // Commandes
    const commands = [
        vscode.commands.registerCommand('aimastery.generateContent', generateContent),
        vscode.commands.registerCommand('aimastery.showUpgradeOptions', () => freemiumUI.showUpgradeOptions()),
        vscode.commands.registerCommand('aimastery.showAccountInfo', () => freemiumUI.showAccountInfo())
    ];
    
    context.subscriptions.push(...commands, freemiumUI.statusBarItem);
    
    // Welcome message pour nouveaux users
    const isFirstTime = context.globalState.get('aimastery.firstTime', true);
    if (isFirstTime) {
        freemiumUI.showWelcomeMessage();
        context.globalState.update('aimastery.firstTime', false);
    }
}