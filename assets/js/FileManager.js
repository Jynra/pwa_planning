/**
 * Gestionnaire de fichiers - Planning de Travail PWA
 * Fichier: assets/js/FileManager.js
 */
class FileManager {
    constructor(app) {
        this.app = app;
        this.supportedFormats = ['csv', 'txt'];
        this.maxFileSize = 5 * 1024 * 1024; // 5MB
    }

    /**
     * Gestion des fichiers CSV avec sauvegarde automatique
     */
    async handleFileLoad(event) {
        const file = event.target.files[0];
        if (!file) return;

        console.log(`📁 Import fichier: ${file.name} (${Math.round(file.size / 1024)}KB)`);
        
        // Validation du fichier
        const validation = this.validateFile(file);
        if (!validation.isValid) {
            this.app.displayManager.showError(validation.error);
            event.target.value = '';
            return;
        }

        this.app.displayManager.showLoading();
        
        try {
            const text = await this.readFile(file);
            const parsedData = this.app.dataManager.parseCSV(text);
            
            if (parsedData.length === 0) {
                throw new Error('Aucune donnée valide trouvée dans le fichier CSV');
            }
            
            // Mettre à jour les données de l'application
            this.app.planningData = parsedData;
            
            // Sauvegarder immédiatement
            const saved = this.app.dataManager.saveData(this.app.planningData);
            
            // Traiter et afficher
            this.app.processDataWithValidation();
            
            // Message de confirmation
            const message = saved ? 
                `📁 CSV importé et sauvegardé (${parsedData.length} entrées)` :
                `⚠️ CSV importé mais sauvegarde échouée`;
            
            this.app.displayManager.showSaveIndicator(message, saved ? 2000 : 3000);
            
            // Statistiques d'import
            this.logImportStats(file, parsedData);
            
        } catch (error) {
            console.error('❌ Erreur import:', error);
            this.app.displayManager.showError(`Erreur lors du chargement: ${error.message}`);
            this.app.displayManager.showNoDataWithHelp();
            
            // Reset de l'input en cas d'erreur
            event.target.value = '';
        }
    }

    /**
     * Valide un fichier avant import
     */
    validateFile(file) {
        // Vérifier la taille
        if (file.size > this.maxFileSize) {
            return {
                isValid: false,
                error: `Fichier trop volumineux (${Math.round(file.size / 1024 / 1024)}MB max: 5MB)`
            };
        }

        // Vérifier l'extension
        const extension = file.name.split('.').pop().toLowerCase();
        if (!this.supportedFormats.includes(extension)) {
            return {
                isValid: false,
                error: `Format non supporté (.${extension}). Formats acceptés: ${this.supportedFormats.join(', ')}`
            };
        }

        // Vérifier le nom du fichier
        if (file.name.length > 100) {
            return {
                isValid: false,
                error: 'Nom de fichier trop long (max: 100 caractères)'
            };
        }

        return { isValid: true };
    }

    /**
     * Lit un fichier de manière asynchrone
     */
    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const result = e.target.result;
                    
                    // Vérifier que le contenu n'est pas vide
                    if (!result || result.trim().length === 0) {
                        reject(new Error('Fichier vide'));
                        return;
                    }
                    
