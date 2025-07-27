/**
 * Gestionnaire d'affichage - Planning de Travail PWA
 * Fichier: assets/js/DisplayManager.js
 * CORRECTION: Méthode renderDayCard corrigée pour éviter la disparition des jours
 */
class DisplayManager {
    constructor(app) {
        this.app = app;
    }

    /**
     * Met à jour l'affichage du mois courant
     */
    updateCurrentMonth() {
        const now = new Date();
        const months = [
            'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
            'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
        ];
        
        if (this.app.currentMonth) {
            this.app.currentMonth.textContent = `${months[now.getMonth()]} ${now.getFullYear()}`;
        }
    }

    /**
     * Affiche un message d'erreur
     */
    showError(message) {
        console.error('❌', message);
        this.showSaveIndicator(`❌ ${message}`, 4000);
    }

    /**
     * Affiche l'indicateur de sauvegarde
     */
    showSaveIndicator(message = '💾 Planning sauvegardé', duration = 2000) {
        if (!this.app.saveIndicator) return;
        
        this.app.saveIndicator.textContent = message;
        this.app.saveIndicator.classList.add('show');
        
        setTimeout(() => {
            this.app.saveIndicator.classList.remove('show');
        }, duration);
    }

    /**
     * Met à jour les informations de semaine
     */
    updateWeekInfo(week, isCurrentWeek) {
        // Récupérer les dates réellement présentes
        const actualDates = [];
        week.days.forEach((dayData) => {
            actualDates.push(dayData.date);
        });
        
        actualDates.sort((a, b) => a - b);
        
        let dateRange;
        
        if (actualDates.length === 0) {
            const startDate = week.weekStart.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
            const endDate = week.weekEnd.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
            dateRange = `${startDate} - ${endDate}`;
        } else if (actualDates.length === 1) {
            dateRange = actualDates[0].toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
        } else {
            const firstDate = actualDates[0];
            const lastDate = actualDates[actualDates.length - 1];
            
            if (firstDate.getMonth() === lastDate.getMonth()) {
                const monthName = lastDate.toLocaleDateString('fr-FR', { month: 'long' });
                dateRange = `${firstDate.getDate()} - ${lastDate.getDate()} ${monthName}`;
            } else {
                const startDay = firstDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
                const endDay = lastDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
                dateRange = `${startDay} - ${endDay}`;
            }
        }
        
        if (this.app.weekDates) {
            this.app.weekDates.textContent = dateRange;
        }
        
        if (this.app.currentBadge) {
            this.app.currentBadge.style.display = isCurrentWeek ? 'inline-block' : 'none';
        }
        
        this.updateTodayButton(isCurrentWeek);
    }

    /**
     * Met à jour le bouton "Aujourd'hui"
     */
    updateTodayButton(isCurrentWeek) {
        if (!this.app.todayBtn) return;
        
        if (isCurrentWeek) {
            this.app.todayBtn.classList.remove('not-current-week');
        } else {
            this.app.todayBtn.classList.add('not-current-week');
        }
    }

    /**
     * Met à jour les statistiques de la semaine
     */
    updateWeekStats(week) {
        let totalWeekHours = 0;
        let workDaysCount = 0;
        let actualDaysCount = 0;

        week.days.forEach(dayData => {
            if (dayData.entries.length > 0) {
                actualDaysCount++;
                const timeInfo = TimeUtils.extractTimeInfo(dayData.entries[0]);
                if (!timeInfo.isRest) {
                    workDaysCount++;
                    dayData.entries.forEach(entry => {
                        totalWeekHours += TimeUtils.calculateDuration(entry);
                    });
                }
            }
        });

        const avgHours = workDaysCount > 0 ? totalWeekHours / workDaysCount : 0;

        if (this.app.totalHours) {
            this.app.totalHours.textContent = `${totalWeekHours.toFixed(1)}h`;
        }
        
        if (this.app.workDays) {
            this.app.workDays.textContent = workDaysCount;
            
            // Mise à jour du label
            const label = this.app.workDays.nextElementSibling;
            if (label) {
                label.textContent = actualDaysCount === 1 ? 'Jour travaillé' : 'Jours travaillés';
            }
        }
        
        if (this.app.avgHours) {
            this.app.avgHours.textContent = `${avgHours.toFixed(1)}h`;
        }
    }

