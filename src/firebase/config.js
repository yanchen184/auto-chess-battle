// Firebase configuration
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import { getAuth } from 'firebase/auth';

// We'll use a demo configuration for now
// Replace with your actual Firebase config in production
const firebaseConfig = {
  apiKey: "AIzaSyDemoApiKey123456789",
  authDomain: "demo-project.firebaseapp.com",
  projectId: "demo-project",
  storageBucket: "demo-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef1234567890",
  databaseURL: "https://demo-project-default-rtdb.firebaseio.com"
};

// Initialize Firebase or use a mock if in GitHub Pages environment
let app, db, realtimeDb, auth;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  realtimeDb = getDatabase(app);
  auth = getAuth(app);
} catch (error) {
  console.log('Using mock Firebase for demo purposes');
  // Mock objects for GitHub Pages demo
  app = {};
  db = {
    collection: () => ({
      doc: () => ({
        set: () => Promise.resolve(),
        get: () => Promise.resolve({ exists: () => false, data: () => ({}) }),
        update: () => Promise.resolve()
      }),
      where: () => ({
        get: () => Promise.resolve({ docs: [] })
      })
    })
  };
  realtimeDb = {
    ref: () => ({
      set: () => Promise.resolve(),
      update: () => Promise.resolve(),
      on: () => {}
    })
  };
  auth = {
    onAuthStateChanged: () => {}
  };
}

export { db, realtimeDb, auth };
export default app;