// UX OPTIMIZATION COMPLÈTE - Extension VS Code
// À intégrer dans votre extension.ts existante

import * as vscode from 'vscode';

interface UserAction {
  action: string;
  data: any;
  timestamp: number;
}
import axios from 'axios';

// ===== 1. WELCOME EXPERIENCE OPTIMISÉE =====

class WelcomeExperienceManager {
  private context: vscode.ExtensionContext;
  private currentStep = 0;
  private totalSteps = 4;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  async showWelcomeFlow() {
    // Vérifier si c'est la première fois
    const isFirstTime = this.context.globalState.get('firstTime', true);

    if (isFirstTime) {
      await this.startWelcomeSequence();
      await this.context.globalState.update('firstTime', false);
      await this.context.globalState.update('installDate', new Date().toISOString());
    }
  }

  private async startWelcomeSequence() {
    const panel = vscode.window.createWebviewPanel(
      'aimasteryWelcome',
      '🎉 Welcome to AIMastery!',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
      }
    );

    panel.webview.html = this.getWelcomeHTML();

    // Handle user interactions
    panel.webview.onDidReceiveMessage(async message => {
      switch (message.command) {
        case 'nextStep':
          this.currentStep++;
          if (this.currentStep < this.totalSteps) {
            panel.webview.html = this.getWelcomeHTML();
          } else {
            await this.completeOnboarding();
            panel.dispose();
          }
          break;
        case 'startDemo':
          await this.startGuidedDemo();
          panel.dispose();
          break;
        case 'upgradePremium':
          await this.showOfferStep('welcome');
          break;
        case 'skipOnboarding':
          await this.trackEvent('onboarding_skipped');
          panel.dispose();
          break;
      }
    });
  }

  private getWelcomeHTML(): string {
    const steps = [
      {
        title: '🎵 Transformez votre Audio en Content Viral',
        subtitle: 'La première extension qui combine IA + Analyse Cymatique + Réseaux Sociaux',
        content: `
          <div class="feature-grid">
            <div class="feature-card">
              <div class="feature-icon">🧠</div>
              <h4>IA Vincienne</h4>
              <p>Algorithmes inspirés de Léonard de Vinci pour analyser vos fréquences</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">📱</div>
              <h4>Social Media Pack</h4>
              <p>Contenus automatiques pour Instagram, LinkedIn, TikTok, YouTube</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">⚡</div>
              <h4>1-Click Generation</h4>
              <p>De l'audio au viral en 30 secondes chrono</p>
            </div>
          </div>
        `,
        cta: 'Découvrir les fonctionnalités →',
      },
      {
        title: '🎯 Comment ça marche ?',
        subtitle: '3 étapes pour révolutionner votre contenu',
        content: `
          <div class="steps-container">
            <div class="step-item">
              <div class="step-number">1</div>
              <div class="step-content">
                <h4>📁 Sélectionnez votre fichier audio</h4>
                <p>MP3, WAV, M4A... Tous formats supportés</p>
              </div>
            </div>
            <div class="step-arrow">↓</div>
            <div class="step-item">
              <div class="step-number">2</div>
              <div class="step-content">
                <h4>🔬 Analyse Cymatique Instantanée</h4>
                <p>Score Vincien, harmoniques, patterns uniques</p>
              </div>
            </div>
            <div class="step-arrow">↓</div>
            <div class="step-item">
              <div class="step-number">3</div>
              <div class="step-content">
                <h4>🚀 Génération Contenus Viraux</h4>
                <p>Posts, Stories, Scripts optimisés par plateforme</p>
              </div>
            </div>
          </div>
        `,
        cta: 'Essayer maintenant →',
      },
      {
        title: '💎 Pourquoi AIMastery est Unique ?',
        subtitle: 'La révolution que vous attendiez',
        content: `
          <div class="comparison-container">
            <div class="before-after">
              <div class="before">
                <h4>❌ Avant AIMastery</h4>
                <ul>
                  <li>Contenus génériques sans âme</li>
                  <li>Heures perdues en création manuelle</li>
                  <li>Aucune science derrière vos posts</li>
                  <li>Engagement faible et imprévisible</li>
                </ul>
              </div>
              <div class="after">
                <h4>✅ Avec AIMastery</h4>
                <ul>
                  <li>Contenus uniques basés sur VOTRE audio</li>
                  <li>Génération en 30 secondes</li>
                  <li>Science cymatique + principes de da Vinci</li>
                  <li>Engagement prédit et optimisé</li>
                </ul>
              </div>
            </div>
          </div>
        `,
        cta: 'Voir la démonstration →',
      },
      {
        title: '🎁 Offre de Lancement Exclusive !',
        subtitle: 'Seulement pour les 50 premiers utilisateurs',
        content: `
          <div class="offer-container">
            <div class="offer-badge">🔥 LANCEMENT SPÉCIAL</div>
            
            <div class="pricing-comparison">
              <div class="price-old">
                <span class="crossed">15€/mois</span>
                <small>Prix normal</small>
              </div>
              <div class="price-arrow">→</div>
              <div class="price-new">
                <span class="highlighted">9€/mois</span>
                <small>À VIE pour vous !</small>
              </div>
            </div>
            
            <div class="offer-features">
              <div class="feature">✨ 50 Social Packs/mois</div>
              <div class="feature">🎨 Templates HD sans watermark</div>
              <div class="feature">📊 Analytics avancées</div>
              <div class="feature">⚡ Support prioritaire</div>
              <div class="feature">🎁 7 jours d'essai gratuit</div>
            </div>
            
            <div class="urgency">
              ⏰ <strong>Offre limitée :</strong> <span id="remaining">27</span> places restantes
            </div>
          </div>
        `,
        cta: 'Réserver ma place (9€/mois à vie) →',
      },
    ];

    const currentStepData = steps[this.currentStep];

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>AIMastery Welcome</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 0;
                margin: 0;
                min-height: 100vh;
                overflow-x: hidden;
            }
            
            .welcome-container {
                max-width: 800px;
                margin: 0 auto;
                padding: 40px 20px;
                text-align: center;
                position: relative;
            }
            
            .progress-bar {
                width: 100%;
                height: 4px;
                background: rgba(255,255,255,0.2);
                border-radius: 2px;
                margin-bottom: 40px;
                overflow: hidden;
            }
            
            .progress-fill {
                height: 100%;
                background: linear-gradient(90deg, #ffd700, #ff6b35);
                width: ${((this.currentStep + 1) / this.totalSteps) * 100}%;
                transition: width 0.5s ease;
            }
            
            .main-content {
                background: rgba(255,255,255,0.1);
                backdrop-filter: blur(20px);
                border-radius: 20px;
                padding: 50px 40px;
                margin-bottom: 30px;
                border: 1px solid rgba(255,255,255,0.2);
                box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            }
            
            .step-indicator {
                font-size: 0.9rem;
                opacity: 0.8;
                margin-bottom: 20px;
            }
            
            h1 {
                font-size: 2.5rem;
                margin-bottom: 15px;
                background: linear-gradient(45deg, #ffd700, #ff6b35);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                font-weight: 700;
            }
            
            .subtitle {
                font-size: 1.2rem;
                opacity: 0.9;
                margin-bottom: 40px;
                line-height: 1.5;
            }
            
            .feature-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
                gap: 25px;
                margin: 40px 0;
            }
            
            .feature-card {
                background: rgba(255,255,255,0.1);
                padding: 25px;
                border-radius: 15px;
                text-align: center;
                border: 1px solid rgba(255,255,255,0.1);
                transition: transform 0.3s ease;
            }
            
            .feature-card:hover {
                transform: translateY(-5px);
                background: rgba(255,255,255,0.15);
            }
            
            .feature-icon {
                font-size: 3rem;
                margin-bottom: 15px;
            }
            
            .feature-card h4 {
                margin-bottom: 10px;
                color: #ffd700;
            }
            
            .steps-container {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 20px;
                margin: 40px 0;
            }
            
            .step-item {
                display: flex;
                align-items: center;
                gap: 20px;
                background: rgba(255,255,255,0.1);
                padding: 20px 30px;
                border-radius: 15px;
                width: 100%;
                max-width: 500px;
            }
            
            .step-number {
                background: linear-gradient(45deg, #ffd700, #ff6b35);
                color: #333;
                width: 40px;
                height: 40px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                font-size: 1.2rem;
                flex-shrink: 0;
            }
            
            .step-content h4 {
                margin-bottom: 5px;
                color: #ffd700;
            }
            
            .step-arrow {
                font-size: 1.5rem;
                color: #ffd700;
            }
            
            .comparison-container {
                margin: 40px 0;
            }
            
            .before-after {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 30px;
                margin-top: 30px;
            }
            
            .before, .after {
                background: rgba(255,255,255,0.1);
                padding: 25px;
                border-radius: 15px;
            }
            
            .before h4 {
                color: #ff6b6b;
                margin-bottom: 15px;
            }
            
            .after h4 {
                color: #4ecdc4;
                margin-bottom: 15px;
            }
            
            .before ul, .after ul {
                list-style: none;
                text-align: left;
            }
            
            .before li, .after li {
                padding: 5px 0;
                opacity: 0.9;
            }
            
            .offer-container {
                text-align: center;
                margin: 40px 0;
            }
            
            .offer-badge {
                background: linear-gradient(45deg, #ff6b35, #ffd700);
                color: #333;
                padding: 8px 20px;
                border-radius: 20px;
                font-weight: bold;
                display: inline-block;
                margin-bottom: 30px;
                animation: pulse 2s infinite;
            }
            
            @keyframes pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.05); }
            }
            
            .pricing-comparison {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 20px;
                margin: 30px 0;
            }
            
            .price-old span.crossed {
                text-decoration: line-through;
                color: #ff6b6b;
                font-size: 1.5rem;
            }
            
            .price-new span.highlighted {
                color: #4ecdc4;
                font-size: 2.5rem;
                font-weight: bold;
            }
            
            .price-arrow {
                font-size: 2rem;
                color: #ffd700;
            }
            
            .offer-features {
                background: rgba(255,255,255,0.1);
                padding: 25px;
                border-radius: 15px;
                margin: 30px 0;
            }
            
            .feature {
                padding: 8px 0;
                font-size: 1.1rem;
            }
            
            .urgency {
                background: rgba(255,107,53,0.2);
                padding: 15px;
                border-radius: 10px;
                border: 1px solid #ff6b35;
                margin-top: 20px;
            }
            
            .buttons-container {
                display: flex;
                gap: 20px;
                justify-content: center;
                flex-wrap: wrap;
                margin-top: 40px;
            }
            
            .cta-button {
                background: linear-gradient(45deg, #ffd700, #ff6b35);
                color: #333;
                border: none;
                padding: 15px 30px;
                border-radius: 25px;
                font-size: 1.1rem;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.3s ease;
                min-width: 200px;
            }
            
            .cta-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 10px 20px rgba(255,215,0,0.3);
            }
            
            .secondary-button {
                background: transparent;
                color: white;
                border: 2px solid rgba(255,255,255,0.5);
                padding: 13px 28px;
                border-radius: 25px;
                font-size: 1rem;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            
            .secondary-button:hover {
                background: rgba(255,255,255,0.1);
                border-color: white;
            }
            
            .skip-link {
                margin-top: 20px;
                opacity: 0.7;
                font-size: 0.9rem;
            }
            
            .skip-link a {
                color: white;
                text-decoration: underline;
                cursor: pointer;
            }
            
            @media (max-width: 768px) {
                .welcome-container {
                    padding: 20px 15px;
                }
                
                .main-content {
                    padding: 30px 20px;
                }
                
                h1 {
                    font-size: 2rem;
                }
                
                .before-after {
                    grid-template-columns: 1fr;
                }
                
                .buttons-container {
                    flex-direction: column;
                    align-items: center;
                }
            }
        </style>
    </head>
    <body>
        <div class="welcome-container">
            <div class="progress-bar">
                <div class="progress-fill"></div>
            </div>
            
            <div class="main-content">
                <div class="step-indicator">Étape ${this.currentStep + 1} sur ${this.totalSteps}</div>
                
                <h1>${currentStepData.title}</h1>
                <div class="subtitle">${currentStepData.subtitle}</div>
                
                ${currentStepData.content}
                
                <div class="buttons-container">
                    ${
                      this.currentStep === this.totalSteps - 1
                        ? `
                        <button class="cta-button" onclick="upgradePremium()">
                            ${currentStepData.cta}
                        </button>
                        <button class="secondary-button" onclick="startDemo()">
                            🎁 Commencer l'essai gratuit
                        </button>
                    `
                        : `
                        <button class="cta-button" onclick="nextStep()">
                            ${currentStepData.cta}
                        </button>
                        ${
                          this.currentStep === 1
                            ? `
                            <button class="secondary-button" onclick="startDemo()">
                                🚀 Essayer tout de suite
                            </button>
                        `
                            : ''
                        }
                    `
                    }
                </div>
            </div>
            
            <div class="skip-link">
                <a onclick="skipOnboarding()">Passer l'introduction →</a>
            </div>
        </div>
        
        <script>
            const vscode = acquireVsCodeApi();
            
            function nextStep() {
                vscode.postMessage({ command: 'nextStep' });
            }
            
            function startDemo() {
                vscode.postMessage({ command: 'startDemo' });
            }
            
            function upgradePremium() {
                vscode.postMessage({ command: 'upgradePremium' });
            }
            
            function skipOnboarding() {
                vscode.postMessage({ command: 'skipOnboarding' });
            }
            
            // Animation du compteur de places restantes
            if (document.getElementById('remaining')) {
                let remaining = 27;
                setInterval(() => {
                    if (Math.random() < 0.1 && remaining > 15) {
                        remaining--;
                        document.getElementById('remaining').textContent = remaining;
                    }
                }, 30000); // Toutes les 30 secondes
            }
        </script>
    </body>
    </html>`;
  }

  private async startGuidedDemo() {
    // Ouvrir un fichier audio exemple ou guider vers l'analyse
    vscode.window
      .showInformationMessage(
        '🎯 Parfait ! Sélectionnez un fichier audio (MP3, WAV, M4A) et faites clic droit → "AIMastery: Analyze Audio"',
        'Ouvrir fichier exemple'
      )
      .then(choice => {
        if (choice) {
          // Vous pouvez ajouter un fichier exemple dans l'extension
          vscode.commands.executeCommand('vscode.open');
        }
      });

    await this.trackEvent('demo_started');
  }

  private async completeOnboarding() {
    await this.context.globalState.update('onboardingCompleted', true);
    await this.trackEvent('onboarding_completed');

    vscode.window.showInformationMessage(
      '🎉 Configuration terminée ! Vous êtes prêt à révolutionner vos contenus !',
      'Faire ma première analyse'
    );
  }

  private async trackEvent(event: string, data?: any) {
    // Intégration avec votre système analytics
    try {
      await axios.post('https://your-vercel-app.vercel.app/api/analytics/track', {
        event,
        data,
        userId: vscode.env.machineId,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      // Fail silently
    }
  }

  private async showOfferStep(context: string) {
    const upgradeManager = new PremiumUpgradeManager(this.context);
    await upgradeManager.showUpgradeFlow(context);
  }
}

// ===== 2. USER PROGRESSION TRACKING =====

class UserProgressionTracker {
  private context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  async trackUserAction(action: string, data?: any) {
    const progress = this.context.globalState.get('userProgress', {
      firstInstall: Date.now(),
      actionsCompleted: [],
      currentTier: 'free',
      conversionScore: 0,
      totalAnalyses: 0,
      totalSocialPacks: 0,
      highScoreAnalyses: 0,
    });

    // Ajouter l'action
    (progress.actionsCompleted as UserAction[]).push({
      action,
      data,
      timestamp: Date.now(),
    });

    // Mettre à jour les compteurs
    if (action === 'audio_analyzed') {
      progress.totalAnalyses++;
      if (data?.vincianScore > 80) {
        progress.highScoreAnalyses++;
      }
    }

    if (action === 'social_pack_generated') {
      progress.totalSocialPacks++;
    }

    // Calculer le score de conversion
    progress.conversionScore = this.calculateConversionScore(progress);

    // Trigger upgrade prompts basés sur le comportement
    await this.checkForUpgradeOpportunities(progress);

    await this.context.globalState.update('userProgress', progress);
  }

  private calculateConversionScore(progress: any): number {
    let score = 0;

    // Points pour actions
    (progress.actionsCompleted as UserAction[]).forEach((item: UserAction) => {
      const actionPoints: { [key: string]: number } = {
        audio_analyzed: 10,
        social_pack_viewed: 5,
        content_copied: 15,
        premium_feature_attempted: 20,
        shared_content: 25,
        high_score_achieved: 30,
      };
      score += actionPoints[item.action] || 0;
    });

    // Bonus pour usage régulier
    const daysSinceInstall = (Date.now() - progress.firstInstall) / (1000 * 60 * 60 * 24);
    const usageFrequency = progress.actionsCompleted.length / Math.max(daysSinceInstall, 1);

    if (usageFrequency > 2) score += 20; // Usage quotidien
    if (progress.highScoreAnalyses > 2) score += 25; // Talent détecté
    if (progress.totalSocialPacks > 5) score += 30; // User engagé

    return Math.min(score, 100);
  }

  private async checkForUpgradeOpportunities(progress: any) {
    const { conversionScore, currentTier, totalAnalyses, highScoreAnalyses } = progress;

    if (currentTier !== 'free') return;

    // Trigger basé sur engagement élevé
    if (conversionScore > 70 && totalAnalyses > 3) {
      await this.triggerUpgradePrompt('high-engagement');
    }

    // Trigger basé sur talent détecté
    if (highScoreAnalyses > 2) {
      await this.triggerUpgradePrompt('talent-detected');
    }

    // Trigger basé sur usage fréquent
    if (totalAnalyses > 10) {
      await this.triggerUpgradePrompt('power-user');
    }
  }

  private async triggerUpgradePrompt(context: string) {
    const lastPrompt = this.context.globalState.get('lastUpgradePrompt', 0);
    const now = Date.now();

    // Ne pas spammer - minimum 24h entre prompts
    if (now - lastPrompt < 24 * 60 * 60 * 1000) return;

    await this.context.globalState.update('lastUpgradePrompt', now);

    const messageTypes: { [key: string]: any } = {
      'high-engagement': {
        title: 'High Engagement!',
        description: 'You are using this a lot!',
        urgency: 'Limited time offer',
      },
      'talent-detected': {
        title: 'Talent Detected!',
        description: 'You have natural ability!',
        urgency: 'Exclusive access',
      },
      'power-user': {
        title: 'Power User!',
        description: 'You are a professional!',
        urgency: 'Professional discount',
      },
    };
    const message = messageTypes[context] || messageTypes['high-engagement'];

    const choice = await vscode.window.showInformationMessage(
      message.title,
      {
        detail: `${message.description}\n\n${message.urgency}`,
        modal: true,
      },
      '💎 Débloquer Premium (9€/mois)',
      '🎁 Essai gratuit 7 jours',
      'Plus tard'
    );

    if (choice?.includes('Premium') || choice?.includes('Essai')) {
      await this.showPremiumUpgrade(context);
    }
  }

  private async showPremiumUpgrade(context: string) {
    // Analytics
    await this.trackEvent('upgrade_prompt_shown', { context });

    // Ouvrir checkout optimisé
    const upgradeManager = new PremiumUpgradeManager(this.context);
    await upgradeManager.showUpgradeFlow(context);
  }

  private async trackEvent(event: string, data?: any) {
    try {
      await axios.post('https://your-vercel-app.vercel.app/api/analytics/track', {
        event,
        data,
        userId: vscode.env.machineId,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      // Fail silently
    }
  }
}

// ===== 3. PREMIUM UPGRADE MANAGER =====

class PremiumUpgradeManager {
  private context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  async showUpgradeFlow(context: string) {
    const panel = vscode.window.createWebviewPanel(
      'aimasteryUpgrade',
      '💎 AIMastery Premium',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
      }
    );

    panel.webview.html = this.getUpgradeHTML(context);

    panel.webview.onDidReceiveMessage(async message => {
      switch (message.command) {
        case 'upgradePremium':
          await this.processUpgrade(message.plan);
          break;
        case 'startTrial':
          await this.startFreeTrial();
          break;
        case 'compareFeatures':
          panel.webview.html = this.getUpgradeHTML(context);
          break;
        case 'trackEvent':
          await this.trackEvent(message.event, message.data);
          break;
      }
    });
  }

  private getUpgradeHTML(context: string): string {
    const contextMessages: { [key: string]: any } = {
      'high-engagement': { badge: '🔥', title: 'High Engagement!', subtitle: 'You are active!' },
      'talent-detected': { badge: '⭐', title: 'Talent Detected!', subtitle: 'Natural ability!' },
      'power-user': { badge: '💎', title: 'Power User!', subtitle: 'Professional level!' },
      welcome: { badge: '🎉', title: 'Welcome!', subtitle: "Let's get started!" },
    };

    const message = contextMessages[context] || contextMessages['welcome'];

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {
                font-family: -apple-system, sans-serif;
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f172a 100%);
                color: white;
                margin: 0;
                padding: 20px;
                min-height: 100vh;
            }
            
            .upgrade-container {
                max-width: 900px;
                margin: 0 auto;
                text-align: center;
            }
            
            .hero-badge {
                background: linear-gradient(45deg, #ffd700, #ff6b35);
                color: #333;
                padding: 10px 25px;
                border-radius: 25px;
                font-weight: bold;
                display: inline-block;
                margin-bottom: 30px;
                animation: pulse 2s infinite;
            }
            
            h1 {
                font-size: 3rem;
                margin-bottom: 15px;
                background: linear-gradient(45deg, #ffd700, #ff6b35);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
            }
            
            .subtitle {
                font-size: 1.3rem;
                opacity: 0.9;
                margin-bottom: 50px;
            }
            
            .pricing-cards {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 30px;
                margin: 50px 0;
            }
            
            .pricing-card {
                background: rgba(255,255,255,0.05);
                border-radius: 20px;
                padding: 40px 30px;
                border: 1px solid rgba(255,255,255,0.1);
                backdrop-filter: blur(20px);
                position: relative;
                transition: all 0.3s ease;
            }
            
            .pricing-card:hover {
                transform: translateY(-10px);
                border-color: rgba(255,215,0,0.5);
                box-shadow: 0 20px 40px rgba(255,215,0,0.1);
            }
            
            .pricing-card.recommended {
                border-color: #ffd700;
                background: rgba(255,215,0,0.1);
                transform: scale(1.05);
            }
            
            .plan-badge {
                position: absolute;
                top: -10px;
                left: 50%;
                transform: translateX(-50%);
                background: linear-gradient(45deg, #ff6b35, #ffd700);
                color: #333;
                padding: 5px 20px;
                border-radius: 15px;
                font-size: 0.9rem;
                font-weight: bold;
            }
            
            .plan-name {
                font-size: 1.5rem;
                margin-bottom: 10px;
                color: #ffd700;
            }
            
            .plan-price {
                font-size: 3rem;
                font-weight: bold;
                margin-bottom: 5px;
            }
            
            .plan-period {
                opacity: 0.7;
                margin-bottom: 30px;
            }
            
            .plan-features {
                list-style: none;
                text-align: left;
                margin: 30px 0;
            }
            
            .plan-features li {
                padding: 8px 0;
                position: relative;
                padding-left: 25px;
            }
            
            .plan-features li::before {
                content: '✨';
                position: absolute;
                left: 0;
            }
            
            .upgrade-button {
                background: linear-gradient(45deg, #ffd700, #ff6b35);
                color: #333;
                border: none;
                padding: 15px 30px;
                border-radius: 25px;
                font-size: 1.1rem;
                font-weight: bold;
                cursor: pointer;
                width: 100%;
                margin-top: 20px;
                transition: all 0.3s ease;
            }
            
            .upgrade-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 10px 20px rgba(255,215,0,0.3);
            }
            
            .trial-button {
                background: transparent;
                color: white;
                border: 2px solid rgba(255,255,255,0.5);
                padding: 12px 25px;
                border-radius: 25px;
                cursor: pointer;
                width: 100%;
                margin-top: 10px;
                transition: all 0.3s ease;
            }
            
            .trial-button:hover {
                background: rgba(255,255,255,0.1);
                border-color: white;
            }
            
            .guarantee {
                background: rgba(40, 167, 69, 0.2);
                border: 1px solid #28a745;
                padding: 20px;
                border-radius: 15px;
                margin: 40px 0;
            }
            
            .testimonials {
                margin: 50px 0;
            }
            
            .testimonial {
                background: rgba(255,255,255,0.05);
                padding: 25px;
                border-radius: 15px;
                margin: 20px 0;
                border-left: 4px solid #ffd700;
            }
            
            @keyframes pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.05); }
            }
        </style>
    </head>
    <body>
        <div class="upgrade-container">
            <div class="hero-badge">${message.badge}</div>
            <h1>${message.title}</h1>
            <div class="subtitle">${message.subtitle}</div>
            
            <div class="pricing-cards">
                <div class="pricing-card">
                    <div class="plan-name">Créateur</div>
                    <div class="plan-price">9€</div>
                    <div class="plan-period">par mois (à vie pour vous !)</div>
                    
                    <ul class="plan-features">
                        <li>50 Social Media Packs / mois</li>
                        <li>Templates HD sans watermark</li>
                        <li>Analytics de base</li>
                        <li>Support par email</li>
                        <li>Accès mobile</li>
                    </ul>
                    
                    <button class="upgrade-button" onclick="upgradePremium('monthly_9')">
                        Commencer maintenant
                    </button>
                    <button class="trial-button" onclick="startTrial()">
                        🎁 Essai gratuit 7 jours
                    </button>
                </div>
                
                <div class="pricing-card recommended">
                    <div class="plan-badge">RECOMMANDÉ</div>
                    <div class="plan-name">Pro Vincien</div>
                    <div class="plan-price">15€</div>
                    <div class="plan-period">par mois</div>
                    
                    <ul class="plan-features">
                        <li>Social Media Packs ILLIMITÉS</li>
                        <li>Templates premium exclusifs</li>
                        <li>Analytics avancées + prédictions</li>
                        <li>Support prioritaire + chat</li>
                        <li>Accès bêta nouvelles features</li>
                        <li>Export 4K et formats pro</li>
                        <li>Intégrations API</li>
                    </ul>
                    
                    <button class="upgrade-button" onclick="upgradePremium('monthly_15')">
                        Devenir Pro Vincien
                    </button>
                    <button class="trial-button" onclick="startTrial()">
                        🎁 Essai gratuit 14 jours
                    </button>
                </div>
            </div>
            
            <div class="guarantee">
                <h3>🛡️ Garantie 30 jours satisfait ou remboursé</h3>
                <p>Testez AIMastery Premium sans risque. Si vous n'êtes pas 100% satisfait, nous vous remboursons intégralement.</p>
            </div>
            
            <div class="testimonials">
                <h3>🗣️ Ce que disent nos utilisateurs Premium :</h3>
                
                <div class="testimonial">
                    <p>"Mes posts Instagram ont 300% d'engagement en plus depuis que j'utilise les Social Packs AIMastery. L'analyse Vincienne révèle des patterns que je n'aurais jamais vus !"</p>
                    <strong>- Sarah M., Music Producer</strong>
                </div>
                
                <div class="testimonial">
                    <p>"En tant que créateur de contenu, AIMastery Premium m'a fait économiser 10h/semaine. Les templates sont parfaits et l'IA comprend vraiment ma musique."</p>
                    <strong>- Thomas L., YouTubeur (2M abonnés)</strong>
                </div>
            </div>
        </div>
        
        <script>
            const vscode = acquireVsCodeApi();
            
            function upgradePremium(plan) {
                vscode.postMessage({ 
                    command: 'upgradePremium', 
                    plan: plan 
                });
                
                // Track click
                vscode.postMessage({
                    command: 'trackEvent',
                    event: 'upgrade_clicked',
                    data: { plan, context: '${context}' }
                });
            }
            
            function startTrial() {
                vscode.postMessage({ command: 'startTrial' });
                
                // Track click
                vscode.postMessage({
                    command: 'trackEvent',
                    event: 'trial_clicked',
                    data: { context: '${context}' }
                });
            }
        </script>
    </body>
    </html>`;
  }

  private async processUpgrade(plan: string) {
    try {
      await this.trackEvent('upgrade_initiated', { plan });

      // Appel API pour créer session Stripe
      const response = await axios.post('https://your-vercel-app.vercel.app/api/create-checkout', {
        priceId: plan === 'monthly_9' ? 'price_social_pack_monthly' : 'price_pro_monthly',
        userId: vscode.env.machineId,
        successUrl: 'https://your-app.vercel.app/success',
        cancelUrl: 'https://your-app.vercel.app/cancel',
        metadata: {
          source: 'vscode_extension',
          plan: plan,
        },
      });

      // Ouvrir Stripe Checkout
      await vscode.env.openExternal(vscode.Uri.parse(response.data.url));

      vscode.window.showInformationMessage('💳 Redirection vers le paiement sécurisé...', 'OK');
    } catch (error) {
      vscode.window.showErrorMessage(
        `Erreur: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private async startFreeTrial() {
    try {
      await this.trackEvent('trial_started');

      // Activer essai gratuit local
      await this.context.globalState.update('trialStatus', {
        active: true,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        tier: 'premium',
      });

      vscode.window.showInformationMessage(
        '🎉 Essai gratuit activé ! Profitez de toutes les fonctionnalités premium pendant 7 jours.',
        'Génerer mon premier Social Pack Premium'
      );
    } catch (error) {
      vscode.window.showErrorMessage(
        `Erreur: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private async trackEvent(event: string, data?: any) {
    try {
      await axios.post('https://your-vercel-app.vercel.app/api/analytics/track', {
        event,
        data,
        userId: vscode.env.machineId,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      // Fail silently
    }
  }
}

// ===== 4. INTÉGRATION DANS L'EXTENSION PRINCIPALE =====

export function activateUXOptimization(context: vscode.ExtensionContext): {
  progressTracker: { trackUserAction: (action: string, data: any) => Promise<void> };
} {
  const progressTracker = {
    async trackUserAction(action: string, data: any) {
      console.log(`🎯 User Action: ${action}`, data);

      // Analytics simple et robuste
      const progress = context.globalState.get('userProgress', {
        totalActions: 0,
        firstUse: Date.now(),
        lastAction: Date.now(),
      });

      progress.totalActions++;
      progress.lastAction = Date.now();
      await context.globalState.update('userProgress', progress);

      // Welcome message après première analyse
      if (action === 'audio_analyzed' && progress.totalActions === 1) {
        setTimeout(() => {
          vscode.window
            .showInformationMessage(
              '🎉 Félicitations ! Première analyse Da Vinci réussie ! Découvrez les fonctionnalités premium.',
              'Voir Social Pack',
              'Continuer'
            )
            .then(selection => {
              if (selection === 'Voir Social Pack') {
                vscode.commands.executeCommand('aimastery.generateSocialPack');
              }
            });
        }, 2000);
      }

      // Power user detection (après 5 analyses)
      if (action === 'audio_analyzed' && progress.totalActions >= 5) {
        setTimeout(() => {
          vscode.window
            .showInformationMessage(
              '🔥 Expert détecté ! Vous maîtrisez AIMastery ! Débloquez le Social Media Pack automatique.',
              '💎 Upgrade Premium',
              'Plus tard'
            )
            .then(selection => {
              if (selection === '💎 Upgrade Premium') {
                // Handle premium upgrade
                vscode.commands.executeCommand('aimastery.showPremiumUpgrade');
              }
            });
        }, 2000);
      }
    },
  };

  return { progressTracker };
}
