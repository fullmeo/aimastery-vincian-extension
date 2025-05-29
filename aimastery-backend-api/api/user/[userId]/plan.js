"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const stripe_1 = __importDefault(require("stripe"));
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
});
const AIMASTERY_PLANS = {
    free: {
        name: "AIMastery Free",
        price: 0,
        monthly_credits: 10
    },
    social_pack: {
        name: "Social Media Pack",
        price: 9,
        monthly_credits: 100
    },
    pro_vincien: {
        name: "Pro Vincien",
        price: 15,
        monthly_credits: 999999
    }
};
async function handler(req, res) {
    if (req.method === 'GET') {
        try {
            const { userId } = req.query;
            if (!userId) {
                return res.status(400).json({ error: 'Missing userId' });
            }
            // Récupérer plan utilisateur depuis Stripe
            const userPlan = await getUserPlan(userId);
            res.status(200).json(userPlan);
        }
        catch (error) {
            console.error('❌ Error fetching user plan:', error);
            res.status(500).json({
                error: 'Failed to fetch user plan',
                details: error.message
            });
        }
    }
    else {
        res.setHeader('Allow', 'GET');
        res.status(405).end('Method Not Allowed');
    }
}
exports.default = handler;
async function getUserPlan(userId) {
    try {
        // Chercher subscriptions actives pour cet utilisateur
        const subscriptions = await stripe.subscriptions.list({
            limit: 10,
            status: 'active'
        });
        // Pour l'instant, retourner FREE par défaut
        // TODO: Implémenter logique de matching userId
        console.log(`👤 Fetching plan for user ${userId} - returning FREE for now`);
        return AIMASTERY_PLANS.free;
    }
    catch (error) {
        console.error('Error in getUserPlan:', error);
        return AIMASTERY_PLANS.free;
    }
}
//# sourceMappingURL=plan.js.map