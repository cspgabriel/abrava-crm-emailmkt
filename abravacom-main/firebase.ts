import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: (import.meta as any).env?.VITE_FIREBASE_API_KEY || "AIzaSyAjsurNMA4OxzpuZ8EfXvAmXGN-TqkT9H8",
  authDomain: (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN || "finance8-96cb0.firebaseapp.com",
  projectId: (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID || "finance8-96cb0",
  storageBucket: (import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET || "finance8-96cb0.firebasestorage.app",
  messagingSenderId: (import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID || "589745239376",
  appId: (import.meta as any).env?.VITE_FIREBASE_APP_ID || "1:589745239376:web:efd94d2a73e42506aa2855",
  measurementId: (import.meta as any).env?.VITE_FIREBASE_MEASUREMENT_ID || "G-X002F9FBGW"
};

// Initialize Firebase (guard to avoid double initialization)
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
let db;
try {
  db = getFirestore(app);
} catch (err) {
  console.error('Error initializing Firestore:', err);
  db = null;
}
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { db, auth, googleProvider };
