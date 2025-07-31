/**
 * Gestionnaire de profils - Planning de Travail PWA
 * Fichier: assets/js/ProfileManager.js - VERSION FINALE CORRIGÉE
 */
class ProfileManager {
	constructor(app) {
		this.app = app;
		this.currentProfileId = null;
		this.profiles = [];
		this.storageKey = 'planning-profiles';
		this.currentProfileKey = 'planning-current-profile';
		this.isInitialized = false; // NOUVEAU flag
		
		// Attendre que le DOM soit prêt avant d'initialiser
		if (document.readyState === 'loading') {
			document.addEventListener('DOMContentLoaded', () => {
				this.initializeProfiles();
				this.bindEvents();
			});
		} else {
			// DOM déjà prêt
			setTimeout(() => {
				this.initializeProfiles();
				this.bindEvents();
			}, 50); // Réduit de 100ms à 50ms
		}
	}
	
	/**
	 * Initialise le système de profils - VERSION CORRIGÉE
	 */
	initializeProfiles() {
		console.log('🚀 Initialisation des profils...');
	
		this.loadProfiles();
		this.loadCurrentProfile();
	
		// Si aucun profil, créer le profil par défaut
		if (this.profiles.length === 0) {
			this.createDefaultProfile();
		}
	
		// Si aucun profil actuel, prendre le premier
		if (!this.currentProfileId && this.profiles.length > 0) {
			this.currentProfileId = this.profiles[0].id;
			this.saveCurrentProfile();
		}
	
		// CORRECTION : Charger les données AVANT de mettre à jour l'UI
		this.loadCurrentProfileData();
	
		// Marquer comme initialisé
		this.isInitialized = true;
	
		// Mettre à jour l'UI après un délai minimal
		setTimeout(() => {
			this.updateUI();
		}, 50); // Réduit de 200ms à 50ms
	
		console.log('✅ ProfileManager initialisé avec profil:', this.getCurrentProfile()?.name);
	}

	/**
	 * Charge les données du profil actuel dans l'app
	 */
	loadCurrentProfileData() {
		if (this.currentProfileId) {
			const profileData = this.loadProfileData(this.currentProfileId);
		
			// S'assurer que l'app est prête à recevoir les données
			if (this.app) {
				this.app.planningData = profileData;
				console.log(`📂 Données du profil actuel chargées: ${profileData.length} entrées`);
			
				// Si on a des données, marquer que l'app doit les retraiter
				if (profileData.length > 0) {
					this.app._needsDataProcessing = true;
				}
			}
		}
	}

	/**
	 * Charge les profils depuis le localStorage
	 */
	loadProfiles() {
		try {
			const saved = localStorage.getItem(this.storageKey);
			this.profiles = saved ? JSON.parse(saved) : [];
			
			// Nettoyer les profils invalides
			this.profiles = this.profiles.filter(p => p && p.id && p.name);
			
			console.log(`📋 Profils chargés: ${this.profiles.length}`);
		} catch (error) {
			console.warn('⚠️ Erreur chargement profils:', error);
			this.profiles = [];
		}
	}

	/**
	 * Sauvegarde les profils dans le localStorage
	 */
	saveProfiles() {
		try {
			// Nettoyer les profils invalides avant sauvegarde
			this.profiles = this.profiles.filter(p => p && p.id && p.name);
			
			localStorage.setItem(this.storageKey, JSON.stringify(this.profiles));
			console.log(`💾 Profils sauvegardés: ${this.profiles.length}`);
			return true;
		} catch (error) {
			console.error('❌ Erreur sauvegarde profils:', error);
			return false;
		}
	}

	/**
	 * Charge le profil actuel
	 */
	loadCurrentProfile() {
		try {
			this.currentProfileId = localStorage.getItem(this.currentProfileKey);
			
			// Vérifier que le profil actuel existe toujours
			if (this.currentProfileId && !this.profiles.find(p => p && p.id === this.currentProfileId)) {
				console.warn('⚠️ Profil actuel introuvable, reset');
				this.currentProfileId = null;
			}
		} catch (error) {
			console.warn('⚠️ Erreur chargement profil actuel:', error);
			this.currentProfileId = null;
		}
	}

