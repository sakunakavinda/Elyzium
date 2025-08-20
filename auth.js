// Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-analytics.js";
  import {getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
  import {getFirestore, setDoc, doc} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "AIzaSyD23cBMvewgTByUcdTNDKe2t4VXtNGEk3A",
    authDomain: "elyzium-5e378.firebaseapp.com",
    databaseURL: "https://elyzium-5e378-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "elyzium-5e378",
    storageBucket: "elyzium-5e378.firebasestorage.app",
    messagingSenderId: "123407494252",
    appId: "1:123407494252:web:324e83b36e587aa1febc49",
    measurementId: "G-53JP89GP8T"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);
  

  // initialize auth and db
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };

 // Handle Register
const registerBtn = document.getElementById("registerBtn");
if (registerBtn) {
  registerBtn.addEventListener("click", async () => {
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const errorElement = document.getElementById("error");

    if (password !== confirmPassword) {
      errorElement.textContent = "Passwords do not match!";
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Save extra info (like name) in Firestore
      await setDoc(doc(db, "admins", user.uid), {
        name: name,
        email: email,
        createdAt: new Date()
      });

      alert("Registration successful!");
      window.location.replace("admin-login.html"); // redirect to login
    } catch (error) {
      errorElement.textContent = error.message;
    }
  });
}


// Handle Login
const loginBtn = document.getElementById("loginBtn");
if (loginBtn) {
  loginBtn.addEventListener("click", async () => {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const errorElement = document.getElementById("error");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      alert("Login successful!");
      window.location.replace("admin-dashboard.html"); // redirect to admin home
    } catch (error) {
      errorElement.textContent = error.message;
    }
  });
}

