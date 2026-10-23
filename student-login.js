
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://dykxmozruyzgkiyopvlp.supabase.co";
const SUPABASE_KEY = "sb_publishable_WprXMzuhLjAKfZfGHvM48A_OHGjmaVH";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage
  }
});

const form = document.querySelector("#student-login-form");
const message = document.querySelector("#student-login-message");

if (form) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = form.querySelector('[name="username"]').value.trim();
    const password = form.querySelector('[name="password"]').value;
    const button = form.querySelector('button[type="submit"]');

    if (message) message.textContent = "Signing in...";
    if (button) button.disabled = true;

    try {
      const { data, error } = await supabase.functions.invoke("student-login", {
        body: { username, password }
      });

      if (error) {
        let details = null;
        try {
          details = await error.context?.json?.();
        } catch {}

        throw new Error(
          details?.error || error.message || "Student login failed."
        );
      }

      if (!data?.access_token || !data?.refresh_token) {
        throw new Error(data?.error || "Login response did not include a session.");
      }

      const { data: sessionData, error: sessionError } =
        await supabase.auth.setSession({
          access_token: data.access_token,
          refresh_token: data.refresh_token
        });

      if (sessionError) throw sessionError;

      if (!sessionData.session?.user) {
        throw new Error("Session was not saved. Please try again.");
      }

      // Verify that the session can be read back from persistent storage.
      const { data: checkData, error: checkError } =
        await supabase.auth.getSession();

      if (checkError) throw checkError;

      if (!checkData.session?.user) {
        throw new Error("Login session could not be restored from storage.");
      }

      if (message) message.textContent = "Login successful. Opening dashboard...";

      window.location.replace("https://bookfairdigital.github.io/texas-campus/student-dashboard.html");
    } catch (err) {
      console.error("Student login error:", err);

      if (message) {
        message.textContent = err.message || "Login failed.";
      }
    } finally {
      if (button) button.disabled = false;
    }
  });
}