	/**
	 * Sauvegarde le profil actuel
	 */
	saveCurrentProfile() {
		try {
			if (this.currentProfileId) {
				localStorage.setItem(this.currentProfileKey, this.currentProfileId);
				console.log(`👤 Profil actuel sauvegardé: ${this.currentProfileId}`);
			}
		} catch (error) {
			console.error('❌ Erreur sauvegarde profil actuel:', error);
		}
	}

	/**
	 * Crée le profil par défaut
	 */
	createDefaultProfile() {
		const defaultProfile = {
			id: 'default',
			name: 'Planning Principal', // CHANGÉ de "Mon Planning" à "Planning Principal"
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		};
	
		this.profiles.push(defaultProfile);
		this.currentProfileId = defaultProfile.id;
		this.saveProfiles();
		this.saveCurrentProfile();
	
		console.log('🆕 Profil par défaut créé:', defaultProfile.name);
		return defaultProfile;
	}

	/**
	 * Crée un nouveau profil
	 */
	createProfile(name) {
		console.log('🆕 Création d\'un nouveau profil:', name);
		
		// Vérifications
		if (!name || typeof name !== 'string' || name.trim() === '') {
			throw new Error('Le nom du profil est obligatoire');
		}

		// Assurer que this.profiles existe
		if (!Array.isArray(this.profiles)) {
			this.profiles = [];
		}

		const trimmedName = name.trim();

		// Vérifier que le nom n'existe pas déjà
		const nameExists = this.profiles.some(p => {
			return p && p.name && p.name.toLowerCase() === trimmedName.toLowerCase();
		});

		if (nameExists) {
			throw new Error('Un profil avec ce nom existe déjà');
		}

		const newProfile = {
			id: this.generateProfileId(),
			name: trimmedName,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		};

		this.profiles.push(newProfile);
		const saved = this.saveProfiles();
		
		if (saved) {
			console.log(`✅ Profil créé avec succès: ${newProfile.name}`);
			// Forcer la mise à jour de l'UI
			setTimeout(() => {
				this.updateUI();
			}, 100);
		} else {
			throw new Error('Erreur lors de la sauvegarde du profil');
		}
		
		return newProfile;
	}

	/**
	 * Édite un profil existant
	 */
	editProfile(profileId, newName) {
		if (!newName || typeof newName !== 'string' || newName.trim() === '') {
			throw new Error('Le nom du profil est obligatoire');
		}

		const profile = this.profiles.find(p => p && p.id === profileId);
		if (!profile) {
			throw new Error('Profil introuvable');
		}

		const trimmedName = newName.trim();

		// Vérifier que le nouveau nom n'existe pas déjà (sauf pour le profil actuel)
		const nameExists = this.profiles.some(p => {
			return p && p.id !== profileId && p.name && p.name.toLowerCase() === trimmedName.toLowerCase();
		});

		if (nameExists) {
			throw new Error('Un profil avec ce nom existe déjà');
		}

		const oldName = profile.name;
		profile.name = trimmedName;
		profile.updatedAt = new Date().toISOString();
		
		this.saveProfiles();
		this.updateUI();
		
		console.log(`✏️ Profil modifié: ${oldName} → ${profile.name}`);
		return profile;
	}

