/**
 * Application principale de Planning de Travail - PWA
 * Version refactorisée et modulaire avec EditManager
 */
class PlanningApp {
    constructor() {
        this.planningData = [];
        this.isDarkTheme = this.loadThemePreference();
        
        // Gestionnaires principaux
        this.dataManager = new DataManager();
        this.weekManager = new WeekManager();
        this.themeManager = new ThemeManager(this);
        this.displayManager = new DisplayManager(this);
        this.fileManager = new FileManager(this);
        
        // Gestionnaires d'édition
        this.editManager = new EditManager(this);
        this.editRenderer = new EditRenderer(this.editManager);
        
        this.initializeElements();
        this.bindEvents();
        this.themeManager.applyTheme();
        this.displayManager.updateCurrentMonth();
        
        // Initialisation avec chargement automatique
        this.initializeApp();
    }

    /**
     * Initialisation complète de l'application
     */
    async initializeApp() {
        console.log('🚀 Initialisation de Planning de Travail...');
        
        // Vérifier la disponibilité du stockage
        if (!this.dataManager.isStorageAvailable()) {
            this.displayManager.showError('Stockage local non disponible. Les données ne pourront pas être sauvegardées.');
            this.displayManager.showNoData();
            return;
        }

        // Afficher les stats de stockage en console
        const stats = this.dataManager.getStorageStats();
        console.log('📊 Stats stockage:', stats);

        // Tenter de charger les données sauvegardées
        this.loadSavedDataWithFeedback();
    }

    /**
     * Charge les données avec feedback utilisateur
     */
    loadSavedDataWithFeedback() {
        console.log('📂 Tentative de chargement du planning sauvegardé...');
        this.displayManager.showLoading();
        
        setTimeout(() => {
            try {
                const data = this.dataManager.loadSavedData();
                
                if (data && data.length > 0) {
                    this.planningData = data;
                    this.processDataWithValidation();
                    
                    const stats = this.dataManager.getStorageStats();
                    this.displayManager.showSaveIndicator(`📂 Planning restauré (${stats.dataCount} entrées)`);
                    console.log('✅ Planning chargé avec succès');
                } else {
                    console.log('📋 Aucun planning sauvegardé trouvé');
                    this.displayManager.showNoDataWithHelp();
                }
            } catch (error) {
                console.error('❌ Erreur lors du chargement:', error);
                this.displayManager.showError('Erreur lors du chargement du planning sauvegardé');
                this.displayManager.showNoDataWithHelp();
            }
        }, 300);
    }

    /**
     * Traitement des données avec validation
     */
    processDataWithValidation() {
        if (!this.planningData || this.planningData.length === 0) {
            this.displayManager.showNoDataWithHelp();
            return;
        }

        try {
            // Reconstituer les objets Date si nécessaire
            this.planningData = this.planningData.map(entry => {
                if (entry.dateObj && typeof entry.dateObj === 'string') {
                    entry.dateObj = new Date(entry.dateObj);
                } else if (!entry.dateObj && entry.date) {
                    entry.dateObj = this.dataManager.parseDate(entry.date);
                }
                return entry;
            });

            // Filtrer les entrées avec des dates invalides
            const validData = this.planningData.filter(entry => 
                entry.dateObj && !isNaN(entry.dateObj.getTime())
            );

            if (validData.length !== this.planningData.length) {
                console.warn(`⚠️ ${this.planningData.length - validData.length} entrées avec dates invalides ignorées`);
                this.planningData = validData;
            }

            if (this.planningData.length === 0) {
                this.displayManager.showNoDataWithHelp();
                return;
            }

            // Organiser et afficher
            this.weekManager.organizeWeeks(this.planningData);
            
            if (!this.weekManager.hasWeeks()) {
                this.displayManager.showNoDataWithHelp();
                return;
            }
            
            this.weekManager.findCurrentWeek();
            this.displayWeek();
            this.displayManager.showPlanning();
            this.displayManager.updateFooter();
            
            console.log(`✅ Planning affiché: ${this.planningData.length} entrées sur ${this.weekManager.getWeeks().length} semaines`);
            
        } catch (error) {
            console.error('❌ Erreur lors du traitement des données:', error);
            this.displayManager.showError('Erreur lors du traitement du planning');
            this.displayManager.showNoDataWithHelp();
        }
    }

