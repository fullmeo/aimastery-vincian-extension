# ===== VS CODE EXTENSION TOOLKITS =====

# 1. GENERATOR OFFICIEL VS CODE
npm install -g yo generator-code
yo code  # Génère scaffolding extension

# 2. VSCE - Extension Manager
npm install -g vsce
vsce package         # Créer .vsix
vsce publish         # Publier marketplace
vsce login microsoft # Login publisher

# 3. EXTENSION TEST RUNNER
npm install --save-dev @vscode/test-runner
npm install --save-dev @vscode/test-cli

# 4. WEBVIEW UI TOOLKIT
npm install @vscode/webview-ui-toolkit
# Composants UI natifs VS Code dans webviews

# 5. EXTENSION API TYPINGS
npm install --save-dev @types/vscode
# Types complets pour toutes les APIs VS Code

# 6. LANGUAGE SERVER PROTOCOL
npm install vscode-languageserver
npm install vscode-languageclient
# Pour analysis avancée de code

# 7. CONFIGURATION ET SETTINGS
npm install jsonc-parser
# Parser JSON avec commentaires pour settings.json

# 8. FILE SYSTEM UTILITIES
npm install glob
npm install minimatch
# Pattern matching pour files

# 9. DEBUGGING TOOLKIT
npm install --save-dev vscode-debugadapter-testsupport
# Tests pour debug adapters