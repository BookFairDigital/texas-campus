# Texas Campus — Step 2: Course Catalog + Details

## Files
- `index.html` — homepage (large category panels only; compact course-card row removed)
- `styles.css` — shared design styles
- `script.js` — mobile navigation and homepage behavior
- `courses.html` — catalog with all 12 courses and category filters
- `courses.css` — catalog page styles
- `courses.js` — course data and filter interaction
- `course.html` — reusable course details page
- `course-detail.css` — course details styles
- `course-detail.js` — loads the selected course from the URL

## Run
1. Extract this ZIP into a new folder.
2. Open `index.html` in your browser.
3. On the homepage, click **View Courses** on either large category panel, or click **Courses** in the navigation.
4. Try the category filter buttons.
5. Click **View Details** or **Buy Now** to open that course's details page.

## Important
- All 12 courses are included.
- Prices are placeholders (LKR 12,500) for design preview and are not confirmed final prices.
- Buy Now is not connected to payment or user accounts yet.
- The bank details shown were supplied for the design; verify them with the account owner before using them in a live checkout.
- Firebase, student registration, admin price management, receipt upload/payment approval and protected Google Drive video access are later steps.
- The logo remains a simple placeholder graphic until the original Texas Campus logo asset is provided.


## Buy Now front-end flow (prototype)
- Open any course details page and click **Buy Now**.
- A student-details form opens, followed by bank deposit instructions and a demo order confirmation.
- This is only a browser-side prototype. It does not create an account, securely store data, upload receipts to a server, submit a real order, verify payment or unlock courses. Firebase and backend security are required before using real student or payment data.
