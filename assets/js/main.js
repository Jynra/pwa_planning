/**
 * Point d'entrée de l'application Planning de Travail - PWA
 * Version avec système de profils et nouvelles fonctionnalités
 */

/**
 * Initialisation de l'application
 */
document.addEventListener('DOMContentLoaded', () => {
    // Vérifier que toutes les classes sont disponibles
    if (typeof TimeUtils === 'undefined' || 
        typeof DataManager === 'undefined' || 
        typeof WeekManager === 'undefined' ||
        typeof ProfileManager === 'undefined' ||
        typeof PlanningManager === 'undefined' ||
        typeof PlanningApp === 'undefined') {
        console.error('Erreur: Classes manquantes. Vérifiez que tous les fichiers JS sont chargés.');
        showInitError('Classes manquantes');
        return;
    }

    // Initialiser l'application
    try {
        window.planningApp = new PlanningApp();
        console.log('✅ Planning de Travail - Application avec profils et nouvelles fonctionnalités initialisée');
        
        // Attacher les événements de fermeture
        attachCleanupEvents();
        
        // Debug en mode développement
        if (isDevMode()) {
            enableDebugMode();
        }
        
    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation de l\'application:', error);
        showInitError('Erreur d\'initialisation', error.message);
    }
});

/**
 * Vérifie si on est en mode développement
 */
function isDevMode() {
    return window.location.hostname === 'localhost' || 
           window.location.hostname === '127.0.0.1' ||
           window.location.search.includes('debug=true');
}

/**
 * Active le mode debug
 */
function enableDebugMode() {
    console.log('🔧 Mode développement activé');
    
    // Exposer des utilitaires de debug
    window.debugApp = () => window.planningApp.debug();
    window.getProfiles = () => window.planningApp.profileManager.getAllProfiles();
    window.getCurrentProfile = () => window.planningApp.profileManager.getCurrentProfile();
    window.switchProfile = (id) => window.planningApp.profileManager.switchToProfile(id);
    
    // NOUVEAU : Fonctions pour les nouvelles fonctionnalités
    window.addDay = () => window.planningApp.showAddDayDialog();
    window.createBlankPlanning = () => window.planningApp.showCreateBlankPlanningDialog();
    
    // Raccourci clavier pour debug
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.altKey && e.key === 'D') {
            window.debugApp();
        }
    });
    
    console.log('🔍 Commandes debug disponibles:');
    console.log('  - debugApp() : État de l\'application');
    console.log('  - getProfiles() : Liste des profils');
    console.log('  - getCurrentProfile() : Profil actuel');
    console.log('  - switchProfile(id) : Basculer vers un profil');
    console.log('  - addDay() : Ajouter un jour');
    console.log('  - createBlankPlanning() : Créer un planning vierge');
    console.log('🎹 Raccourcis disponibles:');
    console.log('  - Ctrl+Alt+D : Debug');
    console.log('  - Ctrl+S : Sauvegarder');
    console.log('  - Ctrl+P : Profils');
    console.log('  - Ctrl+D : Ajouter un jour');
    console.log('  - Ctrl+N : Planning vierge');
}

/**
 * Attache les événements de nettoyage
 */
function attachCleanupEvents() {
    // Sauvegarde avant fermeture de la page
    window.addEventListener('beforeunload', (e) => {
        if (window.planningApp) {
            window.planningApp.beforeUnload();
        }
    });
    
    // Sauvegarde périodique (toutes les 30 secondes)
    setInterval(() => {
        if (window.planningApp && window.planningApp.profileManager) {
            window.planningApp.profileManager.saveCurrentProfileData();
        }
    }, 30000);
    
    // Sauvegarde lors de la perte de focus
    window.addEventListener('blur', () => {
        if (window.planningApp && window.planningApp.profileManager) {
            window.planningApp.profileManager.saveCurrentProfileData();
        }
    });
}

/**
 * Affiche une erreur d'initialisation
 */
