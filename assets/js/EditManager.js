/**
 * Gestionnaire d'édition des horaires - Planning de Travail PWA
 * Fichier: assets/js/EditManager.js
 * CORRECTION FINALE: Bug de disparition des jours corrigé
 */
class EditManager {
	constructor(planningApp) {
		this.app = planningApp;
		this.editingStates = new Map();
		this.originalData = new Map(); // Sauvegarde pour annulation
		this.validationRules = {
			timeFormat: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
			maxHoursPerDay: 24,
			minBreakBetweenSlots: 30 // minutes
		};
	}

	/**
	 * CORRECTION: Nettoie un ID pour qu'il soit valide CSS
	 */
	sanitizeId(str) {
		return str
			.replace(/\s+/g, '-')        // Remplace espaces par tirets
			.replace(/[^a-zA-Z0-9-_]/g, '') // Supprime caractères spéciaux
			.toLowerCase();               // En minuscules
	}

	/**
	 * Commence l'édition d'un jour
	 */
	startEdit(dayId) {
	    console.log(`✏️ Début édition du jour: ${dayId}`);
		
	    // Annuler les autres éditions en cours
	    this.cancelAllOtherEdits(dayId);
		
	    // Sauvegarder l'état original pour pouvoir annuler
	    this.saveOriginalState(dayId);
		
	    // Marquer ce jour comme en édition
	    this.editingStates.set(dayId, true);
		
	    // Rafraîchir l'affichage
	    this.refreshDisplay();
		
	    // Scroll vers le jour en édition et focus
	    this.focusEditingDay(dayId);
		
	    // Attacher les événements d'édition
	    this.attachEditEvents(dayId);
	}

	refreshDisplay() {
	    // Utiliser la méthode de l'app selon la disponibilité
	    if (typeof this.app.refreshCurrentWeekDisplayWithPosition === 'function') {
	        this.app.refreshCurrentWeekDisplayWithPosition();
	    } else if (typeof this.app.refreshCurrentWeekDisplay === 'function') {
	        this.app.refreshCurrentWeekDisplay();
	    } else {
	        console.warn('⚠️ Aucune méthode de rafraîchissement disponible, utilisation de processDataWithValidation');
	        this.app.processDataWithValidation();
	    }
	}

	/**
	 * Sauvegarde les modifications d'un jour
	 */
	async saveEdit(dayId) {
	    console.log(`💾 Sauvegarde du jour: ${dayId}`);
		
	    try {
	        // Sauvegarder l'index de la semaine courante AVANT modification
	        const currentWeekIndex = this.app.weekManager.getCurrentWeekIndex();
	        const currentWeek = this.app.weekManager.getCurrentWeek();
	        console.log(`📍 Semaine courante avant modification: ${currentWeekIndex + 1}`);
		
	        // Extraire et valider les données
	        const editData = this.extractEditData(dayId);
	        if (!editData) {
	            throw new Error('Impossible d\'extraire les données d\'édition');
	        }
		
	        const validationResult = this.validateEditData(editData);
	        if (!validationResult.isValid) {
	            this.showValidationErrors(dayId, validationResult.errors);
	            return false;
	        }
		
	        // Marquer le bouton comme en cours de sauvegarde
	        this.setSavingState(dayId, true);
		
	        // Appliquer les modifications aux données
	        await this.applyEditData(dayId, editData);
		
	        // Sauvegarder en local
	        const saved = this.app.dataManager.saveData(this.app.planningData);
		
	        // Sortir du mode édition
	        this.editingStates.set(dayId, false);
	        this.originalData.delete(dayId);
		
	        // CORRECTION : Rafraîchir en préservant strictement la position
	        console.log(`🔄 Rafraîchissement après modification, retour à semaine ${currentWeekIndex + 1}`);
		
	        // Vérifier que la méthode existe
	        if (typeof this.app.refreshCurrentWeekDisplayWithPosition === 'function') {
	            this.app.refreshCurrentWeekDisplayWithPosition(currentWeekIndex);
	        } else {
	            console.warn('⚠️ refreshCurrentWeekDisplayWithPosition non disponible');
	            // Fallback : réorganiser et essayer de revenir à la bonne semaine
	            this.app.weekManager.organizeWeeks(this.app.planningData);
	            const weeks = this.app.weekManager.getWeeks();
	            if (currentWeekIndex >= 0 && currentWeekIndex < weeks.length) {
	                this.app.weekManager.currentWeekIndex = currentWeekIndex;
	            }
	            this.app.displayWeek();
	        }
		
	        // Afficher le message de confirmation
	        const message = saved ? 
	            '💾 Modifications sauvegardées' : 
	            '⚠️ Modifications appliquées (sauvegarde échouée)';
	        this.app.showSaveIndicator(message);
		
	        console.log('✅ Sauvegarde réussie');
	        return true;
		
	    } catch (error) {
	        console.error('❌ Erreur lors de la sauvegarde:', error);
	        this.app.showError(`Erreur: ${error.message}`);
	        return false;
	    } finally {
	        this.setSavingState(dayId, false);
	    }
	}

