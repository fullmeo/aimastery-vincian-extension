const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { calculateNFTPrice } = require('./nft_generator');

// Configuration freemium
const AIMASTERY_PLANS = {
    free: {
        name: "AIMastery Free",
        price: 0,
        monthly_credits: 10,
        trial_days: 0
    },
    social_pack: {
        name: "Social Media Pack", 
        price: 9,
        price_id: "price_1RSaBkH4ErDlKYxlGgcmW7sS", // Votre prix existant 9€
        monthly_credits: 100,
        trial_days: 7
    },
    pro_vincien: {
        name: "Pro Vincien",
        price: 15,
        price_id: "price_NOUVEAU_PRICE_ID_15EUR", // À remplacer
        monthly_credits: 999999,
        trial_days: 14
    }
};

async function createPaymentIntent(productType, analysisData) {
  const pricing = {
    'social_pack': 900, // 9€ en centimes (VOTRE NOUVEAU PRIX!)
    'premium_pack': 900, // 9€ - votre produit Stripe
    'nft_generation': calculateNFTPrice(analysisData.rarity) * 100,
    'detailed_analysis': 300 // 3€
  };
  
  const paymentIntent = await stripe.paymentIntents.create({
    amount: pricing[productType],
    currency: 'eur',
    automatic_payment_methods: {
      enabled: true
    },
    metadata: {
      product: productType,
      vincianScore: analysisData.vincianScore,
      userId: analysisData.userId,
      priceEuros: pricing[productType] / 100, // Pour analytics
      priceId: 'price_1RSaBkH4ErDlKYxlGgcmW7sS' // Votre Price ID réel
    }
  });
  
  console.log(`💰 Payment Intent created: ${productType} - €${pricing[productType] / 100}`);
  return paymentIntent;
}

// Webhook pour vérification
async function setupWebhook(app) {
  app.post('/webhook/stripe', express.raw({type: 'application/json'}), (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;
    
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      return res.status(400).send(`Webhook signature verification failed.`);
    }
    
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      // Déclencher la génération du produit
      processSuccessfulPayment(paymentIntent);
    }
    
    res.json({received: true});
  });
}

// Traitement post-paiement
async function processSuccessfulPayment(paymentIntent) {
  const { product, vincianScore, userId, priceEuros, priceId } = paymentIntent.metadata;
  
  // 📊 Analytics revenue tracking
  console.log(`🔥🔥 REVENUE GENERATED: €${priceEuros} for ${product} by user ${userId}`);
  console.log(`💳 Price ID: ${priceId}`);
  
  switch(product) {
    case 'social_pack':
    case 'premium_pack': // Votre produit 9€
      await generateAndDeliverSocialPack(userId, vincianScore);
      await unlockPremiumFeatures(userId);
      console.log(`✅ Premium Pack (€${priceEuros}) activated for user ${userId}`);
      break;
      
    case 'nft_generation':
      await generateAndDeliverNFT(userId, vincianScore);
      break;
      
    case 'detailed_analysis':
      await generateDetailedAnalysis(userId, vincianScore);
      break;
  }
  
  // 📈 Revenue tracking
  await trackRevenue({
    amount: parseFloat(priceEuros),
    product: product,
    priceId: priceId,
    userId: userId,
    timestamp: new Date(),
    success: true
  });
}

// AJOUTER à la fin du fichier :
async function unlockPremiumFeatures(userId) {
  const premiumFeatures = {
    advancedAnalysis: true,
    socialMediaAutomation: true,
    exportFormats: ['PDF', 'JSON', 'CSV', 'PNG'],
    prioritySupport: true,
    analyticsAccess: true
  };
  
  console.log(`🎨 Unlocking premium features for user ${userId}:`, premiumFeatures);
  return premiumFeatures;
}

async function trackRevenue(revenueData) {
  console.log(`💰 REVENUE TRACKED:`, revenueData);
  console.log(`📊 Revenue €${revenueData.amount} recorded for ${revenueData.product}`);
  
  // TODO: Sauvegarder dans database analytics
  return revenueData;
}

// Mettre à jour exports (ligne 58) :
module.exports = { 
  createPaymentIntent, 
  setupWebhook, 
  processSuccessfulPayment,
  unlockPremiumFeatures,
  trackRevenue
};

// Dans extension.ts, REMPLACER PRICING et fonctions upgrade :

// Configuration freemium
const AIMASTERY_PLANS = {
    free: {
        name: "AIMastery Free",
        price: 0,
        monthly_credits: 10,
        trial_days: 0
    },
    social_pack: {
        name: "Social Media Pack", 
        price: 9,
        price_id: "price_1RSaBkH4ErDlKYxlGgcmW7sS", // Votre prix existant 9€
        monthly_credits: 100,
        trial_days: 7
    },
    pro_vincien: {
        name: "Pro Vincien",
        price: 15,
        price_id: "price_NOUVEAU_PRICE_ID_15EUR", // À remplacer
        monthly_credits: 999999,
        trial_days: 14
    }
};

// Nouvelle fonction pour vérifier plan utilisateur
async function getUserCurrentPlan(userId: string): Promise<any> {
    try {
        // TODO: Appel API backend pour récupérer plan
        /*
        const response = await fetch(`${process.env.BACKEND_URL}/api/user/${userId}/plan`);
        const plan = await response.json();
        return plan;
        */
        
        // Pour l'instant, retourner FREE par défaut
        return AIMASTERY_PLANS.free;
    } catch (error) {
        console.error('Error fetching user plan:', error);
        return AIMASTERY_PLANS.free;
    }
}

// Nouvelle fonction pour vérifier usage
async function checkUsageLimits(userId: string): Promise<{allowed: boolean, remaining: number, plan: any}> {
    const userPlan = await getUserCurrentPlan(userId);
    
    // TODO: Récupérer usage actuel du mois
    const currentUsage = 3; // Simulé pour l'instant
    
    if (userPlan.monthly_credits === 999999) {
        return { allowed: true, remaining: 999999, plan: userPlan };
    }
    
    const remaining = userPlan.monthly_credits - currentUsage;
    return {
        allowed: remaining > 0,
        remaining: Math.max(0, remaining),
        plan: userPlan
    };
}

// Modifier handleUpgradeFlow pour freemium
async function handleUpgradeFlow(productType: string, analysisId: string): Promise<void> {
    const userPlan = await getUserCurrentPlan(analysisId);
    
    outputChannel.appendLine(`👤 User Plan: ${userPlan.name}`);
    outputChannel.appendLine(`🎯 Available Upgrades:`);
    
    // Afficher options d'upgrade selon plan actuel
    const availableUpgrades = getAvailableUpgrades(userPlan);
    
    const panel = vscode.window.createWebviewPanel(
        'aimasteryFreemium',
        'AIMastery - Choisissez votre plan',
        vscode.ViewColumn.One,
        { enableScripts: true, retainContextWhenHidden: true }
    );

    panel.webview.html = getFreemiumWebviewContent(userPlan, availableUpgrades);

    panel.webview.onDidReceiveMessage(async (message) => {
        switch (message.command) {
            case 'upgrade_to_social':
                await createStripeCheckout('social_pack', analysisId);
                outputChannel.appendLine(`💳 STRIPE CHECKOUT: Social Pack - €9 (7 jours gratuits)`);
                trackAnalytics('upgrade_to_social', 'social_pack');
                panel.dispose();
                break;
                
            case 'upgrade_to_pro':
                await createStripeCheckout('pro_vincien', analysisId);
                outputChannel.appendLine(`💳 STRIPE CHECKOUT: Pro Vincien - €15 (14 jours gratuits)`);
                trackAnalytics('upgrade_to_pro', 'pro_vincien');
                panel.dispose();
                break;
                
            case 'continue_free':
                outputChannel.appendLine(`📱 User continues with FREE plan`);
                trackAnalytics('continue_free', 'free');
                panel.dispose();
                break;
        }
    });
}

