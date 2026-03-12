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

const PATH = window.location.pathname;
const ON_LANDING = PATH.includes('landing.html');
const ON_SETUP   = PATH.includes('profile-setup.html');
const ON_APP     = !ON_LANDING && !ON_SETUP;

auth.onAuthStateChanged(async (user) => {
    currentUser = user;

    if (!user) {
        userProfile = null;
        if (ON_APP) {
            window.location.href = 'landing.html';
        } else {
            updateUIForAuthState();
        }
        return;
    }

    isAdmin = user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

    if (ON_SETUP) {
        updateUIForAuthState();
        return;
    }

    try {
        const profileDoc = await db.collection('users').doc(user.uid)
            .collection('profile').doc('info').get();

        if (profileDoc.exists) {
            userProfile = profileDoc.data();
            if (ON_LANDING) {
                window.location.href = 'index.html';
                return;
            }
            updateUIForAuthState();
        } else {
            // FIX 1: New users on landing page must be redirected to profile-setup.
            // Previously ON_LANDING fell through to updateUIForAuthState() and got stuck.
            userProfile = null;
            if (ON_LANDING || ON_APP) {
                window.location.href = 'profile-setup.html';
            } else {
                updateUIForAuthState();
            }
        }
    } catch (error) {
        console.error('Error loading profile:', error);
        updateUIForAuthState();
    }
});

async function signInWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
        await auth.signInWithPopup(provider);
    } catch (error) {
        // Mobile browsers (Safari, in-app browsers) can't maintain popup state
        // Fall back to redirect in those cases
        if (
            error.code === 'auth/missing-initial-state' ||
            error.code === 'auth/redirect-cancelled-by-user' ||
            error.code === 'auth/web-storage-unsupported' ||
            error.message?.includes('missing initial state')
        ) {
            try {
                await auth.signInWithRedirect(provider);
            } catch (redirectError) {
                console.error('Redirect fallback failed:', redirectError);
                throw redirectError; // FIX 3: let caller show styled error UI
            }
        } else {
            console.error('Sign in error:', error);
            throw error; // FIX 3: re-throw so landing.html shows #errorMsg instead of raw alert()
        }
    }
}

// FIX 2: Handle redirect result properly on page load (for mobile fallback).
// Previously the result was never handled, causing mobile users to appear logged
// out momentarily after returning from the Google redirect.
if (ON_LANDING) {
    auth.getRedirectResult().then((result) => {
        if (result && result.user) {
            // onAuthStateChanged will fire and handle routing automatically
            console.log('Redirect sign-in successful:', result.user.email);
        }
    }).catch((error) => {
        if (error.code && error.code !== 'auth/no-auth-event') {
            console.error('Redirect result error:', error);
            const errorMsg = document.getElementById('errorMsg');
            if (errorMsg) {
                errorMsg.textContent = 'Sign in failed. Please try again.';
                errorMsg.style.display = 'block';
            }
        }
    });
}

async function signOut() {
    try {
        await auth.signOut();
        window.location.href = 'landing.html';
    } catch (error) {
        console.error('Sign out error:', error);
    }
}


function updateUIForAuthState() {
    const authBtn = document.getElementById('authButton');
    if (authBtn) {
        if (currentUser && userProfile) {
            authBtn.innerHTML = `
                <div style="display:flex;align-items:center;gap:12px;">
                    <a href="profile.html?user=${currentUser.uid}" style="display:flex;align-items:center;gap:8px;text-decoration:none;color:#1a1a1a;">
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

function requireAdmin(callback) {
    if (!isAdmin) { showToast('Admin only.', 'error'); return false; }
    return callback();
}

function showToast(message, type = 'info', duration = 3000) {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

function showConfirm(message, onConfirm, danger = false) {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'display:flex;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);z-index:9998;align-items:center;justify-content:center;';
    const box = document.createElement('div');
    box.style.cssText = 'background:white;border-radius:16px;padding:32px;max-width:380px;width:90%;';
    const msg = document.createElement('p');
    msg.style.cssText = 'font-size:17px;font-weight:600;color:#1a1a1a;margin-bottom:24px;line-height:1.4;';
    msg.textContent = message;
    const actions = document.createElement('div');
    actions.style.cssText = 'display:flex;gap:12px;';
    const confirmBtn = document.createElement('button');
    confirmBtn.textContent = 'Confirm';
    confirmBtn.style.cssText = `flex:1;padding:12px;background:${danger ? '#dc3545' : '#3d9c2f'};color:white;border:none;border-radius:8px;cursor:pointer;font-weight:600;font-size:15px;font-family:inherit;`;
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.style.cssText = 'flex:1;padding:12px;background:#f0f0f0;color:#1a1a1a;border:none;border-radius:8px;cursor:pointer;font-weight:600;font-size:15px;font-family:inherit;';
    actions.appendChild(confirmBtn);
    actions.appendChild(cancelBtn);
    box.appendChild(msg);
    box.appendChild(actions);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    confirmBtn.addEventListener('click', () => { overlay.remove(); onConfirm(); });
    cancelBtn.addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
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
window.showToast        = showToast;
window.showConfirm      = showConfirm;
