// Firebase configuration
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import { getAuth } from 'firebase/auth';

// Firebase 配置信息
const firebaseConfig = {
  apiKey: "AIzaSyBnZK-a8tTKuM-4F-23ZISaf1tlftfRHaA",
  authDomain: "j70717-3800e.firebaseapp.com",
  databaseURL: "https://j70717-3800e.firebaseio.com",
  projectId: "j70717-3800e",
  storageBucket: "j70717-3800e.firebasestorage.app",
  messagingSenderId: "1069494517672",
  appId: "1:1069494517672:web:1234567890abcdef" // 注意：這是一個預設值，因為web appId不在google-services.json中
};

// 初始化 Firebase
let app, db, realtimeDb, auth;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  realtimeDb = getDatabase(app);
  auth = getAuth(app);
  console.log('Firebase 初始化成功');
} catch (error) {
  console.error('Firebase 初始化失敗:', error);
  
  // 提供一個降級處理，在初始化失敗時使用模擬對象
  console.log('使用模擬 Firebase 數據');
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
      on: () => {},
      once: () => Promise.resolve({ val: () => null })
    })
  };
  auth = {
    onAuthStateChanged: () => {},
    signInAnonymously: () => Promise.resolve({ user: { uid: 'anonymous-user' } })
  };
}

export { db, realtimeDb, auth };
export default app;
