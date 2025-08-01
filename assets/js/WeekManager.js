/**
 * Gestionnaire de la navigation par semaines
 */
class WeekManager {
    constructor() {
        this.weeks = [];
        this.currentWeekIndex = 0;
    }

    /**
     * Organise les données par semaines
     */
    organizeWeeks(planningData) {
        this.weeks = [];
        const sortedData = planningData
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

    /**
     * Obtient le début de semaine (lundi)
     */
    getWeekStart(date) {
	    const d = new Date(date);
	    const day = d.getDay();
	    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Lundi = début de semaine
	    const weekStart = new Date(d.setDate(diff));
	    weekStart.setHours(0, 0, 0, 0);
	    return weekStart;
	}

    /**
     * Obtient la fin de semaine (dimanche)
     */
    getWeekEnd(weekStart) {
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return weekEnd;
    }

    /**
     * Organise les jours dans une semaine
     */
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
     * Trouve la semaine courante
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

    /**
     * Navigue vers une semaine
     */
    navigateToWeek(direction) {
        const newIndex = this.currentWeekIndex + direction;
        if (newIndex >= 0 && newIndex < this.weeks.length) {
            this.currentWeekIndex = newIndex;
            return true;
        }
        return false;
    }

    /**
     * Va à la semaine courante
     */
    goToCurrentWeek() {
        if (this.weeks.length === 0) return false;
        this.findCurrentWeek();
        return true;
    }

    /**
     * Vérifie si une semaine est la semaine courante
     */
    isCurrentWeek(week) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const weekStart = new Date(week.weekStart);
        const weekEnd = new Date(week.weekEnd);
        weekStart.setHours(0, 0, 0, 0);
        weekEnd.setHours(23, 59, 59, 999);
        
        return today >= weekStart && today <= weekEnd;
    }

    /**
     * Obtient la semaine courante
     */
    getCurrentWeek() {
        return this.weeks[this.currentWeekIndex] || null;
    }

    /**
     * Obtient toutes les semaines
     */
    getWeeks() {
        return this.weeks;
    }

    /**
     * Obtient l'index de la semaine courante
     */
    getCurrentWeekIndex() {
        return this.currentWeekIndex;
    }

    /**
     * Vérifie s'il y a des semaines
     */
    hasWeeks() {
        return this.weeks.length > 0;
    }

    /**
     * Remet à zéro
     */
    reset() {
        this.weeks = [];
        this.currentWeekIndex = 0;
    }
}