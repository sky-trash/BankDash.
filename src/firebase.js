import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyDK_KoCHR8tm_MXd0K88hYzdQslA5fGpCU",
  authDomain: "bankdash-d1a91.firebaseapp.com",
  projectId: "bankdash-d1a91",
  storageBucket: "bankdash-d1a91.firebasestorage.app",
  messagingSenderId: "234036428426",
  appId: "1:234036428426:web:579c854efdbf2ea10cb773",
  measurementId: "G-5983SDHZB0"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app);

export { auth, db, functions };