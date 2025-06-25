/**
 * Gestionnaire des données et import CSV
 */
class DataManager {
    constructor() {
        this.storageKey = 'planning-data';
    }

    /**
     * Charge les données sauvegardées
     */
    loadSavedData() {
        const saved = localStorage.getItem(this.storageKey);
        if (saved) {
            try {
                const data = JSON.parse(saved);
                if (data && data.length > 0) {
                    return data;
                }
            } catch (e) {
                console.warn('Données sauvegardées corrompues');
                localStorage.removeItem(this.storageKey);
            }
        }
        return null;
    }

    /**
     * Sauvegarde les données
     */
    saveData(data) {
        if (data && data.length > 0) {
            localStorage.setItem(this.storageKey, JSON.stringify(data));
            return true;
        }
        return false;
    }

    /**
     * Efface les données sauvegardées
     */
    clearData() {
        localStorage.removeItem(this.storageKey);
    }

    /**
     * Lit un fichier
     */
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
        
        const planningData = [];
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
                    planningData.push(entry);
                }
            }
        }
        
        return planningData;
    }

    /**
     * Parse une ligne CSV en gérant les guillemets
     */
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

    /**
     * Normalise les champs d'une entrée
     */
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

    /**
     * Parse une date dans différents formats
     */
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
}