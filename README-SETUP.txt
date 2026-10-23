TEXAS CAMPUS LMS UPGRADE — INSTALLATION

FILES
- portal.css, portal.js, portal-shell.js
- dashboard.html
- my-courses.html
- student-catalogue.html
- course-view.html
- payments.html
- account-management.html
- assignments.html
- certificates.html
- supabase-lms-progress.sql

INSTALL
1. Upload all files to the repository root (same folder as index.html and assets/).
2. Keep assets/texas-campus-logo.png and assets/logos/*.svg.
3. Do not overwrite index.html, student-login.js, courses.html, course.html, or admin functions.
4. Make sure each course row in public.courses has drive_folder_url populated with the correct Google Drive folder URL.
5. Make sure each approved order has payment_status='approved' and course_access=true.
6. Existing course_orders.student_id must equal auth.users.id of the student.

COURSE VALIDITY
Access expires two years after reviewed_at (or approved_at if present). This UI shows the remaining days. For production security, server-side/RLS enforcement is required too; see SQL notes.

CONTENT
The course viewer opens the course's drive_folder_url. The Drive folder must be shared with the intended students or configured for the desired access policy. Do not place private service-role keys in frontend code.

PROGRESS
The SQL file creates course_lesson_progress. The current portal reads this table if present, but lesson-by-lesson tracking requires lesson records/URLs to be added. Google Drive folder contents are not automatically enumerated by this front-end. Add lessons to the lesson manifest or a database table before you can track individual video completion accurately.

PROFILE
Profile update needs an appropriate profiles table RLS policy. If upsert is blocked, use a trusted server-side Edge Function instead of broad public write access.
