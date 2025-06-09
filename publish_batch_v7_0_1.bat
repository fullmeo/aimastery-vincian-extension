@echo off
setlocal enabledelayedexpansion

:: ====================================================================
:: 🚀 AI Mastery: Vincian Analysis Extension - Publication Script v7.0.1
:: ====================================================================
:: Author: Serigne Diagne
:: Extension: aimastery-vincian-analysis
:: Target Version: 7.0.1
:: ====================================================================

color 0A
title AI Mastery Vincian Analysis - Publication v7.0.1

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                🧬 AI MASTERY VINCIAN ANALYSIS                ║
echo ║                    Publication Script v7.0.1                ║
echo ║                                                              ║
echo ║  🎯 Target: VS Code Marketplace                              ║
echo ║  👨‍💻 Developer: Serigne Diagne                                ║
echo ║  📦 Extension: aimastery-vincian-analysis                    ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

:: Configuration
set VERSION=7.0.1
set EXTENSION_NAME=aimastery-vincian-analysis
set PUBLISHER=Serigne-Diagne
set LOG_FILE=publish_v%VERSION%_log.txt

:: Créer le fichier de log
echo [%DATE% %TIME%] Starting publication process for v%VERSION% > %LOG_FILE%

:: ====================================================================
:: 🔍 ÉTAPE 1: Vérification des prérequis
:: ====================================================================
echo 🔍 [1/8] Vérification des prérequis...
echo [%DATE% %TIME%] Checking prerequisites >> %LOG_FILE%

:: Vérifier Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ERREUR: Node.js n'est pas installé ou n'est pas dans le PATH
    echo [%DATE% %TIME%] ERROR: Node.js not found >> %LOG_FILE%
    goto :error
)

:: Vérifier npm
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ERREUR: npm n'est pas installé
    echo [%DATE% %TIME%] ERROR: npm not found >> %LOG_FILE%
    goto :error
)

:: Vérifier vsce
vsce --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  vsce n'est pas installé. Installation en cours...
    echo [%DATE% %TIME%] Installing vsce >> %LOG_FILE%
    npm install -g vsce
    if %errorlevel% neq 0 (
        echo ❌ ERREUR: Impossible d'installer vsce
        echo [%DATE% %TIME%] ERROR: Failed to install vsce >> %LOG_FILE%
        goto :error
    )
)

echo ✅ Prérequis validés
echo [%DATE% %TIME%] Prerequisites validated >> %LOG_FILE%

:: ====================================================================
:: 📝 ÉTAPE 2: Vérification du package.json et README.md
:: ====================================================================
echo.
echo 📝 [2/8] Vérification du package.json et README.md...
echo [%DATE% %TIME%] Checking package.json and README.md >> %LOG_FILE%

if not exist package.json (
    echo ❌ ERREUR: package.json introuvable
    echo [%DATE% %TIME%] ERROR: package.json not found >> %LOG_FILE%
    goto :error
)

:: ====================================================================
:: 🛡️ VALIDATION MARKETPLACE: Vérification README.md
:: ====================================================================
echo 🛡️  Validation README.md pour compatibilité marketplace...
echo [%DATE% %TIME%] Validating README.md for marketplace compatibility >> %LOG_FILE%

if not exist README.md (
    echo ❌ ERREUR: README.md introuvable
    echo [%DATE% %TIME%] ERROR: README.md not found >> %LOG_FILE%
    goto :error
)

:: Vérifier les badges externes problématiques (img.shields.io)
findstr /C:"img.shields.io" README.md >nul 2>&1
if %errorlevel% equ 0 (
    echo.
    echo ╔══════════════════════════════════════════════════════════════╗
    echo ║                    ⚠️  ERREUR MARKETPLACE!                   ║
    echo ╠══════════════════════════════════════════════════════════════╣
    echo ║  README.md contient des badges externes non autorisés      ║
    echo ║  Références SVG détectées: img.shields.io                   ║
    echo ║                                                              ║
    echo ║  🚫 Le marketplace VS Code refuse ces références:           ║
    echo ║     - img.shields.io                                        ║
    echo ║     - vsmarketplacebadge.apphb.com                          ║
    echo ║                                                              ║
    echo ║  🔧 SOLUTION: Supprimez ces lignes du README.md:            ║
    echo ╚══════════════════════════════════════════════════════════════╝
    echo.
    echo 📋 Badges problématiques trouvés:
    findstr /N /C:"img.shields.io" README.md
    echo.
    echo [%DATE% %TIME%] ERROR: External badges detected in README.md >> %LOG_FILE%
    echo ❌ PUBLICATION ARRÊTÉE - Corrigez le README.md et relancez
    echo.
    echo 💡 Conseil: Remplacez les badges par du texte simple ou supprimez-les
    goto :error
)

