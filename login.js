import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, isSignInWithEmailLink, signInWithEmailLink } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
const firebaseConfig = {
    apiKey: "AIzaSyBBT799FTeNCPGm3-HNzAUg2I1XWf4BAas",
    authDomain: "mygamehub-d13d8.firebaseapp.com",
    projectId: "mygamehub-d13d8",
    storageBucket: "mygamehub-d13d8.appspot.com",
    messagingSenderId: "339025715622",
    appId: "1:339025715622:web:f42547030db409a4b16f67"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
if (isSignInWithEmailLink(window.location.href)) {
    let email = window.localStorage.getItem('emailForSignIn');
    if (email === undefined) {
        email = window.prompt('Please provide your email for confirmation');
    }
    signInWithEmailLink(auth, email, window.location.href)
        .then((result) => {
            window.localStorage.removeItem('emailForSignIn');
            window.location.href = '/';
        })
        .catch((error) => {
            console.error(error);
            document.getElementById('error').innerText = error;
        });
}