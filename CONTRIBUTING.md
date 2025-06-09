# Guide de Contribution

Merci de votre intérêt pour AIMastery Vincian Analysis ! Nous apprécions votre volonté de contribuer à ce projet. Voici comment vous pouvez nous aider.

## 📋 Avant de Commencer

1. **Ouvrir un ticket**
   - Vérifiez d'abord si le problème ou la fonctionnalité n'a pas déjà été signalé(e)
   - Si vous souhaitez travailler sur une nouvelle fonctionnalité, discutez-en d'abord avec l'équipe

2. **Configurer l'environnement**
   - Installez [Node.js](https://nodejs.org/) (version 14.x ou supérieure)
   - Installez [Git](https://git-scm.com/)
   - Installez [VS Code](https://code.visualstudio.com/)

## 🛠 Installation pour le Développement

1. **Forker le dépôt**

   ```bash
   git clone https://github.com/votre-utilisateur/aimastery-vincian-extension.git
   cd aimastery-vincian-extension
   ```

2. **Installer les dépendances**

   ```bash
   npm install
   ```

3. **Compiler le code**

   ```bash
   npm run compile
   ```

4. **Lancer en mode développement**

   ```bash
   npm run watch
   ```

## 🧪 Exécuter les Tests

```bash
# Exécuter tous les tests
npm test

# Exécuter les tests en mode watch
npm run test:watch

# Générer un rapport de couverture de code
npm run test:coverage
```


## 📝 Soumettre des Modifications

1. **Créer une branche**
   ```bash
   git checkout -b feature/nom-de-la-fonctionnalite
   # ou
   git checkout -b fix/nom-du-correctif
   ```

2. **Faire des commits clairs**
   - Utilisez des messages de commit descriptifs
   - Faites des commits atomiques (une fonctionnalité/un correctif par commit)
   - Suivez le format : `type(scope): description`
     
     Exemples :
     
     ```text
     feat(analysis): ajouter la détection de la tonalité
     fix(auth): corriger la validation du token
     docs(readme): mettre à jour les instructions d'installation
     ```

3. **Pousser les modifications**
   ```bash
   git push origin votre-branche
   ```

4. **Ouvrir une Pull Request**
   - Assurez-vous que tous les tests passent
   - Mettez à jour la documentation si nécessaire
   - Décrivez clairement les changements apportés
   - Référencez les issues concernées

## 🎨 Standards de Code

- **TypeScript** : Suivez le [guide de style TypeScript](https://google.github.io/styleguide/tsguide.html)
- **Tests** : Écrivez des tests unitaires pour les nouvelles fonctionnalités
- **Documentation** : Mettez à jour la documentation pour refléter les changements
- **Accessibilité** : Assurez-vous que l'interface reste accessible

## 📝 Modèle de Pull Request

```markdown
## Description

[Description détaillée des changements apportés]

## Type de changement

- [ ] Correction de bug
- [ ] Nouvelle fonctionnalité
- [ ] Modification majeure (changement rétro-incompatible)
- [ ] Cette modification nécessite une mise à jour de la documentation

## Comment tester

[Étapes pour tester les modifications]

## Captures d'écran (si applicable)

[Ajoutez des captures d'écran si vous modifiez l'interface utilisateur]
```

## 🤝 Code de Conduite

En participant à ce projet, vous acceptez de respecter notre [Code de Conduite](CODE_OF_CONDUCT.md).

## 🙋 Besoin d'Aide ?

Si vous avez des questions, n'hésitez pas à :
- Ouvrir une [discussion](https://github.com/fullmeo/aimastery-vincian-extension/discussions)
- Rejoindre notre communauté Discord (lien à ajouter)
- Nous contacter à [contact@aimastery.com](mailto:contact@aimastery.com)
