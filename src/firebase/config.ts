// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA1UNQ7L-tLWgrzWvCp2eTtOdsYKvcEvQY",
  authDomain: "keepwork-56aa8.firebaseapp.com",
  projectId: "keepwork-56aa8",
  storageBucket: "keepwork-56aa8.appspot.com", // Corrected from .firebasestorage.app
  messagingSenderId: "771175476052",
  appId: "1:771175476052:web:43d76febcd350cc120f6c1",
  measurementId: "G-03GMEKNKYH"
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
