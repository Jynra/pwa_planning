/**
 * EditManager.js - Gestion de l'édition des horaires
 * Contrôle la logique métier de l'édition des plannings
 * CORRECTION : Utilisation d'IDs nettoyés pour éviter les erreurs querySelector
 */

class EditManager {
    constructor(dataManager, displayManager) {
        this.dataManager = dataManager;
        this.displayManager = displayManager;
        this.editingStates = new Map(); // dateString -> originalData
        this.editRenderer = new EditRenderer();
        
        console.log('✏️ EditManager initialisé');
    }

    /**
     * Nettoie un string pour en faire un ID CSS valide
     * (Même méthode que EditRenderer pour cohérence)
     */
    sanitizeId(str) {
        return str
            .replace(/\s+/g, '-')        // Remplace espaces par tirets
            .replace(/[^a-zA-Z0-9-_]/g, '') // Supprime caractères spéciaux
            .toLowerCase();               // En minuscules
    }

    /**
     * Active le mode édition pour un jour
     * @param {string} dateString - Date au format string (ex: "Mon Jun 24 2025")
     * @returns {boolean} True si l'édition a été activée avec succès
     */
    startEdit(dateString) {
        try {
            console.log('✏️ Début édition pour:', dateString);
            
            // Vérifier si le jour existe dans les données
            const dayData = this.findDayData(dateString);
            if (!dayData) {
                console.error('❌ Aucune donnée trouvée pour:', dateString);
                this.displayManager.showMessage('Aucune donnée trouvée pour cette date', 'error');
                return false;
            }

            // Vérifier si déjà en cours d'édition
            if (this.editingStates.has(dateString)) {
                console.log('⚠️ Édition déjà en cours pour:', dateString);
                return false;
            }

            // Sauvegarder l'état original
            this.editingStates.set(dateString, JSON.parse(JSON.stringify(dayData)));

            // Trouver le conteneur du jour
            const dayContainer = this.findDayContainer(dateString);
            if (!dayContainer) {
                console.error('❌ Conteneur du jour non trouvé pour:', dateString);
                this.displayManager.showMessage('Conteneur du jour non trouvé', 'error');
                return false;
            }

            // Masquer l'affichage normal
            const normalDisplay = dayContainer.querySelector('.day-content');
            if (normalDisplay) {
                normalDisplay.style.display = 'none';
            }

            // Afficher l'interface d'édition
            this.editRenderer.renderEditInterface(dayData, dayContainer);

            // Focus sur le premier champ
            const sanitizedDateStr = this.sanitizeId(dateString);
            setTimeout(() => {
                this.editRenderer.focusFirstField(sanitizedDateStr);
            }, 100);

            console.log('✅ Mode édition activé pour:', dateString);
            return true;

        } catch (error) {
            console.error('❌ Erreur lors du démarrage de l\'édition:', error);
            this.displayManager.showMessage('Erreur lors de l\'activation du mode édition', 'error');
            return false;
        }
    }

    /**
     * Sauvegarde les modifications d'un jour
     * @param {string} dateString - Date au format string
     * @returns {boolean} True si la sauvegarde a réussi
     */
    saveDay(dateString) {
        try {
            console.log('💾 Sauvegarde en cours pour:', dateString);
            
            if (!this.editingStates.has(dateString)) {
                console.error('❌ Aucune édition en cours pour:', dateString);
                this.displayManager.showMessage('Aucune édition en cours', 'error');
                return false;
            }

            // Créer l'ID nettoyé pour retrouver l'interface
            const sanitizedDateStr = this.sanitizeId(dateString);
            
            // Collecter les données depuis l'interface
            const editData = this.editRenderer.collectEditData(sanitizedDateStr);
            if (!editData) {
                console.error('❌ Impossible de collecter les données d\'édition');
                this.editRenderer.showEditError(sanitizedDateStr, 'Erreur lors de la collecte des données');
                return false;
            }

            // Valider les données
            const validation = this.validateEditData(editData);
            if (!validation.isValid) {
                console.error('❌ Données invalides:', validation.errors);
                this.editRenderer.showEditError(sanitizedDateStr, validation.errors.join(', '));
                return false;
            }

            // Mettre à jour les données
            const success = this.updateDayData(dateString, editData);
            if (!success) {
                console.error('❌ Échec de la mise à jour des données');
                this.editRenderer.showEditError(sanitizedDateStr, 'Erreur lors de la mise à jour');
                return false;
            }

            // Quitter le mode édition
            this.finishEdit(dateString);

            // Sauvegarder dans le localStorage
            this.dataManager.saveToLocalStorage();

            // Rafraîchir l'affichage
            this.displayManager.displayCurrentWeek();

            // Afficher un message de succès
            this.displayManager.showMessage('Modifications sauvegardées avec succès', 'success');

            console.log('✅ Sauvegarde terminée pour:', dateString);
            return true;

        } catch (error) {
            console.error('❌ Erreur lors de la sauvegarde:', error);
            this.displayManager.showMessage('Erreur lors de la sauvegarde', 'error');
            return false;
        }
    }