    /**
     * Met à jour les boutons de navigation
     */
    updateNavigationButtons() {
        const weeks = this.app.weekManager.getWeeks();
        const currentIndex = this.app.weekManager.getCurrentWeekIndex();
        
        if (this.app.prevWeekBtn) {
            this.app.prevWeekBtn.disabled = currentIndex === 0;
        }
        
        if (this.app.nextWeekBtn) {
            this.app.nextWeekBtn.disabled = currentIndex === weeks.length - 1;
        }
    }

    /**
     * Rendu des jours de la semaine
     */
    renderWeekDays(week) {
        const dayNamesFull = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let html = '';
        
        // Récupérer uniquement les jours qui ont des données
        const daysWithData = [];
        for (let i = 0; i < 7; i++) {
            const currentDate = new Date(week.weekStart);
            currentDate.setDate(week.weekStart.getDate() + i);
            const dateKey = currentDate.toDateString();
            
            if (week.days.has(dateKey)) {
                daysWithData.push({
                    index: i,
                    name: dayNamesFull[i],
                    date: currentDate,
                    data: week.days.get(dateKey)
                });
            }
        }
        
        if (daysWithData.length === 0) {
            html = '<div style="text-align: center; padding: 40px; color: var(--text-secondary);">Aucune donnée pour cette semaine</div>';
        } else {
            daysWithData.forEach(day => {
                const isToday = day.date.getTime() === today.getTime();
                // CORRECTION: Utiliser notre propre méthode renderDayCard
                html += this.renderDayCard(day.name, day.date, day.data, isToday);
            });
        }
        
        if (this.app.planningDisplay) {
            this.app.planningDisplay.innerHTML = html;
        }
    }

    /**
     * CORRECTION: Rendu d'une carte de jour complet avec gestion de l'édition
     */
    renderDayCard(dayName, date, dayData, isToday) {
        const dayNumber = date.getDate();
        const dayId = `day-${date.toDateString()}`;
        const isEditing = this.app.editManager.isEditing(dayId);
        const hasWork = dayData && dayData.entries.length > 0;
        
        let isRestDay = false;
        if (hasWork) {
            const timeInfo = TimeUtils.extractTimeInfo(dayData.entries[0]);
            isRestDay = timeInfo.isRest;
        }
        
        let html = `<div class="day-card ${isEditing ? 'editing' : ''}" id="${dayId}">`;
        
        // En-tête de la carte
        html += `<div class="day-header">`;
        html += `<div><div class="day-name">${dayName}</div><div class="day-number">${dayNumber}</div></div>`;
        html += `<div class="day-badges">`;
        
        if (isToday && !isEditing) {
            html += `<div class="today-badge">Aujourd'hui</div>`;
        } else if ((isRestDay || !hasWork) && !isEditing) {
            html += `<div class="rest-badge">Repos</div>`;
        } else if (hasWork && !isEditing) {
            // Badges normaux
            const timeSlots = TimeUtils.organizeTimeSlots(dayData.entries);
            if (timeSlots.length > 2) {
                html += `<div class="multiple-badge">Coupure</div>`;
            } else if (timeSlots.some(slot => TimeUtils.isNightShift(slot.start, slot.end))) {
                html += `<div class="night-badge">Nuit</div>`;
            } else if (timeSlots.length === 2) {
                html += `<div class="multiple-badge">Coupure</div>`;
            }
        }
        
        html += `</div></div>`;
        
        // Contrôles d'édition
        html += `<div class="edit-controls">`;
        html += this.app.editManager.renderEditControls(dayId);
        html += `</div>`;
        
        // Contenu principal
        if (isEditing) {
            // Mode édition : utiliser le formulaire d'édition
            html += this.app.editManager.renderEditForm(dayId, dayData);
        } else {
            // Mode visualisation : afficher les données normalement
            html += this.renderViewContent(dayData, hasWork, isRestDay);
        }
        
        html += `</div>`;
        return html;
    }

