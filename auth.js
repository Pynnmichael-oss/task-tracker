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

// Initialize Firebase (only if not already initialized)
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Authorized admin email
const ADMIN_EMAIL = 'mpynn15@gmail.com';

// Current user state
let currentUser = null;
let isAdmin = false;

// Auth state listener
auth.onAuthStateChanged((user) => {
    currentUser = user;
    isAdmin = user && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
    
    updateUIForAuthState();
});

// Sign in with Google
async function signInWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
        await auth.signInWithPopup(provider);
    } catch (error) {
        console.error('Sign in error:', error);
        alert('Sign in failed. Please try again.');
    }
}

// Sign out
async function signOut() {
    try {
        await auth.signOut();
    } catch (error) {
        console.error('Sign out error:', error);
    }
}

// Update UI based on auth state
function updateUIForAuthState() {
    // Update auth button
    const authBtn = document.getElementById('authButton');
    if (authBtn) {
        if (currentUser) {
            authBtn.innerHTML = `
                <span style="margin-right: 8px;">👋 ${currentUser.displayName || currentUser.email}</span>
                <button onclick="signOut()" style="padding: 8px 16px; background: #dc3545; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">Sign Out</button>
            `;
        } else {
            authBtn.innerHTML = `
                <button onclick="signInWithGoogle()" style="padding: 8px 16px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">Sign In</button>
            `;
        }
    }

    // Show/hide admin controls
    const adminControls = document.querySelectorAll('.admin-only');
    adminControls.forEach(control => {
        control.style.display = isAdmin ? 'block' : 'none';
    });

    const adminInline = document.querySelectorAll('.admin-only-inline');
    adminInline.forEach(control => {
        control.style.display = isAdmin ? 'inline-block' : 'none';
    });

    const adminFlex = document.querySelectorAll('.admin-only-flex');
    adminFlex.forEach(control => {
        control.style.display = isAdmin ? 'flex' : 'none';
    });
}

// Check if user is admin
function requireAdmin(callback) {
    if (!isAdmin) {
        alert('You must be signed in as an admin to perform this action.');
        return false;
    }
    return callback();
}

// Export for use in other scripts
window.auth = auth;
window.db = db;
window.storage = storage;
window.currentUser = () => currentUser;
window.isAdmin = () => isAdmin;
window.signInWithGoogle = signInWithGoogle;
window.signOut = signOut;
window.requireAdmin = requireAdmin;
