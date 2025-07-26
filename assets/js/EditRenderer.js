/**
 * Gestionnaire de rendu pour l'édition - Planning de Travail PWA
 * Fichier: assets/js/EditRenderer.js
 */
class EditRenderer {
    constructor(editManager) {
        this.editManager = editManager;
        this.app = editManager.app;
    }

    /**
     * Modifie le rendu d'une carte de jour pour inclure l'édition
     */
    renderDayCardWithEdit(dayName, date, dayData, isToday) {
        const dayNumber = date.getDate();
        const dayId = `day-${date.toDateString()}`;
        const isEditing = this.editManager.isEditing(dayId);
        const hasWork = dayData && dayData.entries.length > 0;
        
        let isRestDay = false;
        if (hasWork) {
            const timeInfo = TimeUtils.extractTimeInfo(dayData.entries[0]);
            isRestDay = timeInfo.isRest;
        }
        
        let html = `<div class="day-card ${isEditing ? 'editing' : ''}" id="${dayId}">`;
        
        // En-tête de la carte
        html += this.renderDayHeader(dayName, dayNumber, isToday, isRestDay, hasWork, isEditing, dayData);
        
        // Contrôles d'édition
        html += this.renderEditControlsSection(dayId);
        
        // Contenu principal
        if (isEditing) {
            html += this.editManager.renderEditForm(dayId, dayData);
        } else {
            html += this.renderViewContent(dayData, hasWork, isRestDay);
        }
        
        html += `</div>`;
        return html;
    }

    /**
     * Rendu de l'en-tête de la carte de jour
     */
    renderDayHeader(dayName, dayNumber, isToday, isRestDay, hasWork, isEditing, dayData) {
        let html = `<div class="day-header">`;
        html += `<div><div class="day-name">${dayName}</div><div class="day-number">${dayNumber}</div></div>`;
        html += `<div class="day-badges">`;
        
        if (isToday && !isEditing) {
            html += `<div class="today-badge">Aujourd'hui</div>`;
        } else if ((isRestDay || !hasWork) && !isEditing) {
            html += `<div class="rest-badge">Repos</div>`;
        } else if (hasWork && !isEditing) {
            html += this.renderDayBadges(dayData);
        }
        
        html += `</div></div>`;
        return html;
    }

    /**
     * Rendu des badges de jour
     */
    renderDayBadges(dayData) {
        if (!dayData || !dayData.entries) return '';
        
        const timeSlots = TimeUtils.organizeTimeSlots(dayData.entries);
        let badges = '';
        
        if (timeSlots.length > 2) {
            badges += `<div class="multiple-badge">Coupure</div>`;
        } else if (timeSlots.some(slot => TimeUtils.isNightShift(slot.start, slot.end))) {
            badges += `<div class="night-badge">Nuit</div>`;
        } else if (timeSlots.length === 2) {
            badges += `<div class="multiple-badge">Coupure</div>`;
        }
        
        return badges;
    }

    /**
     * Rendu de la section des contrôles d'édition
     */
    renderEditControlsSection(dayId) {
        return `
            <div class="edit-controls">
                ${this.editManager.renderEditControls(dayId)}
            </div>
        `;
    }

    /**
     * Rendu du contenu en mode visualisation
     */
    renderViewContent(dayData, hasWork, isRestDay) {
        let html = '';
        
        if (hasWork && !isRestDay) {
            html += this.renderScheduleSection(dayData);
        }
        
        if (hasWork) {
            html += this.renderDayInfo(dayData);
        }
        
        return html;
    }

    /**
     * Rendu de la section horaires (mode visualisation)
     */
    renderScheduleSection(dayData) {
        let html = `<div class="schedule-section">`;
        html += `<div class="schedule-title">`;
        html += `<span class="info-icon">🕒</span>Horaires de la journée :`;
        html += `</div>`;
        
        let totalHours = 0;
        const timeSlots = TimeUtils.organizeTimeSlots(dayData.entries);
        
        timeSlots.forEach(slot => {
            const isNightShift = TimeUtils.isNightShift(slot.start, slot.end);
            const duration = TimeUtils.calculateSlotDuration(slot.start, slot.end);
            totalHours += duration;
            
            html += `<div class="time-slot ${isNightShift ? 'night-slot' : ''}">`;
            html += `<div class="time-dot ${isNightShift ? 'night-dot' : ''}"></div>`;
            html += `<div class="time-text">${slot.start}-${slot.end}</div>`;
            html += `<div class="duration-badge">${duration.toFixed(1)}h</div>`;
            html += `</div>`;
        });
        
        if (totalHours > 0) {
            html += `<div class="total-hours">💚 Total: ${totalHours.toFixed(1)}h</div>`;
        }
        
        html += `</div>`;
        return html;
    }

