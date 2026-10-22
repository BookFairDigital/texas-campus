TEXAS CAMPUS — STUDENT MANAGEMENT ADD-ON

Included:
- student-management.html: admin-only student list and controls.
- ADD-TO-ADMIN-PANEL.txt: one-line link to add inside admin.html.

Already completed in Supabase:
- Added profiles.account_status and profiles.access_expires_at.
- Existing students were assigned expiry = created_at + 2 years.
- New student creation now assigns active status and expiry 2 years from account creation.
- Student login blocks inactive/deactivated accounts and expired access.
- Deployed admin-manage-students Edge Function for list/status/password reset/expiry.

How to install the page:
1. Download and extract this ZIP.
2. Upload student-management.html to the root of the texas-campus GitHub repository (same level as admin.html and index.html).
3. Open admin.html in GitHub, click Edit, and add the line from ADD-TO-ADMIN-PANEL.txt inside the Management Workspace section. Commit changes.
4. In student-dashboard.html, apply the replacement shown in DASHBOARD-EXPIRY-CHECK.txt so already signed-in students are also checked against expiry/status.
5. Sign in at admin.html, then open Student Management from the new link.

Password note:
Existing passwords CANNOT be viewed. Supabase does not store recoverable plaintext passwords. Use Reset password to set a new temporary password and share it securely.

Important:
- Deactivate preserves student payment/order history; it is safer than deleting auth users with financial records.
- Two-year validity starts at account creation. Existing accounts use their original created_at date.
- Current site does not yet have a connected lesson-player route. Login expiry is enforced, but any future direct video/Drive links must also be protected by expiry-aware access checks for complete video protection.
