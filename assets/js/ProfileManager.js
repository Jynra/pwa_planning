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
            }, 100);
        }
    }

    /**
     * Initialise le système de profils
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
        
        // Charger les données du profil actuel
        this.loadCurrentProfileData();
        
        // Mettre à jour l'UI après un délai pour s'assurer que le DOM est prêt
        setTimeout(() => {
            this.updateUI();
        }, 200);
    }

    /**
     * Charge les données du profil actuel dans l'app
     */
    loadCurrentProfileData() {
        if (this.currentProfileId) {
            const profileData = this.loadProfileData(this.currentProfileId);
            this.app.planningData = profileData;
            console.log(`📂 Données du profil actuel chargées: ${profileData.length} entrées`);
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
            name: 'Mon Planning',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        this.profiles.push(defaultProfile);
        this.currentProfileId = defaultProfile.id;
        this.saveProfiles();
        this.saveCurrentProfile();
        
        console.log('🆕 Profil par défaut créé');
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
     * Supprime un profil
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
        
        // Si on supprime le profil actuel, passer au premier disponible
        if (this.currentProfileId === profileId) {
            const remainingProfiles = this.profiles.filter(p => p && p.id !== profileId);
            if (remainingProfiles.length > 0) {
                this.currentProfileId = remainingProfiles[0].id;
                this.saveCurrentProfile();
            }
        }

        // Supprimer les données du profil
        this.deleteProfileData(profileId);
        
        // Supprimer le profil de la liste
        this.profiles.splice(profileIndex, 1);
        this.saveProfiles();
        this.updateUI();
        
        console.log(`🗑️ Profil supprimé: ${deletedProfile.name}`);
        return deletedProfile;
    }

    /**
     * Bascule vers un profil
     */
    switchToProfile(profileId) {
        const profile = this.profiles.find(p => p && p.id === profileId);
        if (!profile) {
            throw new Error('Profil introuvable');
        }

        const oldProfileId = this.currentProfileId;
        
        // Sauvegarder les données du profil actuel
        if (oldProfileId && this.app.planningData && this.app.planningData.length > 0) {
            this.saveProfileData(oldProfileId, this.app.planningData);
        }

        // Changer de profil
        this.currentProfileId = profileId;
        this.saveCurrentProfile();
        
        // Charger les données du nouveau profil
        const profileData = this.loadProfileData(profileId);
        this.app.planningData = profileData;
        
        // Mettre à jour l'interface
        this.updateUI();
        
        // Retraiter les données
        this.app.processDataWithValidation();
        
        console.log(`🔄 Basculement vers profil: ${profile.name}`);
        
        // Afficher confirmation
        this.app.showSaveIndicator(`👤 Profil actuel: ${profile.name}`, 2000);
        
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
     * Affiche le dialogue de suppression
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
        
        const confirmMessage = `Êtes-vous sûr de vouloir supprimer le profil "${profile.name}" ?\n\nToutes les données de ce profil seront définitivement perdues.`;
        
        if (confirm(confirmMessage)) {
            try {
                const deletedProfile = this.deleteProfile(profileId);
                
                // Si on a supprimé le profil actuel, recharger les données
                if (profileId === this.currentProfileId) {
                    this.app.processDataWithValidation();
                }
                
                this.app.showSaveIndicator(`🗑️ Profil "${deletedProfile.name}" supprimé`);
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
     * Nettoie les ressources
     */
    cleanup() {
        // Sauvegarder les données actuelles avant nettoyage
        this.saveCurrentProfileData();
        console.log('🧹 ProfileManager nettoyé');
    }
}