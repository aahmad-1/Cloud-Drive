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
## Notes

- Visiting `/` while logged out automatically redirects to `/login` (handled per-page, not by the router itself).
- See `requirements.txt` for the exact commands used to set up this project from scratch.

## API Endpoints

### Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Log in, returns a JWT |
| GET | `/api/auth/me` | Get the logged-in user's info |
| PUT | `/api/auth/profile-picture` | Upload a profile picture |

### Documents

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/documents` | Get all documents owned by or shared with the user |
| POST | `/api/documents` | Create a new document |
| GET | `/api/documents/trash` | Get all documents in the recycle bin |
| GET | `/api/documents/:id` | Get a single document (owner, editor, or public view) |
| PUT | `/api/documents/:id` | Edit a document's title/content |
| DELETE | `/api/documents/:id` | Move a document to the recycle bin |
| PUT | `/api/documents/:id/share` | Give edit access to a user |
| PUT | `/api/documents/:id/revoke` | Revoke edit access from a user |
| PUT | `/api/documents/:id/public` | Toggle the public read-only link |
| PUT | `/api/documents/:id/restore` | Restore a document from the recycle bin |
| DELETE | `/api/documents/:id/permanent` | Permanently delete a document |
| POST | `/api/documents/:id/clone` | Clone an existing document |
| POST | `/api/documents/upload-image` | Upload an image as a new document |
| PUT | `/api/documents/:id/lock` | Claim the editing lock on a document |
| PUT | `/api/documents/:id/unlock` | Release the editing lock |