function showInitError(title, details = '') {
    const container = document.querySelector('.container');
    if (container) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #ff6b6b;">
                <div style="font-size: 3rem; margin-bottom: 20px;">⚠️</div>
                <h2>${title}</h2>
                <p>Une erreur s'est produite lors du chargement de l'application.</p>
                ${details ? `<p style="font-size: 0.9rem; margin-top: 15px; color: #666;">${details}</p>` : ''}
                <p style="font-size: 0.9rem; margin-top: 20px;">
                    Veuillez recharger la page ou vérifier votre connexion.
                </p>
                <button onclick="window.location.reload()" 
                        style="margin-top: 20px; padding: 12px 24px; 
                               background: #64b5f6; color: white; 
                               border: none; border-radius: 25px; cursor: pointer;
                               font-size: 0.9rem; font-weight: 600;">
                    🔄 Recharger la page
                </button>
                <br><br>
                <details style="text-align: left; max-width: 500px; margin: 0 auto;">
                    <summary style="cursor: pointer; color: #666; font-size: 0.8rem;">Informations techniques</summary>
                    <div style="margin-top: 10px; padding: 15px; background: #f5f5f5; border-radius: 8px; font-family: monospace; font-size: 0.75rem; color: #333;">
                        <strong>User Agent:</strong> ${navigator.userAgent}<br>
                        <strong>URL:</strong> ${window.location.href}<br>
                        <strong>Timestamp:</strong> ${new Date().toISOString()}<br>
                        <strong>Classes disponibles:</strong><br>
                        - TimeUtils: ${typeof TimeUtils !== 'undefined' ? '✅' : '❌'}<br>
                        - DataManager: ${typeof DataManager !== 'undefined' ? '✅' : '❌'}<br>
                        - WeekManager: ${typeof WeekManager !== 'undefined' ? '✅' : '❌'}<br>
                        - ProfileManager: ${typeof ProfileManager !== 'undefined' ? '✅' : '❌'}<br>
                        - PlanningManager: ${typeof PlanningManager !== 'undefined' ? '✅' : '❌'}<br>
                        - PlanningApp: ${typeof PlanningApp !== 'undefined' ? '✅' : '❌'}
                    </div>
                </details>
            </div>
        `;
    }
}

/**
 * Enregistrement du service worker pour PWA
 */
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(registration => {
                console.log('✅ Service Worker enregistré:', registration);
                
                // Écouter les mises à jour du service worker
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // Nouvelle version disponible
                            if (window.planningApp) {
                                window.planningApp.showSaveIndicator('🔄 Nouvelle version disponible', 4000);
                                
                                // Proposer la mise à jour après 5 secondes
                                setTimeout(() => {
                                    if (confirm('Une nouvelle version est disponible. Voulez-vous recharger l\'application ?')) {
                                        window.location.reload();
                                    }
                                }, 5000);
                            }
                        }
                    });
                });
            })
            .catch(error => {
                console.warn('⚠️ Erreur Service Worker:', error);
            });
    });
}

/**
 * Gestion des erreurs globales
 */
window.addEventListener('error', (event) => {
    console.error('❌ Erreur JavaScript:', event.error);
    
    // En mode développement, afficher l'erreur
    if (isDevMode()) {
        console.group('🐛 Détails de l\'erreur');
        console.error('Message:', event.message);
        console.error('Fichier:', event.filename);
        console.error('Ligne:', event.lineno);
        console.error('Colonne:', event.colno);
        console.error('Stack:', event.error?.stack);
        console.groupEnd();
    }
    
    // Notifier l'utilisateur si l'app est initialisée
    if (window.planningApp) {
        window.planningApp.showError('Une erreur s\'est produite. Vérifiez la console.');
    }
});

/**
 * Gestion des promesses rejetées
 */
window.addEventListener('unhandledrejection', (event) => {
    console.error('❌ Promise rejetée:', event.reason);
    
    if (isDevMode()) {
        console.group('🐛 Promise rejetée');
        console.error('Raison:', event.reason);
        console.error('Promise:', event.promise);
        console.groupEnd();
    }
    
    // Empêcher l'affichage dans la console du navigateur
    event.preventDefault();
    
    // Notifier l'utilisateur
    if (window.planningApp) {
        window.planningApp.showError('Erreur asynchrone détectée.');
    }
});

/**
 * Détection de la connectivité
 */
window.addEventListener('online', () => {
    console.log('🌐 Connexion rétablie');
    if (window.planningApp) {
        window.planningApp.showSaveIndicator('🌐 Connexion rétablie', 2000);
        
        // Tenter une sauvegarde de sécurité
        setTimeout(() => {
            if (window.planningApp.profileManager) {
                window.planningApp.profileManager.saveCurrentProfileData();
            }
        }, 1000);
    }
});

window.addEventListener('offline', () => {
    console.log('📡 Mode hors ligne');
    if (window.planningApp) {
        window.planningApp.showSaveIndicator('📡 Mode hors ligne - Données sauvegardées localement', 3000);
    }
});

/**
 * Gestion du changement de visibilité de la page
 */
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && window.planningApp) {
        // La page redevient visible
        console.log('👁️ Page visible');
        window.planningApp.displayManager.updateCurrentMonth();
        
        // Vérifier l'intégrité des profils
        if (window.planningApp.profileManager) {
            const currentProfile = window.planningApp.profileManager.getCurrentProfile();
            if (currentProfile) {
                console.log(`👤 Profil actuel: ${currentProfile.name}`);
            }
        }
    } else if (document.hidden && window.planningApp) {
        // La page devient cachée, sauvegarder
        console.log('👁️ Page cachée - Sauvegarde');
        if (window.planningApp.profileManager) {
            window.planningApp.profileManager.saveCurrentProfileData();
        }
    }
});

/**
 * Gestion des raccourcis clavier globaux
 */
document.addEventListener('keydown', (e) => {
    // Ctrl+S pour sauvegarder
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        if (window.planningApp && window.planningApp.profileManager) {
            const saved = window.planningApp.profileManager.saveCurrentProfileData();
            const message = saved ? '💾 Profil sauvegardé' : '❌ Erreur de sauvegarde';
            window.planningApp.showSaveIndicator(message, 2000);
        }
    }
    
    // Ctrl+P pour ouvrir les profils
    if (e.ctrlKey && e.key === 'p') {
        e.preventDefault();
        if (window.planningApp && window.planningApp.profilesMenuItem) {
            window.planningApp.profilesMenuItem.click();
        }
    }
    
    // NOUVEAU : Ctrl+D pour ajouter un jour
    if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        if (window.planningApp) {
            window.planningApp.showAddDayDialog();
        }
    }
    
    // NOUVEAU : Ctrl+N pour créer un planning vierge
    if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        if (window.planningApp) {
            window.planningApp.showCreateBlankPlanningDialog();
        }
    }
    
    // F5 pour actualiser avec confirmation si données non sauvegardées
    if (e.key === 'F5') {
        if (window.planningApp && window.planningApp.editManager) {
            const stats = window.planningApp.editManager.getEditStats();
            if (stats.hasUnsavedChanges) {
                e.preventDefault();
                if (confirm('Vous avez des modifications non sauvegardées. Actualiser quand même ?')) {
                    window.location.reload();
                }
            }
        }
    }
});

/**
 * Gestion du redimensionnement
 */
window.addEventListener('resize', () => {
    // Optimisation pour éviter trop d'appels
    clearTimeout(window.resizeTimeout);
    window.resizeTimeout = setTimeout(() => {
        if (window.planningApp) {
            console.log('📱 Redimensionnement détecté');
            // Ici on pourrait ajuster l'interface si nécessaire
        }
    }, 250);
});

/**
 * Performance monitoring en mode dev
 */
if (isDevMode()) {
    window.addEventListener('load', () => {
        // Mesurer le temps de chargement
        const loadTime = performance.now();
        console.log(`⚡ Temps de chargement: ${Math.round(loadTime)}ms`);
        
        // Mesurer l'utilisation mémoire (si disponible)
        if (performance.memory) {
            const memory = performance.memory;
            console.log(`🧠 Mémoire utilisée: ${Math.round(memory.usedJSHeapSize / 1024 / 1024)}MB`);
        }
    });
}

/**
 * Exportation pour les tests (si nécessaire)
 */
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        isDevMode,
        enableDebugMode,
        attachCleanupEvents
    };
}