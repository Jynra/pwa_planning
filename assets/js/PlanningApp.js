/**
 * Application principale de Planning de Travail - PWA
 * Version avec système de profils intégré
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
		
		// NOUVEAU : Gestionnaire de profils
		this.profileManager = new ProfileManager(this);
		
		this.initializeElements();
		this.bindEvents();
		this.themeManager.applyTheme();
		this.displayManager.updateCurrentMonth();
		
		// Initialisation avec chargement automatique
		this.initializeApp();
	}

	/**
	 * CORRECTION : Ordre d'initialisation dans PlanningApp.js
	 * REMPLACEZ ces méthodes dans votre PlanningApp.js
	 */

	/**
	 * Initialisation complète de l'application - VERSION CORRIGÉE
	 */
	async initializeApp() {
		console.log('🚀 Initialisation de Planning de Travail...');
	
		// Vérifier la disponibilité du stockage
		if (!this.dataManager.isStorageAvailable()) {
			this.displayManager.showError('Stockage local non disponible. Les données ne pourront pas être sauvegardées.');
			this.displayManager.showNoData();
			return;
		}
	
		// CORRECTION : Attendre que ProfileManager soit complètement initialisé
		console.log('👤 Attente de l\'initialisation des profils...');
	
		// Attendre que ProfileManager soit prêt
		await this.waitForProfileManager();
	
		console.log('✅ ProfileManager prêt, traitement des données...');
	
		// Maintenant traiter les données chargées par le ProfileManager
		this.processDataWithValidation();
	}
	
	/**
	 * NOUVEAU : Attendre que ProfileManager soit complètement initialisé
	 */
	async waitForProfileManager() {
		return new Promise((resolve) => {
			const checkProfileManager = () => {
				if (this.profileManager && 
					this.profileManager.profiles && 
					this.profileManager.profiles.length > 0 && 
					this.profileManager.currentProfileId) {
					
					console.log('👤 ProfileManager prêt avec profil:', this.profileManager.getCurrentProfile()?.name);
					resolve();
				} else {
					console.log('⏳ Attente ProfileManager...');
					setTimeout(checkProfileManager, 100);
				}
			};
		
			// Commencer la vérification après un délai initial
			setTimeout(checkProfileManager, 50);
		});
	}

	/**
	 * Traitement des données avec validation - VERSION CORRIGÉE
	 */
	processDataWithValidation() {
		// CORRECTION : Vérifier si on a des données à traiter
		if (!this.planningData || this.planningData.length === 0) {
			// Si ProfileManager a marqué qu'on a besoin de traiter les données, réessayer
			if (this._needsDataProcessing && this.profileManager && this.profileManager.isReady()) {
				const currentProfile = this.profileManager.getCurrentProfile();
				if (currentProfile) {
					console.log('🔄 Rechargement des données du profil:', currentProfile.name);
					const profileData = this.profileManager.loadProfileData(currentProfile.id);
					this.planningData = profileData;
					this._needsDataProcessing = false; // Reset du flag
				
					// Si on a maintenant des données, continuer le traitement
					if (this.planningData.length === 0) {
						this.displayManager.showNoDataWithHelp();
						return;
					}
				} else {
					this.displayManager.showNoDataWithHelp();
					return;
				}
			} else {
				this.displayManager.showNoDataWithHelp();
				return;
			}
		}
	
		try {
			console.log(`🔄 Traitement de ${this.planningData.length} entrées...`);
		
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
		
			// Afficher un message de confirmation si on vient de charger un profil
			if (this._needsDataProcessing && this.profileManager) {
				const currentProfile = this.profileManager.getCurrentProfile();
				if (currentProfile) {
					console.log(`✅ Profil "${currentProfile.name}" chargé avec ${this.planningData.length} entrées`);
				}
				this._needsDataProcessing = false;
			}
		
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
		
		// Éléments pour le menu options
		this.optionsBtn = document.getElementById('optionsBtn');
		this.optionsMenu = document.getElementById('optionsMenu');
		this.optionsOverlay = document.getElementById('optionsOverlay');
		this.themeToggleMenu = document.getElementById('themeToggleMenu');
		this.resetBtnMenu = document.getElementById('resetBtnMenu');
		
		// NOUVEAU : Éléments pour les profils
		this.profilesMenuItem = document.getElementById('profilesMenuItem');
		this.profilesModal = document.getElementById('profilesModal');
		this.profilesClose = document.getElementById('profilesClose');
		this.currentProfileDisplay = document.getElementById('currentProfileDisplay');
		
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
		this.csvFileInput.addEventListener('change', (e) => this.handleFileLoad(e));
		this.todayBtn.addEventListener('click', () => this.goToCurrentWeek());
		this.prevWeekBtn.addEventListener('click', () => this.navigateWeek(-1));
		this.nextWeekBtn.addEventListener('click', () => this.navigateWeek(1));

		// Événements du menu options
		this.bindOptionsMenuEvents();

		// NOUVEAU : Événements des profils
		this.bindProfilesEvents();

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
	 * NOUVEAU : Lie les événements du système de profils
	 */
	bindProfilesEvents() {
		// Ouverture de la modale des profils
		if (this.profilesMenuItem) {
			this.profilesMenuItem.addEventListener('click', () => {
				this.closeOptionsMenu();
				this.openProfilesModal();
			});
		}

		// Fermeture de la modale des profils
		if (this.profilesClose) {
			this.profilesClose.addEventListener('click', () => {
				this.closeProfilesModal();
			});
		}

		// Fermeture en cliquant sur l'arrière-plan
		if (this.profilesModal) {
			this.profilesModal.addEventListener('click', (e) => {
				if (e.target === this.profilesModal) {
					this.closeProfilesModal();
				}
			});
		}

		// Escape pour fermer la modale
		document.addEventListener('keydown', (e) => {
			if (e.key === 'Escape') {
				if (this.isProfilesModalOpen) {
					this.closeProfilesModal();
				} else if (this.isMenuOpen) {
					this.closeOptionsMenu();
				}
			}
		});
	}

	/**
	 * NOUVEAU : Ouvre la modale des profils
	 */
	openProfilesModal() {
		this.isProfilesModalOpen = true;
		if (this.profilesModal) {
			this.profilesModal.classList.add('show');
			document.body.style.overflow = 'hidden';
		}
	}

	/**
	 * NOUVEAU : Ferme la modale des profils
	 */
	closeProfilesModal() {
		this.isProfilesModalOpen = false;
		if (this.profilesModal) {
			this.profilesModal.classList.remove('show');
			document.body.style.overflow = '';
		}
	}

	/**
	 * MODIFIÉ : Gestion du chargement de fichier avec sauvegarde dans le profil actuel
	 */
	async handleFileLoad(event) {
		const file = event.target.files[0];
		if (!file) return;
		
		console.log(`📁 Import fichier: ${file.name} (${Math.round(file.size / 1024)}KB)`);
		
		// Validation du fichier
		const validation = this.fileManager.validateFile(file);
		if (!validation.isValid) {
			this.displayManager.showError(validation.error);
			event.target.value = '';
			return;
		}
	
		this.displayManager.showLoading();
	
		try {
			const text = await this.fileManager.readFile(file);
			const parsedData = this.dataManager.parseCSV(text);
		
			if (parsedData.length === 0) {
				throw new Error('Aucune donnée valide trouvée dans le fichier CSV');
			}
		
			// Mettre à jour les données de l'application
			this.planningData = parsedData;
		
			// CORRECTION : Vérifier que profileManager existe et a un profil actuel
			let saved = false;
			let currentProfile = null;
		
			if (this.profileManager) {
				currentProfile = this.profileManager.getCurrentProfile();
				if (currentProfile) {
					saved = this.profileManager.saveCurrentProfileData();
				}
			}
		
			// Traiter et afficher
			this.processDataWithValidation();
		
			// Message de confirmation
			let message;
			if (currentProfile) {
				message = saved ? 
					`📁 CSV importé dans "${currentProfile.name}" (${parsedData.length} entrées)` :
					`⚠️ CSV importé dans "${currentProfile.name}" mais sauvegarde échouée`;
			} else {
				message = `📁 CSV importé (${parsedData.length} entrées)`;
			}
		
			this.displayManager.showSaveIndicator(message, saved ? 2000 : 3000);
		
			// Statistiques d'import
			this.fileManager.logImportStats(file, parsedData);
		
		} catch (error) {
			console.error('❌ Erreur import:', error);
			this.displayManager.showError(`Erreur lors du chargement: ${error.message}`);
			this.displayManager.showNoDataWithHelp();
		
			// Reset de l'input en cas d'erreur
			event.target.value = '';
		}
	}

	/**
	 * Lie les événements du menu options
	 */
	bindOptionsMenuEvents() {
		// État du menu
		this.isMenuOpen = false;
		this.isProfilesModalOpen = false;

		// Toggle du menu principal
		this.optionsBtn.addEventListener('click', (e) => {
			e.stopPropagation();
			this.toggleOptionsMenu();
		});

		// Fermer avec overlay
		this.optionsOverlay.addEventListener('click', () => this.closeOptionsMenu());

		// Toggle thème depuis le menu
		this.themeToggleMenu.addEventListener('click', () => {
			this.themeManager.toggleTheme();
			this.updateThemeMenuDisplay();
			this.closeOptionsMenu();
		});

		// Reset depuis le menu
		this.resetBtnMenu.addEventListener('click', () => {
			this.closeOptionsMenu();
			this.resetPlanningWithConfirm();
		});
	}

	/**
	 * Toggle du menu options
	 */
	toggleOptionsMenu() {
		this.isMenuOpen = !this.isMenuOpen;
		
		if (this.isMenuOpen) {
			this.optionsBtn.classList.add('active');
			this.optionsMenu.classList.add('show');
			this.optionsOverlay.classList.add('show');
		} else {
			this.optionsBtn.classList.remove('active');
			this.optionsMenu.classList.remove('show');
			this.optionsOverlay.classList.remove('show');
		}
	}

	/**
	 * Ferme le menu options
	 */
	closeOptionsMenu() {
		if (this.isMenuOpen) {
			this.isMenuOpen = false;
			this.optionsBtn.classList.remove('active');
			this.optionsMenu.classList.remove('show');
			this.optionsOverlay.classList.remove('show');
		}
	}

	/**
	 * Met à jour l'affichage du thème dans le menu
	 */
	updateThemeMenuDisplay() {
		const isDark = this.themeManager.isDarkTheme;
		const icon = this.themeToggleMenu.querySelector('.menu-icon');
		const text = this.themeToggleMenu.querySelector('.menu-text');
		
		icon.textContent = isDark ? '☀️' : '🌙';
		text.textContent = isDark ? 'Mode clair' : 'Mode sombre';
	}

	/**
	 * Gestion du retour de visibilité de la page
	 */
	handlePageVisible() {
		if (this.planningData.length > 0) {
			// Vérifier si les données du profil actuel sont toujours disponibles
			const currentProfile = this.profileManager.getCurrentProfile();
			if (currentProfile) {
				const profileData = this.profileManager.loadProfileData(currentProfile.id);
				if (profileData.length === 0 && this.planningData.length > 0) {
					console.warn('⚠️ Données du profil perdues, sauvegarde...');
					this.profileManager.saveCurrentProfileData();
				}
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
	 * CORRIGÉ : Reset avec confirmation et gestion des profils
	 * REMPLACEZ cette méthode dans votre PlanningApp.js
	 */
	resetPlanningWithConfirm() {
		try {
			// Vérifier que profileManager existe
			if (!this.profileManager) {
				console.warn('⚠️ ProfileManager non disponible, reset standard');
				this.resetPlanningStandard();
				return;
			}
		
			const currentProfile = this.profileManager.getCurrentProfile();
		
			// Vérifier que le profil actuel existe
			if (!currentProfile) {
				console.warn('⚠️ Aucun profil actuel, reset standard');
				this.resetPlanningStandard();
				return;
			}
		
			const message = `Êtes-vous sûr de vouloir effacer le planning du profil "${currentProfile.name}" ?\n\n` +
						   `Cette action supprimera toutes les données de ce profil.`;
		
			if (confirm(message)) {
				this.resetCurrentProfile();
			}
		} catch (error) {
			console.error('❌ Erreur resetPlanningWithConfirm:', error);
			// Fallback vers reset standard
			this.resetPlanningStandard();
		}
	}

	/**
	 * NOUVEAU : Reset du profil actuel uniquement
	 */
	resetCurrentProfile() {
		try {
			this.displayManager.showLoading();
		
			const currentProfile = this.profileManager.getCurrentProfile();
		
			// Effacer les données du profil actuel
			this.planningData = [];
			this.weekManager.reset();
			this.editManager.cleanup();
		
			// Supprimer les données du profil
			if (currentProfile) {
				this.profileManager.deleteProfileData(currentProfile.id);
			}
		
			// Reset de l'input file
			if (this.csvFileInput) {
				this.csvFileInput.value = '';
			}
		
			// Afficher l'écran vide après un délai
			setTimeout(() => {
				this.displayManager.showNoDataWithHelp();
				const profileName = currentProfile ? currentProfile.name : 'le profil';
				this.displayManager.showSaveIndicator(`🔄 ${profileName} effacé`);
			}, 500);
		
		} catch (error) {
			console.error('❌ Erreur resetCurrentProfile:', error);
			this.displayManager.showError('Erreur lors de la réinitialisation');
		}
	}

	/**
	 * NOUVEAU : Reset standard (sans profils)
	 */
	resetPlanningStandard() {
		try {
			const hasData = this.planningData && this.planningData.length > 0;
		
			if (hasData) {
				const message = `Êtes-vous sûr de vouloir effacer le planning ?\n\n` +
							   `Cette action supprimera toutes les données.`;
			
				if (!confirm(message)) {
					return;
				}
			}
		
			this.displayManager.showLoading();
		
			// Effacer complètement les données
			this.planningData = [];
			this.weekManager.reset();
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
		
		} catch (error) {
			console.error('❌ Erreur resetPlanningStandard:', error);
			this.displayManager.showError('Erreur lors de la réinitialisation');
		}
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
		console.log('🔄 Rafraîchissement de l\'affichage...');
		
		// Vérifier qu'on a des données
		if (!this.planningData || this.planningData.length === 0) {
			console.warn('⚠️ Pas de données à afficher');
			this.displayManager.showNoDataWithHelp();
			return;
		}

		try {
			// Sauvegarder l'index de la semaine actuelle
			const currentWeekIndex = this.weekManager.getCurrentWeekIndex();
			
			// Réorganiser les semaines avec les nouvelles données
			this.weekManager.organizeWeeks(this.planningData);
			
			// Vérifier qu'on a encore des semaines
			if (!this.weekManager.hasWeeks()) {
				console.warn('⚠️ Aucune semaine après réorganisation');
				this.displayManager.showNoDataWithHelp();
				return;
			}
			
			// Restaurer l'index de semaine (ou ajuster si nécessaire)
			const weeks = this.weekManager.getWeeks();
			if (currentWeekIndex >= 0 && currentWeekIndex < weeks.length) {
				this.weekManager.currentWeekIndex = currentWeekIndex;
			} else {
				// Si l'index n'est plus valide, trouver la semaine courante
				this.weekManager.findCurrentWeek();
			}
			
			// Réafficher la semaine
			this.displayWeek();
			
			// NOUVEAU : Sauvegarder automatiquement dans le profil actuel
			this.profileManager.saveCurrentProfileData();
			
			console.log(`✅ Affichage rafraîchi: semaine ${this.weekManager.getCurrentWeekIndex() + 1}/${weeks.length}`);
			
		} catch (error) {
			console.error('❌ Erreur lors du rafraîchissement:', error);
			this.displayManager.showError('Erreur lors du rafraîchissement de l\'affichage');
			
			// En cas d'erreur, recharger complètement
			setTimeout(() => {
				this.processDataWithValidation();
			}, 500);
		}
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

	/**
	 * NOUVEAU : Méthodes pour l'intégration avec ProfileManager
	 */
	
	/**
	 * Charge un profil spécifique (appelé par ProfileManager)
	 */
	loadProfile(profileId) {
		console.log(`📂 Chargement du profil: ${profileId}`);
		
		// Charger les données du profil
		const profileData = this.profileManager.loadProfileData(profileId);
		this.planningData = profileData;
		
		// Retraiter les données
		this.processDataWithValidation();
		
		return true;
	}

	/**
	 * Sauvegarde le profil actuel (appelé automatiquement)
	 */
	saveCurrentProfile() {
		if (this.profileManager && this.planningData.length > 0) {
			return this.profileManager.saveCurrentProfileData();
		}
		return true;
	}

	/**
	 * Obtient des informations sur l'application pour le ProfileManager
	 */
	getAppInfo() {
		return {
			dataCount: this.planningData.length,
			weeksCount: this.weekManager.getWeeks().length,
			currentWeek: this.weekManager.getCurrentWeekIndex() + 1,
			hasUnsavedEdits: this.editManager.getEditStats().hasUnsavedChanges
		};
	}

	/**
	 * NOUVEAU : Gestion de la fermeture de l'application
	 */
	beforeUnload() {
		// Sauvegarder les données du profil actuel avant fermeture
		if (this.profileManager) {
			this.profileManager.saveCurrentProfileData();
		}
		
		// Nettoyer les ressources
		this.cleanup();
	}

	/**
	 * Nettoie les ressources de l'application
	 */
	cleanup() {
		if (this.profileManager) {
			this.profileManager.cleanup();
		}
		if (this.editManager) {
			this.editManager.cleanup();
		}
		if (this.fileManager) {
			this.fileManager.cleanup();
		}
		if (this.themeManager) {
			this.themeManager.cleanup();
		}
		if (this.displayManager) {
			this.displayManager.cleanup();
		}
		
		console.log('🧹 Application nettoyée');
	}

	/**
	 * NOUVEAU : Obtient le statut complet de l'application
	 */
	getStatus() {
		return {
			isReady: true,
			currentProfile: this.profileManager ? this.profileManager.getCurrentProfile() : null,
			dataCount: this.planningData.length,
			theme: this.themeManager ? this.themeManager.getCurrentTheme() : 'light',
			hasUnsavedChanges: this.editManager ? this.editManager.getEditStats().hasUnsavedChanges : false,
			storage: this.dataManager ? this.dataManager.getStorageStats() : null
		};
	}

	/**
	 * NOUVEAU : Méthode utilitaire pour déboguer
	 */
	debug() {
		const status = this.getStatus();
		console.group('🔍 Debug Planning App');
		console.log('Status:', status);
		console.log('Planning Data:', this.planningData);
		console.log('Weeks:', this.weekManager.getWeeks());
		if (this.profileManager) {
			console.log('Profiles:', this.profileManager.getAllProfiles());
		}
		console.groupEnd();
		return status;
	}
}