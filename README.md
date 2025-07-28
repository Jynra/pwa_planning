# 📅 Planning de Travail - PWA

Une application web progressive (PWA) moderne et intuitive pour visualiser et gérer vos plannings de travail semaine par semaine. Interface mobile-first avec support complet des horaires multiples, horaires de nuit, **édition en ligne**, et **gestion de profils multiples**.

![Planning de Travail](https://img.shields.io/badge/PWA-Ready-brightgreen) ![Version](https://img.shields.io/badge/version-2.1.0-blue) ![License](https://img.shields.io/badge/license-MIT-green) ![Docker](https://img.shields.io/badge/Docker-Supported-blue)

## ✨ Fonctionnalités principales

- **🚀 Installation native** sur smartphone (Android/iOS) et desktop
- **📊 Import CSV intelligent** avec détection automatique des formats
- **✏️ Édition en ligne** des horaires jour par jour avec validation temps réel
- **👤 Gestion de profils** - Créez et gérez plusieurs plannings séparés
- **⏰ Gestion avancée** des horaires multiples et de nuit
- **🌙 Mode sombre** adaptatif avec détection système
- **💾 Fonctionnement hors ligne** avec sauvegarde locale automatique par profil
- **📱 Design mobile-first** responsive avec animations fluides

## 🚀 Installation et déploiement

### Prérequis
- **Docker** et **Docker Compose** installés
- **Port 4047** disponible (configurable)

### Déploiement rapide

```bash
# 1. Cloner le projet
git clone https://github.com/Jynra/pwa_planning
cd pwa_planning

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

## 👤 Système de Profils

### Gestion des profils multiples
- **Créer** des profils séparés pour différents contextes (Travail, Freelance, Formation...)
- **Basculer** instantanément entre profils avec sauvegarde automatique
- **Isoler** complètement les données de chaque profil
- **Supprimer** des profils avec confirmation et basculement automatique

### Utilisation des profils
1. **Accès** : Menu Options ⚙️ → Profils 👤
2. **Création** : Bouton "Nouveau" → Saisir le nom
3. **Sélection** : Clic sur le profil désiré
4. **Gestion** : Éditer ✏️ ou Supprimer 🗑️ via les boutons d'action

### Affichage du profil actuel
- **Header principal** : Badge bleu avec nom du profil actuel
- **Sauvegarde automatique** : Toutes les 30 secondes + à chaque changement
- **Persistance** : Le profil actif est mémorisé entre les sessions

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
- **👤 Profils** : Gérer les profils multiples
- **🌙 Mode sombre** : Basculer entre thème clair/sombre
- **🔄 Réinitialiser** : Effacer le planning du profil actuel

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
├── ProfileManager.js   # Gestion des profils multiples (NOUVEAU)
├── DataManager.js      # Gestion CSV et sauvegarde locale
├── WeekManager.js      # Navigation par semaines
├── EditManager.js      # Édition des horaires
├── ThemeManager.js     # Gestion des thèmes
├── DisplayManager.js   # Affichage et statistiques
└── FileManager.js      # Import/Export fichiers
```

```
assets/css/
├── variables.css       # Variables CSS et thèmes
├── layout.css          # Structure et mise en page
├── components.css      # Composants réutilisables
├── profiles.css        # Styles système de profils (NOUVEAU)
├── edit.css           # Interface d'édition
└── responsive.css      # Adaptations mobiles
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

## ⌨️ Raccourcis clavier

- **Ctrl + S** : Sauvegarder le profil actuel
- **Ctrl + P** : Ouvrir la gestion des profils
- **Échap** : Fermer les modales/annuler l'édition
- **F5** : Actualiser avec vérification des modifications non sauvegardées

## 💾 Stockage des données

### Organisation par profil
- **Profils** : `planning-profiles` (liste des profils)
- **Profil actuel** : `planning-current-profile` (ID du profil actif)
- **Données profil** : `planning-data-{profileId}` (données CSV par profil)
- **Métadonnées** : `planning-meta-{profileId}` (stats et infos par profil)

### Sauvegarde automatique
- **Intervalles** : Toutes les 30 secondes
- **Événements** : Changement de profil, modification, perte de focus
- **Sécurité** : Sauvegarde avant fermeture de page

## 🚨 Problèmes courants

### L'application ne s'installe pas en PWA
```bash
./deploy.sh test  # Vérifier les composants PWA
```
**Causes fréquentes** : Icônes manquantes, Service Worker inaccessible, cache navigateur

### Import CSV échoue  
**Solutions** : Vérifier l'encodage UTF-8, format de date YYYY-MM-DD préféré, guillemets pour horaires complexes

### Profils ne se chargent pas
**Solutions** : 
- Vérifier la console (F12) pour erreurs JavaScript
- Effacer le cache navigateur (Ctrl+Shift+R)
- Vérifier le localStorage (F12 → Application → Local Storage)

### Données perdues entre profils
**Diagnostic** : Chaque profil a ses propres données isolées
- Vérifier que vous êtes sur le bon profil (badge bleu dans le header)
- Les données sont automatiquement sauvegardées à chaque changement

### Effacer le cache
```bash
# Dans Chrome : Ctrl+Shift+R
# Ou F12 → Application → Storage → Clear storage
```

## 🔍 Mode développement

### Commandes debug (console)
- `debugApp()` : Afficher l'état complet de l'application
- `getProfiles()` : Lister tous les profils
- `getCurrentProfile()` : Profil actuellement actif
- `switchProfile(id)` : Basculer vers un profil spécifique

### Raccourci debug
- **Ctrl + Alt + D** : Afficher les informations de debug

## 🆕 Nouveautés v2.1.0

### ✨ Système de profils
- **Gestion complète** des profils multiples
- **Interface intuitive** de création/édition/suppression
- **Isolation parfaite** des données entre profils
- **Basculement automatique** lors de suppression

### 🔧 Améliorations techniques
- **Initialisation optimisée** pour éviter les conflits
- **Sauvegarde renforcée** avec vérifications d'intégrité
- **Gestion d'erreurs** améliorée avec fallbacks
- **Logs détaillés** pour faciliter le debugging

### 🎨 Interface
- **Badge profil actuel** dans le header principal
- **Modale moderne** pour la gestion des profils
- **Messages contextuels** selon les actions
- **Animations fluides** pour les transitions

## 📄 Licence

MIT License - Libre d'utilisation, modification et distribution.

---

**Planning de Travail PWA v2.1** - Une solution moderne et flexible pour gérer tous vos plannings ! 📅✨👤