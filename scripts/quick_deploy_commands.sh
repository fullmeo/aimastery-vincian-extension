#!/bin/bash

# ===== COMMANDES RAPIDES POUR SERIGNE DIAGNE =====
# Script de déploiement et publication rapide

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Détection OS automatique
case "$OSTYPE" in
  msys*|cygwin*) PROJECT_DIR="$USERPROFILE/Dev/..." ;;
  darwin*) PROJECT_DIR="$HOME/Dev/..." ;;
esac

PROJECT_DIR="$HOME/Dev/VSCode-Extensions/aimastery-vincian-analysis"
PUBLISHER="Serigne-Diagne"
GITHUB_USER="fullmeo"

echo -e "${BLUE}🚀 AIMastery Extension - Commandes Rapides${NC}"
echo -e "${BLUE}===========================================${NC}"

# Vérifier qu'on est dans le bon dossier
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Erreur: Exécutez ce script depuis le dossier du projet${NC}"
    echo -e "Utilisez: cd \"$PROJECT_DIR\" && ./quick-deploy.sh"
    exit 1
fi

# Menu interactif
echo -e "\n${YELLOW}Choisissez une action:${NC}"
echo "1. 🔧 Compiler et tester"
echo "2. 📦 Créer package VSIX"
echo "3. 🌐 Publier sur Marketplace"
echo "4. 🔄 Push vers GitHub"
echo "5. 🎯 Tout faire (compile + package + publish + git)"
echo "6. ❓ Afficher statut"
echo "7. 🧹 Nettoyer (clean build)"
echo "8. 🔍 Analyser avec l'extension elle-même"
echo "9. 🧪 Lancer tests automatiques"
echo ""
read -p "Votre choix (1-9): " choice

case $choice in
    1)
        echo -e "\n${YELLOW}🔧 Compilation et test...${NC}"
        npm run compile
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Compilation réussie${NC}"
            echo -e "${BLUE}💡 Conseil: Appuyez sur F5 dans VS Code pour tester${NC}"
        else
            echo -e "${RED}❌ Erreur de compilation${NC}"
            exit 1
        fi
        ;;
        
    2)
        echo -e "\n${YELLOW}📦 Création du package VSIX...${NC}"
        npm run compile
        if [ $? -eq 0 ]; then
            vsce package
            if [ $? -eq 0 ]; then
                echo -e "${GREEN}✅ Package créé avec succès${NC}"
                ls -la *.vsix 2>/dev/null && echo -e "${BLUE}📁 Fichier VSIX prêt pour installation${NC}"
            else
                echo -e "${RED}❌ Erreur lors de la création du package${NC}"
                exit 1
            fi
        else
            echo -e "${RED}❌ Erreur de compilation${NC}"
            exit 1
        fi
        ;;
        
    3)
        echo -e "\n${YELLOW}🌐 Publication sur VS Code Marketplace...${NC}"
        echo -e "${BLUE}📋 Vérifications avant publication:${NC}"
        
        # Vérifier la version
        VERSION=$(node -p "require('./package.json').version")
        echo -e "Version actuelle: ${GREEN}$VERSION${NC}"
        
        # Vérifier l'icône
        if [ -f "images/icon.png" ]; then
            echo -e "Icône: ${GREEN}✅ Présente${NC}"
        else
            echo -e "Icône: ${RED}❌ Manquante${NC}"
            echo -e "${YELLOW}⚠️ Ajoutez images/icon.png avant publication${NC}"
            exit 1
        fi
        
        # Vérifier le README
        if [ -f "README.md" ] && [ -s "README.md" ]; then
            echo -e "README: ${GREEN}✅ Présent${NC}"
        else
            echo -e "README: ${RED}❌ Manquant ou vide${NC}"
            exit 1
        fi
        
        read -p "Continuer la publication? (y/N): " confirm
        if [[ $confirm =~ ^[Yy]$ ]]; then
            npm run compile
            vsce publish
            if [ $? -eq 0 ]; then
                echo -e "${GREEN}🎉 Extension publiée avec succès!${NC}"
                echo -e "${BLUE}🌐 Lien: https://marketplace.visualstudio.com/items?itemName=$PUBLISHER.aimastery-vincian-analysis${NC}"
                
                # Tracking des déploiements
                curl -X POST "https://analytics.aimastery.dev/deploy" \
                  -d "version=$VERSION&timestamp=$(date +%s)"
            else
                echo -e "${RED}❌ Erreur lors de la publication${NC}"
                echo -e "${BLUE}💡 Vérifiez vos credentials vsce: vsce login $PUBLISHER${NC}"
            fi
        else
            echo -e "${YELLOW}Publication annulée${NC}"
        fi
        ;;
        
    4)
        echo -e "\n${YELLOW}🔄 Push vers GitHub...${NC}"
        
        # Vérifier si c'est un repo git
        if [ ! -d ".git" ]; then
            echo -e "${RED}❌ Pas un repository Git${NC}"
            read -p "Initialiser Git? (y/N): " init_git
            if [[ $init_git =~ ^[Yy]$ ]]; then
                git init
                git remote add origin "https://github.com/$GITHUB_USER/aimastery-vincian-analysis.git"
            else
                exit 1
            fi
        fi
        
        # Status
        echo -e "${BLUE}📊 Status Git:${NC}"
        git status --short
        
        # Ajouter tous les fichiers
        git add .
        
        # Commit avec message automatique
        TIMESTAMP=$(date +"%Y-%m-%d %H:%M")
        git commit -m "🚀 Update AIMastery Extension - $TIMESTAMP

✨ Recent changes:
- Code improvements and optimizations
- Updated documentation
- Version bump and maintenance