                    // Détecter l'encodage et convertir si nécessaire
                    const cleanedResult = this.cleanFileContent(result);
                    resolve(cleanedResult);
                    
                } catch (error) {
                    reject(new Error(`Erreur de lecture: ${error.message}`));
                }
            };
            
            reader.onerror = () => {
                reject(new Error('Erreur lors de la lecture du fichier'));
            };
            
            reader.onabort = () => {
                reject(new Error('Lecture du fichier annulée'));
            };
            
            // Lire le fichier en tant que texte UTF-8
            reader.readAsText(file, 'UTF-8');
        });
    }

    /**
     * Nettoie le contenu du fichier
     */
    cleanFileContent(content) {
        // Supprimer les BOM (Byte Order Mark) éventuels
        content = content.replace(/^\uFEFF/, '');
        
        // Normaliser les retours à la ligne
        content = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        
        // Supprimer les espaces en fin de lignes
        content = content.replace(/[ \t]+$/gm, '');
        
        // Supprimer les lignes complètement vides à la fin
        content = content.replace(/\n+$/, '');
        
        return content;
    }

    /**
     * Exporte le planning actuel en CSV
     */
    exportToCSV() {
        if (!this.app.planningData || this.app.planningData.length === 0) {
            this.app.displayManager.showWarning('Aucune donnée à exporter');
            return;
        }

        try {
            const csvContent = this.generateCSV();
            const fileName = this.generateFileName();
            
            this.downloadFile(csvContent, fileName, 'text/csv');
            
            this.app.displayManager.showSuccess(`Planning exporté: ${fileName}`);
            
        } catch (error) {
            console.error('❌ Erreur export:', error);
            this.app.displayManager.showError('Erreur lors de l\'export CSV');
        }
    }

    /**
     * Génère le contenu CSV
     */
    generateCSV() {
        const headers = ['date', 'horaire', 'poste', 'taches'];
        const rows = [headers.join(',')];
        
        // Trier par date
        const sortedData = [...this.app.planningData].sort((a, b) => 
            new Date(a.dateObj) - new Date(b.dateObj)
        );
        
        sortedData.forEach(entry => {
            const row = [
                entry.date || '',
                this.escapeCSVField(entry.horaire || ''),
                this.escapeCSVField(entry.poste || ''),
                this.escapeCSVField(entry.taches || '')
            ];
            rows.push(row.join(','));
        });
        
        return rows.join('\n');
    }

    /**
     * Échappe un champ CSV si nécessaire
     */
    escapeCSVField(field) {
        if (typeof field !== 'string') {
            field = String(field);
        }
        
        // Si le champ contient des virgules, guillemets ou retours à la ligne
        if (field.includes(',') || field.includes('"') || field.includes('\n')) {
            // Échapper les guillemets en les doublant
            field = field.replace(/"/g, '""');
            // Entourer de guillemets
            field = `"${field}"`;
        }
        
        return field;
    }

    /**
     * Génère un nom de fichier pour l'export
     */
    generateFileName() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const time = String(now.getHours()).padStart(2, '0') + 
                    String(now.getMinutes()).padStart(2, '0');
        
        return `planning_${year}${month}${day}_${time}.csv`;
    }

    /**
     * Télécharge un fichier
     */
    downloadFile(content, fileName, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Nettoyer l'URL
        setTimeout(() => URL.revokeObjectURL(url), 100);
    }

    /**
     * Importe depuis le presse-papiers
     */
    async importFromClipboard() {
        try {
            if (!navigator.clipboard || !navigator.clipboard.readText) {
                throw new Error('Presse-papiers non supporté par ce navigateur');
            }
            
            const text = await navigator.clipboard.readText();
            
            if (!text || text.trim().length === 0) {
                throw new Error('Presse-papiers vide');
            }
            
            this.app.displayManager.showLoading();
            
            // Parser comme CSV
            const parsedData = this.app.dataManager.parseCSV(text);
            
            if (parsedData.length === 0) {
                throw new Error('Aucune donnée valide trouvée dans le presse-papiers');
            }
            
            // Demander confirmation
            const confirmed = confirm(
                `Importer ${parsedData.length} entrées depuis le presse-papiers ?\n\n` +
                `Cela remplacera le planning actuel.`
            );
            
            if (!confirmed) {
                this.app.displayManager.showInfo('Import annulé');
                return;
            }
            
            // Mettre à jour les données
            this.app.planningData = parsedData;
            
            // Sauvegarder
            const saved = this.app.dataManager.saveData(this.app.planningData);
            
            // Traiter et afficher
            this.app.processDataWithValidation();
            
            this.app.displayManager.showSuccess(
                `📋 ${parsedData.length} entrées importées depuis le presse-papiers`
            );
            
        } catch (error) {
            console.error('❌ Erreur import presse-papiers:', error);
            this.app.displayManager.showError(`Import échoué: ${error.message}`);
        }
    }

    /**
     * Copie le planning vers le presse-papiers
     */
    async copyToClipboard() {
        try {
            if (!navigator.clipboard || !navigator.clipboard.writeText) {
                throw new Error('Presse-papiers non supporté par ce navigateur');
            }
            
            if (!this.app.planningData || this.app.planningData.length === 0) {
                throw new Error('Aucune donnée à copier');
            }
            
            const csvContent = this.generateCSV();
            await navigator.clipboard.writeText(csvContent);
            
            this.app.displayManager.showSuccess(
                `📋 Planning copié (${this.app.planningData.length} entrées)`
            );
            
        } catch (error) {
            console.error('❌ Erreur copie:', error);
            this.app.displayManager.showError(`Copie échouée: ${error.message}`);
        }
    }

    /**
     * Sauvegarde automatique périodique
     */
    enableAutoSave(intervalMinutes = 5) {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }
        
        this.autoSaveInterval = setInterval(() => {
            if (this.app.planningData && this.app.planningData.length > 0) {
                const saved = this.app.dataManager.saveData(this.app.planningData);
                if (saved) {
                    console.log('💾 Sauvegarde automatique effectuée');
                }
            }
        }, intervalMinutes * 60 * 1000);
        
        console.log(`⏰ Sauvegarde automatique activée (${intervalMinutes} min)`);
    }

    /**
     * Désactive la sauvegarde automatique
     */
    disableAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
            console.log('⏰ Sauvegarde automatique désactivée');
        }
    }

    /**
     * Obtient les statistiques de fichier
     */
    getFileStats() {
        return {
            supportedFormats: this.supportedFormats,
            maxFileSize: this.maxFileSize,
            hasAutoSave: !!this.autoSaveInterval,
            dataSize: this.app.planningData.length,
            lastImport: this.lastImportDate || null
        };
    }

    /**
     * Log des statistiques d'import
     */
    logImportStats(file, data) {
        this.lastImportDate = new Date();
        
        const stats = {
            fileName: file.name,
            fileSize: file.size,
            importDate: this.lastImportDate,
            entriesCount: data.length,
            format: file.name.split('.').pop().toLowerCase()
        };
        
        console.log('📊 Stats import:', stats);
    }

    /**
     * Nettoie les ressources du gestionnaire
     */
    cleanup() {
        this.disableAutoSave();
        console.log('🧹 FileManager nettoyé');
    }
}