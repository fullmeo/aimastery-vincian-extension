# 🐛 Guide de Débogage - Extension AIMastery V4

## 🚨 Problèmes Courants et Solutions

### 1. **Erreur "Cannot read file"**
```
❌ Erreur: Impossible de lire le fichier
```

**Causes possibles:**
- Format de fichier non supporté
- Fichier corrompu ou protégé
- Permissions insuffisantes

**Solutions:**
```bash
# Vérifier les permissions
ls -la your_audio_file.mp3

# Formats supportés uniquement
.mp3, .wav, .flac, .m4a, .aac
```

### 2. **Erreur API "Request failed"**
```
❌ Erreur API: Request failed with status code 500
```

**Solutions:**
1. **Vérifier la connexion internet**
2. **Tester l'API directement:**
```bash
curl -X POST https://your-app.vercel.app/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

3. **Vérifier les variables d'environnement Vercel:**
```bash
vercel env ls
# Doit contenir: OPENAI_API_KEY, STRIPE_SECRET_KEY
```

### 3. **Timeout lors de l'analyse**
```
❌ Timeout: L'analyse prend trop de temps
```

**Solutions:**
```typescript
// Dans extension.ts, augmenter le timeout:
const response = await axios.post(API_BASE_URL + '/analyze', {
    // ...data
}, {
    timeout: 60000, // 60 secondes au lieu de 30
});
```

### 4. **Erreur "Invalid JSON response"**

**Causes:**
- Réponse API malformée
- Erreur dans generateResultsHTML()

**Debug:**
```typescript
// Ajouter logging avant JSON.parse
console.log('Raw API response:', response.data);

// Vérifier la structure
if (!result.analysis || !result.content) {
    throw new Error('Réponse API invalide: données manquantes');
}
```

### 5. **WebView ne s'affiche pas**

**Solutions:**
```typescript
// Vérifier enableScripts dans createWebviewPanel
const panel = vscode.window.createWebviewPanel(
    'aimasteryResults',
    'Results',
    vscode.ViewColumn.One,
    { 
        enableScripts: true,  // ✅ Obligatoire pour JS
        retainContextWhenHidden: true
    }
);
```

## 🔧 Outils de Débogage

### 1. **Logging avancé**
```typescript
// Ajouter dans extension.ts
const outputChannel = vscode.window.createOutputChannel('AIMastery Debug');

function debugLog(message: string, data?: any) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    
    console.log(logMessage, data);
    outputChannel.appendLine(logMessage);
    
    if (data) {
        outputChannel.appendLine(JSON.stringify(data, null, 2));
    }
}

// Usage
debugLog('🔍 Starting analysis', { fileName, fileSize });
```

### 2. **Test de l'API séparément**
```bash
# Créer un fichier test-api.js
const axios = require('axios');

async function testAPI() {
    try {
        const response = await axios.post('https://your-app.vercel.app/api/analyze', {
            audioData: 'dGVzdA==', // "test" en base64
            analysisType: 'social_pack',
            userId: 'test-user',
            tier: 'free'
        });
        
        console.log('✅ API Response:', response.data);
    } catch (error) {
        console.error('❌ API Error:', error.response?.data || error.message);
    }
}

testAPI();
```

### 3. **Validation des fichiers audio**
```typescript
function validateAudioFile(uri: vscode.Uri): boolean {
    const fileExtension = path.extname(uri.fsPath).toLowerCase();
    const supportedExtensions = ['.mp3', '.wav', '.flac', '.m4a', '.aac'];
    
    if (!supportedExtensions.includes(fileExtension)) {
        debugLog(`❌ Unsupported format: ${fileExtension}`);
        return false;
    }
    
    // Vérifier si le fichier existe
    try {
        const stats = fs.statSync(uri.fsPath);
        if (!stats.isFile()) {
            debugLog(`❌ Not a file: ${uri.fsPath}`);
            return false;
        }
        
        // Vérifier la taille (max 10MB)
        if (stats.size > 10 * 1024 * 1024) {
            debugLog(`❌ File too large: ${stats.size} bytes`);
            return false;
        }
        
        debugLog(`✅ File validated: ${uri.fsPath}, size: ${stats.size}`);
        return true;
        
    } catch (error) {
        debugLog(`❌ File access error: ${error.message}`);
        return false;
    }
}
```

## 🧪 Tests Unitaires

Créer `src/test/extension.test.ts`:
```typescript
import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';