	/**
	 * Supprime un profil - VERSION CORRIGÉE
	 */
	deleteProfile(profileId) {
		if (this.profiles.length <= 1) {
			throw new Error('Impossible de supprimer le dernier profil');
		}

		const profileIndex = this.profiles.findIndex(p => p && p.id === profileId);
		if (profileIndex === -1) {
			throw new Error('Profil introuvable');
		}

		const deletedProfile = this.profiles[profileIndex];
		console.log(`🗑️ Suppression du profil: ${deletedProfile.name}`);
	
		// CORRECTION : Si on supprime le profil actuel, gérer le basculement proprement
		if (this.currentProfileId === profileId) {
			console.log('⚠️ Suppression du profil actuel, basculement nécessaire');
		
			// Trouver le profil de destination (le premier profil différent)
			const remainingProfiles = this.profiles.filter(p => p && p.id !== profileId);
			if (remainingProfiles.length === 0) {
				throw new Error('Aucun profil de destination disponible');
			}
		
			const destinationProfile = remainingProfiles[0];
			console.log(`🔄 Basculement vers: ${destinationProfile.name}`);
		
			// ÉTAPE 1: Supprimer immédiatement les données du profil à supprimer
			// (on ne veut PAS les sauvegarder car on supprime le profil)
			this.deleteProfileData(profileId);
		
			// ÉTAPE 2: Changer le profil actuel AVANT de charger les nouvelles données
			this.currentProfileId = destinationProfile.id;
			this.saveCurrentProfile();
		
			// ÉTAPE 3: Charger les données du profil de destination
			const destinationData = this.loadProfileData(destinationProfile.id);
		
			// ÉTAPE 4: Mettre à jour l'application avec les bonnes données
			this.app.planningData = destinationData;
		
			console.log(`📂 Données du profil de destination chargées: ${destinationData.length} entrées`);
		
		} else {
			// Si on ne supprime pas le profil actuel, juste supprimer les données
			this.deleteProfileData(profileId);
		}
	
		// Supprimer le profil de la liste
		this.profiles.splice(profileIndex, 1);
		this.saveProfiles();
	
		// Mettre à jour l'interface
		this.updateUI();
	
		// Si on a supprimé le profil actuel, retraiter les données de l'app
		if (profileId === this.currentProfileId) {
			// Forcer le retraitement des données
			setTimeout(() => {
				this.app.processDataWithValidation();
			}, 100);
		}
	
		console.log(`✅ Profil "${deletedProfile.name}" supprimé avec succès`);
		return deletedProfile;
	}

	/**
	 * Bascule vers un profil - VERSION CORRIGÉE
	 */
	switchToProfile(profileId) {
		const profile = this.profiles.find(p => p && p.id === profileId);
		if (!profile) {
			throw new Error('Profil introuvable');
		}

		// Si c'est déjà le profil actuel, ne rien faire
		if (this.currentProfileId === profileId) {
			console.log(`👤 Profil "${profile.name}" déjà actuel`);
			return profile;
		}

		const oldProfileId = this.currentProfileId;
		const oldProfile = this.getCurrentProfile();
	
		console.log(`🔄 Basculement: ${oldProfile?.name || 'Aucun'} → ${profile.name}`);
	
		// CORRECTION : Sauvegarder les données du profil actuel AVANT de changer
		if (oldProfileId && this.app.planningData && this.app.planningData.length > 0) {
			console.log(`💾 Sauvegarde des données du profil "${oldProfile?.name}": ${this.app.planningData.length} entrées`);
			const saved = this.saveProfileData(oldProfileId, this.app.planningData);
			if (!saved) {
				console.warn('⚠️ Échec de la sauvegarde du profil précédent');
			}
		}

		// Changer de profil
		this.currentProfileId = profileId;
		this.saveCurrentProfile();
	
		// Charger les données du nouveau profil
		const profileData = this.loadProfileData(profileId);
		console.log(`📂 Chargement des données du profil "${profile.name}": ${profileData.length} entrées`);
	
		// Mettre à jour l'application avec les nouvelles données
		this.app.planningData = profileData;
	
		// Mettre à jour l'interface
		this.updateUI();
	
		// Retraiter les données dans l'application
		this.app.processDataWithValidation();
	
		// Afficher confirmation
		this.app.showSaveIndicator(`👤 Profil actuel: ${profile.name}`, 2000);
	
		console.log(`✅ Basculement vers "${profile.name}" terminé`);
		return profile;
	}

