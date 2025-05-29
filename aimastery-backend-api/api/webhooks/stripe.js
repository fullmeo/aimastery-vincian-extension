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
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
async function handler(req, res) {
    if (req.method === 'POST') {
        const sig = req.headers['stripe-signature'];
        let event;
        try {
            event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
        }
        catch (err) {
            console.error('❌ Webhook signature verification failed:', err.message);
            return res.status(400).send(`Webhook Error: ${err.message}`);
        }
        console.log(`🔔 Webhook received: ${event.type}`);
        switch (event.type) {
            case 'checkout.session.completed':
                const session = event.data.object;
                console.log(`💰 SUBSCRIPTION STARTED: ${session.metadata?.plan_type} for user ${session.metadata?.user_id}`);
                console.log(`🎉 Revenue: €${(session.amount_total || 0) / 100}`);
                break;
            case 'invoice.payment_succeeded':
                const invoice = event.data.object;
                console.log(`🔄 RECURRING PAYMENT: €${(invoice.amount_paid || 0) / 100}`);
                break;
            case 'customer.subscription.deleted':
                const subscription = event.data.object;
                console.log(`❌ SUBSCRIPTION CANCELLED: ${subscription.customer}`);
                break;
            default:
                console.log(`Unhandled event type ${event.type}`);
        }
        res.json({ received: true });
    }
    else {
        res.setHeader('Allow', 'POST');
        res.status(405).end('Method Not Allowed');
    }
}
exports.default = handler;
exports.config = {
    api: {
        bodyParser: {
            sizeLimit: '1mb',
        },
    },
};
//# sourceMappingURL=stripe.js.map