    /**
     * Rendu des informations du jour (mode visualisation)
     */
    renderDayInfo(dayData) {
        let html = `<div class="info-section">`;
        const uniqueInfo = new Set();
        
        dayData.entries.forEach(entry => {
            if (entry.poste && entry.poste.toLowerCase() !== 'congé') {
                const poste = entry.poste;
                if (!uniqueInfo.has(`poste:${poste}`)) {
                    html += `<div class="info-item">`;
                    html += `<span class="info-icon">📍</span>${poste}`;
                    html += `</div>`;
                    uniqueInfo.add(`poste:${poste}`);
                }
            }
            
            if (entry.taches && entry.taches.toLowerCase() !== 'jour de repos') {
                const taches = entry.taches;
                if (!uniqueInfo.has(`taches:${taches}`)) {
                    html += `<div class="info-item">`;
                    html += `<span class="info-icon">✅</span>${taches}`;
                    html += `</div>`;
                    uniqueInfo.add(`taches:${taches}`);
                }
            }
        });
        
        html += `</div>`;
        return html;
    }

    /**
     * Rendu d'un indicateur de statut d'édition
     */
    renderEditStatus(dayId) {
        const isEditing = this.editManager.isEditing(dayId);
        const hasUnsaved = this.editManager.originalData.has(dayId);
        
        if (!isEditing && !hasUnsaved) return '';
        
        let html = `<div class="edit-status">`;
        
        if (isEditing) {
            html += `<span class="edit-indicator editing">✏️ En cours d'édition</span>`;
        } else if (hasUnsaved) {
            html += `<span class="edit-indicator unsaved">⚠️ Modifications non sauvegardées</span>`;
        }
        
        html += `</div>`;
        return html;
    }

    /**
     * Rendu d'un aperçu des modifications
     */
    renderEditPreview(dayId, editData) {
        if (!editData) return '';
        
        let html = `<div class="edit-preview">`;
        html += `<div class="preview-title">📋 Aperçu des modifications :</div>`;
        
        if (editData.isRest) {
            html += `<div class="preview-item">🛌 Jour de repos</div>`;
        } else {
            html += `<div class="preview-item">🕒 ${editData.schedules.length} créneau(x)</div>`;
            editData.schedules.forEach((schedule, index) => {
                html += `<div class="preview-schedule">${schedule.start} - ${schedule.end}</div>`;
            });
        }
        
        html += `<div class="preview-item">📍 ${editData.location}</div>`;
        html += `<div class="preview-item">✅ ${editData.tasks}</div>`;
        html += `</div>`;
        
        return html;
    }

    /**
     * Rendu de conseils d'édition
     */
    renderEditTips() {
        return `
            <div class="edit-tips">
                <div class="tips-title">💡 Conseils d'édition :</div>
                <div class="tip-item">• Utilisez les boutons + et - pour gérer les créneaux</div>
                <div class="tip-item">• Cochez "Jour de repos" pour les congés</div>
                <div class="tip-item">• Les horaires de nuit sont détectés automatiquement</div>
                <div class="tip-item">• Appuyez sur Échap pour annuler</div>
            </div>
        `;
    }

    /**
     * Rendu des raccourcis clavier
     */
    renderKeyboardShortcuts(dayId) {
        return `
            <div class="keyboard-shortcuts" id="shortcuts-${dayId}">
                <div class="shortcuts-title">⌨️ Raccourcis :</div>
                <div class="shortcut-item">
                    <span class="shortcut-key">Ctrl + S</span>
                    <span class="shortcut-desc">Sauvegarder</span>
                </div>
                <div class="shortcut-item">
                    <span class="shortcut-key">Échap</span>
                    <span class="shortcut-desc">Annuler</span>
                </div>
                <div class="shortcut-item">
                    <span class="shortcut-key">Ctrl + +</span>
                    <span class="shortcut-desc">Ajouter créneau</span>
                </div>
            </div>
        `;
    }

    /**
     * Rendu d'un tooltip d'aide
     */
    renderHelpTooltip(content, position = 'top') {
        return `
            <div class="help-tooltip ${position}">
                <span class="tooltip-trigger">❓</span>
                <div class="tooltip-content">${content}</div>
            </div>
        `;
    }