    /**
     * Initialise les références aux éléments DOM
     */
    initializeElements() {
        this.csvFileInput = document.getElementById('csvFile');
        this.importBtn = document.getElementById('importBtn');
        this.todayBtn = document.getElementById('todayBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.themeToggle = document.getElementById('themeToggle');
        this.weekNavigation = document.getElementById('weekNavigation');
        this.weekDates = document.getElementById('weekDates');
        this.currentBadge = document.getElementById('currentBadge');
        this.prevWeekBtn = document.getElementById('prevWeek');
        this.nextWeekBtn = document.getElementById('nextWeek');
        this.noData = document.getElementById('noData');
        this.loading = document.getElementById('loading');
        this.planningDisplay = document.getElementById('planningDisplay');
        this.footer = document.getElementById('footer');
        this.pageInfo = document.getElementById('pageInfo');
        this.eventCount = document.getElementById('eventCount');
        this.currentMonth = document.getElementById('currentMonth');
        this.saveIndicator = document.getElementById('saveIndicator');
        this.statsBar = document.getElementById('statsBar');
        this.totalHours = document.getElementById('totalHours');
        this.workDays = document.getElementById('workDays');
        this.avgHours = document.getElementById('avgHours');
    }

    /**
     * Lie les événements aux éléments
     */
    bindEvents() {
        this.csvFileInput.addEventListener('change', (e) => this.fileManager.handleFileLoad(e));
        this.todayBtn.addEventListener('click', () => this.goToCurrentWeek());
        this.resetBtn.addEventListener('click', () => this.resetPlanningWithConfirm());
        this.themeToggle.addEventListener('click', () => this.themeManager.toggleTheme());
        this.prevWeekBtn.addEventListener('click', () => this.navigateWeek(-1));
        this.nextWeekBtn.addEventListener('click', () => this.navigateWeek(1));

        // Déléguer la gestion des thèmes au ThemeManager
        this.themeManager.bindAutoThemeDetection();

        // Gestion de la visibilité de la page
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.handlePageVisible();
            }
        });
    }

    /**
     * Gestion du retour de visibilité de la page
     */
    handlePageVisible() {
        if (this.planningData.length > 0) {
            const stats = this.dataManager.getStorageStats();
            if (!stats.hasData) {
                console.warn('⚠️ Données perdues, rechargement...');
                this.loadSavedDataWithFeedback();
            }
        }
        this.displayManager.updateCurrentMonth();
    }

    /**
     * Gestion des thèmes (délégué au ThemeManager)
     */
    loadThemePreference() {
        return this.themeManager ? this.themeManager.loadThemePreference() : false;
    }

    /**
     * Reset avec confirmation
     */
    resetPlanningWithConfirm() {
        const stats = this.dataManager.getStorageStats();
        
        if (stats.hasData) {
            const message = `Êtes-vous sûr de vouloir effacer le planning ?\n\n` +
                          `Dernière sauvegarde: ${stats.lastSaved}\n` +
                          `Entrées: ${stats.dataCount}`;
                          
            if (confirm(message)) {
                this.resetPlanning();
            }
        } else {
            this.resetPlanning();
        }
    }

    /**
     * Reset du planning
     */
    resetPlanning() {
        this.displayManager.showLoading();
        
        // Effacer complètement les données
        this.planningData = [];
        this.weekManager.reset();
        this.dataManager.clearData();
        this.editManager.cleanup();
        
        // Reset de l'input file
        if (this.csvFileInput) {
            this.csvFileInput.value = '';
        }
        
        // Afficher l'écran vide après un délai
        setTimeout(() => {
            this.displayManager.showNoDataWithHelp();
            this.displayManager.showSaveIndicator('🔄 Planning effacé');
        }, 500);
    }

    /**
     * Navigation entre les semaines
     */
    goToCurrentWeek() {
        if (!this.weekManager.hasWeeks()) return;
        this.weekManager.goToCurrentWeek();
        this.displayWeek();
    }

    navigateWeek(direction) {
        if (this.weekManager.navigateToWeek(direction)) {
            this.displayWeek();
        }
    }

    /**
     * Affichage de la semaine courante
     */
    displayWeek() {
        const week = this.weekManager.getCurrentWeek();
        if (!week || !this.planningData || this.planningData.length === 0) {
            this.displayManager.showNoDataWithHelp();
            return;
        }
        
        const isCurrentWeek = this.weekManager.isCurrentWeek(week);
        
        this.displayManager.updateWeekInfo(week, isCurrentWeek);
        this.displayManager.renderWeekDays(week);
        this.displayManager.updateNavigationButtons();
        this.displayManager.updateWeekStats(week);
    }

    /**
     * Rafraîchit l'affichage de la semaine courante (pour EditManager)
     */
    refreshCurrentWeekDisplay() {
        // Sauvegarder l'état d'édition avant le refresh
        const currentEditStates = new Map(this.editManager.editingStates);
        
        // Réorganiser et afficher
        this.weekManager.organizeWeeks(this.planningData);
        this.displayWeek();
        
        // Restaurer l'état d'édition
        this.editManager.editingStates = currentEditStates;
    }

    /**
     * API publique pour l'affichage des messages
     */
    showError(message) {
        this.displayManager.showError(message);
    }

    showSaveIndicator(message, duration) {
        this.displayManager.showSaveIndicator(message, duration);
    }
}