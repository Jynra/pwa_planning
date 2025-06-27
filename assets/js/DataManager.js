/**
 * Gestionnaire des données et import CSV - Version améliorée avec persistance renforcée
 */
class DataManager {
    constructor() {
        this.storageKey = 'planning-data';
        this.metaStorageKey = 'planning-meta';
    }

    /**
     * Charge les données sauvegardées avec validation renforcée
     */
    loadSavedData() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            const meta = this.loadMetadata();
            
            if (saved) {
                const data = JSON.parse(saved);
                
                // Validation des données
                if (Array.isArray(data) && data.length > 0) {
                    // Reconstituer les objets Date si manquants
                    const processedData = data.map(entry => {
                        if (!entry.dateObj && entry.date) {
                            entry.dateObj = this.parseDate(entry.date);
                        }
                        return entry;
                    });
                    
                    console.log(`📂 Planning chargé: ${data.length} entrées (sauvé le ${meta.lastSaved})`);
                    return processedData;
                }
            }
            
            console.log('📋 Aucun planning sauvegardé trouvé');
            return null;
        } catch (error) {
            console.warn('⚠️ Données sauvegardées corrompues:', error);
            // Ne pas supprimer immédiatement, créer une sauvegarde de récupération
            this.createBackup();
            localStorage.removeItem(this.storageKey);
            return null;
        }
    }

    /**
     * Sauvegarde les données avec métadonnées
     */
    saveData(data) {
        if (!data || !Array.isArray(data) || data.length === 0) {
            console.warn('⚠️ Tentative de sauvegarde de données vides');
            return false;
        }

        try {
            // Préparer les données pour la sauvegarde (sérialiser les dates)
            const dataToSave = data.map(entry => ({
                ...entry,
                dateObj: entry.dateObj ? entry.dateObj.toISOString() : null
            }));
            
            // Sauvegarder les données
            localStorage.setItem(this.storageKey, JSON.stringify(dataToSave));
            
            // Sauvegarder les métadonnées
            const metadata = {
                lastSaved: new Date().toLocaleString('fr-FR'),
                dataCount: data.length,
                version: '1.0.0'
            };
            localStorage.setItem(this.metaStorageKey, JSON.stringify(metadata));
            
            console.log(`💾 Planning sauvegardé: ${data.length} entrées`);
            return true;
        } catch (error) {
            console.error('❌ Erreur lors de la sauvegarde:', error);
            
            // Si erreur de quota, essayer de nettoyer
            if (error.name === 'QuotaExceededError') {
                this.cleanupStorage();
                // Réessayer une fois
                try {
                    localStorage.setItem(this.storageKey, JSON.stringify(dataToSave));
                    return true;
                } catch (retryError) {
                    console.error('❌ Impossible de sauvegarder même après nettoyage');
                }
            }
            return false;
        }
    }

    /**
     * Charge les métadonnées de sauvegarde
     */
    loadMetadata() {
        try {
            const meta = localStorage.getItem(this.metaStorageKey);
            return meta ? JSON.parse(meta) : {};
        } catch (error) {
            console.warn('⚠️ Métadonnées corrompues');
            return {};
        }
    }

    /**
     * Crée une sauvegarde de récupération en cas de corruption
     */
    createBackup() {
        try {
            const corrupted = localStorage.getItem(this.storageKey);
            if (corrupted) {
                const backupKey = `${this.storageKey}-backup-${Date.now()}`;
                localStorage.setItem(backupKey, corrupted);
                console.log(`🔄 Sauvegarde de récupération créée: ${backupKey}`);
            }
        } catch (error) {
            console.warn('⚠️ Impossible de créer une sauvegarde de récupération');
        }
    }

    /**
     * Nettoie le stockage en cas de quota dépassé
     */
    cleanupStorage() {
        try {
            // Supprimer les anciennes sauvegardes de récupération
            const keys = Object.keys(localStorage);
            const backupKeys = keys.filter(key => key.startsWith(`${this.storageKey}-backup-`));
            
            backupKeys.forEach(key => {
                localStorage.removeItem(key);
            });
            
            console.log(`🧹 ${backupKeys.length} anciennes sauvegardes supprimées`);
        } catch (error) {
            console.warn('⚠️ Erreur lors du nettoyage');
        }
    }

    /**
     * Efface les données sauvegardées
     */
    clearData() {
        try {
            localStorage.removeItem(this.storageKey);
            localStorage.removeItem(this.metaStorageKey);
            console.log('🗑️ Planning effacé du stockage');
        } catch (error) {
            console.warn('⚠️ Erreur lors de l\'effacement');
        }
    }

    /**
     * Vérifie la disponibilité du localStorage
     */
    isStorageAvailable() {
        try {
            const test = 'test-storage';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (error) {
            console.warn('⚠️ LocalStorage non disponible');
            return false;
        }
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
     * Parse le contenu CSV avec gestion d'erreurs améliorée
     */
    parseCSV(text) {
        const lines = text.trim().split('\n');
        if (lines.length < 2) throw new Error('Fichier CSV vide ou invalide');
        
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
        console.log('📊 En-têtes détectés:', headers);
        
        const planningData = [];
        let validEntries = 0;
        let invalidEntries = 0;
        
        for (let i = 1; i < lines.length; i++) {
            try {
                const values = this.parseCSVLine(lines[i]);
                const entry = {};
                
                headers.forEach((header, index) => {
                    entry[header] = values[index] ? values[index].replace(/"/g, '') : '';
                });
                
                // Normaliser les noms de colonnes
                this.normalizeEntryFields(entry);
                
                // Convertir la date
                if (entry.date) {
                    entry.dateObj = this.parseDate(entry.date);
                    if (!isNaN(entry.dateObj)) {
                        planningData.push(entry);
                        validEntries++;
                    } else {
                        console.warn(`⚠️ Date invalide ligne ${i + 1}:`, entry.date);
                        invalidEntries++;
                    }
                } else {
                    console.warn(`⚠️ Date manquante ligne ${i + 1}`);
                    invalidEntries++;
                }
            } catch (error) {
                console.warn(`⚠️ Erreur ligne ${i + 1}:`, error.message);
                invalidEntries++;
            }
        }
        
        console.log(`✅ Import terminé: ${validEntries} entrées valides, ${invalidEntries} ignorées`);
        
        if (planningData.length === 0) {
            throw new Error('Aucune donnée valide trouvée dans le fichier CSV');
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
     * Parse une date dans différents formats avec gestion d'erreurs
     */
    parseDate(dateString) {
        if (!dateString || typeof dateString !== 'string') {
            throw new Error('Date invalide ou manquante');
        }

        // Si c'est déjà une date ISO (récupération depuis localStorage)
        if (dateString.includes('T') && dateString.includes('Z')) {
            return new Date(dateString);
        }

        // Support de plusieurs formats de date
        const formats = [
            /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // DD/MM/YYYY
            /^(\d{4})-(\d{1,2})-(\d{1,2})$/, // YYYY-MM-DD
            /^(\d{1,2})-(\d{1,2})-(\d{4})$/, // DD-MM-YYYY
        ];

        for (let format of formats) {
            const match = dateString.match(format);
            if (match) {
                let date;
                if (format === formats[1]) { // YYYY-MM-DD
                    date = new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
                } else { // DD/MM/YYYY ou DD-MM-YYYY
                    date = new Date(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1]));
                }
                
                // Vérifier que la date est valide
                if (!isNaN(date.getTime())) {
                    return date;
                }
            }
        }
        
        // Dernier recours
        const fallbackDate = new Date(dateString);
        if (!isNaN(fallbackDate.getTime())) {
            return fallbackDate;
        }
        
        throw new Error(`Format de date non reconnu: ${dateString}`);
    }

    /**
     * Obtient des statistiques sur les données stockées
     */
    getStorageStats() {
        const metadata = this.loadMetadata();
        const dataSize = localStorage.getItem(this.storageKey)?.length || 0;
        
        return {
            hasData: dataSize > 0,
            lastSaved: metadata.lastSaved || 'Jamais',
            dataCount: metadata.dataCount || 0,
            sizeKB: Math.round(dataSize / 1024 * 100) / 100,
            version: metadata.version || 'Inconnue'
        };
    }
}