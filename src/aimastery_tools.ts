import * as vscode from 'vscode';
import { VincianAnalyzer } from './services/VincianAnalyzer';
import { VincianAnalysisProvider, VincianAutocodingProvider } from './providers/TreeViewProvider';
import { VincianWebviewProvider } from './providers/WebviewProvider';

// Définition de l'interface pour l'application
export interface AIMasteryIntegratedApp {
  initialize(context: vscode.ExtensionContext): void;
  dispose(): void;
  analyzeCurrentFile(): Promise<void>;
  analyzeProject(): Promise<void>;
  getFileAnalyzer(): any; // Remplacez 'any' par le type approprié
  getWebviewManager(): any; // Remplacez 'any' par le type approprié
  generateVincianCode(): Promise<void>;
  showDashboard(): void;
  createNewProject(): Promise<void>;
  getProjectManager(): any; // Remplacez 'any' par le type approprié
  exportAnalysisResults(): Promise<void>;
}

// Classe principale de l'application
export class AIMasteryApp implements AIMasteryIntegratedApp {
  private analyzer: VincianAnalyzer;
  private analysisProvider: VincianAnalysisProvider;
  private webviewProvider: VincianWebviewProvider;
  private context: vscode.ExtensionContext | null = null;

  constructor(private readonly extensionUri: vscode.Uri) {
    this.analyzer = new VincianAnalyzer();
    this.analysisProvider = new VincianAnalysisProvider(); // Pas d'arguments requis
    this.webviewProvider = new VincianWebviewProvider(extensionUri);
  }

  async analyzeCurrentFile(): Promise<void> {
    // Implémentation de base - à compléter selon les besoins
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showInformationMessage('Aucun éditeur actif');
      return;
    }
    const document = editor.document;
    const text = document.getText();
    // Analyse du fichier avec l'analyseur
    await this.analyzer.analyzeCode(text, document.languageId);
  }

  async analyzeProject(): Promise<void> {
    // Implémentation de base - à compléter selon les besoins
    vscode.window.showInformationMessage('Analyse du projet en cours...');
  }

  getFileAnalyzer(): any {
    return this.analyzer;
  }

  getWebviewManager(): any {
    return this.webviewProvider;
  }

  async generateVincianCode(): Promise<void> {
    // Implémentation de base - à compléter selon les besoins
    vscode.window.showInformationMessage('Génération du code Vincian en cours...');
  }

  showDashboard(): void {
    // Implémentation de base - à compléter selon les besoins
    vscode.commands.executeCommand('vincian.showDashboard');
  }

  async createNewProject(): Promise<void> {
    // Implémentation de base - à compléter selon les besoins
    vscode.window.showInformationMessage("Création d'un nouveau projet...");
  }

  getProjectManager(): any {
    // Retourne le gestionnaire de projet s'il existe
    return null; // À implémenter
  }

  async exportAnalysisResults(): Promise<void> {
    // Implémentation de base - à compléter selon les besoins
    vscode.window.showInformationMessage("Exportation des résultats d'analyse...");
  }

  initialize(context: vscode.ExtensionContext): void {
    // Initialisation des fournisseurs de vues
    this.webviewProvider = new VincianWebviewProvider(context.extensionUri);

    // Enregistrement des commandes
    const disposable = vscode.commands.registerCommand('aimastery.analyze', () => {
      vscode.window.showInformationMessage('Analyse démarrée avec AIMastery!');
    });

    context.subscriptions.push(disposable);
  }

  dispose(): void {
    // Nettoyage des ressources
    this.analyzer.dispose();
  }
}

// Instance globale de l'application
let app: AIMasteryApp;

// Méthode d'activation de l'extension
export function activate(context: vscode.ExtensionContext) {
  // Création de l'instance de l'application
  const extensionUri = context.extensionUri;
  app = new AIMasteryApp(extensionUri);
  app.initialize(context);

  // Enregistrement des fournisseurs de vues
  vscode.window.registerTreeDataProvider('vincianAnalysis', new VincianAnalysisProvider());

  // Enregistrement des commandes
  context.subscriptions.push(
    vscode.commands.registerCommand('aimastery.refresh', () => {
      vscode.window.showInformationMessage('Rafraîchissement des analyses...');
    })
  );

  console.log('Extension AIMastery est maintenant active!');
}
