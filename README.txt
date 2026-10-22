REPLACEMENT script.js for Texas Campus

1. Open the existing root-level script.js in GitHub.
2. Replace ALL contents with the included script.js.
3. In root-level index.html, at the bottom ensure these script tags appear in this order:
   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
   <script src="script.js"></script>
   Add the Supabase line immediately before script.js if missing.
4. Ensure student-dashboard.html is at the repository root.
5. Ensure the Supabase Edge Function name is exactly student-login and it is deployed.
6. Test with a test student account.

This script preserves existing mobile navigation and course-detail behavior and adds login invocation and redirect.
Never place a service-role key in frontend code.
