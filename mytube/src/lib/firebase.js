import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCNDO_we2VK30NFIB-GrD6I6buaoiq-1mw",
  authDomain: "my-tube-app-9f040.firebaseapp.com",
  projectId: "my-tube-app-9f040",
  storageBucket: "my-tube-app-9f040.firebasestorage.app",
  messagingSenderId: "48291323929",
  appId: "1:48291323929:web:e3a0b23bbb901393040a88",
  measurementId: "G-N34WLMCW31"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { auth, provider };