	/**
	 * CORRECTION FINALE: Annule l'édition d'un jour
	 */
	cancelEdit(dayId) {
		console.log(`❌ Annulation édition du jour: ${dayId}`);
		
		// Restaurer l'état original si disponible
		if (this.originalData.has(dayId)) {
			const originalEntries = this.originalData.get(dayId);
			const dateStr = dayId.replace('day-', '');
			const targetDate = new Date(dateStr);
			targetDate.setHours(0, 0, 0, 0);
			
			// Supprimer les entrées actuelles pour cette date
			this.app.planningData = this.app.planningData.filter(entry => {
				const entryDate = new Date(entry.dateObj);
				entryDate.setHours(0, 0, 0, 0);
				return entryDate.getTime() !== targetDate.getTime();
			});

			// Restaurer les entrées originales
			this.app.planningData.push(...originalEntries);
		}
		
		// Sortir du mode édition
		this.editingStates.set(dayId, false);
		this.originalData.delete(dayId);
		
		// SOLUTION BRUTALE: Recharger complètement l'affichage
		this.app.processDataWithValidation();
		
		this.app.showSaveIndicator('🔄 Modifications annulées');
	}

	/**
	 * Vérifie si un jour est en cours d'édition
	 */
	isEditing(dayId) {
		return this.editingStates.get(dayId) || false;
	}

	/**
	 * Génère le HTML pour les contrôles d'édition
	 */
	renderEditControls(dayId) {
	    const isEditing = this.isEditing(dayId);
		
	    if (isEditing) {
	        return `
	            <button class="edit-btn save" onclick="window.planningApp.editManager.saveEdit('${dayId}')">
	                💾 Enregistrer
	            </button>
	            <button class="edit-btn cancel" onclick="window.planningApp.editManager.cancelEdit('${dayId}')">
	                ❌ Annuler
	            </button>
	            <button class="edit-btn delete" onclick="window.planningApp.editManager.deleteDay('${dayId}')" title="Supprimer ce jour">
	                🗑️ Supprimer
	            </button>
	        `;
	    } else {
	        return `
	            <button class="edit-btn" onclick="window.planningApp.editManager.startEdit('${dayId}')">
	                ✏️ Modifier
	            </button>
	        `;
	    }
	}

