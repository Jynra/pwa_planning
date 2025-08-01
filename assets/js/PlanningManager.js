/**
 * Gestionnaire de planning - Nouvelles fonctionnalités
 * Fichier: assets/js/PlanningManager.js
 * 
 * Fonctionnalités :
 * 1. Ajouter un jour spécifique
 * 2. Créer un planning vierge sur un intervalle de dates
 */
class PlanningManager {
    constructor(app) {
        this.app = app;
        this.addModalStyles();
    }

    /**
     * Affiche le dialogue pour ajouter un jour
     */
    showAddDayDialog() {
        const modal = this.createModal('addDay', {
            title: '📅 Ajouter un jour',
            content: this.renderAddDayForm(),
            buttons: [
                { text: 'Annuler', action: 'cancel', class: 'secondary' },
                { text: 'Ajouter', action: 'confirmAddDay', class: 'primary' }
            ]
        });
        
        this.attachAddDayEvents(modal);
        document.body.appendChild(modal);
        
        // Focus sur le champ date
        setTimeout(() => {
            const dateInput = modal.querySelector('#addDayDate');
            if (dateInput) {
                dateInput.focus();
                dateInput.value = new Date().toISOString().split('T')[0];
            }
        }, 100);
    }

    /**
     * Rendu du formulaire d'ajout de jour
     */
    renderAddDayForm() {
        return `
            <div class="add-day-form">
                <div class="form-section">
                    <label class="form-label" for="addDayDate">📅 Date :</label>
                    <input type="date" id="addDayDate" class="form-input" required>
                    <div class="form-hint">Sélectionnez la date à ajouter</div>
                </div>

                <div class="form-section">
                    <label class="form-label">🕒 Type de journée :</label>
                    <div class="day-type-options">
                        <label class="radio-option">
                            <input type="radio" name="dayType" value="work" checked>
                            <span class="radio-label">💼 Jour de travail</span>
                        </label>
                        <label class="radio-option">
                            <input type="radio" name="dayType" value="rest">
                            <span class="radio-label">🛌 Jour de repos</span>
                        </label>
                    </div>
                </div>

                <div class="form-section" id="workScheduleSection">
                    <label class="form-label">🕐 Horaires :</label>
                    <div class="schedule-inputs">
                        <div class="time-input-group">
                            <input type="time" id="startTime" class="form-input" value="08:00">
                            <span class="time-separator">→</span>
                            <input type="time" id="endTime" class="form-input" value="17:00">
                        </div>
                    </div>
                    <div class="form-hint">Vous pourrez ajouter d'autres créneaux après création</div>
                </div>

                <div class="form-section">
                    <label class="form-label" for="addDayLocation">📍 Lieu :</label>
                    <input type="text" id="addDayLocation" class="form-input" 
                           placeholder="Bureau, Site A, Télétravail..." value="Bureau">
                </div>

                <div class="form-section">
                    <label class="form-label" for="addDayTasks">✅ Tâches :</label>
                    <input type="text" id="addDayTasks" class="form-input" 
                           placeholder="Réunions, développement, formation..." value="Travail">
                </div>

                <div class="form-preview" id="dayPreview">
                    <div class="preview-title">👁️ Aperçu :</div>
                    <div class="preview-content" id="previewContent">
                        <div class="preview-item">📅 <span id="previewDate">-</span></div>
                        <div class="preview-item">🕒 <span id="previewSchedule">08:00-17:00</span></div>
                        <div class="preview-item">📍 <span id="previewLocation">Bureau</span></div>
                        <div class="preview-item">✅ <span id="previewTasks">Travail</span></div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Affiche le dialogue pour créer un planning vierge
     */
    showCreateBlankPlanningDialog() {
        const modal = this.createModal('createBlankPlanning', {
            title: '📋 Créer un planning vierge',
            content: this.renderBlankPlanningForm(),
            buttons: [
                { text: 'Annuler', action: 'cancel', class: 'secondary' },
                { text: 'Créer', action: 'confirmCreateBlankPlanning', class: 'primary' }
            ]
        });
        
        this.attachBlankPlanningEvents(modal);
        document.body.appendChild(modal);
        
        // Focus sur le champ date de début
        setTimeout(() => {
            const startDateInput = modal.querySelector('#blankStartDate');
            if (startDateInput) {
                startDateInput.focus();
                const nextMonday = this.getNextMonday();
                startDateInput.value = nextMonday.toISOString().split('T')[0];
                startDateInput.dispatchEvent(new Event('change'));
            }
        }, 100);
    }

    /**
     * Rendu du formulaire de création de planning vierge
     */
    renderBlankPlanningForm() {
        return `
            <div class="blank-planning-form">
                <div class="form-section">
                    <label class="form-label" for="blankStartDate">📅 Date de début :</label>
                    <input type="date" id="blankStartDate" class="form-input" required>
                    <div class="form-hint">Premier jour du planning</div>
                </div>

                <div class="form-section">
                    <label class="form-label" for="blankEndDate">📅 Date de fin :</label>
                    <input type="date" id="blankEndDate" class="form-input" required>
                    <div class="form-hint">Dernier jour du planning</div>
                </div>

                <div class="form-section">
                    <label class="form-label">📋 Type de planning :</label>
                    <div class="planning-type-options">
                        <label class="radio-option">
                            <input type="radio" name="planningType" value="workdays" checked>
                            <span class="radio-label">💼 Jours ouvrables uniquement (Lun-Ven)</span>
                        </label>
                        <label class="radio-option">
                            <input type="radio" name="planningType" value="all">
                            <span class="radio-label">📅 Tous les jours (Lun-Dim)</span>
                        </label>
                        <label class="radio-option">
                            <input type="radio" name="planningType" value="custom">
                            <span class="radio-label">⚙️ Personnalisé</span>
                        </label>
                    </div>
                </div>

                <div class="form-section" id="customDaysSection" style="display: none;">
                    <label class="form-label">📅 Jours à inclure :</label>
                    <div class="days-checkboxes">
                        <label class="checkbox-option">
                            <input type="checkbox" name="includeDays" value="1" checked>
                            <span class="checkbox-label">Lundi</span>
                        </label>
                        <label class="checkbox-option">
                            <input type="checkbox" name="includeDays" value="2" checked>
                            <span class="checkbox-label">Mardi</span>
                        </label>
                        <label class="checkbox-option">
                            <input type="checkbox" name="includeDays" value="3" checked>
                            <span class="checkbox-label">Mercredi</span>
                        </label>
                        <label class="checkbox-option">
                            <input type="checkbox" name="includeDays" value="4" checked>
                            <span class="checkbox-label">Jeudi</span>
                        </label>
                        <label class="checkbox-option">
                            <input type="checkbox" name="includeDays" value="5" checked>
                            <span class="checkbox-label">Vendredi</span>
                        </label>
                        <label class="checkbox-option">
                            <input type="checkbox" name="includeDays" value="6">
                            <span class="checkbox-label">Samedi</span>
                        </label>
                        <label class="checkbox-option">
                            <input type="checkbox" name="includeDays" value="0">
                            <span class="checkbox-label">Dimanche</span>
                        </label>
                    </div>
                </div>

                <div class="form-section">
                    <label class="form-label">🕐 Horaires par défaut :</label>
                    <div class="default-schedule-options">
                        <label class="radio-option">
                            <input type="radio" name="defaultSchedule" value="8h-17h" checked>
                            <span class="radio-label">08:00 - 17:00 (9h avec pause)</span>
                        </label>
                        <label class="radio-option">
                            <input type="radio" name="defaultSchedule" value="9h-18h">
                            <span class="radio-label">09:00 - 18:00 (9h avec pause)</span>
                        </label>
                        <label class="radio-option">
                            <input type="radio" name="defaultSchedule" value="8h-16h">
                            <span class="radio-label">08:00 - 16:00 (8h)</span>
                        </label>
                        <label class="radio-option">
                            <input type="radio" name="defaultSchedule" value="custom">
                            <span class="radio-label">⚙️ Personnalisé</span>
                        </label>
                    </div>
                </div>

                <div class="form-section" id="customScheduleSection" style="display: none;">
                    <div class="time-input-group">
                        <input type="time" id="customStartTime" class="form-input" value="08:00">
                        <span class="time-separator">→</span>
                        <input type="time" id="customEndTime" class="form-input" value="17:00">
                    </div>
                </div>

                <div class="form-section">
                    <label class="form-label" for="blankLocation">📍 Lieu par défaut :</label>
                    <input type="text" id="blankLocation" class="form-input" 
                           placeholder="Bureau, Site A..." value="Bureau">
                </div>

                <div class="form-section">
                    <label class="form-label" for="blankTasks">✅ Tâches par défaut :</label>
                    <input type="text" id="blankTasks" class="form-input" 
                           placeholder="Travail, Réunions..." value="Travail">
                </div>

                <div class="form-preview" id="planningPreview">
                    <div class="preview-title">👁️ Aperçu du planning :</div>
                    <div class="preview-content" id="planningPreviewContent">
                        <div class="preview-item">📅 <span id="previewPeriod">-</span></div>
                        <div class="preview-item">📊 <span id="previewDaysCount">0 jours</span></div>
                        <div class="preview-item">🕒 <span id="previewDefaultSchedule">08:00-17:00</span></div>
                        <div class="preview-item">📍 <span id="previewDefaultLocation">Bureau</span></div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Attache les événements pour le formulaire d'ajout de jour
     */
    attachAddDayEvents(modal) {
        const dayTypeInputs = modal.querySelectorAll('input[name="dayType"]');
        const workSection = modal.querySelector('#workScheduleSection');
        const dateInput = modal.querySelector('#addDayDate');
        const locationInput = modal.querySelector('#addDayLocation');
        const tasksInput = modal.querySelector('#addDayTasks');
        const startTimeInput = modal.querySelector('#startTime');
        const endTimeInput = modal.querySelector('#endTime');

        // Gestion du type de jour
        dayTypeInputs.forEach(input => {
            input.addEventListener('change', () => {
                const isWork = input.value === 'work';
                workSection.style.display = isWork ? 'block' : 'none';
                
                if (!isWork) {
                    locationInput.value = 'Congé';
                    tasksInput.value = 'Jour de repos';
                } else {
                    locationInput.value = 'Bureau';
                    tasksInput.value = 'Travail';
                }
                
                this.updateAddDayPreview(modal);
            });
        });

        // Mise à jour de l'aperçu en temps réel
        [dateInput, locationInput, tasksInput, startTimeInput, endTimeInput].forEach(input => {
            if (input) {
                input.addEventListener('input', () => this.updateAddDayPreview(modal));
                input.addEventListener('change', () => this.updateAddDayPreview(modal));
            }
        });

        // Boutons d'action
        modal.querySelector('[data-action="cancel"]').addEventListener('click', () => {
            this.closeModal(modal);
        });

        modal.querySelector('[data-action="confirmAddDay"]').addEventListener('click', () => {
            this.executeAddDay(modal);
        });

        // Mise à jour initiale
        this.updateAddDayPreview(modal);
    }

    /**
     * Attache les événements pour le formulaire de planning vierge
     */
    attachBlankPlanningEvents(modal) {
        const startDateInput = modal.querySelector('#blankStartDate');
        const endDateInput = modal.querySelector('#blankEndDate');
        const planningTypeInputs = modal.querySelectorAll('input[name="planningType"]');
        const scheduleTypeInputs = modal.querySelectorAll('input[name="defaultSchedule"]');
        const customDaysSection = modal.querySelector('#customDaysSection');
        const customScheduleSection = modal.querySelector('#customScheduleSection');
        const dayCheckboxes = modal.querySelectorAll('input[name="includeDays"]');

        // Calcul automatique de la date de fin (une semaine par défaut)
        startDateInput.addEventListener('change', () => {
            if (startDateInput.value) {
                const startDate = new Date(startDateInput.value);
                const endDate = new Date(startDate);
                endDate.setDate(startDate.getDate() + 6); // Une semaine
                endDateInput.value = endDate.toISOString().split('T')[0];
                this.updateBlankPlanningPreview(modal);
            }
        });

        // Validation date de fin >= date de début
        endDateInput.addEventListener('change', () => {
            if (startDateInput.value && endDateInput.value) {
                const startDate = new Date(startDateInput.value);
                const endDate = new Date(endDateInput.value);
                
                if (endDate < startDate) {
                    endDateInput.value = startDateInput.value;
                    alert('La date de fin ne peut pas être antérieure à la date de début');
                }
            }
            this.updateBlankPlanningPreview(modal);
        });

        // Gestion du type de planning
        planningTypeInputs.forEach(input => {
            input.addEventListener('change', () => {
                customDaysSection.style.display = input.value === 'custom' ? 'block' : 'none';
                this.updateBlankPlanningPreview(modal);
            });
        });

        // Gestion des horaires personnalisés
        scheduleTypeInputs.forEach(input => {
            input.addEventListener('change', () => {
                customScheduleSection.style.display = input.value === 'custom' ? 'block' : 'none';
                this.updateBlankPlanningPreview(modal);
            });
        });

        // Mise à jour de l'aperçu
        const updateInputs = [
            ...modal.querySelectorAll('input[type="date"]'),
            ...modal.querySelectorAll('input[type="text"]'),
            ...modal.querySelectorAll('input[type="time"]'),
            ...dayCheckboxes
        ];

        updateInputs.forEach(input => {
            if (input) {
                input.addEventListener('input', () => this.updateBlankPlanningPreview(modal));
                input.addEventListener('change', () => this.updateBlankPlanningPreview(modal));
            }
        });

        // Boutons d'action
        modal.querySelector('[data-action="cancel"]').addEventListener('click', () => {
            this.closeModal(modal);
        });

        modal.querySelector('[data-action="confirmCreateBlankPlanning"]').addEventListener('click', () => {
            this.executeCreateBlankPlanning(modal);
        });

        // Mise à jour initiale
        this.updateBlankPlanningPreview(modal);
    }

    /**
     * Met à jour l'aperçu pour l'ajout de jour
     */
    updateAddDayPreview(modal) {
        const dateInput = modal.querySelector('#addDayDate');
        const dayTypeInputs = modal.querySelectorAll('input[name="dayType"]');
        const locationInput = modal.querySelector('#addDayLocation');
        const tasksInput = modal.querySelector('#addDayTasks');
        const startTimeInput = modal.querySelector('#startTime');
        const endTimeInput = modal.querySelector('#endTime');

        const selectedType = Array.from(dayTypeInputs).find(input => input.checked)?.value;
        const isWork = selectedType === 'work';

        // Mise à jour de l'aperçu
        const previewDate = modal.querySelector('#previewDate');
        const previewSchedule = modal.querySelector('#previewSchedule');
        const previewLocation = modal.querySelector('#previewLocation');
        const previewTasks = modal.querySelector('#previewTasks');

        if (previewDate && dateInput.value) {
            const date = new Date(dateInput.value);
            previewDate.textContent = date.toLocaleDateString('fr-FR', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric' 
            });
        }

        if (previewSchedule) {
            if (isWork && startTimeInput.value && endTimeInput.value) {
                previewSchedule.textContent = `${startTimeInput.value}-${endTimeInput.value}`;
            } else {
                previewSchedule.textContent = 'Repos';
            }
        }

        if (previewLocation) {
            previewLocation.textContent = locationInput.value || '-';
        }

        if (previewTasks) {
            previewTasks.textContent = tasksInput.value || '-';
        }
    }

