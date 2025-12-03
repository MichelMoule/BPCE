# Guide de Déploiement sur Render

## Étape 1 : Préparer votre code

Votre projet est prêt ! J'ai créé le fichier `render.yaml` qui configure le déploiement automatiquement.

## Étape 2 : Créer un dépôt Git

Si vous n'avez pas encore de dépôt Git :

```bash
git init
git add .
git commit -m "Initial commit - BPCE Profil Particulier"
```

## Étape 3 : Pousser sur GitHub

1. Créez un nouveau dépôt sur GitHub : https://github.com/new
2. Nommez-le `bpce-profil-particulier`
3. Puis exécutez :

```bash
git remote add origin https://github.com/VOTRE-USERNAME/bpce-profil-particulier.git
git branch -M main
git push -u origin main
```

## Étape 4 : Déployer sur Render

### Option A : Déploiement automatique (Recommandé)

1. Allez sur https://render.com et connectez-vous (ou créez un compte)
2. Cliquez sur **"New +"** → **"Static Site"**
3. Connectez votre dépôt GitHub
4. Render détectera automatiquement le fichier `render.yaml`
5. Ajoutez les variables d'environnement :
   - Cliquez sur **"Environment"** dans le menu
   - Ajoutez ces variables :
     - **Key** : `GEMINI_API_KEY` / **Value** : Votre clé API Google Gemini
     - **Key** : `OPENAI_API_KEY` / **Value** : Votre clé API OpenAI
6. Cliquez sur **"Create Static Site"**

### Option B : Configuration manuelle

1. Sur Render, cliquez **"New +"** → **"Static Site"**
2. Connectez votre dépôt GitHub
3. Configurez :
   - **Name** : `bpce-profil-particulier`
   - **Build Command** : `npm install && npm run build`
   - **Publish Directory** : `dist`
4. Dans **Environment Variables**, ajoutez :
   - **GEMINI_API_KEY** : Votre clé API Google Gemini
   - **OPENAI_API_KEY** : Votre clé API OpenAI
5. Cliquez sur **"Create Static Site"**

## Étape 5 : Configuration des variables d'environnement

Votre application a besoin de ces variables :

- **GEMINI_API_KEY** : Votre clé API Google Gemini (obligatoire)
- **OPENAI_API_KEY** : Votre clé API OpenAI (obligatoire pour le mode vocal)

## Étape 6 : Vérifier le déploiement

1. Render va construire automatiquement votre site (cela prend 2-5 minutes)
2. Une fois terminé, vous recevrez une URL comme : `https://bpce-profil-particulier.onrender.com`
3. Testez votre application !

## Dépannage

### Erreur : "API Key missing"
- Vérifiez que vous avez bien ajouté la variable `GEMINI_API_KEY` dans les paramètres Render

### Le build échoue
- Vérifiez les logs dans Render
- Assurez-vous que toutes les dépendances sont dans `package.json`

### L'image ne s'affiche pas
- Assurez-vous que le dossier `img/` avec `image.jpg` est bien commité dans Git
- Vérifiez le chemin dans `constants.ts`

## Mises à jour futures

Pour mettre à jour votre site après des modifications :

```bash
git add .
git commit -m "Description des changements"
git push
```

Render redéploiera automatiquement votre site !

## Support

- Documentation Render : https://render.com/docs/static-sites
- Votre URL de déploiement sera : `https://[votre-nom-de-site].onrender.com`