	/**
	 * Génère le formulaire d'édition
	 */
	renderEditForm(dayId, dayData) {
		const location = dayData?.entries?.[0]?.poste || 'Bureau';
		const tasks = dayData?.entries?.[0]?.taches || 'Travail';
		
		// Détecter si c'est actuellement un jour de repos
		const isCurrentlyRest = this.isRestDay(dayData);
		
		// Extraire les horaires existants
		const existingSchedules = this.extractExistingSchedules(dayData, isCurrentlyRest);
		
		let html = '<div class="schedule-edit">';
		
		// Toggle repos
		html += this.renderRestToggle(dayId, isCurrentlyRest);
		
		// Conteneur des horaires
		html += `<div id="schedules-container-${this.sanitizeId(dayId)}" class="schedules-container ${isCurrentlyRest ? 'hidden' : ''}">`;
		html += '<div class="edit-section-title">🕒 Horaires de la journée</div>';
		html += `<div id="schedules-list-${this.sanitizeId(dayId)}">`;
		
		existingSchedules.forEach((schedule, index) => {
			html += this.renderScheduleInputGroup(dayId, schedule, index, existingSchedules.length > 1);
		});
		
		html += '</div>';
		html += this.renderAddSlotButton(dayId);
		html += '</div>'; // Fin schedules-container
		
		// Section informations
		html += this.renderInfoSection(dayId, location, tasks);
		
		html += '</div>';
		return html;
	}

	/**
	 * Supprime un jour complet du planning
	 */
	deleteDay(dayId) {
	    try {
	        // Sauvegarder l'index de la semaine courante AVANT suppression
	        const currentWeekIndex = this.app.weekManager.getCurrentWeekIndex();
	        console.log(`📍 Semaine courante avant suppression: ${currentWeekIndex + 1}`);
		
	        // Extraire la date du dayId
	        const dateStr = dayId.replace('day-', '');
	        const targetDate = new Date(dateStr);
	        targetDate.setHours(0, 0, 0, 0);
		
	        const formattedDate = targetDate.toLocaleDateString('fr-FR', { 
	            weekday: 'long', 
	            day: 'numeric', 
	            month: 'long' 
	        });
		
	        const confirmMessage = `Êtes-vous sûr de vouloir supprimer le jour "${formattedDate}" ?\n\n` +
	                              `Cette action supprimera définitivement toutes les données de cette journée.`;
		
	        if (!confirm(confirmMessage)) {
	            console.log('🚫 Suppression annulée par l\'utilisateur');
	            return;
	        }
		
	        console.log(`🗑️ Suppression du jour: ${formattedDate}`);
		
	        // Compter les entrées à supprimer
	        const entriesToDelete = this.app.planningData.filter(entry => {
	            const entryDate = new Date(entry.dateObj);
	            entryDate.setHours(0, 0, 0, 0);
	            return entryDate.getTime() === targetDate.getTime();
	        });
		
	        if (entriesToDelete.length === 0) {
	            this.app.displayManager.showWarning('Aucune donnée trouvée pour ce jour');
	            return;
	        }
		
	        // Supprimer les entrées de cette date
	        this.app.planningData = this.app.planningData.filter(entry => {
	            const entryDate = new Date(entry.dateObj);
	            entryDate.setHours(0, 0, 0, 0);
	            return entryDate.getTime() !== targetDate.getTime();
	        });
		
	        // Nettoyer les états d'édition
	        this.editingStates.delete(dayId);
	        this.originalData.delete(dayId);
		
	        // Sauvegarder dans le profil actuel
	        this.app.profileManager.saveCurrentProfileData();
		
	        // CORRECTION : Vérifier s'il reste des données
	        if (this.app.planningData.length === 0) {
	            // Plus de données, afficher l'écran vide
	            console.log('📭 Plus de données après suppression');
	            this.app.displayManager.showNoDataWithHelp();
	        } else {
	            // Il reste des données, réorganiser et essayer de préserver la position
	            console.log(`🔄 Réorganisation après suppression, retour à semaine ${currentWeekIndex + 1}`);
	            this.app.refreshCurrentWeekDisplayWithPosition(currentWeekIndex);
	        }
		
	        // Message de confirmation
	        this.app.displayManager.showSuccess(
	            `🗑️ Jour "${formattedDate}" supprimé (${entriesToDelete.length} entrée${entriesToDelete.length > 1 ? 's' : ''})`
	        );
		
	        console.log(`✅ Jour supprimé avec succès: ${entriesToDelete.length} entrées`);
		
	    } catch (error) {
	        console.error('❌ Erreur lors de la suppression du jour:', error);
	        this.app.displayManager.showError(`Erreur: ${error.message}`);
	    }
	}

