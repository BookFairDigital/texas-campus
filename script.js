const menuToggle = document.querySelector(".menu-toggle");
const mainNav = document.querySelector(".main-nav");
if (menuToggle && mainNav) {
  menuToggle.addEventListener("click", () => {
    const isOpen = mainNav.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "Close navigation menu" : "Open navigation menu");
  });
  mainNav.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => {
    mainNav.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation menu");
  }));
}
const courseDescriptions = {
  "MYOB Accounting": "Learn MYOB accounting workflows, from core bookkeeping to practical business reporting.",
  "QuickBooks Desktop": "Build confidence using QuickBooks Desktop for everyday accounting tasks and small-business workflows.",
  "QuickBooks Online": "Learn cloud accounting, transactions, reports and day-to-day workflows using QuickBooks Online.",
  "Tally ERP Accounting": "Explore Tally ERP accounting workflows, practical entries and business reporting."
};
const detailsDialog = document.querySelector("#course-details");
const dialogTitle = document.querySelector("#dialog-title");
const dialogDescription = document.querySelector("#dialog-description");
document.querySelectorAll(".detail-link").forEach((link) => link.addEventListener("click", (event) => {
  event.preventDefault();
  const courseName = link.dataset.course || "Course details";
  if (dialogTitle) dialogTitle.textContent = courseName;
  if (dialogDescription) dialogDescription.textContent = courseDescriptions[courseName] || "Course information will be available soon.";
  if (detailsDialog && typeof detailsDialog.showModal === "function") detailsDialog.showModal();
  else if (dialogDescription) alert(`${courseName}\n\n${dialogDescription.textContent}\n\nSample price: LKR 12,500`);
}));
document.querySelectorAll(".dialog-close, .dialog-ok").forEach((button) => button.addEventListener("click", () => {
  if (detailsDialog) detailsDialog.close();
}));
if (detailsDialog) detailsDialog.addEventListener("click", (event) => {
  if (event.target === detailsDialog) detailsDialog.close();
});
const year = document.querySelector("#year");
if (year) year.textContent = new Date().getFullYear();

/* Student login: connect the existing username/password modal to Supabase. */
(() => {
  const form = document.getElementById("student-login-form");
  if (!form) return;
  const message = document.getElementById("student-login-message");
  const usernameInput = document.getElementById("student-username");
  const passwordInput = document.getElementById("student-password");
  const submitButton = form.querySelector('button[type="submit"]');
  if (!window.supabase) {
    if (message) message.textContent = "Login service did not load. Refresh and try again.";
    return;
  }
  const client = window.supabase.createClient(
    "https://dykxmozruyzgkiyopvlp.supabase.co",
    "sb_publishable_WprXMzuhLjAKfZfGHvM48A_OHGjmaVH"
  );
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (message) { message.textContent = "Signing in…"; message.style.color = ""; }
    if (submitButton) { submitButton.disabled = true; submitButton.textContent = "Signing in…"; }
    try {
      const { data, error } = await client.functions.invoke("student-login", {
        body: { username: usernameInput.value.trim(), password: passwordInput.value }
      });
      if (error) {
        let detail = data?.error || error.message || "Login failed.";
        try {
          if (error.context) {
            const response = await error.context.json();
            if (response?.error) detail = response.error;
          }
        } catch (_) {}
        throw new Error(detail);
      }
      if (!data?.access_token || !data?.refresh_token) throw new Error(data?.error || "Login failed. Please try again.");
      const { error: sessionError } = await client.auth.setSession({
        access_token: data.access_token, refresh_token: data.refresh_token
      });
      if (sessionError) throw sessionError;
      if (message) message.textContent = "Login successful. Opening your dashboard…";
      window.location.href = "./student-dashboard.html";
    } catch (err) {
      if (message) {
        message.textContent = err?.message || "Unable to sign in. Please try again.";
        message.style.color = "#ff6578";
      }
    } finally {
      if (submitButton) { submitButton.disabled = false; submitButton.textContent = "Log In"; }
    }
  });
})();