👨‍💻 Author: Serigne Diagne (@$GITHUB_USER)
🧬 AIMastery - Revolutionary Code + Audio Analysis"

        # Push
        git push origin main 2>/dev/null || git push origin master 2>/dev/null || git push -u origin main
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Code poussé vers GitHub${NC}"
            echo -e "${BLUE}🌐 Repository: https://github.com/$GITHUB_USER/aimastery-vincian-analysis${NC}"
        else
            echo -e "${RED}❌ Erreur lors du push${NC}"
            echo -e "${BLUE}💡 Vérifiez vos credentials GitHub${NC}"
        fi
        ;;
        
    5)
        echo -e "\n${YELLOW}🎯 Déploiement complet...${NC}"
        
        # 1. Compile
        echo -e "\n${BLUE}1/4 - Compilation...${NC}"
        npm run compile
        [ $? -ne 0 ] && echo -e "${RED}❌ Compilation échouée${NC}" && exit 1
        
        # 2. Package
        echo -e "\n${BLUE}2/4 - Packaging...${NC}"
        vsce package
        [ $? -ne 0 ] && echo -e "${RED}❌ Packaging échoué${NC}" && exit 1
        
        # 3. Git push
        echo -e "\n${BLUE}3/4 - Git push...${NC}"
        git add . && git commit -m "🚀 Release $(date +%Y%m%d_%H%M)" && git push
        
        # 4. Publish
        echo -e "\n${BLUE}4/4 - Publication marketplace...${NC}"
        read -p "Publier sur marketplace? (y/N): " pub_confirm
        if [[ $pub_confirm =~ ^[Yy]$ ]]; then
            vsce publish
            [ $? -eq 0 ] && echo -e "${GREEN}🎉 Déploiement complet réussi!${NC}"
        else
            echo -e "${GREEN}✅ Déploiement réussi (sans publication marketplace)${NC}"
        fi
        ;;
        
    6)
        echo -e "\n${YELLOW}🔍 Statut du projet...${NC}"
        
        # Version
        VERSION=$(node -p "require('./package.json').version" 2>/dev/null || echo "N/A")
        echo -e "Version: ${GREEN}$VERSION${NC}"
        
        # Publisher
        CURRENT_PUB=$(node -p "require('./package.json').publisher" 2>/dev/null || echo "N/A")
        echo -e "Publisher: ${GREEN}$CURRENT_PUB${NC}"
        
        # Fichiers
        echo -e "\nFichiers clés:"
        [ -f "src/extension.ts" ] && echo -e "  ✅ src/extension.ts" || echo -e "  ❌ src/extension.ts"
        [ -f "src/self-analyzing-extension.ts" ] && echo -e "  ✅ src/self-analyzing-extension.ts" || echo -e "  ❌ src/self-analyzing-extension.ts"
        [ -f "src/VincianTypes.ts" ] && echo -e "  ✅ src/VincianTypes.ts" || echo -e "  ❌ src/VincianTypes.ts"
        [ -f "images/icon.png" ] && echo -e "  ✅ images/icon.png" || echo -e "  ❌ images/icon.png"
        [ -f "README.md" ] && echo -e "  ✅ README.md" || echo -e "  ❌ README.md"
        
        # Compilation
        echo -e "\nCompilation:"
        [ -d "out" ] && echo -e "  ✅ Dossier out/ existe" || echo -e "  ❌ Pas compilé"
        [ -f "out/extension.js" ] && echo -e "  ✅ extension.js compilé" || echo -e "  ❌ extension.js manquant"
        
        # Git
        if [ -d ".git" ]; then
            echo -e "\nGit:"
            echo -e "  ✅ Repository Git initialisé"
            REMOTE=$(git remote get-url origin 2>/dev/null || echo "Pas de remote")
            echo -e "  Remote: $REMOTE"
            BRANCH=$(git branch --show-current 2>/dev/null || echo "N/A")
            echo -e "  Branche: $BRANCH"
        else
            echo -e "\n❌ Pas un repository Git"
        fi
        
        # Packages
        echo -e "\nPackages VSIX:"
        ls -la *.vsix 2>/dev/null | wc -l | xargs -I {} echo "  {} package(s) créé(s)"
        ;;
        
    7)
        echo -e "\n${YELLOW}🧹 Nettoyage...${NC}"
        rm -rf out/
        rm -rf node_modules/
        rm -f *.vsix
        npm install
        npm run compile
        echo -e "${GREEN}✅ Projet nettoyé et recompilé${NC}"
        ;;
        
    8)
        echo -e "\n${YELLOW}🔍 Auto-analyse avec l'extension...${NC}"
        echo -e "${BLUE}💡 Instructions:${NC}"
        echo "1. Appuyez sur F5 pour ouvrir Extension Development Host"
        echo "2. Dans la nouvelle fenêtre, Ctrl+Shift+P"
        echo "3. Tapez 'AIMastery: Start Analysis'"
        echo "4. Choisissez '🧬 Analyze Code'"
        echo "5. Votre extension va s'auto-analyser !"
        
        read -p "Ouvrir VS Code maintenant? (y/N): " open_code
        if [[ $open_code =~ ^[Yy]$ ]]; then
            code .
        fi
        ;;
        
    9)
        echo -e "\n${YELLOW}🧪 Lancement des tests automatiques...${NC}"
        npm test
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Tous les tests passent${NC}"
        else
            echo -e "${RED}❌ Des tests ont échoué${NC}"
            exit 1
        fi
        ;;
        
    *)
        echo -e "${RED}❌ Choix invalide${NC}"
        exit 1
        ;;
esac

echo -e "\n${GREEN}✨ Opération terminée!${NC}"
echo -e "${BLUE}💡 Utilisez './quick-deploy.sh' pour relancer ce menu${NC}"