suite('AIMastery Extension Tests', () => {
    test('Extension should be present', () => {
        assert.ok(vscode.extensions.getExtension('aimastery.cymatic-analyzer'));
    });

    test('Commands should be registered', async () => {
        const commands = await vscode.commands.getCommands(true);
        assert.ok(commands.includes('aimastery.analyzeAudio'));
        assert.ok(commands.includes('aimastery.openSettings'));
    });

    test('Audio file validation', () => {
        // Mock URI pour fichier MP3
        const mockUri = vscode.Uri.file('/test/audio.mp3');
        // Test de validation...
    });
});
```

## 🔬 Debug Configuration

Créer `.vscode/launch.json`:
```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Run Extension",
            "type": "extensionHost",
            "request": "launch",
            "args": [
                "--extensionDevelopmentPath=${workspaceFolder}"
            ],
            "outFiles": [
                "${workspaceFolder}/out/**/*.js"
            ],
            "preLaunchTask": "${workspaceFolder}/npm: watch"
        },
        {
            "name": "Extension Tests",
            "type": "extensionHost",
            "request": "launch",
            "args": [
                "--extensionDevelopmentPath=${workspaceFolder}",
                "--extensionTestsPath=${workspaceFolder}/out/test/suite/index"
            ],
            "outFiles": [
                "${workspaceFolder}/out/test/**/*.js"
            ],
            "preLaunchTask": "${workspaceFolder}/npm: watch"
        }
    ]
}
```

## 🚀 Déploiement et Debug

### 1. **Build local**
```bash
# Compiler TypeScript
npm run compile

# Ou en mode watch
npm run watch

# Package pour test
vsce package
```

### 2. **Test en environnement isolé**
```bash
# Ouvrir nouvelle instance VS Code avec extension
code --extensionDevelopmentPath=./path/to/extension
```

### 3. **Logs de production**
```typescript
// Dans analyzeAudioCommand(), ajouter:
try {
    // ... logique d'analyse
} catch (error) {
    // Log détaillé en production
    const errorReport = {
        timestamp: new Date().toISOString(),
        error: error.message,
        stack: error.stack,
        userAgent: vscode.env.appName,
        platform: process.platform,
        version: context.extension?.packageJSON?.version
    };
    
    console.error('🚨 Production Error:', errorReport);
    
    // Optionnel: Envoyer à service de monitoring
    // await sendErrorReport(errorReport);
}
```

## 📊 Monitoring en Production

### 1. **Intégration Sentry (optionnel)**
```bash
npm install @sentry/node
```

```typescript
import * as Sentry from '@sentry/node';

// Dans activate()
Sentry.init({
    dsn: 'YOUR_SENTRY_DSN',
    environment: 'production'
});

// Wrapper pour les erreurs
function withErrorTracking<T extends any[], R>(
    fn: (...args: T) => Promise<R>
): (...args: T) => Promise<R> {
    return async (...args: T): Promise<R> => {
        try {
            return await fn(...args);
        } catch (error) {
            Sentry.captureException(error);
            throw error;
        }
    };
}

// Usage
const analyzeAudioCommandWithTracking = withErrorTracking(analyzeAudioCommand);
```

### 2. **Health Check de l'API**
```typescript
async function checkAPIHealth(): Promise<boolean> {
    try {
        const response = await axios.get(API_BASE_URL + '/health', {
            timeout: 5000
        });
        return response.status === 200;
    } catch (error) {
        debugLog('❌ API Health check failed', error.message);
        return false;
    }
}

// Utiliser au démarrage de l'extension
export async function activate(context: vscode.ExtensionContext) {
    debugLog('🚀 AIMastery V4 Extension activating...');
    
    // Vérifier l'API au démarrage
    const apiHealthy = await checkAPIHealth();
    if (!apiHealthy) {
        vscode.window.showWarningMessage(
            '⚠️ AIMastery API indisponible. Certaines fonctionnalités peuvent être limitées.',
            'Réessayer',
            'Voir le statut'
        ).then(choice => {
            if (choice === 'Réessayer') {
                vscode.commands.executeCommand('workbench.action.reloadWindow');
            } else if (choice === 'Voir le statut') {
                vscode.env.openExternal(vscode.Uri.parse('https://status.your-app.vercel.app'));
            }
        });
    }
    
    // ... rest of activation
}
```

## 🛠️ Débogage par Scénarios

### Scénario 1: "L'extension ne se charge pas"

**Checklist de debug:**
```bash
# 1. Vérifier la compilation
npm run compile
# Chercher les erreurs TypeScript

# 2. Vérifier package.json
# - activationEvents corrects ?
# - main pointe vers le bon fichier ?

