// Firebase Client Configuration
// Dynamically reads window.FIREBASE_CONFIG or uses project credentials.

const firebaseConfig = window.FIREBASE_CONFIG || {
    apiKey: "AIzaSyAb0kOjPhGelRXDrsLnbFXz_ki_o9N1SiY",
    authDomain: "gen-lang-client-0841297089.firebaseapp.com",
    projectId: "gen-lang-client-0841297089",
    storageBucket: "gen-lang-client-0841297089.firebasestorage.app",
    messagingSenderId: "677530285941",
    appId: "1:677530285941:web:fbaeebbe2acb59c391053c",
    measurementId: "G-5K066XY3MY"
};

const isPlaceholder = (v) => !v || v.startsWith('YOUR_');

// Initialize Firebase if credentials exist and are not placeholders
if (!isPlaceholder(firebaseConfig.apiKey) && typeof firebase !== 'undefined' && !firebase.apps.length) {
    try {
        firebase.initializeApp(firebaseConfig);
    } catch (e) {
        console.error("Firebase initializeApp error:", e);
    }
}

let auth = null;

try {
    if (typeof firebase !== 'undefined' && firebase.auth && !isPlaceholder(firebaseConfig.apiKey)) {
        auth = firebase.auth();
    }
} catch (e) {
    console.warn("Firebase Auth initialization error:", e);
}