	/**
	 * Bascule le mode repos
	 */
	toggleRestMode(dayId, isRest) {
		const cleanId = this.sanitizeId(dayId);
		const container = document.getElementById(`schedules-container-${cleanId}`);
		if (container) {
			if (isRest) {
				container.classList.add('hidden');
			} else {
				container.classList.remove('hidden');
			}
		}
		
		// Mettre à jour les champs automatiquement
		if (isRest) {
			this.setRestValues(dayId);
		} else {
			this.setWorkValues(dayId);
		}
	}

	/**
	 * Ajoute un nouveau créneau horaire
	 */
	addScheduleSlot(dayId) {
		const cleanId = this.sanitizeId(dayId);
		const schedulesList = document.getElementById(`schedules-list-${cleanId}`);
		if (!schedulesList) return;
		
		const currentSlots = schedulesList.querySelectorAll('.schedule-input-group').length;
		
		// Déterminer l'heure de début suggérée
		const suggestedTime = this.getSuggestedNextSlot(dayId);
		
		const newGroup = document.createElement('div');
		newGroup.innerHTML = this.renderScheduleInputGroup(
			dayId, 
			suggestedTime, 
			currentSlots, 
			true
		);
		
		schedulesList.appendChild(newGroup.firstElementChild);
		
		// Focus sur le premier input du nouveau créneau
		const newInput = newGroup.querySelector('.schedule-start');
		if (newInput) {
			setTimeout(() => newInput.focus(), 100);
		}
		
		console.log(`➕ Nouveau créneau ajouté pour ${dayId}`);
	}

	/**
	 * Supprime un créneau horaire
	 */
	removeScheduleSlot(dayId, index) {
		const cleanId = this.sanitizeId(dayId);
		const groupToRemove = document.getElementById(`schedule-group-${cleanId}-${index}`);
		if (groupToRemove) {
			groupToRemove.remove();
			this.reindexScheduleGroups(dayId);
			console.log(`➖ Créneau ${index} supprimé pour ${dayId}`);
		}
	}

	// ========================================
	// MÉTHODES PRIVÉES
	// ========================================

	/**
	 * Annule toutes les autres éditions en cours
	 */
	cancelAllOtherEdits(currentDayId) {
		this.editingStates.forEach((isEditing, dayId) => {
			if (isEditing && dayId !== currentDayId) {
				this.cancelEdit(dayId);
			}
		});
	}

	/**
	 * Sauvegarde l'état original pour pouvoir annuler
	 */
	saveOriginalState(dayId) {
		const dateStr = dayId.replace('day-', '');
		const targetDate = new Date(dateStr);
		targetDate.setHours(0, 0, 0, 0);
		
		const originalEntries = this.app.planningData.filter(entry => {
			const entryDate = new Date(entry.dateObj);
			entryDate.setHours(0, 0, 0, 0);
			return entryDate.getTime() === targetDate.getTime();
		});
		
		this.originalData.set(dayId, JSON.parse(JSON.stringify(originalEntries)));
	}

	/**
	 * SIMPLIFICATION: Restaure l'état original (version simple)
	 */
	restoreOriginalState(dayId) {
		// Cette méthode est maintenant appelée depuis cancelEdit()
		// et ne fait plus rien de spécial
		console.log(`🔄 État original restauré pour ${dayId}`);
	}

	/**
	 * Focus sur le jour en édition
	 */
	focusEditingDay(dayId) {
		setTimeout(() => {
			const dayCard = document.getElementById(dayId);
			if (dayCard) {
				dayCard.scrollIntoView({ 
					behavior: 'smooth', 
					block: 'center' 
				});
				
				// Focus sur le premier input éditable
				const firstInput = dayCard.querySelector('.schedule-input, .info-input');
				if (firstInput) {
					setTimeout(() => firstInput.focus(), 300);
				}
			}
		}, 100);
	}

