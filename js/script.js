/**
 * Planning de Travail - PWA
 * Application web progressive pour la gestion des plannings de travail
 */

class PlanningApp {
    constructor() {
        this.planningData = [];
        this.currentWeekIndex = 0;
        this.weeks = [];
        this.today = new Date();
        this.isDarkTheme = this.loadThemePreference();
        
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
     * Gestion des données sauvegardées
     */
    loadSavedData() {
        const saved = localStorage.getItem('planning-data');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                if (data && data.length > 0) {
                    this.planningData = data;
                    this.processData();
                    this.showSaveIndicator('📂 Planning chargé');
                    return;
                }
            } catch (e) {
                console.warn('Données sauvegardées corrompues');
                localStorage.removeItem('planning-data');
            }
        }
        // Si pas de données sauvegardées ou corrompues, afficher l'écran vide
        this.showNoData();
    }

    saveData() {
        if (this.planningData.length > 0) {
            localStorage.setItem('planning-data', JSON.stringify(this.planningData));
            this.showSaveIndicator();
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
        // Afficher le loading
        this.showLoading();
        
        // Effacer complètement les données
        this.planningData = [];
        this.weeks = [];
        this.currentWeekIndex = 0;
        
        // Effacer les données sauvegardées
        localStorage.removeItem('planning-data');
        
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
            const text = await this.readFile(file);
            this.parseCSV(text);
            
            if (this.planningData.length === 0) {
                throw new Error('Aucune donnée valide trouvée dans le fichier CSV');
            }
            
            this.processData();
            this.saveData();
            this.showSaveIndicator('📁 CSV importé et sauvegardé');
        } catch (error) {
            alert('Erreur lors du chargement du fichier: ' + error.message);
            this.showNoData();
        }
    }

    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }

    /**
     * Parse le contenu CSV
     */
    parseCSV(text) {
        const lines = text.trim().split('\n');
        if (lines.length < 2) throw new Error('Fichier CSV vide ou invalide');
        
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        
        this.planningData = [];
        for (let i = 1; i < lines.length; i++) {
            const values = this.parseCSVLine(lines[i]);
            const entry = {};
            
            headers.forEach((header, index) => {
                entry[header] = values[index] || '';
            });
            
            // Normaliser les noms de colonnes
            this.normalizeEntryFields(entry);
            
            // Convertir la date
            if (entry.date) {
                entry.dateObj = this.parseDate(entry.date);
                if (!isNaN(entry.dateObj)) {
                    this.planningData.push(entry);
                }
            }
        }
    }

    normalizeEntryFields(entry) {
        // Normaliser le champ date
        if (!entry.date && entry.jour) {
            entry.date = entry.jour;
        }
        
        // Normaliser le champ horaire
        if (!entry.horaire) {
            if (entry.horaires) entry.horaire = entry.horaires;
            else if (entry.time) entry.horaire = entry.time;
            else if (entry.heures) entry.horaire = entry.heures;
        }
        
        // Normaliser le champ poste/lieu
        if (!entry.poste) {
            if (entry.lieu) entry.poste = entry.lieu;
            else if (entry.location) entry.poste = entry.location;
            else if (entry.site) entry.poste = entry.site;
        }
        
        // Normaliser le champ taches
        if (!entry.taches) {
            if (entry.tache) entry.taches = entry.tache;
            else if (entry.task) entry.taches = entry.task;
            else if (entry.description) entry.taches = entry.description;
            else if (entry.activite) entry.taches = entry.activite;
            else if (entry.activites) entry.taches = entry.activites;
        }
    }

    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current.trim());
        return result;
    }

    parseDate(dateString) {
        // Support de plusieurs formats de date
        const formats = [
            /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // DD/MM/YYYY
            /^(\d{4})-(\d{1,2})-(\d{1,2})$/, // YYYY-MM-DD
            /^(\d{1,2})-(\d{1,2})-(\d{4})$/, // DD-MM-YYYY
        ];

        for (let format of formats) {
            const match = dateString.match(format);
            if (match) {
                if (format === formats[1]) { // YYYY-MM-DD
                    return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
                } else { // DD/MM/YYYY ou DD-MM-YYYY
                    return new Date(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1]));
                }
            }
        }
        
        return new Date(dateString);
    }

    /**
     * Traitement des données et organisation par semaines
     */
    processData() {
        // Vérifier s'il y a des données à traiter
        if (!this.planningData || this.planningData.length === 0) {
            this.showNoData();
            return;
        }

        // Ajouter dateObj aux données existantes si manquant
        this.planningData = this.planningData.map(entry => {
            if (!entry.dateObj && entry.date) {
                entry.dateObj = this.parseDate(entry.date);
            }
            return entry;
        });

        this.organizeWeeks();
        
        if (this.weeks.length === 0) {
            this.showNoData();
            return;
        }
        
        this.findCurrentWeek();
        this.displayWeek();
        this.showPlanning();
        this.updateFooter();
    }

    organizeWeeks() {
        this.weeks = [];
        const sortedData = this.planningData
            .filter(entry => entry.dateObj && !isNaN(entry.dateObj))
            .sort((a, b) => a.dateObj - b.dateObj);

        if (sortedData.length === 0) return;

        let currentWeekStart = this.getWeekStart(sortedData[0].dateObj);
        let currentWeek = [];

        sortedData.forEach(entry => {
            const entryWeekStart = this.getWeekStart(entry.dateObj);
            
            if (entryWeekStart.getTime() !== currentWeekStart.getTime()) {
                if (currentWeek.length > 0) {
                    this.weeks.push({
                        weekStart: currentWeekStart,
                        weekEnd: this.getWeekEnd(currentWeekStart),
                        days: this.organizeDaysInWeek(currentWeek)
                    });
                }
                currentWeekStart = entryWeekStart;
                currentWeek = [];
            }
            
            currentWeek.push(entry);
        });

        if (currentWeek.length > 0) {
            this.weeks.push({
                weekStart: currentWeekStart,
                weekEnd: this.getWeekEnd(currentWeekStart),
                days: this.organizeDaysInWeek(currentWeek)
            });
        }
    }

    getWeekStart(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Lundi = début de semaine
        return new Date(d.setDate(diff));
    }

    getWeekEnd(weekStart) {
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return weekEnd;
    }

    organizeDaysInWeek(weekData) {
        const daysMap = new Map();
        
        weekData.forEach(entry => {
            const dateKey = entry.dateObj.toDateString();
            if (!daysMap.has(dateKey)) {
                daysMap.set(dateKey, {
                    date: entry.dateObj,
                    entries: []
                });
            }
            daysMap.get(dateKey).entries.push(entry);
        });

        return daysMap;
    }

    /**
     * Navigation entre les semaines
     */
    findCurrentWeek() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        this.currentWeekIndex = this.weeks.findIndex(week => {
            const weekStart = new Date(week.weekStart);
            const weekEnd = new Date(week.weekEnd);
            weekStart.setHours(0, 0, 0, 0);
            weekEnd.setHours(23, 59, 59, 999);
            
            return today >= weekStart && today <= weekEnd;
        });

        if (this.currentWeekIndex === -1) {
            this.currentWeekIndex = 0;
        }
    }

    goToCurrentWeek() {
        if (this.weeks.length === 0) return;
        this.findCurrentWeek();
        this.displayWeek();
    }

    navigateWeek(direction) {
        const newIndex = this.currentWeekIndex + direction;
        if (newIndex >= 0 && newIndex < this.weeks.length) {
            this.currentWeekIndex = newIndex;
            this.displayWeek();
        }
    }

    /**
     * Affichage de la semaine courante
     */
    displayWeek() {
        if (!this.weeks || this.weeks.length === 0 || !this.planningData || this.planningData.length === 0) {
            this.showNoData();
            return;
        }

        const week = this.weeks[this.currentWeekIndex];
        if (!week) {
            this.showNoData();
            return;
        }
        
        const isCurrentWeek = this.isCurrentWeek(week);
        
        this.updateWeekInfo(week, isCurrentWeek);
        this.renderWeekDays(week);
        this.updateNavigationButtons();
        this.updateWeekStats(week);
    }

    isCurrentWeek(week) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const weekStart = new Date(week.weekStart);
        const weekEnd = new Date(week.weekEnd);
        weekStart.setHours(0, 0, 0, 0);
        weekEnd.setHours(23, 59, 59, 999);
        
        return today >= weekStart && today <= weekEnd;
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
            // Aucune donnée - afficher la semaine complète par défaut
            const startDate = week.weekStart.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
            const endDate = week.weekEnd.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
            dateRange = `${startDate} - ${endDate}`;
        } else if (actualDates.length === 1) {
            // Un seul jour - afficher seulement ce jour
            const date = actualDates[0].toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
            dateRange = date;
        } else {
            // Plusieurs jours - afficher la plage des jours présents
            const firstDate = actualDates[0];
            const lastDate = actualDates[actualDates.length - 1];
            
            const startDay = firstDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
            const endDay = lastDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
            
            // Si même mois, afficher "1 - 15 juin", sinon "30 mai - 1 juin"
            if (firstDate.getMonth() === lastDate.getMonth()) {
                const monthName = lastDate.toLocaleDateString('fr-FR', { month: 'long' });
                dateRange = `${firstDate.getDate()} - ${lastDate.getDate()} ${monthName}`;
            } else {
                dateRange = `${startDay} - ${endDay}`;
            }
        }
        
        this.weekDates.textContent = dateRange;
        this.currentBadge.style.display = isCurrentWeek ? 'inline-block' : 'none';
        
        // Mettre à jour l'apparence du bouton "Aujourd'hui"
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
                const timeInfo = this.extractTimeInfo(dayData.entries[0]);
                if (!timeInfo.isRest) {
                    workDaysCount++;
                    dayData.entries.forEach(entry => {
                        totalWeekHours += this.calculateDuration(entry);
                    });
                }
            }
        });

        const avgHours = workDaysCount > 0 ? totalWeekHours / workDaysCount : 0;

        this.totalHours.textContent = `${totalWeekHours.toFixed(1)}h`;
        this.workDays.textContent = workDaysCount;
        this.avgHours.textContent = `${avgHours.toFixed(1)}h`;
        
        // Mettre à jour le label si ce n'est qu'une journée
        if (actualDaysCount === 1) {
            this.workDays.nextElementSibling.textContent = 'Jour travaillé';
        } else {
            this.workDays.nextElementSibling.textContent = 'Jours travaillés';
        }
    }

    updateNavigationButtons() {
        this.prevWeekBtn.disabled = this.currentWeekIndex === 0;
        this.nextWeekBtn.disabled = this.currentWeekIndex === this.weeks.length - 1;
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
        
        // Si aucun jour avec données, afficher un message
        if (daysWithData.length === 0) {
            html = '<div style="text-align: center; padding: 40px; color: var(--text-secondary);">Aucune donnée pour cette semaine</div>';
        } else {
            // Afficher seulement les jours qui ont des données
            daysWithData.forEach(day => {
                const isToday = day.date.getTime() === today.getTime();
                const isWeekend = day.index >= 5; // Samedi et Dimanche
                
                html += this.renderDayCard(day.name, day.date, day.data, isToday, isWeekend);
            });
        }
        
        this.planningDisplay.innerHTML = html;
    }

    renderDayCard(dayName, date, dayData, isToday, isWeekend) {
        const dayNumber = date.getDate();
        const hasWork = dayData && dayData.entries.length > 0;
        
        // Vérifier si c'est un jour de repos
        let isRestDay = false;
        if (hasWork) {
            const timeInfo = this.extractTimeInfo(dayData.entries[0]);
            isRestDay = timeInfo.isRest;
        }
        
        let html = `<div class="day-card">`;
        html += `<div class="day-header">`;
        html += `<div>`;
        html += `<div class="day-name">${dayName}</div>`;
        html += `<div class="day-number">${dayNumber}</div>`;
        html += `</div>`;
        html += `<div>`;
        
        if (isToday) {
            html += `<div class="today-badge">Aujourd'hui</div>`;
        } else if (isRestDay) {
            html += `<div class="rest-badge">Repos</div>`;
        } else if (!hasWork) {
            html += `<div class="rest-badge">Repos</div>`;
        } else if (hasWork) {
            const badges = this.getDayBadges(dayData);
            html += badges;
        }
        
        html += `</div>`;
        html += `</div>`;
        
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
        const timeSlots = this.organizeTimeSlots(dayData.entries);
        let badges = '';
        
        if (timeSlots.length > 2) {
            badges += `<div class="multiple-badge">Coupure</div>`;
        } else if (timeSlots.some(slot => this.isNightShift(slot.start, slot.end))) {
            badges += `<div class="night-badge">Nuit</div>`;
        } else if (timeSlots.length === 2) {
            badges += `<div class="multiple-badge">Coupure</div>`;
        }
        
        return badges;
    }

    renderScheduleSection(dayData) {
        let html = `<div class="schedule-section">`;
        html += `<div class="schedule-title">`;
        html += `<span class="info-icon">🕒</span>`;
        html += `Horaires de la journée :`;
        html += `</div>`;
        
        let totalHours = 0;
        const timeSlots = this.organizeTimeSlots(dayData.entries);
        
        timeSlots.forEach(slot => {
            const isNightShift = this.isNightShift(slot.start, slot.end);
            const duration = this.calculateSlotDuration(slot.start, slot.end);
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
            // Afficher le poste/lieu
            if (entry.poste && entry.poste.toLowerCase() !== 'congé') {
                const poste = entry.poste;
                if (!uniqueInfo.has(`poste:${poste}`)) {
                    html += `<div class="info-item">`;
                    html += `<span class="info-icon">📍</span>`;
                    html += `${poste}`;
                    html += `</div>`;
                    uniqueInfo.add(`poste:${poste}`);
                }
            }
            
            // Afficher les tâches
            if (entry.taches && entry.taches.toLowerCase() !== 'jour de repos') {
                const taches = entry.taches;
                if (!uniqueInfo.has(`taches:${taches}`)) {
                    html += `<div class="info-item">`;
                    html += `<span class="info-icon">✅</span>`;
                    html += `${taches}`;
                    html += `</div>`;
                    uniqueInfo.add(`taches:${taches}`);
                }
            }
        });
        
        html += `</div>`;
        return html;
    }

    /**
     * Gestion des créneaux horaires
     */
    organizeTimeSlots(entries) {
        const allSlots = [];
        
        entries.forEach(entry => {
            const timeInfo = this.extractTimeInfo(entry);
            if (timeInfo.slots && timeInfo.slots.length > 0) {
                timeInfo.slots.forEach(slot => {
                    allSlots.push({
                        start: slot.start,
                        end: slot.end,
                        raw: slot.raw,
                        entry: entry
                    });
                });
            }
        });
        
        // Trier par heure de début
        return allSlots.sort((a, b) => {
            const timeA = this.timeToMinutes(a.start);
            const timeB = this.timeToMinutes(b.start);
            return timeA - timeB;
        });
    }

    extractTimeInfo(entry) {
        if (!entry.horaire) return { slots: [] };
        
        const timeText = entry.horaire.trim();
        
        // Vérifier si c'est un jour de repos
        if (timeText.toLowerCase().includes('repos') || 
            timeText.toLowerCase().includes('congé') ||
            timeText.toLowerCase().includes('off') ||
            timeText === '') {
            return { slots: [], isRest: true };
        }
        
        // Séparer les horaires multiples avec différents séparateurs
        const separators = [' | ', ' puis ', ' / ', ' + ', ' et ', '|', 'puis', '/', '+', 'et'];
        let timeSlots = [timeText];
        
        for (let separator of separators) {
            if (timeText.includes(separator)) {
                timeSlots = timeText.split(separator).map(s => s.trim());
                break;
            }
        }
        
        const slots = [];
        
        timeSlots.forEach(slot => {
            // Parse chaque slot individuel (ex: "08:00-12:00")
            const timeMatch = slot.match(/(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})/);
            if (timeMatch) {
                slots.push({
                    start: `${timeMatch[1]}:${timeMatch[2]}`,
                    end: `${timeMatch[3]}:${timeMatch[4]}`,
                    raw: slot.trim()
                });
            }
        });
        
        return { slots: slots, isRest: false };
    }

    /**
     * Calculs de durée
     */
    timeToMinutes(timeStr) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    }

    isNightShift(startTime, endTime) {
        const startMinutes = this.timeToMinutes(startTime);
        const endMinutes = this.timeToMinutes(endTime);
        
        // Détecte les horaires de nuit (ex: 22:00-06:00)
        return startMinutes > endMinutes || startMinutes >= 22 * 60 || endMinutes <= 6 * 60;
    }

    calculateSlotDuration(startTime, endTime) {
        let startMinutes = this.timeToMinutes(startTime);
        let endMinutes = this.timeToMinutes(endTime);
        
        // Gestion des horaires de nuit
        if (startMinutes > endMinutes) {
            endMinutes += 24 * 60; // Ajouter 24h
        }
        
        return (endMinutes - startMinutes) / 60;
    }

    calculateDuration(entry) {
        const timeInfo = this.extractTimeInfo(entry);
        let totalDuration = 0;
        
        if (timeInfo.slots && timeInfo.slots.length > 0) {
            timeInfo.slots.forEach(slot => {
                totalDuration += this.calculateSlotDuration(slot.start, slot.end);
            });
        }
        
        return totalDuration;
    }

    /**
     * Gestion des états d'affichage
     */
    updateFooter() {
        if (this.weeks.length > 0) {
            this.pageInfo.textContent = `${this.currentWeekIndex + 1} sur ${this.weeks.length}`;
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

/**
 * Initialisation de l'application
 */
document.addEventListener('DOMContentLoaded', () => {
    new PlanningApp();
});

/**
 * Enregistrement du service worker pour PWA
 */
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}