# 3. Vérifier les logs VS Code
# Cmd+Shift+P > "Developer: Toggle Developer Tools"
# Onglet Console pour les erreurs
```

**Erreurs fréquentes:**
```typescript
// ❌ Import incorrect
import * as vscode from 'vscode';

// ✅ Import correct  
import * as vscode from 'vscode';

// ❌ Export manquant
function activate() {}

// ✅ Export correct
export function activate() {}
```

### Scénario 2: "L'analyse échoue toujours"

**Debug step-by-step:**
```typescript
async function debugAnalyzeAudio(uri: vscode.Uri) {
    debugLog('🔍 Debug Analysis Start', { uri: uri.fsPath });
    
    // Step 1: File validation
    if (!validateAudioFile(uri)) {
        debugLog('❌ File validation failed');
        return;
    }
    debugLog('✅ File validation passed');
    
    // Step 2: File reading
    let audioData: Uint8Array;
    try {
        audioData = await vscode.workspace.fs.readFile(uri);
        debugLog('✅ File read success', { size: audioData.length });
    } catch (error) {
        debugLog('❌ File read failed', error);
        return;
    }
    
    // Step 3: Base64 conversion
    const audioDataBase64 = Buffer.from(audioData).toString('base64');
    debugLog('✅ Base64 conversion', { length: audioDataBase64.length });
    
    // Step 4: API payload preparation
    const payload = {
        audioData: audioDataBase64,
        fileName: path.basename(uri.fsPath),
        fileSize: audioData.length,
        analysisType: 'social_pack',
        userId: await getUserId(),
        tier: await getUserTier()
    };
    debugLog('✅ Payload prepared', payload);
    
    // Step 5: API call
    try {
        const response = await axios.post(API_BASE_URL + '/analyze', payload, {
            timeout: 30000,
            headers: { 'Content-Type': 'application/json' }
        });
        debugLog('✅ API call success', { status: response.status });
        debugLog('📊 API response', response.data);
    } catch (error) {
        debugLog('❌ API call failed', {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data
        });
    }
}
```

### Scénario 3: "WebView s'affiche mal"

**Debug HTML/CSS:**
```typescript
function generateDebugHTML(): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { background: red; color: white; padding: 20px; }
            .test { border: 2px solid yellow; margin: 10px; padding: 10px; }
        </style>
    </head>
    <body>
        <h1>🧪 Debug WebView</h1>
        <div class="test">Test div 1</div>
        <div class="test">Test div 2</div>
        
        <script>
            console.log('🧪 WebView script loaded');
            
            window.addEventListener('message', event => {
                console.log('📨 Message received:', event.data);
            });
            
            // Test message
            setTimeout(() => {
                if (typeof acquireVsCodeApi !== 'undefined') {
                    const vscode = acquireVsCodeApi();
                    vscode.postMessage({ command: 'test', message: 'WebView working!' });
                } else {
                    console.error('❌ acquireVsCodeApi not available');
                }
            }, 1000);
        </script>
    </body>
    </html>
    `;
}
```

## 🔧 Outils de Debug Avancés

### 1. **Mock de l'API pour test local**
```typescript
// Créer api-mock.ts
export class APIMock {
    static async analyze(payload: any): Promise<any> {
        // Simuler délai API
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        return {
            analysis: {
                fundamentalFrequency: 440,
                musicalNote: 'A4',
                vincianScore: 85,
                harmonics: [
                    { frequency: 880, amplitude: 0.5 },
                    { frequency: 1320, amplitude: 0.33 }
                ]
            },
            content: {
                instagram: {
                    story: '🎵 Analyse terminée ! Score: 85/100 🔥',
                    post: 'Résultats fascinants de mon analyse cymatique :\n🎯 Note: A4\n📊 Score: 85/100\n⚡ Fréquence: 440Hz',
                    hashtags: ['#cymatic', '#musictech', '#analysis']
                },
                linkedin: {
                    post: 'Fascinating harmonic analysis results using Vincian algorithms...'
                },
                tiktok: {
                    script: 'POV: Your frequency analysis reveals hidden patterns...',
                    hashtags: ['#musictech', '#viral', '#science']
                }
            }
        };
    }
}

// Dans extension.ts, ajouter flag de développement
const DEVELOPMENT_MODE = process.env.NODE_ENV === 'development';

// Utiliser dans analyzeAudioCommand
if (DEVELOPMENT_MODE) {
    debugLog('🧪 Using API Mock');
    const result = await APIMock.analyze(payload);
    // ... continuer avec le mock
} else {
    // ... utiliser vraie API
}
```