	/**
	 * Attache les événements d'édition
	 */
	attachEditEvents(dayId) {
		// Cette méthode peut être étendue pour ajouter des événements spécifiques
		// comme la validation en temps réel, les raccourcis clavier, etc.
	}

	/**
	 * CORRECTION: Extrait les données du formulaire d'édition avec IDs nettoyés
	 */
	extractEditData(dayId) {
		const dayCard = document.getElementById(dayId);
		if (!dayCard) return null;
		
		const cleanId = this.sanitizeId(dayId);
		
		const isRest = dayCard.querySelector(`#rest-${cleanId}`)?.checked || false;
		const location = dayCard.querySelector(`#location-${cleanId}`)?.value?.trim() || '';
		const tasks = dayCard.querySelector(`#tasks-${cleanId}`)?.value?.trim() || '';
		
		const schedules = [];
		if (!isRest) {
			const startInputs = dayCard.querySelectorAll('.schedule-start');
			const endInputs = dayCard.querySelectorAll('.schedule-end');
			
			for (let i = 0; i < startInputs.length; i++) {
				const start = startInputs[i].value;
				const end = endInputs[i].value;
				if (start && end) {
					schedules.push({ start, end });
				}
			}
		}
		
		return { isRest, location, tasks, schedules };
	}

	/**
	 * Valide les données d'édition
	 */
	validateEditData(editData) {
		const errors = [];
		
		if (!editData.isRest) {
			// Validation horaires
			if (editData.schedules.length === 0) {
				errors.push('Au moins un créneau horaire requis');
			}
			
			for (let i = 0; i < editData.schedules.length; i++) {
				const schedule = editData.schedules[i];
				
				if (!this.validationRules.timeFormat.test(schedule.start)) {
					errors.push(`Heure de début invalide pour le créneau ${i + 1}`);
				}
				
				if (!this.validationRules.timeFormat.test(schedule.end)) {
					errors.push(`Heure de fin invalide pour le créneau ${i + 1}`);
				}
				
				if (schedule.start === schedule.end) {
					errors.push(`Le créneau ${i + 1} ne peut pas avoir la même heure de début et de fin`);
				}
			}
			
			// Validation durée totale
			const totalHours = this.calculateTotalHours(editData.schedules);
			if (totalHours > this.validationRules.maxHoursPerDay) {
				errors.push(`Durée totale trop élevée: ${totalHours.toFixed(1)}h (max: ${this.validationRules.maxHoursPerDay}h)`);
			}
		}
		
		// Validation champs obligatoires
		if (!editData.location) {
			errors.push('Le lieu est obligatoire');
		}
		
		if (!editData.tasks) {
			errors.push('La description des tâches est obligatoire');
		}
		
		return {
			isValid: errors.length === 0,
			errors: errors
		};
	}

	/**
	 * Applique les données d'édition au planning
	 */
	async applyEditData(dayId, editData) {
		const dateStr = dayId.replace('day-', '');
		const targetDate = new Date(dateStr);
		targetDate.setHours(0, 0, 0, 0);
		
		// Supprimer les anciennes entrées pour cette date
		this.app.planningData = this.app.planningData.filter(entry => {
			const entryDate = new Date(entry.dateObj);
			entryDate.setHours(0, 0, 0, 0);
			return entryDate.getTime() !== targetDate.getTime();
		});
		
		// Ajouter les nouvelles entrées
		if (editData.isRest) {
			this.app.planningData.push({
				date: targetDate.toISOString().split('T')[0],
				dateObj: targetDate,
				horaire: 'Repos',
				poste: editData.location || 'Congé',
				taches: editData.tasks || 'Jour de repos'
			});
		} else {
			editData.schedules.forEach(schedule => {
				this.app.planningData.push({
					date: targetDate.toISOString().split('T')[0],
					dateObj: targetDate,
					horaire: `${schedule.start}-${schedule.end}`,
					poste: editData.location || 'Bureau',
					taches: editData.tasks || 'Travail'
				});
			});
		}
		
		// Réorganiser les semaines
		this.app.weekManager.organizeWeeks(this.app.planningData);
		
		console.log(`✅ Données appliquées pour ${dayId}:`, editData);
	}

