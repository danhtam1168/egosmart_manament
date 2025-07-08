//npm install firebase

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  // tôi đã ẩn
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

//npm install -g firebase-tools
//firebase login
//firebase init
//firebase deploy --only hosting:egosmart-91b-ct
//egosmart-91b-ct.web.app
cd frontend
npm run build
cd ..
firebase deploy --only hosting:egosmart-91b-ct