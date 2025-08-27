import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyDGJeDRwSoMYgY-qr4ssIs407ovrwzFS5c",
    authDomain: "csia-cellclassification.firebaseapp.com",
    projectId: "csia-cellclassification",
    storageBucket: "csia-cellclassification.firebasestorage.app",
    messagingSenderId: "805007875315",
    appId: "1:805007875315:web:6a8d1fe175a2871e3aab86",
    measurementId: "G-CCG8CWQYXP"
  };

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);