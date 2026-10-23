
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

    const username = form.querySelector('[name="username"]')?.value.trim();
    const password = form.querySelector('[name="password"]')?.value;
    const button = form.querySelector('button[type="submit"]');

    if (!username || !password) {
      if (message) message.textContent = "Username saha password enter karanna.";
      return;
    }

    if (button) {
      button.disabled = true;
      button.textContent = "Signing in...";
    }

    if (message) message.textContent = "Signing in...";

    try {
      const { data, error } = await supabase.functions.invoke(
        "student-login",
        { body: { username, password } }
      );

      if (error) {
        let details = null;
        try {
          details = await error.context?.json?.();
        } catch {}
        throw new Error(details?.error || error.message || "Login failed.");
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

      const { data: savedData, error: savedError } =
        await supabase.auth.getSession();

      if (savedError) throw savedError;

      if (!savedData.session?.user?.id) {
        throw new Error("Login session save une naha. Aye try karanna.");
      }

      if (message) message.textContent = "Login successful. Opening dashboard...";

      window.location.assign(
        "https://bookfairdigital.github.io/texas-campus/student-dashboard.html"
      );
    } catch (error) {
      console.error("Student login error:", error);
      if (message) message.textContent = error.message || "Login failed.";
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = "Log In";
      }
    }
  });
}