	/**
	 * Sauvegarde les données d'un profil
	 */
	saveProfileData(profileId, data) {
		try {
			const dataKey = `planning-data-${profileId}`;
			const metaKey = `planning-meta-${profileId}`;
			
			// S'assurer que data est un tableau
			const dataToSave = Array.isArray(data) ? data : [];
			
			// Sauvegarder les données
			localStorage.setItem(dataKey, JSON.stringify(dataToSave));
			
			// Sauvegarder les métadonnées
			const metadata = {
				lastSaved: new Date().toISOString(),
				dataCount: dataToSave.length,
				profileId: profileId
			};
			localStorage.setItem(metaKey, JSON.stringify(metadata));
			
			console.log(`💾 Données sauvegardées pour profil ${profileId}: ${dataToSave.length} entrées`);
			return true;
		} catch (error) {
			console.error(`❌ Erreur sauvegarde données profil ${profileId}:`, error);
			return false;
		}
	}

	/**
	 * Charge les données d'un profil
	 */
	loadProfileData(profileId) {
		try {
			const dataKey = `planning-data-${profileId}`;
			const saved = localStorage.getItem(dataKey);
			
			if (saved) {
				const data = JSON.parse(saved);
				
				// S'assurer que c'est un tableau
				if (!Array.isArray(data)) {
					console.warn(`⚠️ Données invalides pour profil ${profileId}, utilisation d'un tableau vide`);
					return [];
				}
				
				// Reconstituer les objets Date
				const processedData = data.map(entry => {
					if (entry && entry.dateObj && typeof entry.dateObj === 'string') {
						entry.dateObj = new Date(entry.dateObj);
					} else if (entry && !entry.dateObj && entry.date && this.app.dataManager) {
						try {
							entry.dateObj = this.app.dataManager.parseDate(entry.date);
						} catch (e) {
							console.warn('⚠️ Erreur parsing date:', e);
						}
					}
					return entry;
				});
				
				console.log(`📂 Données chargées pour profil ${profileId}: ${processedData.length} entrées`);
				return processedData;
			}
			
			console.log(`📋 Aucune donnée pour profil ${profileId}`);
			return [];
		} catch (error) {
			console.error(`❌ Erreur chargement données profil ${profileId}:`, error);
			return [];
		}
	}

	/**
	 * Supprime les données d'un profil
	 */
	deleteProfileData(profileId) {
		try {
			const dataKey = `planning-data-${profileId}`;
			const metaKey = `planning-meta-${profileId}`;
		
			localStorage.removeItem(dataKey);
			localStorage.removeItem(metaKey);
		
			console.log(`🗑️ Données supprimées pour profil ${profileId}`);
		} catch (error) {
			console.warn(`⚠️ Erreur suppression données profil ${profileId}:`, error);
		}
	}

