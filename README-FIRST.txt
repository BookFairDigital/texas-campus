Texas Campus dashboard + username login integration

Files:
- student-dashboard.html: dark Texas Campus-style dashboard. Reads the signed-in Supabase session and attempts to load profile/course_orders/courses.
- supabase/functions/student-login/index.ts: secure server-side username-to-email lookup, then Supabase password sign-in.
- script.js-student-login-snippet.txt: code to APPEND to your existing script.js. It connects the current Student Log In modal to the Edge Function and redirects successful logins to student-dashboard.html.

Important prerequisites:
1. Check public.profiles contains id (UUID matching auth.users.id), email and username columns.
2. Check public.course_orders has user_id and the actual status/course ID columns used by the dashboard. The dashboard may need adjustment if your schema uses different names.
3. Deploy the Edge Function named student-login. It uses the server's SUPABASE_SERVICE_ROLE_KEY; never put service-role keys in HTML/JavaScript.
4. Supabase Edge Functions environment needs SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and SUPABASE_ANON_KEY.
5. The current index.html already contains the username/password modal IDs used by the snippet.
6. Append the snippet to script.js; do not replace existing script.js. Keep styles.css and existing home page unchanged.
7. Test with a test student before using real student accounts.

This bundle does not modify or deploy your GitHub repository automatically. It is an integration starter, not a verified live deployment.
