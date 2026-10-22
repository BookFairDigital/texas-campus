
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAfzJkmwd5j0EFkabGhUF5bJa3vopxz7uc",
  authDomain: "texas-campus-lms.firebaseapp.com",
  projectId: "texas-campus-lms",
  storageBucket: "texas-campus-lms.firebasestorage.app",
  messagingSenderId: "825467860399",
  appId: "1:825467860399:web:525dccb0c3bdb8fab36b5a"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