:: Vérifier autres badges externes
findstr /C:"vsmarketplacebadge.apphb.com" README.md >nul 2>&1
if %errorlevel% equ 0 (
    echo ⚠️  ATTENTION: Badges vsmarketplacebadge.apphb.com détectés
    echo [%DATE% %TIME%] WARNING: vsmarketplacebadge badges detected >> %LOG_FILE%
    findstr /N /C:"vsmarketplacebadge.apphb.com" README.md
    echo.
    echo 🤔 Ces badges peuvent aussi causer des problèmes...
    set /p CONTINUE="Continuer malgré cet avertissement? (y/N): "
    if /i not "%CONTINUE%"=="y" (
        echo ❌ Publication annulée par précaution
        echo [%DATE% %TIME%] Publication cancelled due to badge warning >> %LOG_FILE%
        goto :error
    )
)

echo ✅ README.md validé pour le marketplace
echo [%DATE% %TIME%] README.md validated successfully >> %LOG_FILE%

:: Vérifier la version dans package.json
findstr /C:"\"version\": \"%VERSION%\"" package.json >nul
if %errorlevel% neq 0 (
    echo ⚠️  La version dans package.json n'est pas %VERSION%
    echo 🔧 Mise à jour de la version...
    echo [%DATE% %TIME%] Updating version in package.json >> %LOG_FILE%
    
    :: Utiliser vsce pour mettre à jour la version
    vsce publish %VERSION% --no-publish
    if %errorlevel% neq 0 (
        echo ❌ ERREUR: Impossible de mettre à jour la version
        echo [%DATE% %TIME%] ERROR: Failed to update version >> %LOG_FILE%
        goto :error
    )
)

echo ✅ Package.json et README.md validés
echo [%DATE% %TIME%] Package.json and README.md validated >> %LOG_FILE%

:: ====================================================================
:: 🧹 ÉTAPE 3: Nettoyage de l'environnement
:: ====================================================================
echo.
echo 🧹 [3/8] Nettoyage de l'environnement...
echo [%DATE% %TIME%] Cleaning environment >> %LOG_FILE%

:: Supprimer les anciens packages
if exist *.vsix (
    echo 🗑️  Suppression des anciens packages .vsix...
    del *.vsix
)

:: Supprimer node_modules et reinstaller (optionnel pour build propre)
echo 📦 Vérification des dépendances...
if not exist node_modules (
    echo 📥 Installation des dépendances...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ ERREUR: Échec de l'installation des dépendances
        echo [%DATE% %TIME%] ERROR: npm install failed >> %LOG_FILE%
        goto :error
    )
)

echo ✅ Environnement nettoyé
echo [%DATE% %TIME%] Environment cleaned >> %LOG_FILE%

:: ====================================================================
:: 🔨 ÉTAPE 4: Build de l'extension
:: ====================================================================
echo.
echo 🔨 [4/8] Build de l'extension...
echo [%DATE% %TIME%] Building extension >> %LOG_FILE%

:: Exécuter le script de build si disponible
if exist "package.json" (
    findstr /C:"\"build\"" package.json >nul
    if %errorlevel% equ 0 (
        echo 🏗️  Exécution du script de build...
        npm run build
        if %errorlevel% neq 0 (
            echo ❌ ERREUR: Échec du build
            echo [%DATE% %TIME%] ERROR: Build failed >> %LOG_FILE%
            goto :error
        )
    )
)

echo ✅ Build terminé
echo [%DATE% %TIME%] Build completed >> %LOG_FILE%

:: ====================================================================
:: 📦 ÉTAPE 5: Packaging de l'extension
:: ====================================================================
echo.
echo 📦 [5/8] Packaging de l'extension...
echo [%DATE% %TIME%] Packaging extension >> %LOG_FILE%

vsce package
if %errorlevel% neq 0 (
    echo ❌ ERREUR: Échec du packaging
    echo [%DATE% %TIME%] ERROR: Packaging failed >> %LOG_FILE%
    goto :error
)

:: Vérifier que le package a été créé
set PACKAGE_FILE=%PUBLISHER%.%EXTENSION_NAME%-%VERSION%.vsix
if not exist "%PACKAGE_FILE%" (
    echo ❌ ERREUR: Le package %PACKAGE_FILE% n'a pas été créé
    echo [%DATE% %TIME%] ERROR: Package file not created >> %LOG_FILE%
    goto :error
)

echo ✅ Package créé: %PACKAGE_FILE%
echo [%DATE% %TIME%] Package created: %PACKAGE_FILE% >> %LOG_FILE%

