import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCwf2Z0tZSCxVmv0fNt3xC-0tSMjTmqdO8",
    authDomain: "sapientia-app-rtc.firebaseapp.com",
    databaseURL: "https://sapientia-app-rtc-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "sapientia-app-rtc",
    storageBucket: "sapientia-app-rtc.firebasestorage.app",
    messagingSenderId: "787603394068",
    appId: "1:787603394068:web:6600664367ff471ca9e101"
};

const app = initializeApp(firebaseConfig);
const firebaseDb = getDatabase(app);

export { app, firebaseDb };