	/**
	 * Affiche les erreurs de validation
	 */
	showValidationErrors(dayId, errors) {
		// Afficher dans l'interface
		errors.forEach(error => {
			console.warn('⚠️ Validation:', error);
		});
		
		// Créer un message d'erreur groupé
		const errorMessage = `Erreurs de validation:\n${errors.map(e => `• ${e}`).join('\n')}`;
		alert(errorMessage);
		
		// Surligner les champs en erreur
		this.highlightErrorFields(dayId, errors);
	}

	/**
	 * Surligne les champs en erreur
	 */
	highlightErrorFields(dayId, errors) {
		const dayCard = document.getElementById(dayId);
		if (!dayCard) return;
		
		// Supprimer les anciens surlignages
		dayCard.querySelectorAll('.edit-error').forEach(el => {
			el.classList.remove('edit-error');
		});
		
		const cleanId = this.sanitizeId(dayId);
		
		// Ajouter les nouveaux surlignages
		errors.forEach(error => {
			if (error.includes('heure')) {
				dayCard.querySelectorAll('.schedule-input').forEach(input => {
					input.classList.add('edit-error');
				});
			}
			if (error.includes('lieu')) {
				const locationInput = dayCard.querySelector(`#location-${cleanId}`);
				if (locationInput) locationInput.classList.add('edit-error');
			}
			if (error.includes('tâches')) {
				const tasksInput = dayCard.querySelector(`#tasks-${cleanId}`);
				if (tasksInput) tasksInput.classList.add('edit-error');
			}
		});
	}

	/**
	 * CORRECTION: Marque le bouton comme en cours de sauvegarde
	 * Utilise un sélecteur plus robuste pour éviter les erreurs avec les IDs complexes
	 */
	setSavingState(dayId, isSaving) {
		// CORRECTION: Utiliser getElementById au lieu de querySelector avec un sélecteur complexe
		const dayCard = document.getElementById(dayId);
		if (!dayCard) {
			console.warn(`⚠️ Carte de jour non trouvée pour ${dayId}`);
			return;
		}
		
		const saveBtn = dayCard.querySelector('.edit-btn.save');
		if (saveBtn) {
			if (isSaving) {
				saveBtn.classList.add('saving');
				saveBtn.textContent = '⏳ Enregistrement...';
				saveBtn.disabled = true;
			} else {
				saveBtn.classList.remove('saving');
				saveBtn.textContent = '💾 Enregistrer';
				saveBtn.disabled = false;
			}
		} else {
			console.warn(`⚠️ Bouton de sauvegarde non trouvé dans ${dayId}`);
		}
	}

	/**
	 * Vérifie si un jour est en repos
	 */
	isRestDay(dayData) {
		if (!dayData || !dayData.entries || dayData.entries.length === 0) {
			return false;
		}
		
		const timeInfo = TimeUtils.extractTimeInfo(dayData.entries[0]);
		return timeInfo.isRest;
	}

	/**
	 * Extrait les horaires existants
	 */
	extractExistingSchedules(dayData, isRest) {
		if (isRest || !dayData?.entries) {
			return [{ start: '08:00', end: '17:00' }];
		}
		
		const schedules = [];
		dayData.entries.forEach(entry => {
			const timeInfo = TimeUtils.extractTimeInfo(entry);
			if (timeInfo.slots && timeInfo.slots.length > 0) {
				timeInfo.slots.forEach(slot => {
					schedules.push({ start: slot.start, end: slot.end });
				});
			}
		});
		
		return schedules.length > 0 ? schedules : [{ start: '08:00', end: '17:00' }];
	}

