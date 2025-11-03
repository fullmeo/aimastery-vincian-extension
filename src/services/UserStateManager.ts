import * as vscode from 'vscode';

interface UserState {
  isCreatorMode: boolean;
  hasUnlimitedAccess: boolean;
  analysisCount: number;
  lastAnalysisDate?: string;
  analysisLimit: number;
  userPlan: 'free' | 'pro' | 'enterprise';
}

export class UserStateManager {
  private context: vscode.ExtensionContext;
  private defaultState: UserState = {
    isCreatorMode: false,
    hasUnlimitedAccess: false,
    analysisCount: 0,
    analysisLimit: 3, // Limite pour la version gratuite
    userPlan: 'free',
  };

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  private getState(): UserState {
    return this.context.globalState.get<UserState>('userState') || this.defaultState;
  }

  private async updateState(updates: Partial<UserState>): Promise<void> {
    const currentState = this.getState();
    const newState = { ...currentState, ...updates };
    await this.context.globalState.update('userState', newState);
  }

  public isCreatorMode(): boolean {
    return this.getState().isCreatorMode;
  }

  public setCreatorMode(enabled: boolean): void {
    this.updateState({ isCreatorMode: enabled });
  }

  public hasPremiumFeatures(): boolean {
    const state = this.getState();
    return state.isCreatorMode || state.userPlan !== 'free';
  }

  public canAnalyze(): boolean {
    const state = this.getState();
    return state.hasUnlimitedAccess || state.analysisCount < state.analysisLimit;
  }

  public incrementAnalysisCount(): void {
    const state = this.getState();
    this.updateState({ analysisCount: state.analysisCount + 1 });
  }

  public setUnlimitedAccess(enabled: boolean): void {
    this.updateState({ hasUnlimitedAccess: enabled });
  }

  public setAnalysisLimit(limit: number): void {
    this.updateState({ analysisLimit: limit });
  }

  public detectSeigneDiagne(): boolean {
    // Détection basique - à améliorer avec une vérification plus sécurisée
    const userName = process.env.USERNAME || process.env.USER || '';
    return userName.toLowerCase().includes('serigne') || userName.toLowerCase().includes('diagne');
  }

  public async upgradePlan(plan: 'pro' | 'enterprise'): Promise<boolean> {
    try {
      await this.updateState({
        userPlan: plan,
        analysisLimit: plan === 'pro' ? 50 : -1, // -1 pour illimité
        hasUnlimitedAccess: plan === 'enterprise',
      });
      return true;
    } catch (error) {
      console.error('Failed to upgrade plan:', error);
      return false;
    }
  }

  public getUsageStats() {
    const state = this.getState();
    return {
      analysisCount: state.analysisCount,
      analysisLimit: state.analysisLimit,
      remainingAnalyses: Math.max(0, state.analysisLimit - state.analysisCount),
      userPlan: state.userPlan,
      isUnlimited: state.hasUnlimitedAccess,
    };
  }
}
