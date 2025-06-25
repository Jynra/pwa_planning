# 📅 Planning de Travail - PWA

Une application web progressive (PWA) moderne et intuitive pour visualiser et gérer vos plannings de travail semaine par semaine. Interface mobile-first avec support complet des horaires multiples, horaires de nuit, et mode standalone.

![Planning de Travail](https://img.shields.io/badge/PWA-Ready-brightgreen) ![Version](https://img.shields.io/badge/version-1.0.0-blue) ![License](https://img.shields.io/badge/license-MIT-green) ![Docker](https://img.shields.io/badge/Docker-Supported-blue)

## 🎯 Présentation

Planning de Travail est une PWA complète conçue pour les professionnels ayant des horaires variables. Elle permet d'importer facilement des plannings au format CSV et de les visualiser de manière claire et organisée, semaine par semaine.

### ✨ Points forts
- **🚀 Installation native** sur smartphone (Android/iOS)
- **📊 Import CSV intelligent** avec détection automatique des formats
- **⏰ Gestion avancée** des horaires multiples et de nuit
- **🌙 Mode sombre** adaptatif
- **💾 Fonctionnement hors ligne** avec sauvegarde locale
- **🐳 Déploiement Docker** simplifié

## 📱 Fonctionnalités

### Interface & Navigation
- **Design mobile-first** optimisé pour smartphone et tablette
- **Mode standalone** : s'ouvre comme une app native après installation
- **Navigation intuitive** par semaines avec flèches et bouton "Aujourd'hui"
- **Thème adaptatif** : mode clair/sombre avec détection automatique
- **Responsive design** : fonctionne parfaitement sur tous les écrans

### Import et Gestion des Données
- **Import CSV avancé** avec parser robuste
- **Formats de date multiples** : YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY
- **Détection automatique des colonnes** avec aliases supportés
- **Validation et normalisation** des données importées
- **Sauvegarde automatique** en local avec récupération au démarrage

### Horaires et Planification
- **Support des horaires multiples** par jour avec séparateurs variés
- **Détection automatique des horaires de nuit** (ex: 22:00-06:00)
- **Calculs automatiques** des durées et statistiques
- **Badges visuels** pour identifier rapidement les types de journées
- **Vue hebdomadaire adaptive** n'affichant que les jours avec données

### Fonctionnalités Avancées
- **Mode hors ligne** complet avec Service Worker
- **Statistiques en temps réel** par semaine
- **Navigation au clavier** avec raccourcis
- **Gestion des erreurs** robuste avec messages informatifs
- **Performance optimisée** avec animations fluides

## 🚀 Installation et Déploiement

### Structure du Projet

```
pwa_planning/
├── assets/
│   ├── css/                    # Styles modulaires
│   │   ├── variables.css       # Variables et thèmes
│   │   ├── layout.css          # Structure et layout
│   │   ├── components.css      # Composants UI
│   │   └── responsive.css      # Responsive design
│   ├── icons/                  # Icônes PWA (72px à 512px)
│   │   ├── icon-72.png
│   │   ├── icon-96.png
│   │   ├── icon-128.png
│   │   ├── icon-144.png
│   │   ├── icon-152.png
│   │   ├── icon-192.png        ← CRITIQUE PWA
│   │   ├── icon-384.png
│   │   └── icon-512.png        ← CRITIQUE PWA
│   └── js/                     # JavaScript modulaire
│       ├── DataManager.js      # Gestion données et CSV
│       ├── TimeUtils.js        # Calculs temporels
│       ├── WeekManager.js      # Navigation semaines
│       ├── PlanningApp.js      # Application principale
│       └── main.js             # Point d'entrée
├── docker/                     # Configuration Docker
│   ├── Dockerfile
│   ├── docker-compose.yml
│   ├── nginx.conf
│   └── deploy.sh               # Script de déploiement
├── index.html                  # Page principale
├── manifest.json               # Manifest PWA
├── sw.js                       # Service Worker
└── README.md
```

### Prérequis

- **Docker** et **Docker Compose** installés
- **Port 4047** disponible (configurable)
- **Navigateur moderne** avec support PWA

### Déploiement Rapide

```bash
# 1. Cloner ou télécharger le projet
git clone [url-du-projet] planning-travail
cd planning-travail

# 2. Lancer le déploiement complet
cd docker/
chmod +x deploy.sh
./deploy.sh full
```

L'application sera accessible sur **http://localhost:4047**

### Options de Déploiement

```bash
# Démarrage simple
./deploy.sh start

# Construction + démarrage + tests
./deploy.sh full

# Tests PWA uniquement
./deploy.sh test

# Logs en temps réel
./deploy.sh logs

# Redémarrage
./deploy.sh restart

# Arrêt
./deploy.sh stop

# Informations de la stack
./deploy.sh info
```

## 📊 Format CSV Supporté

### Structure Standard

```csv
date,horaire,poste,taches
2025-06-30,08:00-16:00,Bureau,Réunion équipe
2025-07-01,09:00-17:00,Site A,Formation
2025-07-02,Repos,Congé,Jour de repos
```

### Horaires Complexes

```csv
date,horaire,poste,taches
2025-06-30,"08:00-12:00 | 14:00-18:00",Bureau Principal,"Matin: réunions, après-midi: formation"
2025-07-01,10:00-15:00 puis 18:00-22:00,Site A,Supervision jour et nuit
2025-07-02,09:00-13:00 / 15:00-17:00,Site B,Double vacation
2025-07-03,22:00-06:00,Site C,Équipe de nuit (8h)
```

### Colonnes et Aliases Supportés

| Colonne | Aliases Acceptés | Format |
|---------|------------------|---------|
| **Date** | `date`, `jour` | YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY |
| **Horaire** | `horaire`, `horaires`, `time`, `heures` | HH:MM-HH:MM, "Repos", multiples |
| **Poste** | `poste`, `lieu`, `location`, `site` | Texte libre |
| **Tâches** | `taches`, `task`, `description`, `activite` | Texte libre |

### Séparateurs d'Horaires Multiples

- `|` : `08:00-12:00 | 14:00-18:00`
- `puis` : `10:00-15:00 puis 18:00-22:00`
- `/` : `09:00-13:00 / 15:00-17:00`
- `+` : `08:00-12:00 + 14:00-18:00`
- `et` : `09:00-13:00 et 15:00-17:00`

## 📱 Installation PWA

### Sur Android (Chrome/Edge)
1. Ouvrir **http://localhost:4047** dans Chrome
2. Menu ⋮ → **"Ajouter à l'écran d'accueil"**
3. Ou attendre la notification automatique d'installation

### Sur iOS (Safari)
1. Ouvrir l'URL dans **Safari**
2. Bouton **Partage** 📤 → **"Sur l'écran d'accueil"**
3. Confirmer l'installation

### Sur Desktop
- **Chrome** : Icône d'installation dans la barre d'adresse
- **Edge** : Menu → Apps → Installer cette app

## 🎨 Interface Utilisateur

### Badges et Indicateurs

| Badge | Couleur | Signification |
|-------|---------|---------------|
| **Aujourd'hui** | 🟢 Vert | Journée courante |
| **Repos** | 🟠 Orange | Jour de congé |
| **Coupure** | 🔴 Rouge | Horaires multiples |
| **Nuit** | 🟣 Violet | Horaires nocturnes |

### Statistiques Automatiques

- **Total semaine** : Heures travaillées cumulées
- **Jours travaillés** : Nombre de jours (hors repos)
- **Moyenne/jour** : Heures moyennes par jour travaillé

### Navigation

- **← →** : Navigation entre semaines
- **📅 Aujourd'hui** : Retour à la semaine courante  
- **🔄 Reset** : Effacer et revenir aux données d'exemple
- **🌙/☀️** : Basculer mode sombre/clair

## 🔧 Configuration et Personnalisation

### Variables CSS (assets/css/variables.css)

```css
:root {
    --accent-blue: #64b5f6;    # Couleur principale
    --accent-green: #81c784;   # Succès/validation
    --accent-orange: #ffb74d;  # Avertissements
    --accent-red: #ff8a80;     # Erreurs/urgence
}
```

### Configuration Docker

**Port personnalisé** (docker/docker-compose.yml) :
```yaml
ports:
  - "VOTRE_PORT:80"  # Changer VOTRE_PORT
```

**Script de déploiement** (docker/deploy.sh) :
```bash
PORT=VOTRE_PORT  # Modifier cette ligne
```

### Service Worker

Configuration du cache dans `sw.js` :
```javascript
const CACHE_NAME = 'planning-travail-v1.0.0';  # Version à incrémenter
```

## 🚨 Résolution de Problèmes

### L'application ne s'installe pas en PWA

**Vérifications :**
```bash
# 1. Tester les composants PWA
./deploy.sh test

# 2. Vérifier le manifest
curl http://localhost:4047/manifest.json

# 3. Vérifier le service worker
curl http://localhost:4047/sw.js

# 4. Forcer le rechargement du cache
# Chrome: Ctrl+Shift+R
# F12 → Application → Storage → Clear storage
```

**Causes fréquentes :**
- ❌ Icônes 192x192 ou 512x512 manquantes
- ❌ Service Worker non accessible
- ❌ HTTP au lieu de HTTPS (en production)
- ❌ Cache navigateur obsolète

### Import CSV échoue

**Solutions :**
- ✅ Vérifier l'encodage : **UTF-8** recommandé
- ✅ Format de date : **YYYY-MM-DD** préféré
- ✅ Guillemets pour horaires complexes : `"08:00-12:00 | 14:00-18:00"`
- ✅ En-têtes requis : au minimum `date` et `horaire`

### Performance et Cache

```bash
# Vider complètement le cache Docker
docker system prune -f

# Reconstruire sans cache
./deploy.sh build

# Logs détaillés
./deploy.sh logs
```

## 🔮 Évolutions Futures

### Fonctionnalités Envisagées
- **Export PDF** du planning hebdomadaire
- **Synchronisation cloud** (Google Drive, Dropbox)
- **Notifications push** pour rappels de planning
- **Mode équipe** avec plannings partagés
- **Intégration calendrier** (Google Calendar, Outlook)
- **Thèmes personnalisés** et couleurs d'entreprise
- **Support multi-langues** (EN, ES, DE)
- **Analytics** d'utilisation et statistiques avancées

### Améliorations Techniques
- **Progressive Web Share** pour partager des plannings
- **Web Locks API** pour gestion concurrentielle
- **Background Sync** pour synchronisation automatique
- **Web Push** pour notifications système
- **File System Access** pour sauvegarde locale avancée

## 🤝 Contribution

### Pour Contribuer
1. **Fork** le projet
2. **Créer une branche** : `git checkout -b feature/nouvelle-fonctionnalite`
3. **Modifier** le code avec les conventions existantes
4. **Tester** : `./deploy.sh test`
5. **Commit** : `git commit -m "feat: description de la fonctionnalité"`
6. **Pull Request** avec description détaillée

### Guidelines de Code
- **JavaScript** : ES6+ avec classes modulaires
- **CSS** : Variables CSS et méthodologie BEM
- **Responsive** : Mobile-first approach
- **PWA** : Service Worker et manifest conformes
- **Docker** : Configuration reproductible

## 📄 Licence

**MIT License** - Libre d'utilisation, modification et distribution.

```
Copyright (c) 2025 Planning de Travail PWA

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

## 📞 Support

### Auto-diagnostic
1. **Console navigateur** : F12 → Console pour voir les erreurs
2. **Test PWA** : `./deploy.sh test`
3. **Vérification Docker** : `docker ps` et `docker logs`
4. **Reset complet** : `./deploy.sh stop && ./deploy.sh full`

### Ressources Utiles
- **Documentation PWA** : [web.dev/progressive-web-apps](https://web.dev/progressive-web-apps/)
- **Test PWA** : [www.pwabuilder.com](https://www.pwabuilder.com/)
- **Lighthouse audit** : F12 → Lighthouse → PWA

---

**Planning de Travail PWA** - Une solution moderne, intuitive et professionnelle pour gérer vos plannings ! 📅✨

*Développé avec ❤️ pour simplifier la gestion des plannings de travail.*