    /**
     * Rendu d'un indicateur de validation
     */
    renderValidationIndicator(isValid, message = '') {
        const icon = isValid ? '✅' : '❌';
        const className = isValid ? 'valid' : 'invalid';
        
        return `
            <div class="validation-indicator ${className}">
                <span class="validation-icon">${icon}</span>
                ${message ? `<span class="validation-message">${message}</span>` : ''}
            </div>
        `;
    }

    /**
     * Rendu d'un compteur de caractères
     */
    renderCharacterCounter(currentLength, maxLength, fieldName) {
        const remaining = maxLength - currentLength;
        const className = remaining < 10 ? 'warning' : remaining < 0 ? 'error' : 'normal';
        
        return `
            <div class="character-counter ${className}">
                <span class="counter-text">${currentLength}/${maxLength}</span>
                <span class="counter-field">${fieldName}</span>
            </div>
        `;
    }

    /**
     * Rendu d'une barre de progression pour l'édition
     */
    renderEditProgress(currentStep, totalSteps) {
        const percentage = (currentStep / totalSteps) * 100;
        
        return `
            <div class="edit-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${percentage}%"></div>
                </div>
                <div class="progress-text">Étape ${currentStep} sur ${totalSteps}</div>
            </div>
        `;
    }

    /**
     * Rendu d'un sélecteur de template d'horaires
     */
    renderScheduleTemplates(dayId) {
        const templates = [
            { name: 'Journée continue', schedules: [{ start: '08:00', end: '17:00' }] },
            { name: 'Matin + Après-midi', schedules: [{ start: '08:00', end: '12:00' }, { start: '13:00', end: '17:00' }] },
            { name: 'Horaires de nuit', schedules: [{ start: '22:00', end: '06:00' }] },
            { name: 'Équipe matin', schedules: [{ start: '06:00', end: '14:00' }] },
            { name: 'Équipe après-midi', schedules: [{ start: '14:00', end: '22:00' }] }
        ];
        
        let html = `<div class="schedule-templates">`;
        html += `<div class="templates-title">🕒 Templates d'horaires :</div>`;
        html += `<div class="templates-list">`;
        
        templates.forEach((template, index) => {
            html += `
                <button class="template-btn" onclick="window.planningApp.editManager.applyTemplate('${dayId}', ${index})">
                    ${template.name}
                </button>
            `;
        });
        
        html += `</div></div>`;
        return html;
    }

    /**
     * Rendu d'un historique des modifications
     */
    renderEditHistory(dayId) {
        // Cette fonctionnalité peut être implémentée plus tard
        return `
            <div class="edit-history">
                <div class="history-title">📜 Historique :</div>
                <div class="history-item">🕒 Dernière modification : Il y a 2 minutes</div>
                <div class="history-item">💾 Dernière sauvegarde : Il y a 5 minutes</div>
            </div>
        `;
    }

    /**
     * Rendu d'un bouton de duplication de jour
     */
    renderDuplicateButton(dayId) {
        return `
            <button class="edit-btn duplicate" onclick="window.planningApp.editManager.duplicateDay('${dayId}')">
                📋 Dupliquer
            </button>
        `;
    }

    /**
     * Rendu d'un aperçu des statistiques pendant l'édition
     */
    renderEditStats(editData) {
        if (!editData || editData.isRest) {
            return `
                <div class="edit-stats">
                    <div class="stat-item">
                        <span class="stat-icon">🛌</span>
                        <span class="stat-value">Repos</span>
                    </div>
                </div>
            `;
        }
        
        const totalHours = editData.schedules.reduce((total, schedule) => {
            return total + this.calculateScheduleDuration(schedule);
        }, 0);
        
        return `
            <div class="edit-stats">
                <div class="stat-item">
                    <span class="stat-icon">🕒</span>
                    <span class="stat-value">${editData.schedules.length} créneau(x)</span>
                </div>
                <div class="stat-item">
                    <span class="stat-icon">⏱️</span>
                    <span class="stat-value">${totalHours.toFixed(1)}h</span>
                </div>
            </div>
        `;
    }

    /**
     * Calcule la durée d'un créneau
     */
    calculateScheduleDuration(schedule) {
        const startMinutes = this.timeToMinutes(schedule.start);
        let endMinutes = this.timeToMinutes(schedule.end);
        
        // Gestion des horaires de nuit
        if (startMinutes > endMinutes) {
            endMinutes += 24 * 60;
        }
        
        return (endMinutes - startMinutes) / 60;
    }