	/**
	 * Supprime un profil - VERSION FINALE CORRIGÉE
	 */
	deleteProfile(profileId) {
		if (this.profiles.length <= 1) {
			throw new Error('Impossible de supprimer le dernier profil');
		}

		const profileIndex = this.profiles.findIndex(p => p && p.id === profileId);
		if (profileIndex === -1) {
			throw new Error('Profil introuvable');
		}

		const deletedProfile = this.profiles[profileIndex];
		console.log(`🗑️ Suppression du profil: ${deletedProfile.name}`);
	
		// CORRECTION : Si on supprime le profil actuel, gérer le basculement proprement
		if (this.currentProfileId === profileId) {
			console.log('⚠️ Suppression du profil actuel, basculement nécessaire');
		
			// Trouver le profil de destination (le premier profil différent)
			const remainingProfiles = this.profiles.filter(p => p && p.id !== profileId);
			if (remainingProfiles.length === 0) {
				throw new Error('Aucun profil de destination disponible');
			}
		
			const destinationProfile = remainingProfiles[0];
			console.log(`🔄 Basculement vers: ${destinationProfile.name}`);
		
			// ÉTAPE 1: Supprimer immédiatement les données du profil à supprimer
			this.deleteProfileData(profileId);
		
			// ÉTAPE 2: Supprimer le profil de la liste MAINTENANT
			this.profiles.splice(profileIndex, 1);
			this.saveProfiles();
		
			// ÉTAPE 3: Changer le profil actuel vers le profil de destination
			this.currentProfileId = destinationProfile.id;
			this.saveCurrentProfile();
		
			// ÉTAPE 4: Charger les données du profil de destination
			const destinationData = this.loadProfileData(destinationProfile.id);
			console.log(`📂 Chargement des données du profil de destination: ${destinationData.length} entrées`);
		
			// ÉTAPE 5: Mettre à jour l'application avec les bonnes données
			this.app.planningData = destinationData;
		
			// ÉTAPE 6: Mettre à jour l'interface
			this.updateUI();
		
			// ÉTAPE 7: FORCER le retraitement des données immédiatement
			console.log('🔄 Retraitement forcé des données...');
			this.app.processDataWithValidation();
		
			console.log(`✅ Basculement vers "${destinationProfile.name}" terminé`);
			return deletedProfile;
		
		} else {
			// Si on ne supprime pas le profil actuel, juste supprimer les données et le profil
			this.deleteProfileData(profileId);
			this.profiles.splice(profileIndex, 1);
			this.saveProfiles();
			this.updateUI();
		}
	
		console.log(`✅ Profil "${deletedProfile.name}" supprimé avec succès`);
		return deletedProfile;
	}

	/**
	 * CORRIGÉ : Obtient le profil actuel avec vérification
	 */
	getCurrentProfile() {
		if (!Array.isArray(this.profiles) || !this.currentProfileId) {
			return null;
		}
		
		const profile = this.profiles.find(p => p && p.id === this.currentProfileId);
		if (!profile) {
			console.warn('⚠️ Profil actuel introuvable, utilisation du premier disponible');
			if (this.profiles.length > 0) {
				this.currentProfileId = this.profiles[0].id;
				this.saveCurrentProfile();
				return this.profiles[0];
			}
			return null;
		}
		
		return profile;
	}

	/**
	 * Obtient tous les profils
	 */
	getAllProfiles() {
		return Array.isArray(this.profiles) ? [...this.profiles] : [];
	}

