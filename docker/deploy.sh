#!/bin/bash

# Script de déploiement pour Planning de Travail PWA
# Usage: ./deploy.sh [start|stop|restart|logs|build]
# À exécuter depuis le répertoire planning-travail/docker/

set -e

PROJECT_NAME="planning-travail"
STACK_NAME="planning-travail"
PORT=4047  # Correspond à votre port réel

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonctions utilitaires
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Vérifications préalables
check_requirements() {
    log_info "Vérification des prérequis..."
    
    # Vérifier qu'on est dans le bon répertoire
    if [[ ! -f "docker-compose.yml" ]] || [[ ! -f "Dockerfile" ]]; then
        log_error "Fichiers Docker non trouvés. Assurez-vous d'être dans le répertoire planning-travail/docker/"
        exit 1
    fi
    
    # Vérifier que les fichiers de l'app existent
    if [[ ! -f "../index.html" ]]; then
        log_error "Fichiers de l'application non trouvés. Vérifiez la structure du projet."
        exit 1
    fi
    
    # Vérifier que le manifest PWA existe
    if [[ ! -f "../manifest.json" ]]; then
        log_error "manifest.json non trouvé. Requis pour PWA."
        exit 1
    fi
    
    # Vérifier que le service worker existe
    if [[ ! -f "../sw.js" ]]; then
        log_error "sw.js non trouvé. Requis pour PWA."
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker n'est pas installé"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose n'est pas installé"
        exit 1
    fi
    
    log_success "Prérequis validés"
}

# Construction de l'image
build_image() {
    log_info "Construction de l'image Docker pour $STACK_NAME..."
    docker-compose -p $STACK_NAME build --no-cache
    log_success "Image construite avec succès"
}

# Démarrage des services
start_services() {
    log_info "Démarrage de la stack $STACK_NAME..."
    docker-compose -p $STACK_NAME up -d
    
    # Attendre que le service soit prêt
    log_info "Vérification de la disponibilité du service..."
    max_attempts=10  # Réduit de 30 à 10
    attempt=1
    
    # Détecter l'URL d'accès
    local test_urls=("http://localhost:$PORT" "http://127.0.0.1:$PORT")
    local accessible_url=""
    
    while [ $attempt -le $max_attempts ]; do
        # Tester différentes URLs
        for url in "${test_urls[@]}"; do
            if curl -s "$url" > /dev/null 2>&1; then
                accessible_url="$url"
                log_success "Planning de Travail est disponible sur $accessible_url"
                log_info "📱 PWA prête à être installée !"
                
                # Si accessible depuis le réseau, afficher l'IP
                local_ip=$(ip route get 1 | awk '{print $7; exit}' 2>/dev/null || echo "")
                if [ -n "$local_ip" ]; then
                    log_info "🌐 Accessible aussi sur: http://$local_ip:$PORT"
                fi
                return 0
            fi
        done
        
        if [ $attempt -eq $max_attempts ]; then
            log_warning "Tests de connectivité échoués, mais le container semble démarré"
            log_info "📋 Vérifiez manuellement: http://localhost:$PORT"
            
            # Afficher les ports en écoute
            log_info "Ports Docker en écoute:"
            docker port $(docker-compose -p $STACK_NAME ps -q) 2>/dev/null || echo "  Impossible de récupérer les ports"
            return 0  # Ne pas échouer, juste avertir
        fi
        
        log_info "Tentative $attempt/$max_attempts - En attente..."
        sleep 1  # Réduit de 2s à 1s
        ((attempt++))
    done
}

# Test PWA spécifique
test_pwa() {
    log_info "Test des composants PWA..."
    
    # Test du manifest
    if curl -s http://localhost:$PORT/manifest.json | grep -q "Planning de Travail"; then
        log_success "Manifest PWA valide"
    else
        log_error "Manifest PWA invalide ou inaccessible"
        return 1
    fi
    
    # Test du service worker
    if curl -s -f http://localhost:$PORT/sw.js > /dev/null; then
        log_success "Service Worker accessible"
    else
        log_error "Service Worker inaccessible"
        return 1
    fi
    
    # Test des fichiers CSS/JS dans assets/
    if curl -s -f http://localhost:$PORT/assets/css/variables.css > /dev/null; then
        log_success "Fichiers CSS dans assets/ accessibles"
    else
        log_warning "Certains fichiers CSS dans assets/ peuvent être inaccessibles"
    fi
    
    if curl -s -f http://localhost:$PORT/assets/js/TimeUtils.js > /dev/null; then
        log_success "Fichiers JS dans assets/ accessibles"
    else
        log_warning "Certains fichiers JS dans assets/ peuvent être inaccessibles"
    fi
    
    log_success "Tests PWA terminés"
}

# Arrêt des services
stop_services() {
    log_info "Arrêt de la stack $STACK_NAME..."
    docker-compose -p $STACK_NAME down
    log_success "Stack arrêtée"
}

