// ========== KONFIGURASI FIREBASE ==========
// GANTI DENGAN DATA DARI FIREBASE PROJECT ANDA!

const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Inisialisasi Firebase (akan diisi setelah Anda buat project Firebase)
// Untuk sementara, kita pakai LocalStorage dulu sebagai fallback
let db = null;
let isFirebaseReady = false;

// Coba inisialisasi Firebase jika konfigurasi sudah diisi
if (firebaseConfig.apiKey !== "YOUR_API_KEY") {
    try {
        // Firebase SDK akan di-load di index.html
        if (typeof firebase !== 'undefined' && firebase.apps.length === 0) {
            firebase.initializeApp(firebaseConfig);
            db = firebase.firestore();
            isFirebaseReady = true;
            console.log("✅ Firebase connected!");
        }
    } catch(e) {
        console.log("⚠️ Firebase not configured, using LocalStorage");
        isFirebaseReady = false;
    }
} else {
    console.log("⚠️ Firebase config not set, using LocalStorage fallback");
}