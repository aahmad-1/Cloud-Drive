# Cloud Drive

> Full-stack cloud document storage app where users can register, log in, and create, edit, and share text documents and images.

**Tech Stack:** React, TypeScript, Express, MongoDB, JWT, Quill, i18next, Bootstrap, Vite

---

## Features

- User registration and login (JWT authentication, hashed passwords)
- Create, edit, rename, and delete text documents
- Text editing with Quill
- Upload images to the drive
- Download documents/images as PDF, or download images directly
- Share edit access with specific users, or revoke it
- Share a document via a read-only public link
- Edit-lock system, prevents two users editing the same doc at once
- Recycle bin with restore and permanent delete
- Clone existing documents
- Profile picture upload with a default letter avatar fallback
- Search, sort, and pagination on the drive
- Dark and light mode
- English/Finnish translation
- Responsive design (Bootstrap)

---

## Quick Start

### Prerequisites

- Node.js
- MongoDB running locally
- A web browser

### Installation

**1. Clone the repository**
```bash
git clone https://github.com/aahmad-1/Cloud-Drive.git
cd Cloud-Drive
```

**2. Install dependencies**
```bash
npm install
cd client && npm install
cd ../server && npm install
```

**3. Configure environment variables**

Create `server/.env`:
```
SECRET=your_own_secret_key
PORT=3000
MONGO_URI=mongodb://127.0.0.1:27017/clouddrivedb
```

### Running the app

From the project root:
```bash
npm run dev
```

This starts both servers concurrently:
- Backend runs on http://localhost:3000
- Frontend runs on http://localhost:5173

Open http://localhost:5173 in your browser.

---

Refer to the documentation for installation details, API endpoints, user manual, and other userful information.