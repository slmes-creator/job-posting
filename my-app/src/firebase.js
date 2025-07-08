import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyCbA7IMrDwE6XUlvqezw8xXcw9xqjGyppc",
    authDomain: "job-posting-b2410.firebaseapp.com",
    projectId: "job-posting-b2410",
    storageBucket: "job-posting-b2410.firebasestorage.app",
    messagingSenderId: "959519805590",
    appId: "1:959519805590:web:4d325d5fc2af11a837b2b7",
    measurementId: "G-HF116RBLCT"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