    /**
     * Annule l'édition d'un jour
     * @param {string} dateString - Date au format string
     * @returns {boolean} True si l'annulation a réussi
     */
    cancelEdit(dateString) {
        try {
            console.log('❌ Annulation édition pour:', dateString);
            
            if (!this.editingStates.has(dateString)) {
                console.error('❌ Aucune édition en cours pour:', dateString);
                return false;
            }

            // Quitter le mode édition sans sauvegarder
            this.finishEdit(dateString);

            // Rafraîchir l'affichage pour restaurer l'état original
            this.displayManager.displayCurrentWeek();

            this.displayManager.showMessage('Modifications annulées', 'info');

            console.log('✅ Édition annulée pour:', dateString);
            return true;

        } catch (error) {
            console.error('❌ Erreur lors de l\'annulation:', error);
            this.displayManager.showMessage('Erreur lors de l\'annulation', 'error');
            return false;
        }
    }

    /**
     * Termine le mode édition (nettoie l'état)
     * @param {string} dateString - Date au format string
     */
    finishEdit(dateString) {
        // Supprimer l'état d'édition
        this.editingStates.delete(dateString);

        // Supprimer l'interface d'édition
        const sanitizedDateStr = this.sanitizeId(dateString);
        this.editRenderer.removeEditInterface(sanitizedDateStr);

        console.log('🔚 Mode édition terminé pour:', dateString);
    }

    /**
     * Trouve les données d'un jour
     * @param {string} dateString - Date au format string
     * @returns {Object|null} Données du jour ou null
     */
    findDayData(dateString) {
        try {
            const targetDate = new Date(dateString);
            const allData = this.dataManager.getAllData();
            
            return allData.find(item => {
                const itemDate = new Date(item.date);
                return itemDate.getTime() === targetDate.getTime();
            });
        } catch (error) {
            console.error('❌ Erreur lors de la recherche des données du jour:', error);
            return null;
        }
    }

    /**
     * Trouve le conteneur DOM d'un jour
     * @param {string} dateString - Date au format string
     * @returns {HTMLElement|null} Conteneur du jour ou null
     */
    findDayContainer(dateString) {
        try {
            const targetDate = new Date(dateString);
            const dayContainers = document.querySelectorAll('.day');
            
            for (let container of dayContainers) {
                const dayData = container.dayData;
                if (dayData && dayData.date.getTime() === targetDate.getTime()) {
                    return container;
                }
            }
            
            return null;
        } catch (error) {
            console.error('❌ Erreur lors de la recherche du conteneur:', error);
            return null;
        }
    }