    /**
     * Met à jour l'aperçu pour le planning vierge
     */
    updateBlankPlanningPreview(modal) {
        const startDateInput = modal.querySelector('#blankStartDate');
        const endDateInput = modal.querySelector('#blankEndDate');
        const planningTypeInputs = modal.querySelectorAll('input[name="planningType"]');
        const scheduleTypeInputs = modal.querySelectorAll('input[name="defaultSchedule"]');
        const locationInput = modal.querySelector('#blankLocation');
        const customStartTime = modal.querySelector('#customStartTime');
        const customEndTime = modal.querySelector('#customEndTime');
        const dayCheckboxes = modal.querySelectorAll('input[name="includeDays"]:checked');

        // Éléments d'aperçu
        const previewPeriod = modal.querySelector('#previewPeriod');
        const previewDaysCount = modal.querySelector('#previewDaysCount');
        const previewDefaultSchedule = modal.querySelector('#previewDefaultSchedule');
        const previewDefaultLocation = modal.querySelector('#previewDefaultLocation');

        // Calcul de la période
        if (startDateInput.value && endDateInput.value) {
            const startDate = new Date(startDateInput.value);
            const endDate = new Date(endDateInput.value);
            
            if (previewPeriod) {
                previewPeriod.textContent = `${startDate.toLocaleDateString('fr-FR')} → ${endDate.toLocaleDateString('fr-FR')}`;
            }

            // Calcul du nombre de jours
            const selectedPlanningType = Array.from(planningTypeInputs).find(input => input.checked)?.value;
            const daysCount = this.calculateDaysCount(startDate, endDate, selectedPlanningType, dayCheckboxes);
            
            if (previewDaysCount) {
                previewDaysCount.textContent = `${daysCount} jour${daysCount > 1 ? 's' : ''}`;
            }
        }

        // Horaires par défaut
        if (previewDefaultSchedule) {
            const selectedSchedule = Array.from(scheduleTypeInputs).find(input => input.checked)?.value;
            let scheduleText = '';
            
            switch (selectedSchedule) {
                case '8h-17h':
                    scheduleText = '08:00-17:00';
                    break;
                case '9h-18h':
                    scheduleText = '09:00-18:00';
                    break;
                case '8h-16h':
                    scheduleText = '08:00-16:00';
                    break;
                case 'custom':
                    if (customStartTime && customEndTime && customStartTime.value && customEndTime.value) {
                        scheduleText = `${customStartTime.value}-${customEndTime.value}`;
                    }
                    break;
            }
            
            previewDefaultSchedule.textContent = scheduleText || '-';
        }

        // Lieu par défaut
        if (previewDefaultLocation) {
            previewDefaultLocation.textContent = locationInput.value || '-';
        }
    }

