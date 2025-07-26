/**
 * EditRenderer.js - Gestion du rendu des éléments d'édition
 * Génère et gère l'interface utilisateur pour l'édition des horaires
 * CORRECTION : IDs nettoyés pour éviter les erreurs querySelector
 */

class EditRenderer {
    constructor() {
        console.log('✨ EditRenderer initialisé');
    }

    /**
     * Nettoie un string pour en faire un ID CSS valide
     * Supprime espaces et caractères spéciaux
     */
    sanitizeId(str) {
        return str
            .replace(/\s+/g, '-')        // Remplace espaces par tirets
            .replace(/[^a-zA-Z0-9-_]/g, '') // Supprime caractères spéciaux
            .toLowerCase();               // En minuscules
    }

    /**
     * Génère l'interface d'édition pour un jour
     * @param {Object} day - Données du jour à éditer
     * @param {HTMLElement} container - Conteneur où insérer l'interface
     */
    renderEditInterface(day, container) {
        const dateStr = day.date.toDateString();
        const sanitizedDateStr = this.sanitizeId(dateStr);
        
        // Debug
        console.log('🔧 Génération interface édition pour:', dateStr, '→', sanitizedDateStr);
        
        const editHTML = `
            <div class="edit-interface" id="edit-${sanitizedDateStr}">
                <div class="edit-header">
                    <h4>✏️ Modification ${day.dayName} ${day.date.getDate()}</h4>
                    <div class="edit-actions">
                        <button class="btn-save" onclick="planningApp.editManager.saveDay('${dateStr}')">
                            💾 Enregistrer
                        </button>
                        <button class="btn-cancel" onclick="planningApp.editManager.cancelEdit('${dateStr}')">
                            ❌ Annuler
                        </button>
                    </div>
                </div>
                
                <div class="edit-controls">
                    <!-- Checkbox jour de repos avec ID nettoyé -->
                    <div class="rest-day-control">
                        <input type="checkbox" 
                               id="rest-day-${sanitizedDateStr}" 
                               ${day.isRestDay ? 'checked' : ''}>
                        <label for="rest-day-${sanitizedDateStr}">
                            ☑️ Jour de repos
                        </label>
                    </div>
                    
                    <!-- Lieu de travail -->
                    <div class="location-control">
                        <label for="location-${sanitizedDateStr}">📍 Lieu :</label>
                        <input type="text" 
                               id="location-${sanitizedDateStr}" 
                               value="${day.location || ''}" 
                               placeholder="Bureau, Site A...">
                    </div>
                    
                    <!-- Tâches -->
                    <div class="tasks-control">
                        <label for="tasks-${sanitizedDateStr}">📝 Tâches :</label>
                        <textarea id="tasks-${sanitizedDateStr}" 
                                  placeholder="Description des tâches...">${day.tasks || ''}</textarea>
                    </div>
                    
                    <!-- Horaires -->
                    <div class="schedules-control">
                        <div class="schedules-header">
                            <h5>🕐 Horaires</h5>
                            <button class="btn-add-schedule" 
                                    onclick="planningApp.editRenderer.addScheduleSlot('${sanitizedDateStr}')">
                                ➕ Ajouter créneau
                            </button>
                        </div>
                        <div class="schedules-list" id="schedules-${sanitizedDateStr}">
                            ${this.renderScheduleSlots(day.schedules || [], sanitizedDateStr)}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        container.innerHTML = editHTML;
        
        // Ajouter les événements
        this.attachEditEvents(sanitizedDateStr, day);
    }

    /**
     * Génère les créneaux horaires
     * @param {Array} schedules - Liste des horaires
     * @param {string} sanitizedDateStr - ID nettoyé de la date
     * @returns {string} HTML des créneaux
     */
    renderScheduleSlots(schedules, sanitizedDateStr) {
        if (!schedules || schedules.length === 0) {
            return this.renderScheduleSlot('', '', 0, sanitizedDateStr);
        }
        
        return schedules.map((schedule, index) => {
            const parts = schedule.split('-');
            const startTime = parts[0] || '';
            const endTime = parts[1] || '';
            return this.renderScheduleSlot(startTime, endTime, index, sanitizedDateStr);
        }).join('');
    }

    /**
     * Génère un créneau horaire individuel
     * @param {string} startTime - Heure de début
     * @param {string} endTime - Heure de fin
     * @param {number} index - Index du créneau
     * @param {string} sanitizedDateStr - ID nettoyé de la date
     * @returns {string} HTML du créneau
     */
    renderScheduleSlot(startTime, endTime, index, sanitizedDateStr) {
        return `
            <div class="schedule-slot" data-index="${index}">
                <div class="time-inputs">
                    <input type="time" 
                           class="start-time" 
                           value="${startTime}" 
                           id="start-${sanitizedDateStr}-${index}">
                    <span class="time-separator">→</span>
                    <input type="time" 
                           class="end-time" 
                           value="${endTime}"
                           id="end-${sanitizedDateStr}-${index}">
                </div>
                <button class="btn-remove-schedule" 
                        onclick="planningApp.editRenderer.removeScheduleSlot(this)"
                        ${index === 0 ? 'style="visibility: hidden;"' : ''}>
                    ➖
                </button>
            </div>
        `;
    }

    /**
     * Ajoute un nouveau créneau horaire
     * @param {string} sanitizedDateStr - ID nettoyé de la date
     */
    addScheduleSlot(sanitizedDateStr) {
        const schedulesList = document.getElementById(`schedules-${sanitizedDateStr}`);
        if (!schedulesList) {
            console.error('❌ Liste des horaires non trouvée:', sanitizedDateStr);
            return;
        }

        const currentSlots = schedulesList.querySelectorAll('.schedule-slot');
        const newIndex = currentSlots.length;
        
        const newSlotHTML = this.renderScheduleSlot('', '', newIndex, sanitizedDateStr);
        schedulesList.insertAdjacentHTML('beforeend', newSlotHTML);
        
        // Attacher les événements au nouveau créneau
        const newSlot = schedulesList.lastElementChild;
        const timeInputs = newSlot.querySelectorAll('input[type="time"]');
        timeInputs.forEach(input => {
            input.addEventListener('change', () => {
                this.validateTimeInput(input);
            });
        });
        
        console.log('➕ Nouveau créneau ajouté:', newIndex);
    }

    /**
     * Supprime un créneau horaire
     * @param {HTMLElement} button - Bouton de suppression cliqué
     */
    removeScheduleSlot(button) {
        const slot = button.closest('.schedule-slot');
        const schedulesList = slot.parentNode;
        
        // Ne pas supprimer s'il n'y a qu'un seul créneau
        const remainingSlots = schedulesList.querySelectorAll('.schedule-slot');
        if (remainingSlots.length <= 1) {
            console.log('❌ Impossible de supprimer le dernier créneau');
            return;
        }
        
        slot.remove();
        console.log('➖ Créneau supprimé');
        
        // Réindexer les créneaux restants
        this.reindexScheduleSlots(schedulesList);
    }

    /**
     * Réindexe les créneaux après suppression
     * @param {HTMLElement} schedulesList - Conteneur des créneaux
     */
    reindexScheduleSlots(schedulesList) {
        const slots = schedulesList.querySelectorAll('.schedule-slot');
        slots.forEach((slot, index) => {
            slot.dataset.index = index;
            
            // Mettre à jour les IDs des inputs
            const startInput = slot.querySelector('.start-time');
            const endInput = slot.querySelector('.end-time');
            
            if (startInput && endInput) {
                const baseId = startInput.id.split('-').slice(0, -1).join('-');
                startInput.id = `${baseId}-${index}`;
                endInput.id = `${baseId.replace('start', 'end')}-${index}`;
            }
            
            // Masquer/afficher le bouton de suppression
            const removeBtn = slot.querySelector('.btn-remove-schedule');
            if (removeBtn) {
                removeBtn.style.visibility = index === 0 ? 'hidden' : 'visible';
            }
        });
    }

    /**
     * Attache les événements aux éléments d'édition
     * @param {string} sanitizedDateStr - ID nettoyé de la date
     * @param {Object} day - Données du jour
     */
    attachEditEvents(sanitizedDateStr, day) {
        // Événement pour le checkbox jour de repos
        const restDayCheckbox = document.getElementById(`rest-day-${sanitizedDateStr}`);
        if (restDayCheckbox) {
            restDayCheckbox.addEventListener('change', (e) => {
                const isRestDay = e.target.checked;
                console.log('☑️ Jour de repos modifié:', isRestDay);
                
                // Masquer/afficher les horaires selon l'état
                const schedulesControl = document.querySelector(`#edit-${sanitizedDateStr} .schedules-control`);
                if (schedulesControl) {
                    schedulesControl.style.display = isRestDay ? 'none' : 'block';
                }
            });
        }

        // Validation en temps réel des horaires
        const timeInputs = document.querySelectorAll(`#edit-${sanitizedDateStr} input[type="time"]`);
        timeInputs.forEach(input => {
            input.addEventListener('change', () => {
                this.validateTimeInput(input);
            });
        });

        // Événements pour les champs texte
        const locationInput = document.getElementById(`location-${sanitizedDateStr}`);
        const tasksInput = document.getElementById(`tasks-${sanitizedDateStr}`);
        
        if (locationInput) {
            locationInput.addEventListener('input', () => {
                console.log('📍 Lieu modifié:', locationInput.value);
            });
        }
        
        if (tasksInput) {
            tasksInput.addEventListener('input', () => {
                console.log('📝 Tâches modifiées:', tasksInput.value.substring(0, 50) + '...');
            });
        }
    }

    /**
     * Valide un champ d'heure
     * @param {HTMLElement} input - Input de type time à valider
     */
    validateTimeInput(input) {
        const value = input.value;
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        
        if (value && !timeRegex.test(value)) {
            input.style.borderColor = '#ff8a80';
            input.style.backgroundColor = '#ffebee';
            console.log('❌ Format d\'heure invalide:', value);
        } else {
            input.style.borderColor = '#81c784';
            input.style.backgroundColor = '#f1f8e9';
            console.log('✅ Heure valide:', value);
        }
    }

    /**
     * Collecte les données d'édition depuis l'interface
     * @param {string} sanitizedDateStr - ID nettoyé de la date
     * @returns {Object|null} Données collectées ou null en cas d'erreur
     */
    collectEditData(sanitizedDateStr) {
        const editInterface = document.getElementById(`edit-${sanitizedDateStr}`);
        if (!editInterface) {
            console.error('❌ Interface d\'édition non trouvée:', sanitizedDateStr);
            return null;
        }

        // Récupérer les données
        const restDayCheckbox = document.getElementById(`rest-day-${sanitizedDateStr}`);
        const locationInput = document.getElementById(`location-${sanitizedDateStr}`);
        const tasksInput = document.getElementById(`tasks-${sanitizedDateStr}`);
        
        const isRestDay = restDayCheckbox ? restDayCheckbox.checked : false;
        const location = locationInput ? locationInput.value : '';
        const tasks = tasksInput ? tasksInput.value : '';
        
        // Récupérer les horaires
        const schedules = [];
        if (!isRestDay) {
            const scheduleSlots = editInterface.querySelectorAll('.schedule-slot');
            scheduleSlots.forEach(slot => {
                const startInput = slot.querySelector('.start-time');
                const endInput = slot.querySelector('.end-time');
                
                if (startInput && endInput && startInput.value && endInput.value) {
                    schedules.push(`${startInput.value}-${endInput.value}`);
                }
            });
        }

        const editData = {
            isRestDay,
            location: location.trim(),
            tasks: tasks.trim(),
            schedules: schedules.length > 0 ? schedules : (isRestDay ? [] : [''])
        };

        console.log('📝 Données collectées:', editData);
        return editData;
    }

    /**
     * Supprime l'interface d'édition
     * @param {string} sanitizedDateStr - ID nettoyé de la date
     */
    removeEditInterface(sanitizedDateStr) {
        const editInterface = document.getElementById(`edit-${sanitizedDateStr}`);
        if (editInterface) {
            editInterface.remove();
            console.log('🗑️ Interface d\'édition supprimée:', sanitizedDateStr);
        }
    }

    /**
     * Affiche un message d'erreur dans l'interface
     * @param {string} sanitizedDateStr - ID nettoyé de la date
     * @param {string} message - Message d'erreur à afficher
     */
    showEditError(sanitizedDateStr, message) {
        const editInterface = document.getElementById(`edit-${sanitizedDateStr}`);
        if (editInterface) {
            const errorHTML = `
                <div class="edit-error" style="
                    background: #ffebee; 
                    border: 1px solid #ff8a80; 
                    border-radius: 8px; 
                    padding: 10px; 
                    margin: 10px 0; 
                    color: #d32f2f;
                    animation: slideDown 0.3s ease;
                ">
                    ❌ ${message}
                </div>
            `;
            
            // Supprimer les anciennes erreurs
            const existingError = editInterface.querySelector('.edit-error');
            if (existingError) {
                existingError.remove();
            }
            
            // Ajouter la nouvelle erreur en haut
            editInterface.insertAdjacentHTML('afterbegin', errorHTML);
            
            // Supprimer l'erreur après 5 secondes
            setTimeout(() => {
                const errorElement = editInterface.querySelector('.edit-error');
                if (errorElement) {
                    errorElement.style.opacity = '0';
                    setTimeout(() => {
                        if (errorElement && errorElement.parentNode) {
                            errorElement.remove();
                        }
                    }, 300);
                }
            }, 5000);
        }
    }

    /**
     * Affiche un message de succès dans l'interface
     * @param {string} sanitizedDateStr - ID nettoyé de la date
     * @param {string} message - Message de succès à afficher
     */
    showEditSuccess(sanitizedDateStr, message) {
        const editInterface = document.getElementById(`edit-${sanitizedDateStr}`);
        if (editInterface) {
            const successHTML = `
                <div class="edit-success" style="
                    background: #e8f5e8; 
                    border: 1px solid #81c784; 
                    border-radius: 8px; 
                    padding: 10px; 
                    margin: 10px 0; 
                    color: #2e7d32;
                    animation: slideDown 0.3s ease;
                ">
                    ✅ ${message}
                </div>
            `;
            
            // Supprimer les anciens messages
            const existingMessage = editInterface.querySelector('.edit-success');
            if (existingMessage) {
                existingMessage.remove();
            }
            
            // Ajouter le nouveau message en haut
            editInterface.insertAdjacentHTML('afterbegin', successHTML);
            
            // Supprimer le message après 3 secondes
            setTimeout(() => {
                const successElement = editInterface.querySelector('.edit-success');
                if (successElement) {
                    successElement.style.opacity = '0';
                    setTimeout(() => {
                        if (successElement && successElement.parentNode) {
                            successElement.remove();
                        }
                    }, 300);
                }
            }, 3000);
        }
    }

    /**
     * Vérifie si une interface d'édition existe
     * @param {string} sanitizedDateStr - ID nettoyé de la date
     * @returns {boolean} True si l'interface existe
     */
    hasEditInterface(sanitizedDateStr) {
        return !!document.getElementById(`edit-${sanitizedDateStr}`);
    }

    /**
     * Focus sur le premier champ de l'interface d'édition
     * @param {string} sanitizedDateStr - ID nettoyé de la date
     */
    focusFirstField(sanitizedDateStr) {
        const editInterface = document.getElementById(`edit-${sanitizedDateStr}`);
        if (editInterface) {
            const firstInput = editInterface.querySelector('input:not([type="checkbox"]), textarea');
            if (firstInput) {
                firstInput.focus();
            }
        }
    }
}

// Export pour usage global
window.EditRenderer = EditRenderer;