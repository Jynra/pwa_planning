/**
 * Point d'entrée de l'application Planning de Travail - PWA
 */

/**
 * Initialisation de l'application
 */
document.addEventListener('DOMContentLoaded', () => {
    // Vérifier que toutes les classes sont disponibles
    if (typeof TimeUtils === 'undefined' || 
        typeof DataManager === 'undefined' || 
        typeof WeekManager === 'undefined' || 
        typeof PlanningApp === 'undefined') {
        console.error('Erreur: Classes manquantes. Vérifiez que tous les fichiers JS sont chargés.');
        return;
    }

    // Initialiser l'application
    try {
        window.planningApp = new PlanningApp();
        console.log('Planning de Travail - Application initialisée avec succès');
    } catch (error) {
        console.error('Erreur lors de l\'initialisation de l\'application:', error);
        
        // Afficher un message d'erreur à l'utilisateur
        const container = document.querySelector('.container');
        if (container) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #ff6b6b;">
                    <div style="font-size: 3rem; margin-bottom: 20px;">⚠️</div>
                    <h2>Erreur d'initialisation</h2>
                    <p>Une erreur s'est produite lors du chargement de l'application.</p>
                    <p style="font-size: 0.9rem; margin-top: 20px;">
                        Veuillez recharger la page ou vérifier votre connexion.
                    </p>
                    <button onclick="window.location.reload()" 
                            style="margin-top: 20px; padding: 10px 20px; 
                                   background: #64b5f6; color: white; 
                                   border: none; border-radius: 25px; cursor: pointer;">
                        Recharger la page
                    </button>
                </div>
            `;
        }
    }
});

/**
 * Enregistrement du service worker pour PWA
 */
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(registration => {
                console.log('Service Worker enregistré avec succès:', registration);
                
                // Écouter les mises à jour du service worker
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // Nouvelle version disponible
                            if (window.planningApp) {
                                window.planningApp.showSaveIndicator('🔄 Nouvelle version disponible');
                            }
                        }
                    });
                });
            })
            .catch(error => {
                console.log('Erreur lors de l\'enregistrement du Service Worker:', error);
            });
    });
}

/**
 * Gestion des erreurs globales
 */
window.addEventListener('error', (event) => {
    console.error('Erreur JavaScript:', event.error);
    
    // En mode développement, afficher l'erreur
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.error('Détails de l\'erreur:', {
            message: event.message,
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
            error: event.error
        });
    }
});

/**
 * Gestion des promesses rejetées
 */
window.addEventListener('unhandledrejection', (event) => {
    console.error('Promise rejetée:', event.reason);
    event.preventDefault(); // Empêche l'affichage dans la console du navigateur
});

/**
 * Détection de la connectivité
 */
window.addEventListener('online', () => {
    if (window.planningApp) {
        window.planningApp.showSaveIndicator('🌐 Connexion rétablie');
    }
});

window.addEventListener('offline', () => {
    if (window.planningApp) {
        window.planningApp.showSaveIndicator('📡 Mode hors ligne');
    }
});

/**
 * Gestion du changement de visibilité de la page
 */
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && window.planningApp) {
        // La page redevient visible, on peut mettre à jour les données si nécessaire
        window.planningApp.updateCurrentMonth();
    }
});

/**
 * Raccourcis clavier
 */
document.addEventListener('keydown', (event) => {
    if (!window.planningApp) return;
    
    // Échapper pour fermer les modales/états actifs
    if (event.key === 'Escape') {
        // Logique pour fermer des éléments si nécessaire
    }
    
    // Navigation avec les flèches (si Ctrl est pressé)
    if (event.ctrlKey) {
        switch (event.key) {
            case 'ArrowLeft':
                event.preventDefault();
                window.planningApp.navigateWeek(-1);
                break;
            case 'ArrowRight':
                event.preventDefault();
                window.planningApp.navigateWeek(1);
                break;
            case 'Home':
                event.preventDefault();
                window.planningApp.goToCurrentWeek();
                break;
        }
    }
});