	/**
	 * CORRECTION: Génère le toggle repos avec ID nettoyé
	 */
	renderRestToggle(dayId, isRest) {
		const cleanId = this.sanitizeId(dayId);
		
		return `
			<div class="rest-toggle">
				<input type="checkbox" id="rest-${cleanId}" class="rest-checkbox" ${isRest ? 'checked' : ''}
					   onchange="window.planningApp.editManager.toggleRestMode('${dayId}', this.checked)">
				<label for="rest-${cleanId}" class="rest-label">🛌 Jour de repos</label>
			</div>
		`;
	}

	/**
	 * Génère un groupe d'inputs pour un créneau
	 */
	renderScheduleInputGroup(dayId, schedule, index, canRemove) {
		const cleanId = this.sanitizeId(dayId);
		
		return `
			<div class="schedule-input-group" id="schedule-group-${cleanId}-${index}">
				<input type="time" class="schedule-input schedule-start" value="${schedule.start}" 
					   data-day="${dayId}" data-index="${index}">
				<span class="schedule-separator">→</span>
				<input type="time" class="schedule-input schedule-end" value="${schedule.end}"
					   data-day="${dayId}" data-index="${index}">
				${canRemove ? 
				  `<button class="remove-slot-btn" onclick="window.planningApp.editManager.removeScheduleSlot('${dayId}', ${index})" title="Supprimer ce créneau">−</button>` : 
				  ''}
			</div>
		`;
	}

	/**
	 * Génère le bouton d'ajout de créneau
	 */
	renderAddSlotButton(dayId) {
		return `
			<div class="add-slot-container">
				<button class="add-slot-btn" onclick="window.planningApp.editManager.addScheduleSlot('${dayId}')" title="Ajouter un créneau">+</button>
				<div class="add-slot-text">Ajouter un créneau</div>
			</div>
		`;
	}

	/**
	 * CORRECTION: Génère la section d'informations avec IDs nettoyés
	 */
	renderInfoSection(dayId, location, tasks) {
		const cleanId = this.sanitizeId(dayId);
		
		return `
			<div class="info-section">
				<label class="info-label">📍 Lieu de travail :</label>
				<input type="text" class="info-input" id="location-${cleanId}" value="${location}" 
					   placeholder="Bureau, Site A, Télétravail, Congé...">
				
				<label class="info-label">✅ Tâches et activités :</label>
				<input type="text" class="info-input" id="tasks-${cleanId}" value="${tasks}"
					   placeholder="Réunions, formation, développement, maintenance...">
			</div>
		`;
	}

	/**
	 * Définit les valeurs par défaut pour un jour de repos
	 */
	setRestValues(dayId) {
		const cleanId = this.sanitizeId(dayId);
		const locationInput = document.getElementById(`location-${cleanId}`);
		const tasksInput = document.getElementById(`tasks-${cleanId}`);
		
		if (locationInput && !locationInput.value.toLowerCase().includes('congé')) {
			locationInput.value = 'Congé';
		}
		if (tasksInput && !tasksInput.value.toLowerCase().includes('repos')) {
			tasksInput.value = 'Jour de repos';
		}
	}

	/**
	 * Définit les valeurs par défaut pour un jour de travail
	 */
	setWorkValues(dayId) {
		const cleanId = this.sanitizeId(dayId);
		const locationInput = document.getElementById(`location-${cleanId}`);
		const tasksInput = document.getElementById(`tasks-${cleanId}`);
		
		if (locationInput && locationInput.value.toLowerCase().includes('congé')) {
			locationInput.value = 'Bureau';
		}
		if (tasksInput && tasksInput.value.toLowerCase().includes('repos')) {
			tasksInput.value = 'Travail';
		}
	}

