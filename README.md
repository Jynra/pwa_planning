# 📅 Planning de Travail - PWA

Une application web progressive (PWA) moderne et intuitive pour visualiser et gérer vos plannings de travail semaine par semaine. Interface mobile-first avec support complet des horaires multiples, horaires de nuit, et **édition en ligne**.

![Planning de Travail](https://img.shields.io/badge/PWA-Ready-brightgreen) ![Version](https://img.shields.io/badge/version-2.0.0-blue) ![License](https://img.shields.io/badge/license-MIT-green) ![Docker](https://img.shields.io/badge/Docker-Supported-blue)

## ✨ Fonctionnalités principales

- **🚀 Installation native** sur smartphone (Android/iOS) et desktop
- **📊 Import CSV intelligent** avec détection automatique des formats
- **✏️ Édition en ligne** des horaires jour par jour avec validation temps réel
- **⏰ Gestion avancée** des horaires multiples et de nuit
- **🌙 Mode sombre** adaptatif avec détection système
- **💾 Fonctionnement hors ligne** avec sauvegarde locale automatique
- **📱 Design mobile-first** responsive avec animations fluides

## 🚀 Installation et déploiement

### Prérequis
- **Docker** et **Docker Compose** installés
- **Port 4047** disponible (configurable)

### Déploiement rapide

```bash
# 1. Cloner le projet
git clone https://github.com/Jynra/pwa_planning planning-travail
cd planning-travail

# 2. Lancer l'application
cd docker/
chmod +x deploy.sh
./deploy.sh full
```

L'application sera accessible sur **http://localhost:4047**

### Commandes utiles

```bash
./deploy.sh start     # Démarrer
./deploy.sh stop      # Arrêter
./deploy.sh restart   # Redémarrer
./deploy.sh logs      # Voir les logs
./deploy.sh test      # Tester les composants PWA
```

### Installation PWA

**Sur mobile** :
- **Android (Chrome)** : Menu ⋮ → "Ajouter à l'écran d'accueil"
- **iOS (Safari)** : Bouton Partage 📤 → "Sur l'écran d'accueil"

**Sur desktop** :
- **Chrome/Edge** : Icône d'installation dans la barre d'adresse

## 📊 Format CSV supporté

### Structure basique
```csv
date,horaire,poste,taches
2025-06-30,08:00-16:00,Bureau,Réunion équipe
2025-07-01,09:00-17:00,Site A,Formation
2025-07-02,Repos,Congé,Jour de repos
```

### Horaires multiples et complexes
```csv
date,horaire,poste,taches
2025-06-30,"08:00-12:00 | 14:00-18:00",Bureau,"Matin: réunions, après-midi: formation"
2025-07-01,10:00-15:00 puis 18:00-22:00,Site A,Supervision jour et nuit
2025-07-02,22:00-06:00,Site C,Équipe de nuit (8h)
```

### Formats supportés
- **Dates** : YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY
- **Horaires multiples** : Séparateurs `|`, `puis`, `/`, `+`, `et`
- **Colonnes** : Aliases automatiquement détectés (`date`/`jour`, `horaire`/`time`, `poste`/`lieu`, `taches`/`task`)

## 🎨 Interface utilisateur

### Badges automatiques
- **Aujourd'hui** 🟢 : Journée courante
- **Repos** 🟠 : Jour de congé  
- **Coupure** 🔴 : Horaires multiples
- **Nuit** 🟣 : Horaires nocturnes (22h-6h)

### Menu Options ⚙️
- **🌙 Mode sombre** : Basculer entre thème clair/sombre
- **🔄 Réinitialiser** : Effacer le planning actuel

### Édition des horaires
- **✏️ Modifier** : Éditer les horaires d'un jour en place
- **➕/➖** : Ajouter/supprimer des créneaux horaires
- **☑️ Jour de repos** : Toggle avec mise à jour automatique
- **💾 Enregistrer** / **❌ Annuler** : Sauvegarde ou restauration

### Navigation
- **← →** : Navigation entre semaines
- **📅 Aujourd'hui** : Retour à la semaine courante
- **Statistiques** : Total semaine, jours travaillés, moyenne/jour

## 🏗️ Architecture

Structure modulaire pour une maintenance facilitée :

```
assets/js/
├── PlanningApp.js      # Application principale
├── DataManager.js      # Gestion CSV et sauvegarde locale
├── WeekManager.js      # Navigation par semaines
├── EditManager.js      # Édition des horaires
├── ThemeManager.js     # Gestion des thèmes
├── DisplayManager.js   # Affichage et statistiques
└── FileManager.js      # Import/Export fichiers
```

## 🔧 Configuration

### Changer le port d'écoute
Éditer `docker/docker-compose.yml` :
```yaml
ports:
  - "VOTRE_PORT:80"  # Remplacer par le port souhaité
```

### Personnaliser les couleurs
Modifier `assets/css/variables.css` :
```css
:root {
    --accent-blue: #64b5f6;    /* Couleur principale */
    --accent-green: #81c784;   /* Succès/validation */
    --accent-orange: #ffb74d;  /* Avertissements */
    --accent-red: #ff8a80;     /* Erreurs/urgence */
}
```

## 🚨 Problèmes courants

### L'application ne s'installe pas en PWA
```bash
./deploy.sh test  # Vérifier les composants PWA
```
**Causes fréquentes** : Icônes manquantes, Service Worker inaccessible, cache navigateur

### Import CSV échoue  
**Solutions** : Vérifier l'encodage UTF-8, format de date YYYY-MM-DD préféré, guillemets pour horaires complexes

### Effacer le cache
```bash
# Dans Chrome : Ctrl+Shift+R
# Ou F12 → Application → Storage → Clear storage
```

## 🔮 Évolutions prévues

**Version 2.1** : Templates d'horaires, copie entre jours, validation avancée  
**Version 2.2** : Statistiques avancées, thèmes personnalisés, export PDF  
**Version 3.0** : Synchronisation cloud, mode équipe, notifications push

## 📄 Licence

MIT License - Libre d'utilisation, modification et distribution.

---

**Planning de Travail PWA** - Une solution moderne pour gérer vos plannings ! 📅✨