# 📅 Planning de Travail - PWA

Une application web progressive (PWA) moderne pour visualiser et gérer vos plannings de travail semaine par semaine. Interface mobile-first avec support complet des horaires multiples et de nuit.

![Planning de Travail](https://img.shields.io/badge/PWA-Ready-brightgreen) ![Version](https://img.shields.io/badge/version-1.0.0-blue) ![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Fonctionnalités

### 📱 **Interface mobile native**
- PWA installable sur Android/iOS
- Design responsive et optimisé mobile
- Gestes tactiles natifs
- Mode standalone

### 📊 **Import CSV avancé**
- Support de multiples formats de date (YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY)
- Détection automatique des colonnes
- Parser CSV robuste avec gestion des guillemets
- Validation et normalisation des données

### ⏰ **Horaires multiples**
- Support de plusieurs créneaux par jour
- **Séparateurs supportés :**
  - `|` : `08:00-12:00 | 14:00-18:00`
  - `puis` : `10:00-15:00 puis 18:00-22:00`
  - `/` : `09:00-13:00 / 15:00-17:00`
  - `+` : `08:00-12:00 + 14:00-18:00`
  - `et` : `09:00-13:00 et 15:00-17:00`

### 🌙 **Horaires de nuit**
- Détection automatique (ex: `22:00-06:00`)
- Calcul correct des durées sur 24h
- Badge "Nuit" spécial violet
- Support des équipes de nuit

### 💾 **Sauvegarde automatique**
- Stockage local persistant du dernier planning
- Indicateur visuel de sauvegarde
- Récupération automatique au démarrage
- Gestion des erreurs de données corrompues

### 📅 **Navigation intelligente**
- Vue hebdomadaire adaptive (affiche uniquement les jours présents)
- Navigation entre semaines avec flèches
- Bouton "Aujourd'hui" pour retour rapide
- Indication "Semaine Actuelle"
- Dates cohérentes avec les données affichées

### 🎯 **Badges et indicateurs visuels**
- **"Aujourd'hui"** vert pour la journée courante
- **"Repos"** orange pour les jours de congé
- **"Coupure"** rouge pour horaires multiples
- **"Nuit"** violet pour horaires nocturnes
- Statistiques de semaine en temps réel

### 🌙 **Mode sombre intelligent**
- Détection automatique des préférences système
- Basculement manuel persistant
- Thème sauvegardé localement
- Variables CSS pour cohérence

### 🔄 **Données d'exemple**
- Planning de démonstration pré-chargé
- 3 semaines d'exemples avec différents types d'horaires
- Bouton reset pour revenir aux exemples
- Cas d'usage variés (nuit, coupure, repos)

### ⏱️ **Calculs automatiques**
- Temps total par jour affiché
- Durée de chaque créneau
- Statistiques hebdomadaires (total, jours travaillés, moyenne)
- Gestion correcte des horaires de nuit

## 📋 Format CSV

### Structure standard
```csv
date,horaire,poste,taches
2025-06-30,08:00-16:00,Bureau,Réunion équipe
2025-07-01,09:00-17:00,Site A,Formation
2025-07-02,Repos,Congé,Jour de repos
```

### Horaires multiples
```csv
date,horaire,poste,taches
2025-06-30,"08:00-12:00 | 14:00-18:00",Bureau Principal,"Matin: réunions, après-midi: formation"
2025-07-01,10:00-15:00 puis 18:00-22:00,Site A,Supervision jour et nuit
2025-07-02,09:00-13:00 / 15:00-17:00,Site B,Double vacation
2025-07-03,22:00-06:00,Site C,Équipe de nuit (8h)
2025-07-04,Repos,Congé,Jour de repos
```

### Colonnes supportées
- **`date`** : Date au format YYYY-MM-DD (recommandé), DD/MM/YYYY ou DD-MM-YYYY
- **`horaire`** : Plage horaire simple, multiple ou "Repos"
- **`poste`** : Lieu de travail ou site
- **`taches`** : Description des activités

### Aliases de colonnes
L'application reconnaît automatiquement ces variations :
- **Date :** `date`, `jour`
- **Horaire :** `horaire`, `horaires`, `time`, `heures`
- **Poste :** `poste`, `lieu`, `location`, `site`
- **Tâches :** `taches`, `tache`, `task`, `description`, `activite`, `activites`

## 🚀 Installation

### Option 1 : PWA (Recommandé)
1. Ouvrez l'application dans votre navigateur
2. Sur mobile : Menu navigateur → "Ajouter à l'écran d'accueil"
3. Sur desktop : Icône d'installation dans la barre d'adresse

### Option 2 : Fichier local
1. Téléchargez le fichier HTML
2. Ouvrez-le dans votre navigateur
3. Toutes les fonctionnalités sont disponibles hors ligne

## 💡 Utilisation

### Premier démarrage
1. **Données d'exemple** chargées automatiquement
2. **Semaine courante** détectée et affichée
3. **Navigation** avec les flèches ← →

### Import de votre planning
1. Cliquez sur **"📁 Import CSV"**
2. Sélectionnez votre fichier CSV
3. Le planning se charge automatiquement
4. **Sauvegarde automatique** en local

### Navigation
- **← →** : Naviguer entre les semaines
- **📅 Aujourd'hui** : Retour à la semaine courante
- **🔄 Reset** : Revenir aux données d'exemple
- **🌙/☀️** : Basculer le mode sombre

### Statistiques
- **Total semaine** : Heures travaillées
- **Jours travaillés** : Nombre de jours (hors repos)
- **Moyenne/jour** : Heures moyennes par jour travaillé

## 🔧 Fonctionnalités techniques

### PWA
- **Service Worker** enregistré automatiquement
- **Manifest** pour installation mobile
- **Icône** personnalisée
- **Mode standalone** sur mobile

### Stockage
- **localStorage** pour persistance des données
- **Préférences thème** sauvegardées
- **Gestion d'erreurs** pour données corrompues
- **Pas de serveur requis**

### Compatibilité
- **Tous navigateurs modernes**
- **iOS Safari** (PWA support)
- **Android Chrome** (PWA support)
- **Desktop** (Chrome, Firefox, Safari, Edge)

### Performance
- **Chargement instantané**
- **Fonctionnement hors ligne**
- **Animations fluides** (CSS transitions)
- **Responsive design** adaptatif

## 🎨 Personnalisation

### Thèmes
- **Mode clair** : Couleurs douces et modernes
- **Mode sombre** : Interface adaptée vision nocturne
- **Variables CSS** : Facile à personnaliser
- **Détection automatique** des préférences système

### Couleurs des badges
- **Vert** : Aujourd'hui, total heures
- **Orange** : Repos, reset
- **Rouge** : Horaires multiples/coupure
- **Violet** : Horaires de nuit
- **Bleu** : Navigation, accents

## 📱 Screenshots

### Mode clair
- Interface épurée avec cartes blanches
- Fond dégradé bleu clair
- Badges colorés distinctifs

### Mode sombre
- Interface sombre pour usage nocturne
- Cartes grises sur fond sombre
- Même fonctionnalités préservées

### Mobile
- Design optimisé tactile
- Boutons suffisamment grands
- Navigation intuitive

## 🔄 Mises à jour

### Version 1.0.0 (Actuelle)
- ✅ Import CSV avec horaires multiples
- ✅ Gestion horaires de nuit
- ✅ Sauvegarde automatique
- ✅ Mode sombre avec persistance
- ✅ PWA complète
- ✅ Navigation intelligente
- ✅ Calculs automatiques
- ✅ Interface française complète

### Fonctionnalités futures possibles
- Export PDF du planning
- Synchronisation cloud
- Notifications de rappel
- Intégration calendrier
- Thèmes personnalisés
- Multi-langues

## 🐛 Problèmes connus

### Limitations
- **localStorage uniquement** : Pas de sync entre appareils
- **Pas de backup cloud** : Données locales seulement
- **Import CSV seulement** : Pas d'autres formats

### Solutions
- **Export manuel** des données importantes
- **Sauvegarde CSV** avant reset
- **Test sur petit planning** avant import complet

## 📄 License

MIT License - Libre d'utilisation, modification et distribution.

## 🤝 Contribution

Cette application est un projet standalone complet. Pour des améliorations :

1. **Fork** le projet
2. **Modifiez** le code HTML/CSS/JS
3. **Testez** les fonctionnalités
4. **Partagez** vos améliorations

## 📞 Support

### Auto-diagnostic
1. **F12** → Console pour voir les erreurs
2. **Vider le cache** en cas de problème
3. **Tester avec données d'exemple** d'abord
4. **Vérifier format CSV** selon documentation

### Formats CSV problématiques
- **Encodage** : Utiliser UTF-8
- **Séparateurs** : Virgules standard
- **Dates** : Format YYYY-MM-DD recommandé
- **Guillemets** : Pour horaires avec séparateurs multiples

---

**Planning de Travail PWA** - Une solution moderne et intuitive pour gérer vos plannings ! 📅✨