    /**
     * Convertit une heure en minutes
     */
    timeToMinutes(timeStr) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    }

    /**
     * Rendu d'un sélecteur de couleur pour les badges
     */
    renderColorPicker(dayId) {
        const colors = [
            { name: 'Bleu', value: '#64b5f6', class: 'blue' },
            { name: 'Vert', value: '#81c784', class: 'green' },
            { name: 'Orange', value: '#ffb74d', class: 'orange' },
            { name: 'Rouge', value: '#ff8a80', class: 'red' },
            { name: 'Violet', value: '#ba68c8', class: 'purple' }
        ];
        
        let html = `<div class="color-picker">`;
        html += `<div class="picker-title">🎨 Couleur du jour :</div>`;
        html += `<div class="color-options">`;
        
        colors.forEach(color => {
            html += `
                <button class="color-option ${color.class}" 
                        style="background-color: ${color.value}"
                        onclick="window.planningApp.editManager.setDayColor('${dayId}', '${color.value}')"
                        title="${color.name}">
                </button>
            `;
        });
        
        html += `</div></div>`;
        return html;
    }

    /**
     * Rendu d'un widget météo (exemple d'extension)
     */
    renderWeatherWidget(date) {
        // Exemple de widget additionnel
        return `
            <div class="weather-widget">
                <div class="widget-title">🌤️ Météo prévue :</div>
                <div class="weather-info">
                    <span class="weather-icon">☂️</span>
                    <span class="weather-temp">18°C</span>
                    <span class="weather-desc">Pluie légère</span>
                </div>
            </div>
        `;
    }

    /**
     * Rendu d'alertes et notifications
     */
    renderEditAlerts(dayId, alerts = []) {
        if (alerts.length === 0) return '';
        
        let html = `<div class="edit-alerts">`;
        
        alerts.forEach(alert => {
            const iconMap = {
                'warning': '⚠️',
                'error': '❌',
                'info': 'ℹ️',
                'success': '✅'
            };
            
            html += `
                <div class="alert-item ${alert.type}">
                    <span class="alert-icon">${iconMap[alert.type] || 'ℹ️'}</span>
                    <span class="alert-message">${alert.message}</span>
                    ${alert.action ? `<button class="alert-action" onclick="${alert.action}">${alert.actionText}</button>` : ''}
                </div>
            `;
        });
        
        html += `</div>`;
        return html;
    }

    /**
     * Rendu d'un mode de saisie rapide
     */
    renderQuickEntry(dayId) {
        return `
            <div class="quick-entry">
                <div class="quick-title">⚡ Saisie rapide :</div>
                <div class="quick-options">
                    <button class="quick-btn" onclick="window.planningApp.editManager.quickSet('${dayId}', '8h-17h')">
                        8h-17h
                    </button>
                    <button class="quick-btn" onclick="window.planningApp.editManager.quickSet('${dayId}', '9h-18h')">
                        9h-18h
                    </button>
                    <button class="quick-btn" onclick="window.planningApp.editManager.quickSet('${dayId}', 'repos')">
                        Repos
                    </button>
                    <button class="quick-btn" onclick="window.planningApp.editManager.quickSet('${dayId}', 'teletravail')">
                        Télétravail
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Rendu d'un panneau de debug (développement)
     */
    renderDebugPanel(dayId, debugData) {
        if (process?.env?.NODE_ENV !== 'development') return '';
        
        return `
            <div class="debug-panel">
                <div class="debug-title">🐛 Debug Info :</div>
                <div class="debug-content">
                    <pre>${JSON.stringify(debugData, null, 2)}</pre>
                </div>
            </div>
        `;
    }

    /**
     * Rendu d'un footer d'édition avec actions supplémentaires
     */
    renderEditFooter(dayId) {
        return `
            <div class="edit-footer">
                <div class="footer-actions">
                    <button class="footer-btn" onclick="window.planningApp.editManager.resetDay('${dayId}')" title="Remettre à zéro">
                        🔄 Reset
                    </button>
                    <button class="footer-btn" onclick="window.planningApp.editManager.copyFromYesterday('${dayId}')" title="Copier d'hier">
                        📋 Copier d'hier
                    </button>
                    <button class="footer-btn" onclick="window.planningApp.editManager.showPreview('${dayId}')" title="Aperçu">
                        👁️ Aperçu
                    </button>
                </div>
                <div class="footer-info">
                    <span class="edit-time">Édition commencée à ${new Date().toLocaleTimeString()}</span>
                </div>
            </div>
        `;
    }
}