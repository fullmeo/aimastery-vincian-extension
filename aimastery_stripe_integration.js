// ================================
// 1. CONFIGURATION STRIPE
// ================================

const stripe = require('stripe')('sk_live_...'); // Remplacez par votre clé secrète

// Vos Price IDs depuis Stripe Dashboard
const PRICES = {
    SOCIAL_PACK: 'price_xxxxxxxxxxxxx', // 9€/mois - Social Media Pack
    PRO_VINCIEN: 'price_xxxxxxxxxxxxx'  // 15€/mois - Pro Vincien
};

// ================================
// 2. SERVEUR - CRÉATION CHECKOUT
// ================================

// Route pour créer une session de paiement
app.post('/create-checkout-session', async (req, res) => {
    try {
        const { priceId, userId, userEmail } = req.body;
        
        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            payment_method_types: ['card'],
            
            line_items: [{
                price: priceId, // PRICES.SOCIAL_PACK ou PRICES.PRO_VINCIEN
                quantity: 1,
            }],
            
            // URLs de redirection
            success_url: `${req.headers.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${req.headers.origin}/cancel`,
            
            // Informations client
            customer_email: userEmail,
            client_reference_id: userId, // Votre user ID interne
            
            // Métadonnées pour tracking
            metadata: {
                user_id: userId,
                source: 'vscode_extension',
                plan_type: priceId === PRICES.SOCIAL_PACK ? 'social_pack' : 'pro_vincien'
            },
            
            // Essai gratuit automatique
            subscription_data: {
                trial_period_days: priceId === PRICES.SOCIAL_PACK ? 7 : 14,
                metadata: {
                    user_id: userId,
                    extension_version: req.body.extensionVersion || '1.0.0'
                }
            }
        });

        res.json({ url: session.url });
        
    } catch (error) {
        console.error('Erreur checkout:', error);
        res.status(500).json({ error: error.message });
    }
});

// ================================
// 3. VS CODE EXTENSION - CÔTÉ CLIENT
// ================================

// Dans votre extension VS Code (extension.js)
const vscode = require('vscode');

class AIMasteryBilling {
    constructor() {
        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right, 
            100
        );
        this.updateStatusBar();
    }

    async updateStatusBar() {
        const userPlan = await this.getUserPlan();
        
        if (userPlan === 'free') {
            this.statusBarItem.text = "$(star) Upgrade AIMastery Pro";
            this.statusBarItem.command = 'aimastery.showUpgradeOptions';
            this.statusBarItem.tooltip = "Débloquez toutes les fonctionnalités premium";
        } else {
            this.statusBarItem.text = `$(check) AIMastery ${userPlan}`;
            this.statusBarItem.command = 'aimastery.showAccount';
            this.statusBarItem.tooltip = `Plan actuel: ${userPlan}`;
        }
        
        this.statusBarItem.show();
    }

    async showUpgradeOptions() {
        const choice = await vscode.window.showQuickPick([
            {
                label: '$(package) Social Media Pack',
                description: '9€/mois - 7 jours gratuits',
                detail: 'IA Vincian, 4 plateformes, templates premium',
                value: 'social_pack'
            },
            {
                label: '$(rocket) Pro Vincien',
                description: '15€/mois - 14 jours gratuits',
                detail: 'Tout + analytics, support prioritaire, features exclusives',
                value: 'pro_vincien'
            }
        ], {
            placeHolder: 'Choisissez votre plan AIMastery'
        });

        if (choice) {
            await this.createCheckoutSession(choice.value);
        }
    }

    async createCheckoutSession(planType) {
        try {
            const userId = await this.getUserId();
            const userEmail = await this.getUserEmail();
            
            const priceId = planType === 'social_pack' 
                ? 'price_xxxxxxxxxxxxx' // Social Pack
                : 'price_xxxxxxxxxxxxx'; // Pro Vincien

            // Appel à votre serveur
            const response = await fetch('https://votre-api.com/create-checkout-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    priceId,
                    userId,
                    userEmail,
                    extensionVersion: vscode.extensions.getExtension('votre.extension')?.packageJSON.version
                })
            });

            const { url } = await response.json();
            
            // Ouvrir le checkout dans le navigateur
            vscode.env.openExternal(vscode.Uri.parse(url));
            
            // Message d'information
            vscode.window.showInformationMessage(
                'Redirection vers Stripe pour finaliser votre abonnement...',
                'OK'
            );

        } catch (error) {
            vscode.window.showErrorMessage(`Erreur: ${error.message}`);
        }
    }

    async getUserId() {
        // Récupérer l'ID utilisateur depuis vos préférences/auth
        return vscode.workspace.getConfiguration('aimastery').get('userId') || 
               await this.promptForUserId();
    }

    async getUserEmail() {
        // Récupérer l'email utilisateur 
        return vscode.workspace.getConfiguration('aimastery').get('userEmail') || 
               await this.promptForUserEmail();
    }

    async getUserPlan() {
        // Vérifier le plan actuel via votre API
        try {
            const userId = await this.getUserId();
            const response = await fetch(`https://votre-api.com/user/${userId}/subscription`);
            const data = await response.json();
            return data.plan || 'free';
        } catch {
            return 'free';
        }
    }
}