	/**
	 * Génère un ID unique pour un profil
	 */
	generateProfileId() {
		return `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}

	/**
	 * CORRIGÉ : Met à jour l'interface utilisateur avec vérifications
	 */
	updateUI() {
		// Ne pas mettre à jour l'UI si pas encore initialisé
		if (!this.isInitialized) {
			console.log('⏳ UI en attente d\'initialisation...');
			return;
		}
	
		try {
			const currentProfile = this.getCurrentProfile();
			if (!currentProfile) {
				console.warn('⚠️ Aucun profil actuel pour mise à jour UI');
				return;
			}
		
			// Mettre à jour l'affichage du profil dans le header
			const profileDisplay = document.querySelector('.current-profile-display');
			if (profileDisplay) {
				profileDisplay.textContent = `👤 ${currentProfile.name}`;
			}
		
			// Mettre à jour la liste des profils dans la modale
			this.renderProfilesList();
		
			// Mettre à jour l'indicateur dans la modale
			const currentProfileName = document.querySelector('.current-profile-name');
			if (currentProfileName) {
				currentProfileName.textContent = currentProfile.name;
			}
		
			console.log(`🎨 UI mise à jour pour profil: ${currentProfile.name}`);
		} catch (error) {
			console.error('❌ Erreur mise à jour UI:', error);
		}
	}

	/**
	 * Rendu de la liste des profils
	 */
	renderProfilesList() {
		const profilesList = document.querySelector('.profile-list');
		if (!profilesList) {
			console.warn('⚠️ Élément .profile-list non trouvé');
			return;
		}
		
		profilesList.innerHTML = '';
		
		if (!Array.isArray(this.profiles) || this.profiles.length === 0) {
			profilesList.innerHTML = '<div style="text-align: center; padding: 20px; color: var(--text-muted);">Aucun profil disponible</div>';
			return;
		}
		
		console.log(`🎨 Rendu de ${this.profiles.length} profils`);
		
		this.profiles.forEach(profile => {
			if (!profile || !profile.id || !profile.name) {
				console.warn('⚠️ Profil invalide ignoré:', profile);
				return;
			}
			
			const isActive = profile.id === this.currentProfileId;
			
			const profileCard = document.createElement('div');
			profileCard.className = `profile-card ${isActive ? 'active' : ''}`;
			profileCard.dataset.profile = profile.id;
			
			profileCard.innerHTML = `
				<div class="profile-card-header">
					<div class="profile-info">
						<div class="profile-details">
							<h4>${this.escapeHtml(profile.name)}</h4>
						</div>
					</div>
					<div class="profile-actions">
						<button class="action-btn edit" title="Modifier" data-profile-id="${profile.id}">✏️</button>
						<button class="action-btn delete" title="Supprimer" data-profile-id="${profile.id}">🗑️</button>
					</div>
				</div>
			`;
			
			profilesList.appendChild(profileCard);
		});
		
		// Réattacher les événements
		this.attachProfileEvents();
	}

	/**
	 * Attache les événements aux éléments des profils
	 */
	attachProfileEvents() {
		// Clics sur les profils
		document.querySelectorAll('.profile-card').forEach(card => {
			card.addEventListener('click', (e) => {
				if (e.target.classList.contains('action-btn')) return;
				
				const profileId = card.dataset.profile;
				if (profileId && profileId !== this.currentProfileId) {
					try {
						this.switchToProfile(profileId);
					} catch (error) {
						console.error('❌ Erreur basculement profil:', error);
						this.app.showError(`Erreur: ${error.message}`);
					}
				}
			});
		});
		
		// Boutons d'édition
		document.querySelectorAll('.action-btn.edit').forEach(btn => {
			btn.addEventListener('click', (e) => {
				e.stopPropagation();
				const profileId = btn.dataset.profileId;
				this.showEditDialog(profileId);
			});
		});
		
		// Boutons de suppression
		document.querySelectorAll('.action-btn.delete').forEach(btn => {
			btn.addEventListener('click', (e) => {
				e.stopPropagation();
				const profileId = btn.dataset.profileId;
				this.showDeleteDialog(profileId);
			});
		});
	}

	/**
	 * Lie les événements principaux
	 */
	bindEvents() {
		// Attendre que le DOM soit prêt
		setTimeout(() => {
			// Bouton nouveau profil
			const newBtn = document.querySelector('.profile-btn.new');
			if (newBtn) {
				newBtn.addEventListener('click', () => this.showCreateDialog());
				console.log('✅ Événement "Nouveau profil" attaché');
			} else {
				console.warn('⚠️ Bouton "Nouveau profil" non trouvé');
			}
			
			// Bouton import (pour plus tard)
			const importBtn = document.querySelector('.profile-btn.import');
			if (importBtn) {
				importBtn.addEventListener('click', () => this.showImportDialog());
			}
		}, 300);
	}

	/**
	 * Affiche le dialogue de création
	 */
	showCreateDialog() {
		console.log('🆕 Ouverture dialogue création profil');
		const name = prompt('Nom du nouveau profil:', '');
		if (name) {
			try {
				const newProfile = this.createProfile(name);
				this.app.showSaveIndicator(`✅ Profil "${newProfile.name}" créé`, 2000);
			} catch (error) {
				console.error('❌ Erreur création profil:', error);
				alert(`Erreur: ${error.message}`);
			}
		}
	}

	/**
	 * Affiche le dialogue d'édition
	 */
	showEditDialog(profileId) {
		const profile = this.profiles.find(p => p && p.id === profileId);
		if (!profile) {
			alert('Profil introuvable');
			return;
		}
		
		const newName = prompt('Nouveau nom du profil:', profile.name);
		if (newName && newName !== profile.name) {
			try {
				const updatedProfile = this.editProfile(profileId, newName);
				this.app.showSaveIndicator(`✅ Profil renommé en "${updatedProfile.name}"`);
			} catch (error) {
				console.error('❌ Erreur édition profil:', error);
				alert(`Erreur: ${error.message}`);
			}
		}
	}

	/**
	 * Affiche le dialogue de suppression - VERSION CORRIGÉE
	 */
	showDeleteDialog(profileId) {
		const profile = this.profiles.find(p => p && p.id === profileId);
		if (!profile) {
			alert('Profil introuvable');
			return;
		}
	
		if (this.profiles.length <= 1) {
			alert('Impossible de supprimer le dernier profil');
			return;
		}
	
		// Message différent si c'est le profil actuel
		let confirmMessage;
		if (profileId === this.currentProfileId) {
			const remainingProfiles = this.profiles.filter(p => p && p.id !== profileId);
			const nextProfile = remainingProfiles[0];
		
			confirmMessage = `Êtes-vous sûr de vouloir supprimer le profil actuel "${profile.name}" ?\n\n` +
							`Vous serez automatiquement basculé vers "${nextProfile.name}".\n` +
							`Toutes les données de "${profile.name}" seront définitivement perdues.`;
		} else {
			confirmMessage = `Êtes-vous sûr de vouloir supprimer le profil "${profile.name}" ?\n\n` +
							`Toutes les données de ce profil seront définitivement perdues.`;
		}
	
		if (confirm(confirmMessage)) {
			try {
				const wasCurrentProfile = (profileId === this.currentProfileId);
				const deletedProfile = this.deleteProfile(profileId);
			
				// Message de confirmation adapté
				if (wasCurrentProfile) {
					const newCurrentProfile = this.getCurrentProfile();
					this.app.showSaveIndicator(
						`🗑️ Profil "${deletedProfile.name}" supprimé - Profil actuel: ${newCurrentProfile?.name}`, 
						3000
					);
				} else {
					this.app.showSaveIndicator(`🗑️ Profil "${deletedProfile.name}" supprimé`, 2000);
				}
			
			} catch (error) {
				console.error('❌ Erreur suppression profil:', error);
				alert(`Erreur: ${error.message}`);
			}
		}
	}

	/**
	 * Affiche le dialogue d'import (placeholder)
	 */
	showImportDialog() {
		alert('Fonctionnalité d\'import de profils à venir...');
	}

	/**
	 * Échappe le HTML pour éviter les injections
	 */
	escapeHtml(text) {
		if (!text) return '';
		const div = document.createElement('div');
		div.textContent = text;
		return div.innerHTML;
	}

	/**
	 * Sauvegarde les données du profil actuel
	 */
	saveCurrentProfileData() {
		if (this.currentProfileId && this.app.planningData) {
			return this.saveProfileData(this.currentProfileId, this.app.planningData);
		}
		return true;
	}

	/**
	 * Obtient des statistiques sur les profils
	 */
	getStats() {
		return {
			totalProfiles: Array.isArray(this.profiles) ? this.profiles.length : 0,
			currentProfile: this.getCurrentProfile(),
			hasData: this.app.planningData ? this.app.planningData.length > 0 : false
		};
	}

	/**
	 * NOUVEAU : Vérifie si ProfileManager est complètement initialisé
	 */
	isReady() {
		return this.isInitialized && 
			   this.profiles && 
			   this.profiles.length > 0 && 
			   this.currentProfileId &&
			   this.getCurrentProfile() !== null;
	}

	/**
	 * Nettoie les ressources
	 */
	cleanup() {
		// Sauvegarder les données actuelles avant nettoyage
		this.saveCurrentProfileData();
		console.log('🧹 ProfileManager nettoyé');
	}
}