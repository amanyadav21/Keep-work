
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAoi7YVpVJcDuqAl20K5w7wp9fUePNh-vg",
  authDomain: "taskwise-student.firebaseapp.com",
  projectId: "taskwise-student",
  storageBucket: "taskwise-student.firebasestorage.app",
  messagingSenderId: "161828988974",
  appId: "1:161828988974:web:ed4462923d2026a02257bf"
};

// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };

