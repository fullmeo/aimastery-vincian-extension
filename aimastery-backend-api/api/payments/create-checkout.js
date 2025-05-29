"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const stripe_1 = __importDefault(require("stripe"));
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
});
// Configuration freemium plans
const AIMASTERY_PLANS = {
    social_pack: {
        name: "Social Media Pack",
        price: 9.00,
        stripe_price_id: "price_1RSaBkH4ErDlKYxlGgcmW7sS",
        trial_days: 7
    },
    pro_vincien: {
        name: "Pro Vincien",
        price: 15.00,
        stripe_price_id: "price_NOUVEAU_PRICE_ID_15EUR",
        trial_days: 14
    }
};
async function handler(req, res) {
    console.log('🚀 Checkout API called:', req.method, req.body);
    if (req.method === 'POST') {
        try {
            const { planType, userId } = req.body;
            // Validation
            if (!planType || !userId) {
                return res.status(400).json({
                    error: 'Missing planType or userId',
                    received: { planType, userId }
                });
            }
            const plan = AIMASTERY_PLANS[planType];
            if (!plan) {
                return res.status(400).json({
                    error: 'Invalid plan type',
                    availablePlans: Object.keys(AIMASTERY_PLANS)
                });
            }
            // URLs de redirection
            const successUrl = `${req.headers.origin}/success?session_id={CHECKOUT_SESSION_ID}&plan=${planType}`;
            const cancelUrl = `${req.headers.origin}/cancel?plan=${planType}`;
            // Configuration session Stripe
            const sessionConfig = {
                mode: 'subscription',
                payment_method_types: ['card'],
                line_items: [{
                        price: plan.stripe_price_id,
                        quantity: 1
                    }],
                success_url: successUrl,
                cancel_url: cancelUrl,
                metadata: {
                    plan_type: planType,
                    user_id: userId,
                    source: 'vscode_extension',
                    plan_name: plan.name
                }
            };
            // Ajouter trial si disponible
            if (plan.trial_days > 0) {
                sessionConfig.subscription_data = {
                    trial_period_days: plan.trial_days
                };
            }
            const session = await stripe.checkout.sessions.create(sessionConfig);
            console.log(`✅ Checkout session created: ${plan.name} with ${plan.trial_days} days trial`);
            console.log(`💰 Revenue potential: €${plan.price} for user ${userId}`);
            res.status(200).json({
                sessionId: session.id,
                url: session.url,
                success: true,
                plan: plan.name,
                trial_days: plan.trial_days,
                price: plan.price
            });
        }
        catch (error) {
            console.error('❌ Checkout creation failed:', error);
            res.status(500).json({
                error: 'Checkout creation failed',
                details: error.message
            });
        }
    }
    else {
        res.setHeader('Allow', 'POST');
        res.status(405).json({ error: 'Method Not Allowed' });
    }
}
exports.default = handler;
// Configuration des fonctions API
exports.config = {
    api: {
        bodyParser: true,
        externalResolver: true,
        // Durée maximale en secondes
        responseLimit: '4mb',
        // Timeout de la fonction
        maxDuration: 30
    }
};
//# sourceMappingURL=create-checkout.js.map