function getAvailableUpgrades(currentPlan: any): any[] {
    if (currentPlan.name === "AIMastery Free") {
        return [AIMASTERY_PLANS.social_pack, AIMASTERY_PLANS.pro_vincien];
    } else if (currentPlan.name === "Social Media Pack") {
        return [AIMASTERY_PLANS.pro_vincien];
    }
    return [];
}

// Nouvelle fonction Stripe Checkout pour freemium
async function createStripeCheckout(planType: string, userId: string): Promise<void> {
    try {
        const plan = AIMASTERY_PLANS[planType as keyof typeof AIMASTERY_PLANS];
        
        outputChannel.appendLine(`🚀 Creating checkout for ${plan.name} - €${plan.price}`);
        outputChannel.appendLine(`🎁 Trial period: ${plan.trial_days} days`);
        
        // TODO: Appel API backend pour créer session Stripe
        /*
        const response = await fetch(`${process.env.BACKEND_URL}/api/payments/create-checkout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                planType: planType,
                userId: userId,
                priceId: plan.price_id
            })
        });
        
        const { url } = await response.json();
        await vscode.env.openExternal(vscode.Uri.parse(url));
        */
        
        vscode.window.showInformationMessage(
            `💳 ${plan.name} checkout ready! ${plan.trial_days} days free trial. Backend deployment needed.`,
            'View Analytics'
        ).then(selection => {
            if (selection === 'View Analytics') {
                outputChannel.show();
            }
        });
        
    } catch (error) {
        console.error('Checkout creation failed:', error);
        vscode.window.showErrorMessage('Payment initialization failed. Please try again.');
    }
}