### 2. **Profiler de performance**
```typescript
class PerformanceProfiler {
    private timers: Map<string, number> = new Map();
    
    start(label: string): void {
        this.timers.set(label, Date.now());
        debugLog(`⏱️ ${label} - START`);
    }
    
    end(label: string): number {
        const startTime = this.timers.get(label);
        if (!startTime) {
            debugLog(`❌ Timer not found: ${label}`);
            return 0;
        }
        
        const duration = Date.now() - startTime;
        debugLog(`⏱️ ${label} - END (${duration}ms)`);
        this.timers.delete(label);
        return duration;
    }
    
    measure<T>(label: string, fn: () => Promise<T>): Promise<T> {
        return new Promise(async (resolve, reject) => {
            this.start(label);
            try {
                const result = await fn();
                this.end(label);
                resolve(result);
            } catch (error) {
                this.end(label);
                reject(error);
            }
        });
    }
}

// Usage
const profiler = new PerformanceProfiler();

async function analyzeAudioCommand(uri: vscode.Uri) {
    return profiler.measure('full-analysis', async () => {
        // File reading
        const audioData = await profiler.measure('file-read', async () => {
            return await vscode.workspace.fs.readFile(uri);
        });
        
        // API call
        const response = await profiler.measure('api-call', async () => {
            return await axios.post(API_BASE_URL + '/analyze', payload);
        });
        
        // WebView generation
        await profiler.measure('webview-generation', async () => {
            await showAnalysisResults(response.data.analysis, response.data.content);
        });
    });
}
```

### 3. **Configuration de debug par environnement**
```typescript
interface DebugConfig {
    enableDetailedLogging: boolean;
    apiTimeout: number;
    maxFileSize: number;
    mockAPI: boolean;
    enablePerformanceTracking: boolean;
}

function getDebugConfig(): DebugConfig {
    const config = vscode.workspace.getConfiguration('aimastery.debug');
    
    return {
        enableDetailedLogging: config.get('detailedLogging', false),
        apiTimeout: config.get('apiTimeout', 30000),
        maxFileSize: config.get('maxFileSize', 10 * 1024 * 1024),
        mockAPI: config.get('mockAPI', false),
        enablePerformanceTracking: config.get('performanceTracking', false)
    };
}

// Ajouter à package.json configuration section:
"aimastery.debug.detailedLogging": {
    "type": "boolean",
    "default": false,
    "description": "Activer les logs détaillés pour le debug"
},
"aimastery.debug.mockAPI": {
    "type": "boolean", 
    "default": false,
    "description": "Utiliser l'API mock pour les tests"
}
```

## 📋 Checklist de Debug Final

Avant de publier ou signaler un bug:

### ✅ Tests de base
- [ ] Extension se charge correctement
- [ ] Commandes apparaissent dans Command Palette
- [ ] Menu contextuel fonctionne sur fichiers audio
- [ ] Status bar item visible et cliquable

### ✅ Tests fonctionnels
- [ ] Analyse d'un fichier MP3 standard
- [ ] Gestion des formats non supportés
- [ ] Gestion des fichiers trop volumineux
- [ ] Timeout sur API lente

### ✅ Tests UI
- [ ] WebView s'affiche correctement
- [ ] Boutons de copie fonctionnent
- [ ] Messages d'erreur appropriés
- [ ] Paramètres sauvegardés correctement

### ✅ Tests de robustesse
- [ ] Réseau déconnecté
- [ ] API indisponible
- [ ] Fichier corrompu
- [ ] Annulation pendant l'analyse

### ✅ Performance
- [ ] Temps de traitement acceptable (< 30s)
- [ ] Mémoire stable (pas de fuites)
- [ ] Pas de blocage de l'UI VS Code

## 🆘 Support et Escalation

Si le problème persiste:

1. **Collecter les informations:**
```typescript
function generateSupportInfo(): string {
    return `
🔧 AIMastery V4 - Support Info
==============================
Extension Version: ${context.extension?.packageJSON?.version}
VS Code Version: ${vscode.version}
Platform: ${process.platform}
Node Version: ${process.version}
User Tier: ${await getUserTier()}
Timestamp: ${new Date().toISOString()}

Recent Errors:
${JSON.stringify(recentErrors, null, 2)}
    `;
}
```

2. **Canaux de support:**
- GitHub Issues: https://github.com/your-repo/issues
- Discord: https://discord.gg/aimastery
- Email: support@aimastery.com

3. **Informations à fournir:**
- OS et version VS Code
- Version de l'extension
- Fichier audio de test (si possible)
- Logs détaillés
- Étapes pour reproduire