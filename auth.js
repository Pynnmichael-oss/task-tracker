// Firebase Auth Configuration
const firebaseConfig = {
    apiKey: "AIzaSyB_EmP-qufcH2ZAymdKK_qn_9B_nXjcgwc",
    authDomain: "michael-new-website.firebaseapp.com",
    projectId: "michael-new-website",
    storageBucket: "michael-new-website.firebasestorage.app",
    messagingSenderId: "149129540182",
    appId: "1:149129540182:web:ea47a8eaa08181ecd6c1f7",
    measurementId: "G-8R2FKQ3XMN"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

const ADMIN_EMAIL = 'mpynn15@gmail.com';

let currentUser = null;
let userProfile = null;
let isAdmin = false;

// Which page are we on?
const PATH = window.location.pathname;
const ON_LANDING = PATH.includes('landing.html');
const ON_SETUP   = PATH.includes('profile-setup.html');
const ON_APP     = !ON_LANDING && !ON_SETUP;

// ── Auth State ──────────────────────────────────────────────
auth.onAuthStateChanged(async (user) => {
    currentUser = user;

    if (!user) {
        userProfile = null;
        if (ON_APP) {
            window.location.href = '/task-tracker/landing.html';
        } else {
            updateUIForAuthState();
        }
        return;
    }

    isAdmin = user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

    try {
        const profileDoc = await db.collection('users').doc(user.uid)
            .collection('profile').doc('info').get();

        if (profileDoc.exists) {
            userProfile = profileDoc.data();
            if (ON_LANDING || (ON_SETUP && !window._savingProfile)) {
                window.location.href = '/task-tracker/index.html';
                return;
            }
            updateUIForAuthState();
        } else {
            userProfile = null;
            if (!ON_SETUP) {
                window.location.href = '/task-tracker/profile-setup.html';
                return;
            }
            updateUIForAuthState();
        }
    } catch (error) {
        console.error('Error loading profile:', error);
        updateUIForAuthState();
    }
});

// ── Sign In ──────────────────────────────────────────────────
async function signInWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
        await auth.signInWithRedirect(provider);
    } catch (error) {
        console.error('Sign in error:', error);
        alert('Sign in failed. Please try again.');
    }
}

// Handle redirect result on landing page only
if (ON_LANDING) {
    auth.getRedirectResult().catch((error) => {
        if (error.code && error.code !== 'auth/no-auth-event') {
            console.error('Redirect result error:', error);
        }
    });
}

// ── Sign Out ─────────────────────────────────────────────────
async function signOut() {
    try {
        await auth.signOut();
        window.location.href = '/task-tracker/landing.html';
    } catch (error) {
        console.error('Sign out error:', error);
    }
}

// ── Update UI ────────────────────────────────────────────────
function updateUIForAuthState() {
    const authBtn = document.getElementById('authButton');
    if (authBtn) {
        if (currentUser && userProfile) {
            authBtn.innerHTML = `
                <div style="display:flex;align-items:center;gap:12px;">
                    <a href="/task-tracker/profile.html?user=${currentUser.uid}" style="display:flex;align-items:center;gap:8px;text-decoration:none;color:#1a1a1a;">
                        <img src="${userProfile.photoURL}" style="width:32px;height:32px;border-radius:50%;object-fit:cover;border:2px solid #3d9c2f;">
                        <span style="font-weight:600;">${userProfile.displayName}</span>
                    </a>
                    <button onclick="signOut()" style="padding:8px 16px;background:#dc3545;color:white;border:none;border-radius:6px;cursor:pointer;font-weight:600;">Sign Out</button>
                </div>`;
        } else if (currentUser && !userProfile) {
            authBtn.innerHTML = `<button onclick="signOut()" style="padding:8px 16px;background:#dc3545;color:white;border:none;border-radius:6px;cursor:pointer;font-weight:600;">Sign Out</button>`;
        } else {
            authBtn.innerHTML = `<button onclick="signInWithGoogle()" style="padding:8px 16px;background:#3d9c2f;color:white;border:none;border-radius:6px;cursor:pointer;font-weight:600;">Sign In</button>`;
        }
    }

    document.querySelectorAll('.logged-in-only').forEach(el => {
        el.style.display = currentUser && userProfile ? 'block' : 'none';
    });
    document.querySelectorAll('.logged-in-only-inline').forEach(el => {
        el.style.display = currentUser && userProfile ? 'inline-block' : 'none';
    });
    document.querySelectorAll('.admin-only').forEach(el => {
        el.style.display = isAdmin ? 'block' : 'none';
    });
    document.querySelectorAll('.admin-only-inline').forEach(el => {
        el.style.display = isAdmin ? 'inline-block' : 'none';
    });
}

// ── Helpers ──────────────────────────────────────────────────
function requireAdmin(callback) {
    if (!isAdmin) { alert('Admin only.'); return false; }
    return callback();
}
function getCurrentUserId() { return currentUser ? currentUser.uid : null; }
function getUserProfile()    { return userProfile; }

window.auth             = auth;
window.db               = db;
window.storage          = storage;
window.currentUser      = () => currentUser;
window.userProfile      = () => userProfile;
window.isAdmin          = () => isAdmin;
window.signInWithGoogle = signInWithGoogle;
window.signOut          = signOut;
window.requireAdmin     = requireAdmin;
window.getCurrentUserId = getCurrentUserId;
window.getUserProfile   = getUserProfile;
