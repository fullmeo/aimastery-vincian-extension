import * as vscode from 'vscode';

export interface RevenueEvent {
    id: string;
    timestamp: Date;
    amount: number;
    currency: string;
    userId: string;
    plan: 'free' | 'pro' | 'enterprise';
    status: 'completed' | 'pending' | 'failed';
    metadata?: Record<string, any>;
}

export class RevenueTracker {
    private context: vscode.ExtensionContext;
    private events: RevenueEvent[] = [];
    private static instance: RevenueTracker;

    private constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.loadEvents();
    }

    public static getInstance(context?: vscode.ExtensionContext): RevenueTracker {
        if (!RevenueTracker.instance && context) {
            RevenueTracker.instance = new RevenueTracker(context);
        }
        return RevenueTracker.instance;
    }

    private async loadEvents(): Promise<void> {
        const storedEvents = this.context.globalState.get<RevenueEvent[]>('revenueEvents') || [];
        this.events = storedEvents.map(event => ({
            ...event,
            timestamp: new Date(event.timestamp)
        }));
    }

    private async saveEvents(): Promise<void> {
        await this.context.globalState.update('revenueEvents', this.events);
    }

    public async trackRevenue(event: Omit<RevenueEvent, 'id' | 'timestamp'>): Promise<string> {
        const newEvent: RevenueEvent = {
            ...event,
            id: crypto.randomUUID(),
            timestamp: new Date()
        };

        this.events.push(newEvent);
        await this.saveEvents();

        // Mettre à jour les statistiques de l'utilisateur si c'est un achat
        if (event.status === 'completed' && event.plan !== 'free') {
            await vscode.commands.executeCommand('aimastery.updateUserPlan', event.plan);
        }

        return newEvent.id;
    }

    public getRevenueReport(options: {
        startDate?: Date;
        endDate?: Date;
        plan?: RevenueEvent['plan'];
        status?: RevenueEvent['status'];
    } = {}): RevenueReport {
        let filteredEvents = [...this.events];

        if (options.startDate) {
            filteredEvents = filteredEvents.filter(event => event.timestamp >= options.startDate!);
        }

        if (options.endDate) {
            filteredEvents = filteredEvents.filter(event => event.timestamp <= options.endDate!);
        }

        if (options.plan) {
            filteredEvents = filteredEvents.filter(event => event.plan === options.plan);
        }

        if (options.status) {
            filteredEvents = filteredEvents.filter(event => event.status === options.status);
        }

        const totalRevenue = filteredEvents.reduce((sum, event) => sum + event.amount, 0);
        const userCount = new Set(filteredEvents.map(e => e.userId)).size;

        return {
            totalRevenue,
            eventCount: filteredEvents.length,
            userCount,
            events: filteredEvents,
            startDate: options.startDate || new Date(Math.min(...filteredEvents.map(e => e.timestamp.getTime()))),
            endDate: options.endDate || new Date()
        };
    }

    public async getMonthlyRecurringRevenue(): Promise<number> {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const recentRevenue = this.getRevenueReport({
            startDate: thirtyDaysAgo,
            status: 'completed'
        });

        // Extrapoler le MRR basé sur les 30 derniers jours
        return (recentRevenue.totalRevenue / 30) * 30; // MRR = moyenne journalière * 30
    }

    public async getUserRevenue(userId: string): Promise<number> {
        const userEvents = this.events.filter(event => 
            event.userId === userId && event.status === 'completed'
        );
        return userEvents.reduce((sum, event) => sum + event.amount, 0);
    }

    public async getTopCustomers(limit: number = 10): Promise<Array<{userId: string, totalSpent: number}>> {
        const userSpending = new Map<string, number>();
        
        this.events
            .filter(event => event.status === 'completed')
            .forEach(event => {
                const current = userSpending.get(event.userId) || 0;
                userSpending.set(event.userId, current + event.amount);
            });

        return Array.from(userSpending.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([userId, totalSpent]) => ({ userId, totalSpent }));
    }
}

export interface RevenueReport {
    totalRevenue: number;
    eventCount: number;
    userCount: number;
    events: RevenueEvent[];
    startDate: Date;
    endDate: Date;
}