// Webview freemium avec 3 plans
function getFreemiumWebviewContent(currentPlan: any, availableUpgrades: any[]): string {
    return `
    <html>
    <head>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                margin: 0;
                padding: 20px;
            }
            .plans-container {
                max-width: 1000px;
                margin: 0 auto;
            }
            .plans-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 20px;
                margin: 30px 0;
            }
            .plan-card {
                background: rgba(255,255,255,0.1);
                backdrop-filter: blur(10px);
                border-radius: 15px;
                padding: 25px;
                border: 2px solid rgba(255,255,255,0.2);
                text-align: center;
                transition: transform 0.3s;
            }
            .plan-card:hover { transform: translateY(-5px); }
            .plan-current { border-color: #FFD700; }
            .plan-popular { border-color: #3B82F6; }
            .plan-pro { border-color: #8B5CF6; }
            .plan-name { font-size: 1.5em; margin-bottom: 10px; }
            .plan-price { font-size: 2.5em; color: #FFD700; font-weight: bold; margin: 15px 0; }
            .plan-trial { background: #22C55E; padding: 5px 10px; border-radius: 15px; font-size: 0.9em; margin: 10px 0; display: inline-block; }
            .plan-features { list-style: none; padding: 0; margin: 20px 0; text-align: left; }
            .plan-features li { margin: 8px 0; font-size: 0.95em; }
            .plan-features li:before { content: "✅ "; margin-right: 8px; }
            .plan-button {
                background: #FF6B6B;
                color: white;
                border: none;
                padding: 12px 25px;
                font-size: 1.1em;
                border-radius: 8px;
                cursor: pointer;
                margin: 10px 5px;
                transition: all 0.3s;
                width: 100%;
            }
            .plan-button:hover { background: #FF5252; transform: scale(1.05); }
            .plan-button-current { background: #6B7280; cursor: not-allowed; }
            .plan-button-popular { background: #3B82F6; }
            .plan-button-pro { background: #8B5CF6; }
        </style>
    </head>
    <body>
        <div class="plans-container">
            <h1 style="text-align: center; margin-bottom: 10px;">🚀 Choisissez votre plan AIMastery</h1>
            <p style="text-align: center; margin-bottom: 30px;">Plan actuel: <strong>${currentPlan.name}</strong></p>
            
            <div class="plans-grid">
                <!-- Plan Free -->
                <div class="plan-card ${currentPlan.name === 'AIMastery Free' ? 'plan-current' : ''}">
                    <div class="plan-name">🆓 AIMastery Free</div>
                    <div class="plan-price">0€<small>/mois</small></div>
                    <ul class="plan-features">
                        <li>10 générations IA/mois</li>
                        <li>Instagram + LinkedIn</li>
                        <li>Templates de base</li>
                        <li>Export manuel</li>
                        <li>Support communautaire</li>
                    </ul>
                    <button class="plan-button ${currentPlan.name === 'AIMastery Free' ? 'plan-button-current' : ''}" 
                            onclick="handleContinueFree()" 
                            ${currentPlan.name === 'AIMastery Free' ? 'disabled' : ''}>
                        ${currentPlan.name === 'AIMastery Free' ? 'Plan actuel' : 'Rester gratuit'}
                    </button>
                </div>
                
                <!-- Plan Social -->
                <div class="plan-card plan-popular ${currentPlan.name === 'Social Media Pack' ? 'plan-current' : ''}">
                    <div class="plan-name">📱 Social Media Pack</div>
                    <div class="plan-trial">🎁 7 jours gratuits</div>
                    <div class="plan-price">9€<small>/mois</small></div>
                    <ul class="plan-features">
                        <li>100 générations/mois</li>
                        <li>4 plateformes complètes</li>
                        <li>Templates premium</li>
                        <li>Export automatique</li>
                        <li>Support email</li>
                        <li>Analytics de base</li>
                    </ul>
                    <button class="plan-button ${currentPlan.name === 'Social Media Pack' ? 'plan-button-current' : 'plan-button-popular'}" 
                            onclick="handleUpgradeToSocial()"
                            ${currentPlan.name === 'Social Media Pack' ? 'disabled' : ''}>
                        ${currentPlan.name === 'Social Media Pack' ? 'Plan actuel' : 'Essai gratuit 7j'}
                    </button>
                </div>
                
                <!-- Plan Pro -->
                <div class="plan-card plan-pro ${currentPlan.name === 'Pro Vincien' ? 'plan-current' : ''}">
                    <div class="plan-name">🚀 Pro Vincien</div>
                    <div class="plan-trial">🎁 14 jours gratuits</div>
                    <div class="plan-price">15€<small>/mois</small></div>
                    <ul class="plan-features">
                        <li>Générations illimitées</li>
                        <li>6 plateformes + futures</li>
                        <li>Templates exclusifs</li>
                        <li>Analytics avancés</li>
                        <li>Support prioritaire</li>
                        <li>API access</li>
                        <li>Features en avant-première</li>
                    </ul>
                    <button class="plan-button ${currentPlan.name === 'Pro Vincien' ? 'plan-button-current' : 'plan-button-pro'}" 
                            onclick="handleUpgradeToPro()"
                            ${currentPlan.name === 'Pro Vincien' ? 'disabled' : ''}>
                        ${currentPlan.name === 'Pro Vincien' ? 'Plan actuel' : 'Essai gratuit 14j'}
                    </button>
                </div>
            </div>
        </div>
        
        <script>
            const vscode = acquireVsCodeApi();
            
            function handleUpgradeToSocial() {
                vscode.postMessage({ command: 'upgrade_to_social' });
            }
            
            function handleUpgradeToPro() {
                vscode.postMessage({ command: 'upgrade_to_pro' });
            }
            
            function handleContinueFree() {
                vscode.postMessage({ command: 'continue_free' });
            }
        </script>
    </body>
    </html>`;
}