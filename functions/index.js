const functions = require('firebase-functions');
const admin     = require('firebase-admin');

admin.initializeApp();

/**
 * Triggers when a new notification document is created for any user.
 * Reads the FCM token stored on their profile and sends a push notification.
 */
exports.sendPushOnNewNotification = functions.firestore
    .document('users/{uid}/notifications/{notifId}')
    .onCreate(async (snap, context) => {
        const uid   = context.params.uid;
        const notif = snap.data();

        // Get the user's FCM token (stored on their profile/info doc)
        let token;
        try {
            const profileDoc = await admin.firestore()
                .collection('users').doc(uid)
                .collection('profile').doc('info')
                .get();
            token = profileDoc.data()?.fcmToken;
        } catch (e) {
            console.warn(`Could not read profile for uid ${uid}:`, e);
            return null;
        }

        if (!token) {
            console.log(`No FCM token for uid ${uid} — skipping push`);
            return null;
        }

        const message = {
            token,
            notification: {
                title: 'TouchGrass 🌿',
                body:  notif.message || 'You have a new notification'
            },
            webpush: {
                notification: {
                    icon:  '/task-tracker/icons/icon-192.png',
                    badge: '/task-tracker/icons/icon-192.png'
                },
                fcm_options: {
                    // Full URL so the browser knows where to navigate on click.
                    // Update this to your Firebase Hosting URL if you switch deployments.
                    link: 'https://pynnmichael-oss.github.io/task-tracker/index.html'
                }
            }
        };

        try {
            await admin.messaging().send(message);
            console.log(`Push sent to uid ${uid}`);
        } catch (error) {
            if (
                error.code === 'messaging/invalid-registration-token' ||
                error.code === 'messaging/registration-token-not-registered'
            ) {
                // Stale token — remove it so we don't keep trying
                console.log(`Removing stale FCM token for uid ${uid}`);
                await admin.firestore()
                    .collection('users').doc(uid)
                    .collection('profile').doc('info')
                    .update({ fcmToken: admin.firestore.FieldValue.delete() });
            } else {
                console.error(`FCM send error for uid ${uid}:`, error);
            }
        }

        return null;
    });
