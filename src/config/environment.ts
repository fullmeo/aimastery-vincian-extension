import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import * as vscode from 'vscode';

// Charger les variables d'environnement depuis le fichier .env
const envPath = path.join(__dirname, '..', '..', '.env');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    console.log('Variables d\'environnement chargées avec succès');
} else {
    console.warn('Avertissement: Fichier .env introuvable. Les variables d\'environnement ne sont pas chargées.');
}

// Vérification des variables d'environnement requises
const requiredEnvVars = ['OPENAI_API_KEY'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
    console.error(`Erreur: Les variables d'environnement suivantes sont manquantes: ${missingVars.join(', ')}`);
    vscode.window.showWarningMessage(
        `Certaines variables d'environnement sont manquantes: ${missingVars.join(', ')}. ` +
        'Certaines fonctionnalités pourraient ne pas fonctionner correctement.'
    );
}

// Configuration de l'API OpenAI
export const openAIConfig = {
    apiKey: process.env.OPENAI_API_KEY,
};

export const BACKEND_API_URL = 'https://aimastery-backend-ku8lgf82f-aimastery.vercel.app';
