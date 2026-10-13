// FIREBASE CONFIGURATION
// ============================================


import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

const firebaseConfig = {
 apiKey: "AIzaSyBUZBnbgKazLF2KnrW4waecfLgchvEGR9o",
  authDomain: "crumble-and-creame.firebaseapp.com",
  projectId: "crumble-and-creame",
  storageBucket: "crumble-and-creame.firebasestorage.app",
  messagingSenderId: "389510974834",
  appId: "1:389510974834:web:cc8948ba997d41cd0961eb"
};

// Initialize Firebase — every other JS file imports these three
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);