    /**
     * CORRECTION: Rendu du contenu en mode visualisation
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
     * CORRECTION: Rendu de la section horaires (mode visualisation)
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
     * CORRECTION: Rendu des informations du jour (mode visualisation)
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
     * Met à jour le footer
     */
    updateFooter() {
        const weeks = this.app.weekManager.getWeeks();
        const currentIndex = this.app.weekManager.getCurrentWeekIndex();
        
        if (weeks.length > 0) {
            if (this.app.pageInfo) {
                this.app.pageInfo.textContent = `${currentIndex + 1} sur ${weeks.length}`;
            }
            if (this.app.eventCount) {
                this.app.eventCount.textContent = this.app.planningData.length;
            }
            if (this.app.footer) {
                this.app.footer.style.display = 'block';
            }
        } else {
            if (this.app.footer) {
                this.app.footer.style.display = 'none';
            }
        }
    }

    /**
     * Affiche l'état de chargement
     */
    showLoading() {
        if (this.app.noData) this.app.noData.style.display = 'none';
        if (this.app.loading) this.app.loading.style.display = 'block';
        if (this.app.planningDisplay) this.app.planningDisplay.classList.remove('show');
        if (this.app.weekNavigation) this.app.weekNavigation.style.display = 'none';
        if (this.app.footer) this.app.footer.style.display = 'none';
        if (this.app.statsBar) this.app.statsBar.style.display = 'none';
    }

    /**
     * Affiche le planning
     */
    showPlanning() {
        if (this.app.noData) this.app.noData.style.display = 'none';
        if (this.app.loading) this.app.loading.style.display = 'none';
        if (this.app.planningDisplay) this.app.planningDisplay.classList.add('show');
        if (this.app.weekNavigation) this.app.weekNavigation.style.display = 'flex';
        if (this.app.statsBar) this.app.statsBar.style.display = 'flex';
    }

    /**
     * Affiche l'écran "pas de données"
     */
    showNoData() {
        if (this.app.noData) this.app.noData.style.display = 'block';
        if (this.app.loading) this.app.loading.style.display = 'none';
        if (this.app.planningDisplay) this.app.planningDisplay.classList.remove('show');
        if (this.app.weekNavigation) this.app.weekNavigation.style.display = 'none';
        if (this.app.footer) this.app.footer.style.display = 'none';
        if (this.app.statsBar) this.app.statsBar.style.display = 'none';
    }

    /**
     * Affiche l'écran "pas de données" avec aide
     */
    showNoDataWithHelp() {
        this.showNoData();
        
        // Ajouter des conseils utiles dans le message no-data
        const noDataElement = this.app.noData;
        if (noDataElement) {
            const stats = this.app.dataManager.getStorageStats();
            let helpText = '';
            
            if (stats.hasData) {
                helpText = `<p>Données détectées mais non valides</p>
                           <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 10px;">
                           Dernière sauvegarde: ${stats.lastSaved}</p>`;
            } else {
                helpText = `<p>Importez un fichier CSV pour commencer</p>
                           <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 10px;">
                           Format: date,horaire,poste,taches</p>`;
            }
            
            // Ne modifier que le texte, pas la structure
            const existingTitle = noDataElement.querySelector('h3');
            if (existingTitle && existingTitle.nextElementSibling) {
                existingTitle.nextElementSibling.innerHTML = helpText;
            }
        }
    }

    /**
     * Affiche un message de succès
     */
    showSuccess(message) {
        this.showSaveIndicator(`✅ ${message}`, 2000);
    }

    /**
     * Affiche un avertissement
     */
    showWarning(message) {
        this.showSaveIndicator(`⚠️ ${message}`, 3000);
    }

    /**
     * Affiche des informations
     */
    showInfo(message) {
        this.showSaveIndicator(`ℹ️ ${message}`, 2000);
    }

    /**
     * Met à jour le titre de la page
     */
    updatePageTitle(title) {
        document.title = title || 'Planning de Travail';
    }