// ================================
// 4. WEBHOOKS - GESTION DES ÉVÉNEMENTS
// ================================

// Route webhook pour écouter les événements Stripe
app.post('/webhook', express.raw({type: 'application/json'}), (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = 'whsec_...'; // Votre webhook secret

    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
        console.log(`Webhook signature verification failed.`, err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Gérer les événements
    switch (event.type) {
        case 'customer.subscription.created':
            await handleSubscriptionCreated(event.data.object);
            break;
            
        case 'customer.subscription.updated':
            await handleSubscriptionUpdated(event.data.object);
            break;
            
        case 'customer.subscription.deleted':
            await handleSubscriptionCancelled(event.data.object);
            break;
            
        case 'invoice.payment_succeeded':
            await handlePaymentSucceeded(event.data.object);
            break;
            
        case 'invoice.payment_failed':
            await handlePaymentFailed(event.data.object);
            break;
            
        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    res.json({received: true});
});

async function handleSubscriptionCreated(subscription) {
    const userId = subscription.metadata.user_id;
    const planType = subscription.metadata.plan_type;
    
    // Mettre à jour votre base de données
    await updateUserSubscription(userId, {
        status: 'active',
        plan: planType,
        stripeSubscriptionId: subscription.id,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000)
    });
    
    console.log(`Nouvel abonnement créé pour user ${userId}: ${planType}`);
}

async function handleSubscriptionUpdated(subscription) {
    const userId = subscription.metadata.user_id;
    
    await updateUserSubscription(userId, {
        status: subscription.status,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000)
    });
}

async function handleSubscriptionCancelled(subscription) {
    const userId = subscription.metadata.user_id;
    
    await updateUserSubscription(userId, {
        status: 'cancelled',
        cancelledAt: new Date()
    });
}

// ================================
// 5. GESTION DES FONCTIONNALITÉS
// ================================

class AIMasteryFeatures {
    static async checkFeatureAccess(userId, feature) {
        const subscription = await getUserSubscription(userId);
        
        if (!subscription || subscription.status !== 'active') {
            return false; // Plan gratuit
        }
        
        const planFeatures = {
            'social_pack': [
                'ai_generation',
                'multi_platform',
                'templates_basic',
                'export_direct'
            ],
            'pro_vincien': [
                'ai_generation',
                'multi_platform', 
                'templates_premium',
                'analytics_advanced',
                'support_priority',
                'export_direct',
                'unlimited_credits'
            ]
        };
        
        return planFeatures[subscription.plan]?.includes(feature) || false;
    }

    static async limitFeatureUsage(userId, feature) {
        const subscription = await getUserSubscription(userId);
        
        if (subscription?.plan === 'pro_vincien') {
            return true; // Illimité pour Pro
        }
        
        if (subscription?.plan === 'social_pack') {
            // Vérifier les limites mensuelles
            const usage = await getMonthlyUsage(userId, feature);
            return usage < 100; // Limite du Social Pack
        }
        
        // Plan gratuit - limites strictes
        const usage = await getMonthlyUsage(userId, feature);
        return usage < 10; // 10 générations/mois gratuit
    }
}

// ================================
// 6. EXEMPLES D'UTILISATION
// ================================

// Dans votre commande de génération de contenu
vscode.commands.registerCommand('aimastery.generateContent', async () => {
    const userId = await billing.getUserId();
    
    // Vérifier l'accès à la fonctionnalité
    const hasAccess = await AIMasteryFeatures.checkFeatureAccess(userId, 'ai_generation');
    const canUse = await AIMasteryFeatures.limitFeatureUsage(userId, 'ai_generation');
    
    if (!hasAccess || !canUse) {
        const upgrade = await vscode.window.showWarningMessage(
            'Cette fonctionnalité nécessite un plan premium',
            'Voir les plans',
            'Plus tard'
        );
        
        if (upgrade === 'Voir les plans') {
            await billing.showUpgradeOptions();
        }
        return;
    }
    
    // Générer le contenu...
    await generateAIContent();
});

// Initialisation dans activate()
function activate(context) {
    const billing = new AIMasteryBilling();
    
    // Enregistrer les commandes
    const upgradeCommand = vscode.commands.registerCommand(
        'aimastery.showUpgradeOptions', 
        () => billing.showUpgradeOptions()
    );
    
    context.subscriptions.push(upgradeCommand, billing.statusBarItem);
}