/**
 * Gestionnaire de thèmes - Planning de Travail PWA
 * Fichier: assets/js/ThemeManager.js
 */
class ThemeManager {
    constructor(app) {
        this.app = app;
        this.storageKey = 'planning-theme';
        this.isDarkTheme = this.loadThemePreference();
    }

    /**
     * Charge la préférence de thème sauvegardée
     */
    loadThemePreference() {
        const saved = localStorage.getItem(this.storageKey);
        return saved ? saved === 'dark' : false;
    }

    /**
     * Sauvegarde la préférence de thème
     */
    saveThemePreference() {
        try {
            localStorage.setItem(this.storageKey, this.isDarkTheme ? 'dark' : 'light');
            console.log(`🎨 Thème sauvegardé: ${this.isDarkTheme ? 'sombre' : 'clair'}`);
        } catch (error) {
            console.warn('⚠️ Impossible de sauvegarder le thème:', error);
        }
    }

    /**
     * Détection automatique du thème système
     */
    handleAutoTheme() {
        if (!localStorage.getItem(this.storageKey)) {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            this.isDarkTheme = prefersDark;
            this.applyTheme();
            console.log(`🌓 Thème automatique détecté: ${prefersDark ? 'sombre' : 'clair'}`);
        }
    }

    /**
     * Applique le thème à l'interface
     */
    applyTheme() {
        document.body.classList.toggle('dark-theme', this.isDarkTheme);
        
        // Mettre à jour l'icône du bouton
        if (this.app.themeToggle) {
            this.app.themeToggle.textContent = this.isDarkTheme ? '☀️' : '🌙';
            this.app.themeToggle.title = this.isDarkTheme ? 'Mode clair' : 'Mode sombre';
        }

        // Mettre à jour la couleur du thème PWA
        this.updatePWAThemeColor();
        
        console.log(`🎨 Thème appliqué: ${this.isDarkTheme ? 'sombre' : 'clair'}`);
    }

    /**
     * Bascule entre les thèmes
     */
    toggleTheme() {
        this.isDarkTheme = !this.isDarkTheme;
        this.applyTheme();
        this.saveThemePreference();
        
        // Animation de transition
        this.animateThemeTransition();
        
        // Notifier le changement
        this.app.showSaveIndicator(
            `🎨 Mode ${this.isDarkTheme ? 'sombre' : 'clair'} activé`
        );
    }

    /**
     * Lie la détection automatique du thème système
     */
    bindAutoThemeDetection() {
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            
            // Écouter les changements du thème système
            const handler = () => this.handleAutoTheme();
            
            if (mediaQuery.addListener) {
                mediaQuery.addListener(handler);
            } else if (mediaQuery.addEventListener) {
                mediaQuery.addEventListener('change', handler);
            }
            
            // Appliquer le thème initial
            this.handleAutoTheme();
        }
    }

    /**
     * Met à jour la couleur de thème PWA
     */
    updatePWAThemeColor() {
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            metaThemeColor.content = this.isDarkTheme ? '#1a1a2e' : '#64b5f6';
        }
    }

    /**
     * Animation de transition de thème
     */
    animateThemeTransition() {
        // Ajouter une classe temporaire pour l'animation
        document.body.classList.add('theme-transition');
        
        // Retirer la classe après l'animation
        setTimeout(() => {
            document.body.classList.remove('theme-transition');
        }, 300);
    }

    /**
     * Obtient le thème actuel
     */
    getCurrentTheme() {
        return this.isDarkTheme ? 'dark' : 'light';
    }

    /**
     * Définit un thème spécifique
     */
    setTheme(themeName) {
        if (themeName === 'dark' || themeName === 'light') {
            this.isDarkTheme = themeName === 'dark';
            this.applyTheme();
            this.saveThemePreference();
            return true;
        }
        console.warn('⚠️ Thème invalide:', themeName);
        return false;
    }

    /**
     * Réinitialise le thème aux préférences système
     */
    resetToSystemTheme() {
        localStorage.removeItem(this.storageKey);
        this.handleAutoTheme();
        this.app.showSaveIndicator('🌓 Thème remis aux préférences système');
    }

    /**
     * Obtient les statistiques du thème
     */
    getThemeStats() {
        return {
            current: this.getCurrentTheme(),
            isSystemPreference: !localStorage.getItem(this.storageKey),
            systemPrefersDark: window.matchMedia('(prefers-color-scheme: dark)').matches,
            canDetectSystem: !!window.matchMedia
        };
    }

    /**
     * Prévisualise un thème temporairement
     */
    previewTheme(themeName, duration = 3000) {
        const originalTheme = this.isDarkTheme;
        
        if (this.setTheme(themeName)) {
            this.app.showSaveIndicator(`👁️ Aperçu du thème ${themeName}`, duration);
            
            // Restaurer après la durée spécifiée
            setTimeout(() => {
                this.isDarkTheme = originalTheme;
                this.applyTheme();
                this.app.showSaveIndicator('🔄 Thème restauré');
            }, duration);
        }
    }

    /**
     * Active le mode automatique selon l'heure
     */
    enableAutoTimeTheme() {
        const now = new Date();
        const hour = now.getHours();
        
        // Mode sombre entre 20h et 7h
        const shouldBeDark = hour >= 20 || hour < 7;
        
        if (this.isDarkTheme !== shouldBeDark) {
            this.setTheme(shouldBeDark ? 'dark' : 'light');
            this.app.showSaveIndicator(
                `🕐 Thème automatique: ${shouldBeDark ? 'sombre' : 'clair'} (${hour}h)`
            );
        }
    }

    /**
     * Nettoie les ressources du gestionnaire
     */
    cleanup() {
        // Nettoyer les event listeners si nécessaire
        console.log('🧹 ThemeManager nettoyé');
    }
}