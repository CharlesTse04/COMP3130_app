
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database"; 
import { getAuth } from "firebase/auth";



const firebaseConfig = {
  apiKey: "AIzaSyA5Ysby_QqXW2l3cAP5xeOdhCJUsDdtdbs",
  authDomain: "moblie-ec4d3.firebaseapp.com",
  databaseURL: "https://moblie-ec4d3-default-rtdb.firebaseio.com", 
  projectId: "moblie-ec4d3",
  storageBucket: "moblie-ec4d3.firebasestorage.app",
  messagingSenderId: "101456546690",
  appId: "1:101456546690:web:adb7c42990e219ad765d9b",
  measurementId: "G-80JRLZWGFJ"
};


export const FIREBASE_APP = initializeApp(firebaseConfig);


export const REALTIME_DB = getDatabase(FIREBASE_APP);


export const FIREBASE_AUTH = getAuth(FIREBASE_APP);

console.log('Firebase initialized successfully');
console.log('Database URL:', firebaseConfig.databaseURL);