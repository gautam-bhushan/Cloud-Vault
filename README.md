# CloudVault ☁️

**CloudVault** is a lightweight cloud-based file upload, download, and sharing system developed as a major project.

The application allows users to securely register, log in, upload files, manage their stored files, download them, delete them, and generate shareable links for other users.

---
CloudVault_Project/
│
├── public/
│   ├── index.html
│   ├── style.css
│   └── app.js
│
├── uploads/
│
├── data/
│   └── db.json
│
├── server.js
├── package.json
├── start.bat
└── README.md
## 🚀 Features

- User Registration and Login
- JWT-based Authentication
- Secure Password Hashing
- File Upload
- File Listing
- File Download
- File Deletion
- File Sharing through Unique Links
- Shared File Access
- File Search
- Storage Usage Information
- Modern and Responsive Dashboard

---

## 🛠️ Tech Stack

### Frontend
- HTML
- CSS
- JavaScript

### Backend
- Node.js
- Express.js

### Authentication
- JSON Web Token (JWT)
- bcrypt

### File Handling
- Multer

### Storage
- Local file storage for prototype/demo
- Can be extended to Cloudinary, Google Cloud Storage, or Amazon S3

### Database
- Local JSON-based metadata storage for the prototype
- Can be extended to MongoDB

---

## 🏗️ System Architecture

```text
              ┌───────────────────┐
              │       User        │
              └─────────┬─────────┘
                        │
                        ▼
              ┌───────────────────┐
              │  Web Frontend    │
              │   CloudVault     │
              └─────────┬─────────┘
                        │
                        ▼
              ┌───────────────────┐
              │  Node.js +        │
              │  Express Backend  │
              └───────┬─────┬─────┘
                      │     │
             ┌────────┘     └────────┐
             ▼                       ▼
      ┌──────────────┐       ┌──────────────┐
      │   Metadata   │       │ File Storage │
      │   Database   │       │   /uploads   │
      └──────────────┘       └──────────────┘




