/**
 * Utilitaires pour les calculs de temps et horaires
 */
class TimeUtils {
    /**
     * Convertit une heure en minutes
     */
    static timeToMinutes(timeStr) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    }

    /**
     * Détecte si un créneau est de nuit
     */
    static isNightShift(startTime, endTime) {
        const startMinutes = this.timeToMinutes(startTime);
        const endMinutes = this.timeToMinutes(endTime);
        
        // Détecte les horaires de nuit (ex: 22:00-06:00)
        return startMinutes > endMinutes || startMinutes >= 22 * 60 || endMinutes <= 6 * 60;
    }

    /**
     * Calcule la durée d'un créneau horaire
     */
    static calculateSlotDuration(startTime, endTime) {
        let startMinutes = this.timeToMinutes(startTime);
        let endMinutes = this.timeToMinutes(endTime);
        
        // Gestion des horaires de nuit
        if (startMinutes > endMinutes) {
            endMinutes += 24 * 60; // Ajouter 24h
        }
        
        return (endMinutes - startMinutes) / 60;
    }

    /**
     * Extrait les informations de temps depuis une entrée
     */
    static extractTimeInfo(entry) {
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
     * Calcule la durée totale d'une entrée
     */
    static calculateDuration(entry) {
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
     * Organise les créneaux horaires d'une journée
     */
    static organizeTimeSlots(entries) {
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
}