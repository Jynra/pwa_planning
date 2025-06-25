/**
 * Service Worker pour Planning de Travail PWA
 * Gère la mise en cache et le fonctionnement hors ligne
 */

const CACHE_NAME = 'planning-travail-v1.0.0';
const CACHE_URLS = [
    '/',
    '/index.html',
    '/styles.css',
    '/script.js',
    '/manifest.json'
];

/**
 * Installation du Service Worker
 */
self.addEventListener('install', (event) => {
    console.log('Service Worker: Installation en cours...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Service Worker: Mise en cache des fichiers');
                return cache.addAll(CACHE_URLS);
            })
            .then(() => {
                console.log('Service Worker: Installation terminée');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('Service Worker: Erreur lors de l\'installation', error);
            })
    );
});

/**
 * Activation du Service Worker
 */
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activation en cours...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        // Supprimer les anciens caches
                        if (cacheName !== CACHE_NAME) {
                            console.log('Service Worker: Suppression de l\'ancien cache', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('Service Worker: Activation terminée');
                return self.clients.claim();
            })
            .catch((error) => {
                console.error('Service Worker: Erreur lors de l\'activation', error);
            })
    );
});

/**
 * Interception des requêtes (stratégie Cache First)
 */
self.addEventListener('fetch', (event) => {
    // Ignorer les requêtes non-GET
    if (event.request.method !== 'GET') {
        return;
    }

    // Ignorer les requêtes vers des domaines externes (sauf fonts/CDN)
    const url = new URL(event.request.url);
    if (url.origin !== location.origin && !url.hostname.includes('fonts.')) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                // Si trouvé dans le cache, le retourner
                if (cachedResponse) {
                    console.log('Service Worker: Fichier servi depuis le cache', event.request.url);
                    return cachedResponse;
                }

                // Sinon, récupérer depuis le réseau
                console.log('Service Worker: Récupération depuis le réseau', event.request.url);
                return fetch(event.request)
                    .then((networkResponse) => {
                        // Vérifier si la réponse est valide
                        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                            return networkResponse;
                        }

                        // Cloner la réponse car elle ne peut être consommée qu'une fois
                        const responseToCache = networkResponse.clone();

                        // Ajouter au cache pour les prochaines fois
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });

                        return networkResponse;
                    })
                    .catch(() => {
                        // En cas d'erreur réseau, retourner une page d'erreur basique
                        if (event.request.destination === 'document') {
                            return new Response(
                                `<!DOCTYPE html>
                                <html lang="fr">
                                <head>
                                    <meta charset="UTF-8">
                                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                                    <title>Hors ligne - Planning de Travail</title>
                                    <style>
                                        body {
                                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                                            background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
                                            min-height: 100vh;
                                            display: flex;
                                            align-items: center;
                                            justify-content: center;
                                            margin: 0;
                                            padding: 20px;
                                        }
                                        .offline-message {
                                            background: white;
                                            border-radius: 20px;
                                            padding: 40px;
                                            text-align: center;
                                            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                                            max-width: 400px;
                                        }
                                        .offline-icon {
                                            font-size: 4rem;
                                            margin-bottom: 20px;
                                        }
                                        h1 {
                                            color: #333;
                                            margin-bottom: 10px;
                                        }
                                        p {
                                            color: #666;
                                            margin-bottom: 20px;
                                        }
                                        .retry-btn {
                                            background: #64b5f6;
                                            color: white;
                                            border: none;
                                            padding: 12px 24px;
                                            border-radius: 25px;
                                            cursor: pointer;
                                            font-weight: 600;
                                        }
                                        .retry-btn:hover {
                                            background: #42a5f5;
                                        }
                                    </style>
                                </head>
                                <body>
                                    <div class="offline-message">
                                        <div class="offline-icon">📡</div>
                                        <h1>Mode hors ligne</h1>
                                        <p>Vous êtes actuellement hors ligne. Vos données sauvegardées restent disponibles.</p>
                                        <button class="retry-btn" onclick="window.location.reload()">
                                            Réessayer
                                        </button>
                                    </div>
                                </body>
                                </html>`,
                                {
                                    headers: {
                                        'Content-Type': 'text/html; charset=utf-8'
                                    }
                                }
                            );
                        }
                    });
            })
    );
});

/**
 * Gestion des messages depuis l'application principale
 */
self.addEventListener('message', (event) => {
    console.log('Service Worker: Message reçu', event.data);
    
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'GET_VERSION') {
        event.ports[0].postMessage({
            version: CACHE_NAME
        });
    }
});

/**
 * Gestion de la synchronisation en arrière-plan (si supportée)
 */
self.addEventListener('sync', (event) => {
    console.log('Service Worker: Synchronisation en arrière-plan', event.tag);
    
    if (event.tag === 'background-sync') {
        event.waitUntil(
            // Ici on pourrait synchroniser les données avec un serveur
            console.log('Service Worker: Synchronisation des données...')
        );
    }
});

/**
 * Gestion des notifications push (si supportées)
 */
self.addEventListener('push', (event) => {
    console.log('Service Worker: Notification push reçue', event.data);
    
    const options = {
        body: event.data ? event.data.text() : 'Nouveau planning disponible',
        icon: '/manifest-icon-192.png',
        badge: '/manifest-icon-96.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: 'Voir le planning',
                icon: '/manifest-icon-96.png'
            },
            {
                action: 'close',
                title: 'Fermer',
                icon: '/manifest-icon-96.png'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('Planning de Travail', options)
    );
});

/**
 * Gestion des clics sur les notifications
 */
self.addEventListener('notificationclick', (event) => {
    console.log('Service Worker: Clic sur notification', event.notification.tag, event.action);
    
    event.notification.close();
    
    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

/**
 * Nettoyage périodique du cache
 */
self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'cache-cleanup') {
        event.waitUntil(
            cleanupCache()
        );
    }
});

/**
 * Fonction utilitaire pour nettoyer le cache
 */
function cleanupCache() {
    return caches.open(CACHE_NAME)
        .then((cache) => {
            return cache.keys()
                .then((requests) => {
                    // Supprimer les entrées anciennes (plus de 7 jours)
                    const now = Date.now();
                    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 jours
                    
                    const deletePromises = requests
                        .filter((request) => {
                            // Logique de nettoyage personnalisée
                            return false; // Pour l'instant, ne pas supprimer automatiquement
                        })
                        .map((request) => cache.delete(request));
                    
                    return Promise.all(deletePromises);
                });
        })
        .then(() => {
            console.log('Service Worker: Nettoyage du cache terminé');
        });
}