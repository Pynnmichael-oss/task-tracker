// Firebase Cloud Messaging Service Worker
// Handles background push notifications only — no caching or asset serving.

importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyB_EmP-qufcH2ZAymdKK_qn_9B_nXjcgwc",
    authDomain: "michael-new-website.web.app",
    projectId: "michael-new-website",
    storageBucket: "michael-new-website.firebasestorage.app",
    messagingSenderId: "149129540182",
    appId: "1:149129540182:web:ea47a8eaa08181ecd6c1f7"
});

const messaging = firebase.messaging();

// Background message handler — fires when the app tab is not in the foreground
messaging.onBackgroundMessage((payload) => {
    const title = payload.notification?.title || 'TouchGrass 🌿';
    const body  = payload.notification?.body  || payload.data?.body || '';

    self.registration.showNotification(title, {
        body,
        icon: 'icons/icon-192.png',   // relative to SW scope — works on both GitHub Pages and Firebase Hosting
        badge: 'icons/icon-192.png',
        data: { click_action: self.registration.scope + 'index.html' }
    });
});

// Open (or focus) the app when the user taps the notification
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const url = event.notification.data?.click_action || self.registration.scope;
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // If a tab is already open, focus it
            for (const client of clientList) {
                if (client.url.startsWith(self.registration.scope) && 'focus' in client) {
                    return client.focus();
                }
            }
            // Otherwise open a new tab
            if (clients.openWindow) return clients.openWindow(url);
        })
    );
});