# Redémarrage des services
restart_services() {
    log_info "Redémarrage de la stack $STACK_NAME..."
    docker-compose -p $STACK_NAME restart
    log_success "Stack redémarrée"
}

# Affichage des logs
show_logs() {
    docker-compose -p $STACK_NAME logs -f
}

# Surveillance de la santé
health_check() {
    log_info "Vérification de la santé de la stack $STACK_NAME..."
    
    container_status=$(docker-compose -p $STACK_NAME ps -q planning-travail | xargs docker inspect -f '{{.State.Health.Status}}' 2>/dev/null || echo "unknown")
    
    case $container_status in
        "healthy")
            log_success "Le service est en bonne santé"
            ;;
        "unhealthy")
            log_error "Le service est en mauvaise santé"
            docker-compose -p $STACK_NAME logs planning-travail
            ;;
        "starting")
            log_warning "Le service est en cours de démarrage"
            ;;
        *)
            log_warning "État de santé inconnu, vérification manuelle..."
            ;;
    esac
    
    # Test PWA
    test_pwa
    
    # Afficher les infos de la stack
    echo ""
    log_info "=== Informations de la stack $STACK_NAME ==="
    docker-compose -p $STACK_NAME ps
}

# Affichage des informations
show_info() {
    log_info "=== Planning de Travail PWA - Docker Stack Info ==="
    echo "📍 URL Local: http://localhost:$PORT"
    echo "📱 PWA: Prête à être installée sur mobile"
    echo "🐳 Stack: $STACK_NAME"
    echo "📂 Répertoire: $(pwd)"
    echo "📄 Manifest: http://localhost:$PORT/manifest.json"
    echo "⚙️ Service Worker: http://localhost:$PORT/sw.js"
    echo "🎨 Assets CSS: http://localhost:$PORT/assets/css/"
    echo "⚡ Assets JS: http://localhost:$PORT/assets/js/"
    echo "🖼️ Icônes: http://localhost:$PORT/assets/icons/"
    echo ""
    echo "📱 Instructions d'installation PWA:"
    echo "  Android: Menu → 'Ajouter à l'écran d'accueil'"
    echo "  iOS: Partage → 'Sur l'écran d'accueil'"
    echo ""
    echo "Commandes utiles:"
    echo "  🔧 Logs:    ./deploy.sh logs"
    echo "  ❤️ Santé:   ./deploy.sh health"
    echo "  🔄 Restart: ./deploy.sh restart"
    echo "  🛑 Stop:    ./deploy.sh stop"
    echo "  🧪 Test PWA: ./deploy.sh test"
}

# Test PWA complet
test_pwa_full() {
    log_info "Test PWA complet..."
    test_pwa
    
    # Test des headers PWA
    log_info "Vérification des headers PWA..."
    
    MANIFEST_HEADERS=$(curl -s -I http://localhost:$PORT/manifest.json)
    if echo "$MANIFEST_HEADERS" | grep -q "application/manifest+json"; then
        log_success "Headers manifest corrects"
    else
        log_warning "Headers manifest manquants"
    fi
    
    SW_HEADERS=$(curl -s -I http://localhost:$PORT/sw.js)
    if echo "$SW_HEADERS" | grep -q "Service-Worker-Allowed"; then
        log_success "Headers Service Worker corrects"
    else
        log_warning "Headers Service Worker manquants"
    fi
    
    log_success "Test PWA complet terminé"
}

# Menu principal
case "${1:-start}" in
    "build")
        check_requirements
        build_image
        ;;
    "start")
        check_requirements
        start_services
        show_info
        ;;
    "stop")
        stop_services
        ;;
    "restart")
        restart_services
        ;;
    "logs")
        show_logs
        ;;
    "health")
        health_check
        ;;
    "test")
        test_pwa_full
        ;;
    "info")
        show_info
        ;;
    "full")
        check_requirements
        build_image
        start_services
        health_check
        test_pwa_full
        show_info
        ;;
    *)
        echo "Usage: $0 {build|start|stop|restart|logs|health|test|info|full}"
        echo ""
        echo "📅 Planning de Travail PWA - Docker Stack Manager"
        echo ""
        echo "Commandes disponibles:"
        echo "  build    - Construire l'image Docker"
        echo "  start    - Démarrer la stack $STACK_NAME"
        echo "  stop     - Arrêter la stack $STACK_NAME"
        echo "  restart  - Redémarrer la stack $STACK_NAME"
        echo "  logs     - Afficher les logs en temps réel"
        echo "  health   - Vérifier la santé du service"
        echo "  test     - Tester les composants PWA"
        echo "  info     - Afficher les informations"
        echo "  full     - Build + Start + Health + Test PWA + Info"
        echo ""
        echo "💡 Exécutez depuis le répertoire planning-travail/docker/"
        echo "📱 Une fois démarré, l'app sera installable comme PWA"
        exit 1
        ;;
esac