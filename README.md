# CloudVault

Minimal academic major-project demo: **Cloud-Based File Upload, Download and Sharing System**.

## Features
- User registration and login (JWT)
- File upload (up to 100 MB)
- Personal dashboard
- File download
- File deletion
- Share link / share code generation
- Public shared-file access page
- Storage summary and search

## Tech Stack
- Frontend: HTML, CSS, Vanilla JavaScript (kept minimal for fast demo)
- Backend: Node.js + Express.js
- Uploads: Multer
- Authentication: JWT + bcryptjs
- Demo metadata store: JSON file (`data/db.json`)
- Demo file storage: local `uploads/` directory

> For the faculty demonstration, this local storage setup reproduces the complete workflow without requiring an external cloud account. The documented architecture can later replace `uploads/` with Google Cloud Storage / Cloudinary / AWS S3 and `data/db.json` with MongoDB without changing the UI workflow.

## Run locally
1. Install Node.js 18+.
2. Open a terminal in this folder.
3. Run:
   ```bash
   npm install
   npm start
   ```
4. Open `http://localhost:5000`

## Suggested faculty demo
1. Register a new user.
2. Upload a PDF/image/text file.
3. Show the dashboard and storage count.
4. Download the uploaded file.
5. Generate a share link.
6. Open the share link in a new incognito/private window.
7. Download the shared file without logging in.

## Project mapping to report
- Methodology: client/server + API + metadata + file storage workflow
- Modules: authentication, upload, management, download, sharing, dashboard
- GUI figures: Login, Registration, Dashboard, Upload, Sharing, Shared File Access
