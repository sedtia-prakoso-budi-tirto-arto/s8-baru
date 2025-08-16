import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";
import {
  getAuth,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { getDatabase } from "firebase/database";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC5reP5sLTkka-og8YnzI95nR9oHZjvMGM",
  authDomain: "order-edit.firebaseapp.com",
  databaseURL:
    "https://order-edit-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "order-edit",
  storageBucket: "order-edit.firebasestorage.app",
  messagingSenderId: "603758574954",
  appId: "1:603758574954:web:cd10940a15da347acf7913",
  measurementId: "G-NRSFNBFBB2",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const storage = getStorage(app);
const db = getDatabase(app);

export {
  auth,
  provider,
  storage,
  signInWithPopup,
  signInWithEmailAndPassword,
  db,
};
