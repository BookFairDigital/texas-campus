
import { loginWithEmail } from "./auth.js";

const form = document.querySelector("#student-login-form");

if (form) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = form.querySelector('[name="username"]').value.trim();
    const password = form.querySelector('[name="password"]').value;

    const message = form.querySelector(".login-message");
    if (message) message.textContent = "Login setup is not complete yet.";
    
    // Username-to-email lookup must be implemented securely
    // before calling loginWithEmail(email, password).
  });
}