    /**
     * Valide les données d'édition
     * @param {Object} editData - Données à valider
     * @returns {Object} Résultat de validation {isValid, errors}
     */
    validateEditData(editData) {
        const errors = [];

        try {
            // Validation des horaires si ce n'est pas un jour de repos
            if (!editData.isRestDay && editData.schedules.length > 0) {
                for (let schedule of editData.schedules) {
                    if (schedule && schedule.includes('-')) {
                        const [start, end] = schedule.split('-');
                        
                        // Vérifier le format
                        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
                        if (!timeRegex.test(start)) {
                            errors.push(`Heure de début invalide: ${start}`);
                        }
                        if (!timeRegex.test(end)) {
                            errors.push(`Heure de fin invalide: ${end}`);
                        }
                        
                        // Vérifier la cohérence
                        if (timeRegex.test(start) && timeRegex.test(end)) {
                            const startTime = new Date(`2000-01-01T${start}:00`);
                            const endTime = new Date(`2000-01-01T${end}:00`);
                            
                            // Gérer les horaires de nuit (ex: 22:00-06:00)
                            if (startTime > endTime) {
                                // Vérifier si c'est un horaire de nuit valide
                                const startHour = parseInt(start.split(':')[0]);
                                const endHour = parseInt(end.split(':')[0]);
                                
                                if (!(startHour >= 18 && endHour <= 12)) {
                                    errors.push(`Horaire invalide: ${schedule} (si c'est un horaire de nuit, l'heure de début doit être >= 18h et l'heure de fin <= 12h)`);
                                }
                            }
                        }
                    }
                }
            }

            // Validation du lieu (optionnelle mais avec limite de caractères)
            if (editData.location && editData.location.length > 100) {
                errors.push('Le lieu ne peut pas dépasser 100 caractères');
            }

            // Validation des tâches (optionnelle mais avec limite de caractères)
            if (editData.tasks && editData.tasks.length > 500) {
                errors.push('La description des tâches ne peut pas dépasser 500 caractères');
            }

            // Validation spécifique : pas d'horaires si jour de repos
            if (editData.isRestDay && editData.schedules.length > 0) {
                errors.push('Un jour de repos ne peut pas avoir d\'horaires');
            }

            // Validation spécifique : au moins un horaire si pas jour de repos
            if (!editData.isRestDay && editData.schedules.length === 0) {
                errors.push('Un jour de travail doit avoir au moins un horaire');
            }

        } catch (error) {
            console.error('❌ Erreur lors de la validation:', error);
            errors.push('Erreur lors de la validation des données');
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Met à jour les données d'un jour
     * @param {string} dateString - Date au format string
     * @param {Object} editData - Nouvelles données
     * @returns {boolean} True si la mise à jour a réussi
     */
    updateDayData(dateString, editData) {
        try {
            const dayData = this.findDayData(dateString);
            if (!dayData) {
                console.error('❌ Données du jour non trouvées pour mise à jour');
                return false;
            }

            // Mettre à jour les propriétés
            dayData.isRestDay = editData.isRestDay;
            dayData.location = editData.location;
            dayData.tasks = editData.tasks;

            // Mettre à jour les horaires
            if (editData.isRestDay) {
                dayData.schedules = [];
                dayData.originalHoraire = 'Repos';
            } else {
                dayData.schedules = editData.schedules.filter(s => s && s.trim());
                dayData.originalHoraire = dayData.schedules.join(' | ');
            }

            // Recalculer les propriétés dérivées
            this.recalculateDayProperties(dayData);

            console.log('✅ Données mises à jour:', dayData);
            return true;

        } catch (error) {
            console.error('❌ Erreur lors de la mise à jour des données:', error);
            return false;
        }
    }

    /**
     * Recalcule les propriétés dérivées d'un jour
     * @param {Object} dayData - Données du jour à recalculer
     */
    recalculateDayProperties(dayData) {
        try {
            if (dayData.isRestDay || !dayData.schedules || dayData.schedules.length === 0) {
                dayData.totalHours = 0;
                dayData.hasMultipleSlots = false;
                dayData.isNightShift = false;
            } else {
                // Recalculer avec TimeUtils
                const timeUtils = window.TimeUtils;
                if (timeUtils) {
                    dayData.totalHours = timeUtils.calculateTotalHours(dayData.schedules);
                    dayData.hasMultipleSlots = dayData.schedules.length > 1;
                    dayData.isNightShift = dayData.schedules.some(schedule => 
                        timeUtils.isNightShift(schedule)
                    );
                } else {
                    console.error('❌ TimeUtils non disponible');
                    dayData.totalHours = 0;
                    dayData.hasMultipleSlots = dayData.schedules.length > 1;
                    dayData.isNightShift = false;
                }
            }
        } catch (error) {
            console.error('❌ Erreur lors du recalcul des propriétés:', error);
        }
    }

    /**
     * Vérifie si un jour est en cours d'édition
     * @param {string} dateString - Date au format string
     * @returns {boolean} True si en cours d'édition
     */
    isEditing(dateString) {
        return this.editingStates.has(dateString);
    }

    /**
     * Annule toutes les éditions en cours
     * @returns {number} Nombre d'éditions annulées
     */
    cancelAllEdits() {
        const editingDates = Array.from(this.editingStates.keys());
        let cancelledCount = 0;
        
        for (let dateString of editingDates) {
            if (this.cancelEdit(dateString)) {
                cancelledCount++;
            }
        }
        
        console.log(`❌ ${cancelledCount} éditions annulées`);
        return cancelledCount;
    }

    /**
     * Obtient le nombre d'éditions en cours
     * @returns {number} Nombre d'éditions actives
     */
    getEditingCount() {
        return this.editingStates.size;
    }

    /**
     * Obtient la liste des dates en cours d'édition
     * @returns {Array} Liste des dates en cours d'édition
     */
    getEditingDates() {
        return Array.from(this.editingStates.keys());
    }

    /**
     * Sauvegarde rapide de toutes les éditions en cours
     * @returns {Object} Résultat {success: number, failed: number}
     */
    saveAllEdits() {
        const editingDates = Array.from(this.editingStates.keys());
        let successCount = 0;
        let failedCount = 0;
        
        for (let dateString of editingDates) {
            if (this.saveDay(dateString)) {
                successCount++;
            } else {
                failedCount++;
            }
        }
        
        console.log(`💾 Sauvegarde multiple: ${successCount} réussies, ${failedCount} échouées`);
        
        return {
            success: successCount,
            failed: failedCount
        };
    }

    /**
     * Duplique les horaires d'un jour vers un autre
     * @param {string} sourceDateString - Date source
     * @param {string} targetDateString - Date cible
     * @returns {boolean} True si la duplication a réussi
     */
    duplicateDay(sourceDateString, targetDateString) {
        try {
            const sourceData = this.findDayData(sourceDateString);
            const targetData = this.findDayData(targetDateString);
            
            if (!sourceData || !targetData) {
                console.error('❌ Données source ou cible non trouvées');
                return false;
            }

            // Copier les propriétés
            targetData.isRestDay = sourceData.isRestDay;
            targetData.location = sourceData.location;
            targetData.tasks = sourceData.tasks;
            targetData.schedules = [...sourceData.schedules];
            targetData.originalHoraire = sourceData.originalHoraire;

            // Recalculer les propriétés dérivées
            this.recalculateDayProperties(targetData);

            // Sauvegarder
            this.dataManager.saveToLocalStorage();

            // Rafraîchir l'affichage
            this.displayManager.displayCurrentWeek();

            console.log(`✅ Jour dupliqué de ${sourceDateString} vers ${targetDateString}`);
            return true;

        } catch (error) {
            console.error('❌ Erreur lors de la duplication:', error);
            return false;
        }
    }

    /**
     * Réinitialise un jour (remet à zéro)
     * @param {string} dateString - Date au format string
     * @returns {boolean} True si la réinitialisation a réussi
     */
    resetDay(dateString) {
        try {
            const dayData = this.findDayData(dateString);
            if (!dayData) {
                console.error('❌ Données du jour non trouvées');
                return false;
            }

            // Réinitialiser les propriétés
            dayData.isRestDay = false;
            dayData.location = '';
            dayData.tasks = '';
            dayData.schedules = [];
            dayData.originalHoraire = '';
            dayData.totalHours = 0;
            dayData.hasMultipleSlots = false;
            dayData.isNightShift = false;

            // Sauvegarder
            this.dataManager.saveToLocalStorage();

            // Rafraîchir l'affichage
            this.displayManager.displayCurrentWeek();

            console.log(`✅ Jour réinitialisé: ${dateString}`);
            return true;

        } catch (error) {
            console.error('❌ Erreur lors de la réinitialisation:', error);
            return false;
        }
    }

    /**
     * Obtient les statistiques d'édition
     * @returns {Object} Statistiques
     */
    getEditingStats() {
        return {
            currentlyEditing: this.editingStates.size,
            editingDates: Array.from(this.editingStates.keys()),
            hasUnsavedChanges: this.editingStates.size > 0
        };
    }

    /**
     * Vérifie s'il y a des modifications non sauvegardées
     * @returns {boolean} True s'il y a des modifications en attente
     */
    hasUnsavedChanges() {
        return this.editingStates.size > 0;
    }

    /**
     * Nettoie les états d'édition orphelins
     * Supprime les états d'édition qui n'ont plus d'interface correspondante
     */
    cleanupOrphanedStates() {
        const editingDates = Array.from(this.editingStates.keys());
        let cleanedCount = 0;
        
        for (let dateString of editingDates) {
            const sanitizedDateStr = this.sanitizeId(dateString);
            if (!this.editRenderer.hasEditInterface(sanitizedDateStr)) {
                this.editingStates.delete(dateString);
                cleanedCount++;
                console.log('🧹 État d\'édition orphelin supprimé:', dateString);
            }
        }
        
        if (cleanedCount > 0) {
            console.log(`🧹 ${cleanedCount} états orphelins nettoyés`);
        }
        
        return cleanedCount;
    }
}

// Export pour usage global
window.EditManager = EditManager;