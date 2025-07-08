import { createApp } from 'vue';
import App from './App.vue';
import router from './router/index.js';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Import Bootstrap CSS and JS
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap';

// Firebase initialization
const firebaseConfig = {
  apiKey: "AIzaSyC5cyMSUTS063h3yh3DTlwmYQGW5pu06a0",
  authDomain: "egosmart-91b.firebaseapp.com",
  projectId: "egosmart-91b",
  storageBucket: "egosmart-91b.firebasestorage.app",
  messagingSenderId: "69777108350",
  appId: "1:69777108350:web:cc149d5403d8b862ab572f",
  measurementId: "G-944LGZQG93"
};

const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
const app = createApp(App);

app.use(router);

app.mount('#app');