	/**
	 * Suggère l'horaire pour le prochain créneau
	 */
	getSuggestedNextSlot(dayId) {
		const existingInputs = document.querySelectorAll(`#${CSS.escape(dayId)} .schedule-end`);
		if (existingInputs.length === 0) {
			return { start: '14:00', end: '18:00' };
		}
		
		// Prendre la dernière heure de fin et ajouter une pause
		const lastEndTime = existingInputs[existingInputs.length - 1].value;
		const [hours, minutes] = lastEndTime.split(':').map(Number);
		const startMinutes = hours * 60 + minutes + 30; // 30 min de pause
		
		const newStartHour = Math.floor(startMinutes / 60);
		const newStartMin = startMinutes % 60;
		
		if (newStartHour >= 24) {
			return { start: '14:00', end: '18:00' };
		}
		
		const startTime = `${newStartHour.toString().padStart(2, '0')}:${newStartMin.toString().padStart(2, '0')}`;
		const endTime = `${(newStartHour + 4).toString().padStart(2, '0')}:${newStartMin.toString().padStart(2, '0')}`;
		
		return { start: startTime, end: endTime };
	}

	/**
	 * Réindexe les groupes de créneaux
	 */
	reindexScheduleGroups(dayId) {
		const cleanId = this.sanitizeId(dayId);
		const schedulesList = document.getElementById(`schedules-list-${cleanId}`);
		if (!schedulesList) return;
		
		const groups = schedulesList.querySelectorAll('.schedule-input-group');
		groups.forEach((group, newIndex) => {
			group.id = `schedule-group-${cleanId}-${newIndex}`;
			
			const inputs = group.querySelectorAll('.schedule-input');
			inputs.forEach(input => {
				input.setAttribute('data-index', newIndex);
			});
			
			const removeBtn = group.querySelector('.remove-slot-btn');
			if (removeBtn) {
				removeBtn.setAttribute('onclick', `window.planningApp.editManager.removeScheduleSlot('${dayId}', ${newIndex})`);
			}
		});
	}

	/**
	 * Calcule le nombre total d'heures
	 */
	calculateTotalHours(schedules) {
		let total = 0;
		schedules.forEach(schedule => {
			const startMinutes = this.timeToMinutes(schedule.start);
			let endMinutes = this.timeToMinutes(schedule.end);
			
			// Gestion des horaires de nuit
			if (startMinutes > endMinutes) {
				endMinutes += 24 * 60;
			}
			
			total += (endMinutes - startMinutes) / 60;
		});
		return total;
	}

	/**
	 * Convertit une heure en minutes
	 */
	timeToMinutes(timeStr) {
		const [hours, minutes] = timeStr.split(':').map(Number);
		return hours * 60 + minutes;
	}

	/**
	 * Nettoie les états d'édition
	 */
	cleanup() {
		this.editingStates.clear();
		this.originalData.clear();
	}

	/**
	 * Obtient les statistiques d'édition
	 */
	getEditStats() {
	    return {
	        currentEditing: Array.from(this.editingStates.entries()).filter(([_, isEditing]) => isEditing).length,
	        totalSessions: this.editingStates.size,
	        hasUnsavedChanges: this.originalData.size > 0,
	        // NOUVEAU: ajout d'infos utiles
	        totalDays: this.app.planningData ? this.getTotalDaysCount() : 0,
	        editableDays: this.app.planningData ? this.getEditableDaysCount() : 0
	    };
	}

	/**
	 * Compte le nombre total de jours dans le planning
	 */
	getTotalDaysCount() {
	    const uniqueDates = new Set();
	    this.app.planningData.forEach(entry => {
	        if (entry.dateObj) {
	            const dateKey = entry.dateObj.toDateString();
	            uniqueDates.add(dateKey);
	        }
	    });
	    return uniqueDates.size;
	}

	/**
	 * Compte le nombre de jours éditables (avec des données)
	 */
	getEditableDaysCount() {
	    return this.getTotalDaysCount(); // Tous les jours avec données sont éditables
	}
}