    /**
     * Affiche une notification temporaire
     */
    showNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Styles inline pour la notification
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: var(--card-bg);
            color: var(--text-primary);
            padding: 12px 16px;
            border-radius: 10px;
            box-shadow: 0 4px 12px var(--shadow);
            z-index: 1001;
            animation: slideInNotification 0.3s ease;
            max-width: 300px;
            word-wrap: break-word;
        `;
        
        // Couleur selon le type
        switch (type) {
            case 'success':
                notification.style.borderLeft = '4px solid var(--accent-green)';
                break;
            case 'error':
                notification.style.borderLeft = '4px solid var(--accent-red)';
                break;
            case 'warning':
                notification.style.borderLeft = '4px solid var(--accent-orange)';
                break;
            default:
                notification.style.borderLeft = '4px solid var(--accent-blue)';
        }
        
        document.body.appendChild(notification);
        
        // Supprimer après la durée spécifiée
        setTimeout(() => {
            notification.style.animation = 'slideOutNotification 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, duration);
    }

    /**
     * Ajoute les animations CSS pour les notifications
     */
    addNotificationStyles() {
        if (document.getElementById('notification-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideInNotification {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOutNotification {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Affiche une modale simple
     */
    showModal(title, content, buttons = []) {
        // Créer la modale
        const modal = document.createElement('div');
        modal.className = 'display-modal';
        modal.innerHTML = `
            <div class="modal-overlay">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>${title}</h3>
                        <button class="modal-close">✕</button>
                    </div>
                    <div class="modal-body">${content}</div>
                    <div class="modal-footer">
                        ${buttons.map(btn => 
                            `<button class="modal-btn ${btn.class || ''}" data-action="${btn.action}">${btn.text}</button>`
                        ).join('')}
                    </div>
                </div>
            </div>
        `;
        
        // Styles inline
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 2000;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        
        document.body.appendChild(modal);
        
        // Événements
        modal.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay') || 
                e.target.classList.contains('modal-close')) {
                this.closeModal(modal);
            }
            
            if (e.target.classList.contains('modal-btn')) {
                const action = e.target.dataset.action;
                if (action && typeof window[action] === 'function') {
                    window[action]();
                }
                this.closeModal(modal);
            }
        });
        
        return modal;
    }

    /**
     * Ferme une modale
     */
    closeModal(modal) {
        if (modal) {
            modal.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => modal.remove(), 300);
        }
    }

    /**
     * Initialise les styles d'affichage
     */
    initializeDisplayStyles() {
        this.addNotificationStyles();
        // Autres styles d'affichage peuvent être ajoutés ici
    }

    /**
     * Obtient les statistiques d'affichage
     */
    getDisplayStats() {
        return {
            currentView: this.getCurrentView(),
            hasData: this.app.planningData.length > 0,
            weekCount: this.app.weekManager.getWeeks().length,
            currentWeek: this.app.weekManager.getCurrentWeekIndex() + 1
        };
    }

    /**
     * Détermine la vue actuelle
     */
    getCurrentView() {
        if (this.app.loading && this.app.loading.style.display !== 'none') {
            return 'loading';
        }
        if (this.app.noData && this.app.noData.style.display !== 'none') {
            return 'no-data';
        }
        if (this.app.planningDisplay && this.app.planningDisplay.classList.contains('show')) {
            return 'planning';
        }
        return 'unknown';
    }

    /**
     * Active le mode plein écran
     */
    enterFullscreen() {
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen();
            this.showInfo('Mode plein écran activé');
        }
    }

    /**
     * Quitte le mode plein écran
     */
    exitFullscreen() {
        if (document.exitFullscreen) {
            document.exitFullscreen();
            this.showInfo('Mode plein écran désactivé');
        }
    }

    /**
     * Nettoie les ressources d'affichage
     */
    cleanup() {
        // Supprimer les notifications en cours
        document.querySelectorAll('.notification').forEach(n => n.remove());
        
        // Supprimer les modales ouvertes
        document.querySelectorAll('.display-modal').forEach(m => m.remove());
        
        console.log('🧹 DisplayManager nettoyé');
    }
}