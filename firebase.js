// Replace these values with your Firebase project config
// Firebase Console → Project Settings → Your Apps → Web App

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDIz0Tj6BNy9XaxNTSS8miuvkfNV2xnHbE",
  authDomain: "habitflow-62ab0.firebaseapp.com",
  projectId: "habitflow-62ab0",
  storageBucket: "habitflow-62ab0.firebasestorage.app",
  messagingSenderId: "118159026010",
  appId: "1:118159026010:web:05a9bc684885e54bf9b563",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export default app;