    /**
     * Calcule le nombre de jours selon le type de planning
     */
    calculateDaysCount(startDate, endDate, planningType, dayCheckboxes) {
        let count = 0;
        const currentDate = new Date(startDate);
        
        while (currentDate <= endDate) {
            const dayOfWeek = currentDate.getDay();
            let includeDay = false;
            
            switch (planningType) {
                case 'workdays':
                    includeDay = dayOfWeek >= 1 && dayOfWeek <= 5; // Lun-Ven
                    break;
                case 'all':
                    includeDay = true;
                    break;
                case 'custom':
                    const selectedDays = Array.from(dayCheckboxes).map(cb => parseInt(cb.value));
                    includeDay = selectedDays.includes(dayOfWeek);
                    break;
            }
            
            if (includeDay) {
                count++;
            }
            
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        return count;
    }

    /**
     * Exécute l'ajout d'un jour
     */
    executeAddDay(modal) {
	    try {
	        const data = this.extractAddDayData(modal);
		
	        // Validation
	        if (!data.date) {
	            throw new Error('La date est obligatoire');
	        }
		
	        // CORRECTION : Vérifier si le profil était vraiment vide AVANT toute modification
	        const wasProfileEmpty = this.app.planningData.length === 0;
	        console.log(`📊 Profil était vide: ${wasProfileEmpty}`);
		
	        // Sauvegarder l'index de semaine AVANT modification (seulement si profil pas vide)
	        let currentWeekIndex = 0;
	        if (!wasProfileEmpty) {
	            currentWeekIndex = this.app.weekManager.getCurrentWeekIndex();
	            console.log(`📍 Index semaine avant ajout: ${currentWeekIndex + 1}`);
	        }
		
	        // Vérifier si la date existe déjà
	        const existingEntry = this.app.planningData.find(entry => {
	            const entryDate = new Date(entry.dateObj);
	            const targetDate = new Date(data.date);
	            entryDate.setHours(0, 0, 0, 0);
	            targetDate.setHours(0, 0, 0, 0);
	            return entryDate.getTime() === targetDate.getTime();
	        });
		
	        if (existingEntry) {
	            if (!confirm('Un jour existe déjà pour cette date. Voulez-vous le remplacer ?')) {
	                return;
	            }
			
	            // Supprimer l'entrée existante
	            this.app.planningData = this.app.planningData.filter(entry => {
	                const entryDate = new Date(entry.dateObj);
	                const targetDate = new Date(data.date);
	                entryDate.setHours(0, 0, 0, 0);
	                targetDate.setHours(0, 0, 0, 0);
	                return entryDate.getTime() !== targetDate.getTime();
	            });
	        }
		
	        // Créer la nouvelle entrée
	        const newEntry = {
	            date: data.date,
	            dateObj: new Date(data.date),
	            horaire: data.isWork ? `${data.startTime}-${data.endTime}` : 'Repos',
	            poste: data.location,
	            taches: data.tasks
	        };
		
	        // Ajouter à la liste
	        this.app.planningData.push(newEntry);
		
	        // Sauvegarder
	        this.app.profileManager.saveCurrentProfileData();
		
	        // CORRECTION : Logique de rafraîchissement
	        if (wasProfileEmpty) {
	            // Le profil était vide, initialisation complète nécessaire
	            console.log('🆕 Premier jour du profil, initialisation complète');
	            this.app.processDataWithValidation();
	        } else {
	            // Le profil avait déjà des données, préserver la position
	            console.log('➕ Ajout à un profil existant, préservation position');
			
	            // Calculer dans quelle semaine sera le nouveau jour
	            const newDate = new Date(data.date);
	            const newWeekStart = this.app.weekManager.getWeekStart(newDate);
			
	            // Vérifier si le nouveau jour est dans la semaine courante affichée
	            const currentWeek = this.app.weekManager.getCurrentWeek();
	            let shouldStayOnCurrentWeek = false;
			
	            if (currentWeek) {
	                const currentWeekStart = currentWeek.weekStart;
	                shouldStayOnCurrentWeek = (newWeekStart.getTime() === currentWeekStart.getTime());
	                console.log(`🔍 Nouveau jour dans semaine courante: ${shouldStayOnCurrentWeek}`);
	            }
			
	            if (shouldStayOnCurrentWeek) {
	                // Le nouveau jour est dans la semaine affichée, rester sur cette semaine
	                this.app.refreshCurrentWeekDisplayWithPosition(currentWeekIndex);
	            } else {
	                // Le nouveau jour est dans une autre semaine, aller à cette semaine
	                this.app.weekManager.organizeWeeks(this.app.planningData);
				
	                // Trouver l'index de la semaine du nouveau jour
	                const weeks = this.app.weekManager.getWeeks();
	                const targetWeekIndex = weeks.findIndex(week => {
	                    return week.weekStart.getTime() === newWeekStart.getTime();
	                });
				
	                if (targetWeekIndex !== -1) {
	                    console.log(`📍 Aller à la semaine du nouveau jour: ${targetWeekIndex + 1}`);
	                    this.app.refreshCurrentWeekDisplayWithPosition(targetWeekIndex);
	                } else {
	                    console.log('⚠️ Semaine du nouveau jour non trouvée, rafraîchissement standard');
	                    this.app.refreshCurrentWeekDisplayWithPosition(currentWeekIndex);
	                }
	            }
	        }
		
	        // Fermer la modale et afficher confirmation
	        this.closeModal(modal);
	        this.app.showSaveIndicator(`✅ Jour ajouté: ${new Date(data.date).toLocaleDateString('fr-FR')}`);
		
	    } catch (error) {
	        console.error('❌ Erreur ajout jour:', error);
	        alert(`Erreur: ${error.message}`);
	    }
	}

    /**
     * Exécute la création du planning vierge
     */
    executeCreateBlankPlanning(modal) {
	    try {
	        const data = this.extractBlankPlanningData(modal);
		
	        // Validation
	        if (!data.startDate || !data.endDate) {
	            throw new Error('Les dates de début et fin sont obligatoires');
	        }
		
	        if (new Date(data.endDate) < new Date(data.startDate)) {
	            throw new Error('La date de fin doit être postérieure à la date de début');
	        }
		
	        // Confirmation si des données existent déjà
	        if (this.app.planningData.length > 0) {
	            const currentProfile = this.app.profileManager.getCurrentProfile();
	            const message = `Créer un nouveau planning vierge dans le profil "${currentProfile?.name}" ?\n\n` +
	                          `Cela remplacera les ${this.app.planningData.length} entrées actuelles.`;
			
	            if (!confirm(message)) {
	                return;
	            }
	        }
		
	        // Générer le planning
	        const newPlanningData = this.generateBlankPlanning(data);
		
	        // Remplacer les données actuelles
	        this.app.planningData = newPlanningData;
		
	        // Sauvegarder et actualiser
	        this.app.profileManager.saveCurrentProfileData();
		
	        // CORRECTION : Toujours utiliser processDataWithValidation pour un planning vierge
	        // car c'est un remplacement complet
	        console.log('📋 Planning vierge créé, initialisation complète');
	        this.app.processDataWithValidation();
		
	        // Fermer la modale et afficher confirmation
	        this.closeModal(modal);
	        this.app.showSaveIndicator(`✅ Planning vierge créé: ${newPlanningData.length} jours`);
		
	    } catch (error) {
	        console.error('❌ Erreur création planning:', error);
	        alert(`Erreur: ${error.message}`);
	    }
	}

    /**
     * Extrait les données du formulaire d'ajout de jour
     */
    extractAddDayData(modal) {
        const dateInput = modal.querySelector('#addDayDate');
        const dayTypeInputs = modal.querySelectorAll('input[name="dayType"]');
        const locationInput = modal.querySelector('#addDayLocation');
        const tasksInput = modal.querySelector('#addDayTasks');
        const startTimeInput = modal.querySelector('#startTime');
        const endTimeInput = modal.querySelector('#endTime');

        const selectedType = Array.from(dayTypeInputs).find(input => input.checked)?.value;
        const isWork = selectedType === 'work';

        return {
            date: dateInput.value,
            isWork: isWork,
            location: locationInput.value || (isWork ? 'Bureau' : 'Congé'),
            tasks: tasksInput.value || (isWork ? 'Travail' : 'Jour de repos'),
            startTime: startTimeInput.value || '08:00',
            endTime: endTimeInput.value || '17:00'
        };
    }

    /**
     * Extrait les données du formulaire de planning vierge
     */
    extractBlankPlanningData(modal) {
        const startDateInput = modal.querySelector('#blankStartDate');
        const endDateInput = modal.querySelector('#blankEndDate');
        const planningTypeInputs = modal.querySelectorAll('input[name="planningType"]');
        const scheduleTypeInputs = modal.querySelectorAll('input[name="defaultSchedule"]');
        const locationInput = modal.querySelector('#blankLocation');
        const tasksInput = modal.querySelector('#blankTasks');
        const customStartTime = modal.querySelector('#customStartTime');
        const customEndTime = modal.querySelector('#customEndTime');
        const dayCheckboxes = modal.querySelectorAll('input[name="includeDays"]:checked');

        const selectedPlanningType = Array.from(planningTypeInputs).find(input => input.checked)?.value;
        const selectedSchedule = Array.from(scheduleTypeInputs).find(input => input.checked)?.value;
        const selectedDays = Array.from(dayCheckboxes).map(cb => parseInt(cb.value));

        // Déterminer les horaires
        let startTime = '08:00';
        let endTime = '17:00';

        switch (selectedSchedule) {
            case '8h-17h':
                startTime = '08:00';
                endTime = '17:00';
                break;
            case '9h-18h':
                startTime = '09:00';
                endTime = '18:00';
                break;
            case '8h-16h':
                startTime = '08:00';
                endTime = '16:00';
                break;
            case 'custom':
                startTime = customStartTime?.value || '08:00';
                endTime = customEndTime?.value || '17:00';
                break;
        }

        return {
            startDate: startDateInput.value,
            endDate: endDateInput.value,
            planningType: selectedPlanningType,
            selectedDays: selectedDays,
            startTime: startTime,
            endTime: endTime,
            location: locationInput.value || 'Bureau',
            tasks: tasksInput.value || 'Travail'
        };
    }

    /**
     * Génère un planning vierge selon les paramètres
     */
    generateBlankPlanning(data) {
        const planningData = [];
        const currentDate = new Date(data.startDate);
        const endDate = new Date(data.endDate);

        while (currentDate <= endDate) {
            const dayOfWeek = currentDate.getDay();
            let includeDay = false;

            // Déterminer si ce jour doit être inclus
            switch (data.planningType) {
                case 'workdays':
                    includeDay = dayOfWeek >= 1 && dayOfWeek <= 5; // Lun-Ven
                    break;
                case 'all':
                    includeDay = true;
                    break;
                case 'custom':
                    includeDay = data.selectedDays.includes(dayOfWeek);
                    break;
            }

            if (includeDay) {
                const entry = {
                    date: currentDate.toISOString().split('T')[0],
                    dateObj: new Date(currentDate),
                    horaire: `${data.startTime}-${data.endTime}`,
                    poste: data.location,
                    taches: data.tasks
                };
                planningData.push(entry);
            }

            currentDate.setDate(currentDate.getDate() + 1);
        }

        return planningData;
    }

    /**
     * Obtient le prochain lundi
     */
    getNextMonday() {
        const today = new Date();
        const dayOfWeek = today.getDay();
        const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
        
        const nextMonday = new Date(today);
        nextMonday.setDate(today.getDate() + daysUntilMonday);
        return nextMonday;
    }

    /**
     * Crée une modale générique
     */
    createModal(id, config) {
        const modal = document.createElement('div');
        modal.className = 'planning-modal';
        modal.id = `modal-${id}`;
        
        modal.innerHTML = `
            <div class="modal-overlay">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 class="modal-title">${config.title}</h3>
                        <button class="modal-close" data-action="cancel">✕</button>
                    </div>
                    <div class="modal-body">
                        ${config.content}
                    </div>
                    <div class="modal-footer">
                        ${config.buttons.map(btn => 
                            `<button class="modal-btn ${btn.class}" data-action="${btn.action}">${btn.text}</button>`
                        ).join('')}
                    </div>
                </div>
            </div>
        `;

        // Styles inline pour la modale
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.6);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2000;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
        `;

        // Afficher la modale
        setTimeout(() => {
            modal.style.opacity = '1';
            modal.style.visibility = 'visible';
        }, 10);

        // Fermeture avec Escape
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                this.closeModal(modal);
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);

        // Fermeture en cliquant sur l'overlay
        modal.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                this.closeModal(modal);
            }
        });

        return modal;
    }

    /**
     * Ferme une modale
     */
    closeModal(modal) {
        modal.style.opacity = '0';
        modal.style.visibility = 'hidden';
        setTimeout(() => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        }, 300);
    }

    /**
     * Ajoute les styles CSS pour les modales
     */
    addModalStyles() {
        if (document.getElementById('planning-modal-styles')) return;

        const style = document.createElement('style');
        style.id = 'planning-modal-styles';
        style.textContent = `
            .planning-modal .modal-content {
                background: var(--card-bg);
                border-radius: 20px;
                max-width: 600px;
                width: 90%;
                max-height: 90vh;
                overflow: hidden;
                box-shadow: 0 15px 35px rgba(0, 0, 0, 0.3);
                transform: translateY(-20px) scale(0.95);
                transition: all 0.3s ease;
            }

            .planning-modal[style*="opacity: 1"] .modal-content {
                transform: translateY(0) scale(1);
            }

            .planning-modal .modal-header {
                background: linear-gradient(135deg, var(--accent-blue), #42a5f5);
                color: white;
                padding: 20px 25px;
                display: flex;
                align-items: center;
                justify-content: space-between;
            }

            .planning-modal .modal-title {
                margin: 0;
                font-size: 1.2rem;
                font-weight: 600;
            }

            .planning-modal .modal-close {
                background: rgba(255, 255, 255, 0.2);
                border: none;
                border-radius: 50%;
                width: 35px;
                height: 35px;
                font-size: 1.2rem;
                color: white;
                cursor: pointer;
                transition: all 0.3s ease;
            }

            .planning-modal .modal-close:hover {
                background: rgba(255, 255, 255, 0.3);
                transform: scale(1.1);
            }

            .planning-modal .modal-body {
                padding: 25px;
                max-height: 60vh;
                overflow-y: auto;
            }

            .planning-modal .modal-footer {
                padding: 20px 25px;
                border-top: 1px solid var(--border-color);
                display: flex;
                gap: 10px;
                justify-content: flex-end;
            }

            .planning-modal .modal-btn {
                padding: 12px 24px;
                border: none;
                border-radius: 12px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.3s ease;
                font-size: 0.9rem;
            }

            .planning-modal .modal-btn.primary {
                background: var(--accent-blue);
                color: white;
            }

            .planning-modal .modal-btn.primary:hover {
                background: #42a5f5;
                transform: translateY(-1px);
            }

            .planning-modal .modal-btn.secondary {
                background: var(--border-color);
                color: var(--text-secondary);
            }

            .planning-modal .modal-btn.secondary:hover {
                background: var(--bg-secondary);
            }

            /* Styles pour les formulaires */
            .form-section {
                margin-bottom: 20px;
            }

            .form-label {
                display: block;
                margin-bottom: 8px;
                font-weight: 500;
                color: var(--text-primary);
                font-size: 0.9rem;
            }

            .form-input {
                width: 100%;
                padding: 12px;
                border: 2px solid var(--border-color);
                border-radius: 10px;
                font-size: 0.9rem;
                background: var(--card-bg);
                color: var(--text-primary);
                transition: all 0.3s ease;
                box-sizing: border-box;
            }

            .form-input:focus {
                outline: none;
                border-color: var(--accent-blue);
                box-shadow: 0 0 0 3px rgba(100, 181, 246, 0.1);
            }

            .form-hint {
                font-size: 0.8rem;
                color: var(--text-muted);
                margin-top: 5px;
            }

            .radio-option, .checkbox-option {
                display: flex;
                align-items: center;
                gap: 10px;
                margin-bottom: 12px;
                cursor: pointer;
                padding: 8px;
                border-radius: 8px;
                transition: background 0.3s ease;
            }

            .radio-option:hover, .checkbox-option:hover {
                background: rgba(100, 181, 246, 0.05);
            }

            .radio-option input, .checkbox-option input {
                width: auto;
                margin: 0;
            }

            .radio-label, .checkbox-label {
                flex: 1;
                font-size: 0.9rem;
                color: var(--text-primary);
            }

            .time-input-group {
                display: flex;
                align-items: center;
                gap: 10px;
            }

            .time-input-group .form-input {
                width: 120px;
            }

            .time-separator {
                font-size: 1.2rem;
                font-weight: 600;
                color: var(--text-secondary);
            }

            .days-checkboxes {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
                gap: 8px;
            }

            .form-preview {
                background: linear-gradient(135deg, rgba(100, 181, 246, 0.1), rgba(100, 181, 246, 0.05));
                border: 1px solid rgba(100, 181, 246, 0.2);
                border-radius: 12px;
                padding: 15px;
                margin-top: 20px;
            }

            .preview-title {
                font-weight: 600;
                color: var(--accent-blue);
                margin-bottom: 10px;
                font-size: 0.9rem;
            }

            .preview-content {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .preview-item {
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 0.9rem;
                color: var(--text-primary);
            }

            .preview-item span {
                font-weight: 500;
            }

            /* Mode sombre */
            .dark-theme .planning-modal .modal-content {
                box-shadow: 0 15px 35px rgba(0, 0, 0, 0.6);
            }

            .dark-theme .radio-option:hover, 
            .dark-theme .checkbox-option:hover {
                background: rgba(90, 159, 212, 0.1);
            }

            /* Responsive */
            @media (max-width: 480px) {
                .planning-modal .modal-content {
                    width: 95%;
                    max-height: 95vh;
                }

                .planning-modal .modal-header,
                .planning-modal .modal-body,
                .planning-modal .modal-footer {
                    padding: 15px 20px;
                }

                .planning-modal .modal-footer {
                    flex-direction: column;
                }

                .planning-modal .modal-btn {
                    width: 100%;
                    justify-content: center;
                }

                .days-checkboxes {
                    grid-template-columns: repeat(2, 1fr);
                }

                .time-input-group {
                    flex-direction: column;
                    align-items: stretch;
                }

                .time-input-group .form-input {
                    width: 100%;
                }

                .time-separator {
                    align-self: center;
                    transform: rotate(90deg);
                }
            }
        `;
        
        document.head.appendChild(style);
    }

    /**
     * Nettoie les ressources
     */
    cleanup() {
        // Supprimer les modales ouvertes
        document.querySelectorAll('.planning-modal').forEach(modal => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        });
        console.log('🧹 PlanningManager nettoyé');
    }
}