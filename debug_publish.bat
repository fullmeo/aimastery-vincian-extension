@echo off
echo Diagnostic des prérequis...

echo.
echo === Node.js ===
node --version
if %errorlevel% neq 0 (
    echo ERREUR: Node.js non trouvé
    goto :end
)

echo.
echo === npm ===
npm --version
if %errorlevel% neq 0 (
    echo ERREUR: npm non trouvé
    goto :end
)

echo.
echo === vsce ===
vsce --version
if %errorlevel% neq 0 (
    echo ERREUR: vsce non trouvé
    echo Installation de vsce...
    npm install -g @vscode/vsce
)

echo.
echo === Fichiers ===
if exist package.json (
    echo ✅ package.json trouvé
) else (
    echo ❌ package.json manquant
)

if exist README.md (
    echo ✅ README.md trouvé
) else (
    echo ❌ README.md manquant
)

echo.
echo === Validation README ===
findstr /C:"img.shields.io" README.md >nul 2>&1
if %errorlevel% equ 0 (
    echo ❌ BADGES EXTERNES DÉTECTÉS!
    findstr /N /C:"img.shields.io" README.md
) else (
    echo ✅ README.md clean
)

:end
pause