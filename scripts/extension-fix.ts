// Correction de la section corrompue autour de la ligne 270

// AVANT (corrompu) :
// const autoImproveConfig: AutoImprovementConfig = {o-improvement error: ${error instanceof Error ? error.message : String(error)}`);

// APRÈS (corrigé) :
const autoImproveConfig: AutoImprovementConfig = {
    enabled: config.get<boolean>(VincianConstants.CONFIG_KEYS.AUTO_IMPROVE_ENABLED, false),
    intervalHours: config.get<number>(VincianConstants.CONFIG_KEYS.AUTO_IMPROVE_INTERVAL, 1),
    healthThreshold: config.get<number>(VincianConstants.CONFIG_KEYS.AUTO_IMPROVE_HEALTH_THRESHOLD, 0.8)
};

// Gestion d'erreur séparée pour l'auto-amélioration
try {
    // Code d'auto-amélioration ici
    if (autoImproveConfig.enabled) {
        // Logique d'amélioration automatique
    }
} catch (error) {
    console.error(`Auto-improvement error: ${error instanceof Error ? error.message : String(error)}`);
    vscode.window.showErrorMessage(`Auto-improvement failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
}

// Validation de l'intervalle
if (autoImproveConfig.intervalHours <= 0) {
    vscode.window.showWarningMessage(`Invalid auto-improvement interval: ${autoImproveConfig.intervalHours}h. Using default 1h.`);
    autoImproveConfig.intervalHours = 1;
}

// Interface TypeScript manquante (à ajouter si elle n'existe pas)
interface AutoImprovementConfig {
    enabled: boolean;
    intervalHours: number;
    healthThreshold: number;
}

// Constantes de configuration (à ajouter dans VincianConstants si manquantes)
const VincianConstants = {
    CONFIG_KEYS: {
        AUTO_IMPROVE_ENABLED: 'aimastery.autoImprove.enabled',
        AUTO_IMPROVE_INTERVAL: 'aimastery.autoImprove.intervalHours',
        AUTO_IMPROVE_HEALTH_THRESHOLD: 'aimastery.autoImprove.healthThreshold'
    }
};
