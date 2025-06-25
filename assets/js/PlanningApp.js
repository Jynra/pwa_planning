/**
 * Application principale de Planning de Travail - PWA
 */
class PlanningApp {
    constructor() {
        this.planningData = [];
        this.isDarkTheme = this.loadThemePreference();
        
        // Gestionnaires
        this.dataManager = new DataManager();
        this.weekManager = new WeekManager();
        
        this.initializeElements();
        this.bindEvents();
        this.updateCurrentMonth();
        this.applyTheme();
        this.loadSavedData();
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
        this.csvFileInput.addEventListener('change', (e) => this.handleFileLoad(e));
        this.todayBtn.addEventListener('click', () => this.goToCurrentWeek());
        this.resetBtn.addEventListener('click', () => this.resetPlanning());
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
        this.prevWeekBtn.addEventListener('click', () => this.navigateWeek(-1));
        this.nextWeekBtn.addEventListener('click', () => this.navigateWeek(1));

        // Détection automatique du mode sombre
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            mediaQuery.addListener(() => this.handleAutoTheme());
            this.handleAutoTheme();
        }
    }

    /**
     * Gestion des thèmes
     */
    loadThemePreference() {
        const saved = localStorage.getItem('planning-theme');
        return saved ? saved === 'dark' : false;
    }

    saveThemePreference() {
        localStorage.setItem('planning-theme', this.isDarkTheme ? 'dark' : 'light');
    }

    handleAutoTheme() {
        if (!localStorage.getItem('planning-theme')) {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            this.isDarkTheme = prefersDark;
            this.applyTheme();
        }
    }

    applyTheme() {
        document.body.classList.toggle('dark-theme', this.isDarkTheme);
        this.themeToggle.textContent = this.isDarkTheme ? '☀️' : '🌙';
    }

    toggleTheme() {
        this.isDarkTheme = !this.isDarkTheme;
        this.applyTheme();
        this.saveThemePreference();
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
        this.currentMonth.textContent = `${months[now.getMonth()]} ${now.getFullYear()}`;
    }

    /**
     * Gestion des données
     */
    loadSavedData() {
        const data = this.dataManager.loadSavedData();
        if (data) {
            this.planningData = data;
            this.processData();
            this.showSaveIndicator('📂 Planning chargé');
        } else {
            this.showNoData();
        }
    }

    showSaveIndicator(message = '💾 Planning sauvegardé') {
        this.saveIndicator.textContent = message;
        this.saveIndicator.classList.add('show');
        setTimeout(() => {
            this.saveIndicator.classList.remove('show');
        }, 2000);
    }

    resetPlanning() {
        this.showLoading();
        
        // Effacer complètement les données
        this.planningData = [];
        this.weekManager.reset();
        this.dataManager.clearData();
        
        // Afficher l'écran vide après un délai
        setTimeout(() => {
            this.showNoData();
            this.showSaveIndicator('🔄 Planning effacé');
        }, 500);
    }

    /**
     * Gestion des fichiers CSV
     */
    async handleFileLoad(event) {
        const file = event.target.files[0];
        if (!file) return;

        this.showLoading();
        
        try {
            const text = await this.dataManager.readFile(file);
            this.planningData = this.dataManager.parseCSV(text);
            
            if (this.planningData.length === 0) {
                throw new Error('Aucune donnée valide trouvée dans le fichier CSV');
            }
            
            this.processData();
            this.dataManager.saveData(this.planningData);
            this.showSaveIndicator('📁 CSV importé et sauvegardé');
        } catch (error) {
            alert('Erreur lors du chargement du fichier: ' + error.message);
            this.showNoData();
        }
    }

    /**
     * Traitement des données
     */
    processData() {
        if (!this.planningData || this.planningData.length === 0) {
            this.showNoData();
            return;
        }

        // Ajouter dateObj aux données existantes si manquant
        this.planningData = this.planningData.map(entry => {
            if (!entry.dateObj && entry.date) {
                entry.dateObj = this.dataManager.parseDate(entry.date);
            }
            return entry;
        });

        this.weekManager.organizeWeeks(this.planningData);
        
        if (!this.weekManager.hasWeeks()) {
            this.showNoData();
            return;
        }
        
        this.weekManager.findCurrentWeek();
        this.displayWeek();
        this.showPlanning();
        this.updateFooter();
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
            this.showNoData();
            return;
        }
        
        const isCurrentWeek = this.weekManager.isCurrentWeek(week);
        
        this.updateWeekInfo(week, isCurrentWeek);
        this.renderWeekDays(week);
        this.updateNavigationButtons();
        this.updateWeekStats(week);
    }

    updateWeekInfo(week, isCurrentWeek) {
        // Récupérer les dates réellement présentes dans les données
        const actualDates = [];
        week.days.forEach((dayData, dateKey) => {
            actualDates.push(dayData.date);
        });
        
        // Trier les dates
        actualDates.sort((a, b) => a - b);
        
        let dateRange;
        
        if (actualDates.length === 0) {
            const startDate = week.weekStart.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
            const endDate = week.weekEnd.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
            dateRange = `${startDate} - ${endDate}`;
        } else if (actualDates.length === 1) {
            const date = actualDates[0].toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
            dateRange = date;
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
        
        this.weekDates.textContent = dateRange;
        this.currentBadge.style.display = isCurrentWeek ? 'inline-block' : 'none';
        this.updateTodayButton(isCurrentWeek);
    }

    updateTodayButton(isCurrentWeek) {
        if (isCurrentWeek) {
            this.todayBtn.classList.remove('not-current-week');
        } else {
            this.todayBtn.classList.add('not-current-week');
        }
    }

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

        this.totalHours.textContent = `${totalWeekHours.toFixed(1)}h`;
        this.workDays.textContent = workDaysCount;
        this.avgHours.textContent = `${avgHours.toFixed(1)}h`;
        
        if (actualDaysCount === 1) {
            this.workDays.nextElementSibling.textContent = 'Jour travaillé';
        } else {
            this.workDays.nextElementSibling.textContent = 'Jours travaillés';
        }
    }

    updateNavigationButtons() {
        const weeks = this.weekManager.getWeeks();
        const currentIndex = this.weekManager.getCurrentWeekIndex();
        
        this.prevWeekBtn.disabled = currentIndex === 0;
        this.nextWeekBtn.disabled = currentIndex === weeks.length - 1;
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
                html += this.renderDayCard(day.name, day.date, day.data, isToday);
            });
        }
        
        this.planningDisplay.innerHTML = html;
    }

    renderDayCard(dayName, date, dayData, isToday) {
        const dayNumber = date.getDate();
        const hasWork = dayData && dayData.entries.length > 0;
        
        let isRestDay = false;
        if (hasWork) {
            const timeInfo = TimeUtils.extractTimeInfo(dayData.entries[0]);
            isRestDay = timeInfo.isRest;
        }
        
        let html = `<div class="day-card">`;
        html += `<div class="day-header">`;
        html += `<div><div class="day-name">${dayName}</div><div class="day-number">${dayNumber}</div></div>`;
        html += `<div>`;
        
        if (isToday) {
            html += `<div class="today-badge">Aujourd'hui</div>`;
        } else if (isRestDay || !hasWork) {
            html += `<div class="rest-badge">Repos</div>`;
        } else if (hasWork) {
            html += this.getDayBadges(dayData);
        }
        
        html += `</div></div>`;
        
        if (hasWork && !isRestDay) {
            html += this.renderScheduleSection(dayData);
        }
        
        if (hasWork) {
            html += this.renderDayInfo(dayData);
        }
        
        html += `</div>`;
        return html;
    }

    getDayBadges(dayData) {
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

    renderScheduleSection(dayData) {
        let html = `<div class="schedule-section">`;
        html += `<div class="schedule-title"><span class="info-icon">🕒</span>Horaires de la journée :</div>`;
        
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

    renderDayInfo(dayData) {
        let html = `<div class="info-section">`;
        const uniqueInfo = new Set();
        
        dayData.entries.forEach(entry => {
            if (entry.poste && entry.poste.toLowerCase() !== 'congé') {
                const poste = entry.poste;
                if (!uniqueInfo.has(`poste:${poste}`)) {
                    html += `<div class="info-item"><span class="info-icon">📍</span>${poste}</div>`;
                    uniqueInfo.add(`poste:${poste}`);
                }
            }
            
            if (entry.taches && entry.taches.toLowerCase() !== 'jour de repos') {
                const taches = entry.taches;
                if (!uniqueInfo.has(`taches:${taches}`)) {
                    html += `<div class="info-item"><span class="info-icon">✅</span>${taches}</div>`;
                    uniqueInfo.add(`taches:${taches}`);
                }
            }
        });
        
        html += `</div>`;
        return html;
    }

    /**
     * Gestion des états d'affichage
     */
    updateFooter() {
        const weeks = this.weekManager.getWeeks();
        const currentIndex = this.weekManager.getCurrentWeekIndex();
        
        if (weeks.length > 0) {
            this.pageInfo.textContent = `${currentIndex + 1} sur ${weeks.length}`;
            this.eventCount.textContent = this.planningData.length;
            this.footer.style.display = 'block';
        } else {
            this.footer.style.display = 'none';
        }
    }

    showLoading() {
        this.noData.style.display = 'none';
        this.loading.style.display = 'block';
        this.planningDisplay.classList.remove('show');
        this.weekNavigation.style.display = 'none';
        this.footer.style.display = 'none';
        this.statsBar.style.display = 'none';
    }

    showPlanning() {
        this.noData.style.display = 'none';
        this.loading.style.display = 'none';
        this.planningDisplay.classList.add('show');
        this.weekNavigation.style.display = 'flex';
        this.statsBar.style.display = 'flex';
    }

    showNoData() {
        this.noData.style.display = 'block';
        this.loading.style.display = 'none';
        this.planningDisplay.classList.remove('show');
        this.weekNavigation.style.display = 'none';
        this.footer.style.display = 'none';
        this.statsBar.style.display = 'none';
    }
}