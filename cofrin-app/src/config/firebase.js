// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import Constants from 'expo-constants';

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: Constants.expoConfig?.extra?.firebaseApiKey || "AIzaSyB9JT13NkP8AExnxtwLkJ-T1Ncl-Mmer0M",
    authDomain: Constants.expoConfig?.extra?.firebaseAuthDomain || "cofrin-940ab.firebaseapp.com",
    projectId: Constants.expoConfig?.extra?.firebaseProjectId || "cofrin-940ab",
    storageBucket: Constants.expoConfig?.extra?.firebaseStorageBucket || "cofrin-940ab.firebasestorage.app",
    messagingSenderId: Constants.expoConfig?.extra?.firebaseMessagingSenderId || "342873178619",
    appId: Constants.expoConfig?.extra?.firebaseAppId || "1:342873178619:web:1e45b26f91a7bca8a6cb5e",
    measurementId: Constants.expoConfig?.extra?.firebaseMeasurementId || "G-6H0CMWGWKD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;