:: ====================================================================
:: 🔍 ÉTAPE 6: Validation du package
:: ====================================================================
echo.
echo 🔍 [6/8] Validation du package...
echo [%DATE% %TIME%] Validating package >> %LOG_FILE%

:: Lister le contenu du package pour vérification
echo 📋 Contenu du package:
vsce ls

echo ✅ Package validé
echo [%DATE% %TIME%] Package validated >> %LOG_FILE%

:: ====================================================================
:: 🚀 ÉTAPE 7: Publication sur VS Code Marketplace
:: ====================================================================
echo.
echo 🚀 [7/8] Publication sur VS Code Marketplace...
echo [%DATE% %TIME%] Publishing to VS Code Marketplace >> %LOG_FILE%

echo ⚠️  ATTENTION: Vous allez publier la version %VERSION% sur le marketplace
echo.
set /p CONFIRM="Continuer la publication? (y/N): "
if /i not "%CONFIRM%"=="y" (
    echo ❌ Publication annulée par l'utilisateur
    echo [%DATE% %TIME%] Publication cancelled by user >> %LOG_FILE%
    goto :end
)

echo 📤 Publication en cours...
vsce publish
if %errorlevel% neq 0 (
    echo ❌ ERREUR: Échec de la publication
    echo [%DATE% %TIME%] ERROR: Publication failed >> %LOG_FILE%
    goto :error
)

echo ✅ Publication réussie!
echo [%DATE% %TIME%] Publication successful >> %LOG_FILE%

:: ====================================================================
:: 🎉 ÉTAPE 8: Finalisation et nettoyage
:: ====================================================================
echo.
echo 🎉 [8/8] Finalisation...
echo [%DATE% %TIME%] Finalizing >> %LOG_FILE%

:: Afficher les informations de publication
echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                     🎉 PUBLICATION RÉUSSIE!                 ║
echo ╠══════════════════════════════════════════════════════════════╣
echo ║  📦 Extension: %EXTENSION_NAME%                
echo ║  🔢 Version: %VERSION%                                       ║
echo ║  👨‍💻 Publisher: %PUBLISHER%                                   ║
echo ║  📁 Package: %PACKAGE_FILE%    ║
echo ║                                                              ║
echo ║  🌐 Marketplace: https://marketplace.visualstudio.com/      ║
echo ║      items?itemName=%PUBLISHER%.%EXTENSION_NAME%             ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

:: Créer un fichier de résumé
echo Publication Summary v%VERSION% > publication_summary_v%VERSION%.txt
echo ========================== >> publication_summary_v%VERSION%.txt
echo Date: %DATE% %TIME% >> publication_summary_v%VERSION%.txt
echo Version: %VERSION% >> publication_summary_v%VERSION%.txt
echo Extension: %EXTENSION_NAME% >> publication_summary_v%VERSION%.txt
echo Publisher: %PUBLISHER% >> publication_summary_v%VERSION%.txt
echo Package: %PACKAGE_FILE% >> publication_summary_v%VERSION%.txt
echo Status: SUCCESS >> publication_summary_v%VERSION%.txt
echo. >> publication_summary_v%VERSION%.txt
echo Marketplace URL: >> publication_summary_v%VERSION%.txt
echo https://marketplace.visualstudio.com/items?itemName=%PUBLISHER%.%EXTENSION_NAME% >> publication_summary_v%VERSION%.txt

echo 📄 Résumé sauvegardé: publication_summary_v%VERSION%.txt
echo [%DATE% %TIME%] Publication completed successfully >> %LOG_FILE%

:: Ouvrir le marketplace dans le navigateur (optionnel)
set /p OPEN_BROWSER="Ouvrir la page marketplace dans le navigateur? (y/N): "
if /i "%OPEN_BROWSER%"=="y" (
    start https://marketplace.visualstudio.com/items?itemName=%PUBLISHER%.%EXTENSION_NAME%
)

goto :end

:: ====================================================================
:: ❌ GESTION D'ERREUR
:: ====================================================================
:error
echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                      ❌ ERREUR CRITIQUE                      ║
echo ╠══════════════════════════════════════════════════════════════╣
echo ║  La publication a échoué!                                   ║
echo ║                                                              ║
echo ║  📋 Vérifiez le fichier de log: %LOG_FILE%                   ║
echo ║  🔧 Corrigez les erreurs et relancez le script              ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo [%DATE% %TIME%] Publication failed with errors >> %LOG_FILE%
echo.
pause
exit /b 1

:: ====================================================================
:: ✅ FIN NORMALE
:: ====================================================================
:end
echo.
echo 🏁 Script terminé avec succès!
echo.
pause
exit /b 0