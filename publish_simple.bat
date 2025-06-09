@echo off
echo 🚀 Publication Simple Test...

echo === Prérequis ===
node --version
npm --version  
vsce --version

echo === README Validation ===
findstr /C:"img.shields.io" README.md >nul 2>&1
if %errorlevel% equ 0 (
    echo ❌ BADGES EXTERNES DÉTECTÉS!
    exit /b 1
) else (
    echo ✅ README.md Clean
)

echo === Package ===
vsce package

echo === Publication ===
vsce publish

pause