import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDRdz5-luRxa5Tv4etYLCNXmTe9Sj7EJwM",
  authDomain: "my-expense-app-1befb.firebaseapp.com",
  projectId: "my-expense-app-1befb",
  storageBucket: "my-expense-app-1befb.firebasestorage.app",
  messagingSenderId: "749285861910",
  appId: "1:749285861910:web:e9efaad82c5aa830866337"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

// Enable offline persistence
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code == 'failed-precondition') {
    console.warn("Multiple tabs open, persistence can only be enabled in one tab at a time.");
  } else if (err.code == 'unimplemented') {
    console.warn("The current browser doesn't support all of the features required to enable persistence.");
  }
});

export const storage = getStorage(app);

