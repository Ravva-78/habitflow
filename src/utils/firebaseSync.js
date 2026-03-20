// src/utils/firebaseSync.js
// Firebase Firestore sync — backup and restore user data
// Setup: go to firebase.google.com → create project → add web app → paste config in firebase.js

import AsyncStorage from '@react-native-async-storage/async-storage';
import { format, subDays, eachDayOfInterval } from 'date-fns';

// Try to import Firebase — gracefully skip if not configured
let db = null;
let doc, setDoc, getDoc, collection, getDocs;
try {
  const firestore = require('firebase/firestore');
  const firebaseApp = require('../../firebase');
  if (firebaseApp.db) {
    db       = firebaseApp.db;
    doc      = firestore.doc;
    setDoc   = firestore.setDoc;
    getDoc   = firestore.getDoc;
    collection = firestore.collection;
    getDocs  = firestore.getDocs;
  }
} catch (e) {
  console.log('Firebase not configured — running in local-only mode');
}

export const isFirebaseReady = () => !!db;

/**
 * Backup all local data to Firestore
 * Call this: after habit completion, on app background, weekly
 */
export async function backupToFirebase(userId) {
  if (!db || !userId) return false;

  try {
    // Gather all local data
    const keys = await AsyncStorage.getAllKeys();
    const pairs = await AsyncStorage.multiGet(keys);
    const data  = Object.fromEntries(pairs.filter(([k, v]) => v !== null));

    await setDoc(doc(db, 'users', userId, 'backup', 'latest'), {
      data,
      updatedAt: new Date().toISOString(),
      version: '1.0.0',
    });

    console.log('✅ Backed up to Firebase');
    return true;
  } catch (e) {
    console.log('Firebase backup failed:', e.message);
    return false;
  }
}

/**
 * Restore data from Firestore to local AsyncStorage
 * Call this: on first login on new device
 */
export async function restoreFromFirebase(userId) {
  if (!db || !userId) return false;

  try {
    const snap = await getDoc(doc(db, 'users', userId, 'backup', 'latest'));
    if (!snap.exists()) return false;

    const { data } = snap.data();
    const pairs = Object.entries(data);
    await AsyncStorage.multiSet(pairs);

    console.log('✅ Restored from Firebase:', pairs.length, 'keys');
    return true;
  } catch (e) {
    console.log('Firebase restore failed:', e.message);
    return false;
  }
}

/**
 * Auto-sync: backup every time user completes a habit
 */
export async function autoSync(userId) {
  if (!db || !userId) return;
  // Debounce — only sync once per 5 minutes max
  const lastSync = await AsyncStorage.getItem('hf_last_sync');
  const now = Date.now();
  if (lastSync && now - parseInt(lastSync) < 5 * 60 * 1000) return;

  await backupToFirebase(userId);
  await AsyncStorage.setItem('hf_last_sync', now.toString());
}
