
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://dykxmozruyzgkiyopvlp.supabase.co";
const SUPABASE_KEY = "sb_publishable_WprXMzuhLjAKfZfGHvM48A_OHGjmaVH";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const form = document.querySelector("#student-login-form");
const message = document.querySelector("#student-login-message");

if (form) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = form.querySelector('[name="username"]').value.trim();
    const password = form.querySelector('[name="password"]').value;
    const submitButton = form.querySelector('button[type="submit"]');

    if (message) {
      message.textContent = "Signing in...";
      message.style.color = "";
    }

    if (submitButton) submitButton.disabled = true;

    try {
      const { data, error } = await supabase.functions.invoke(
        "student-login",
        {
          body: { username, password }
        }
      );

      if (error) {
        let detail = "";

        try {
          detail = await error.context?.json?.();
        } catch {
          // Keep the generic message if the response isn't JSON.
        }

        throw new Error(
          detail?.error || "Login failed. Please check your details."
        );
      }

      if (!data?.access_token || !data?.refresh_token) {
        throw new Error(
          data?.error || "Login response was incomplete. Please try again."
        );
      }

      const { error: sessionError } = await supabase.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token
      });

      if (sessionError) throw sessionError;

      if (message) {
        message.textContent = "Login successful. Opening your dashboard...";
        message.style.color = "green";
      }

      window.location.href = "student-dashboard.html";
    } catch (error) {
      console.error("Student login error:", error);

      if (message) {
        message.textContent =
          error.message || "Unable to sign in. Please try again.";
        message.style.color = "crimson";
      }
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  });
}
