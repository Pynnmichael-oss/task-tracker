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

// Admin email
const ADMIN_EMAIL = 'mpynn15@gmail.com';

// Current user state
let currentUser = null;
let userProfile = null;
let isAdmin = false;

// Auth state listener
auth.onAuthStateChanged(async (user) => {
    currentUser = user;
    
    if (user) {
        isAdmin = user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
        
        // Load user profile
        try {
            const profileDoc = await db.collection('users').doc(user.uid).collection('profile').doc('info').get();
            
            if (profileDoc.exists) {
                userProfile = profileDoc.data();
                updateUIForAuthState();
            } else {
                // No profile - redirect to setup unless already on setup page
                if (!window.location.pathname.includes('profile-setup.html')) {
                    window.location.href = 'profile-setup.html';
                }
            }
        } catch (error) {
            console.error('Error loading profile:', error);
        }
    } else {
        userProfile = null;
        updateUIForAuthState();
    }
});

// Sign in with Google
async function signInWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
        const result = await auth.signInWithPopup(provider);
        const user = result.user;
        
        // Check if profile exists
        const profileDoc = await db.collection('users').doc(user.uid).collection('profile').doc('info').get();
        
        if (!profileDoc.exists) {
            // New user - redirect to profile setup
            window.location.href = 'profile-setup.html';
        }
    } catch (error) {
        console.error('Sign in error:', error);
        alert('Sign in failed. Please try again.');
    }
}

// Sign out
async function signOut() {
    try {
        await auth.signOut();
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Sign out error:', error);
    }
}

// Update UI based on auth state
function updateUIForAuthState() {
    // Update auth button
    const authBtn = document.getElementById('authButton');
    if (authBtn) {
        if (currentUser && userProfile) {
            authBtn.innerHTML = `
                <div style="display: flex; align-items: center; gap: 12px;">
                    <a href="profile.html?user=${currentUser.uid}" style="display: flex; align-items: center; gap: 8px; text-decoration: none; color: #1a1a1a;">
                        <img src="${userProfile.photoURL}" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover; border: 2px solid #667eea;">
                        <span style="font-weight: 600;">${userProfile.displayName}</span>
                    </a>
                    <button onclick="signOut()" style="padding: 8px 16px; background: #dc3545; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">Sign Out</button>
                </div>
            `;
        } else if (currentUser && !userProfile) {
            authBtn.innerHTML = `
                <button onclick="signOut()" style="padding: 8px 16px; background: #dc3545; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">Sign Out</button>
            `;
        } else {
            authBtn.innerHTML = `
                <button onclick="signInWithGoogle()" style="padding: 8px 16px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">Sign In</button>
            `;
        }
    }

    // Show/hide logged-in content
    const loggedInContent = document.querySelectorAll('.logged-in-only');
    loggedInContent.forEach(el => {
        el.style.display = currentUser && userProfile ? 'block' : 'none';
    });

    const loggedInInline = document.querySelectorAll('.logged-in-only-inline');
    loggedInInline.forEach(el => {
        el.style.display = currentUser && userProfile ? 'inline-block' : 'none';
    });

    // Show/hide admin controls
    const adminControls = document.querySelectorAll('.admin-only');
    adminControls.forEach(control => {
        control.style.display = isAdmin ? 'block' : 'none';
    });

    const adminInline = document.querySelectorAll('.admin-only-inline');
    adminInline.forEach(control => {
        control.style.display = isAdmin ? 'inline-block' : 'none';
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

// Get current user ID
function getCurrentUserId() {
    return currentUser ? currentUser.uid : null;
}

// Get user profile
function getUserProfile() {
    return userProfile;
}

// Export for use in other scripts
window.auth = auth;
window.db = db;
window.storage = storage;
window.currentUser = () => currentUser;
window.userProfile = () => userProfile;
window.isAdmin = () => isAdmin;
window.signInWithGoogle = signInWithGoogle;
window.signOut = signOut;
window.requireAdmin = requireAdmin;
window.getCurrentUserId = getCurrentUserId;
window.getUserProfile = getUserProfile;
