import 'dotenv/config';

export default {
    expo: {
        name: "cofrin-app",
        slug: "cofrin-app",
        version: "1.0.0",
        orientation: "portrait",
        icon: "./assets/icon.png",
        userInterfaceStyle: "light",
        newArchEnabled: true,
        splash: {
            image: "./assets/splash-icon.png",
            resizeMode: "contain",
            backgroundColor: "#ffffff"
        },
        ios: {
            supportsTablet: true
        },
        android: {
            adaptiveIcon: {
                foregroundImage: "./assets/adaptive-icon.png",
                backgroundColor: "#ffffff"
            },
            edgeToEdgeEnabled: true
        },
        web: {
            favicon: "./assets/favicon.png"
        },
        extra: {
            firebaseApiKey: process.env.FIREBASE_API_KEY || "your_api_key_here",
            firebaseAuthDomain: process.env.FIREBASE_AUTH_DOMAIN || "your_project.firebaseapp.com",
            firebaseProjectId: process.env.FIREBASE_PROJECT_ID || "your_project_id",
            firebaseStorageBucket: process.env.FIREBASE_STORAGE_BUCKET || "your_project.firebasestorage.app",
            firebaseMessagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "your_messaging_sender_id",
            firebaseAppId: process.env.FIREBASE_APP_ID || "your_app_id",
            firebaseMeasurementId: process.env.FIREBASE_MEASUREMENT_ID || "your_measurement_id"
        }
    }
};
