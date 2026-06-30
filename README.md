# 🏢 Society Maintenance Tracker

A full-stack platform for managing apartment society maintenance complaints. Residents can raise and track complaints with photos; admins manage them through a workflow with priorities; everyone stays informed through a notice board and email updates.

---

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Setup Guide](#setup-guide)
- [Environment Variables](#environment-variables)
- [Database Schema](#database-schema)
- [API Documentation](#api-documentation)
- [System Design](#system-design)

---

## ✅ Features

**Residents**
- Register and log in
- Raise complaints with category, description, and optional photo
- View all personal complaints with full status history
- Receive email when complaint status changes
- Receive email for important notices

**Admin**
- View all complaints with filters (category, status, date)
- Set priority (Low / Medium / High) and update status (Open / In Progress / Resolved)
- Every status change is recorded with timestamp, actor, and optional note
- Flag complaints as overdue manually or via configurable auto-detection
- Overdue complaints surface at the top of the list
- Post notices; mark as important to pin and trigger resident emails
- Dashboard: total complaints by status, by category, overdue count

---

## 🛠 Tech Stack

| Layer     | Technology                     |
|-----------|-------------------------------|
| Backend   | Node.js, Express               |
| Frontend  | React 18, React Router v6      |
| Database  | PostgreSQL                     |
| Auth      | JWT (jsonwebtoken) + bcryptjs  |
| Photos    | Multer (local disk)            |
| Email     | Nodemailer (Gmail / any SMTP)  |

---

## 📁 Project Structure

```
society-maintenance-tracker/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js               # DB pool + table creation
│   │   ├── controllers/
│   │   │   ├── authController.js   # Register, login
│   │   │   ├── complaintController.js
│   │   │   └── noticeController.js
│   │   ├── middleware/
│   │   │   ├── auth.js             # JWT verify, role guard
│   │   │   └── upload.js           # Multer config
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── complaints.js
│   │   │   └── notices.js
│   │   ├── utils/
│   │   │   └── email.js            # Nodemailer helpers
│   │   └── index.js                # Express entry point
│   ├── uploads/                    # Stored complaint photos
│   ├── .env.example
│   └── package.json
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── components/
    │   │   └── Shared/
    │   │       └── Navbar.js
    │   ├── context/
    │   │   └── AuthContext.js
    │   ├── pages/
    │   │   ├── Auth.js
    │   │   ├── MyComplaints.js
    │   │   ├── RaiseComplaint.js
    │   │   ├── NoticeBoard.js
    │   │   ├── AdminDashboard.js
    │   │   └── AdminComplaints.js
    │   ├── styles/
    │   │   └── global.css
    │   ├── utils/
    │   │   └── api.js              # Axios instance
    │   ├── App.js
    │   └── index.js
    ├── .env.example
    └── package.json
```

---

## 🚀 Setup Guide

### Prerequisites

- Node.js v18+
- PostgreSQL 14+
- Gmail account (for email) or any SMTP provider

### 1. Clone the repository

```bash
git clone https://github.com/your-username/society-maintenance-tracker.git
cd society-maintenance-tracker
```

### 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your values (see Environment Variables section)
```

#### Create PostgreSQL database

```sql
CREATE DATABASE society_tracker;
```

Tables are created automatically when the server starts.

#### Run the backend

```bash
npm run dev     # development (nodemon)
npm start       # production
```

Server starts on `http://localhost:5000`

### 3. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
# Set REACT_APP_API_URL if backend is not on localhost:5000
npm start
```

Frontend starts on `http://localhost:3000`

### 4. Create Admin User

After starting the backend, use any REST client (Postman, curl) to create an admin:

```bash
# Register a normal user first
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin User","email":"admin@example.com","password":"admin123"}'

# Then manually set role to admin in DB
psql -d society_tracker -c "UPDATE users SET role='admin' WHERE email='admin@example.com';"
```

---

## 🔐 Environment Variables

### Backend `.env`

```env
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/society_tracker
JWT_SECRET=your_super_secret_jwt_key_here
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password
NODE_ENV=development
```

> **Gmail setup:** Enable 2FA on your Google account → Google Account → Security → App Passwords → Generate one for "Mail".

### Frontend `.env`

```env
REACT_APP_API_URL=http://localhost:5000/api
```

---

## 🗄 Database Schema

### `users`
| Column       | Type         | Notes                      |
|-------------|-------------|---------------------------|
| id          | SERIAL PK   |                           |
| name        | VARCHAR(100)|                           |
| email       | VARCHAR(150)| UNIQUE                    |
| password    | VARCHAR(255)| bcrypt hash               |
| role        | VARCHAR(20) | 'resident' or 'admin'     |
| flat_number | VARCHAR(20) | optional                  |
| created_at  | TIMESTAMP   |                           |

### `complaints`
| Column      | Type         | Notes                                   |
|------------|-------------|----------------------------------------|
| id         | SERIAL PK   |                                        |
| resident_id| INTEGER FK  | → users.id                            |
| category   | VARCHAR(50) |                                        |
| description| TEXT        |                                        |
| photo_url  | VARCHAR(500)| path to uploaded file                  |
| status     | VARCHAR(30) | Open / In Progress / Resolved          |
| priority   | VARCHAR(10) | Low / Medium / High                    |
| is_overdue | BOOLEAN     | auto-set or manually flagged           |
| created_at | TIMESTAMP   |                                        |
| updated_at | TIMESTAMP   |                                        |

### `complaint_history`
| Column      | Type        | Notes                                  |
|------------|------------|---------------------------------------|
| id         | SERIAL PK  |                                       |
| complaint_id| INTEGER FK | → complaints.id                       |
| actor_id   | INTEGER FK  | → users.id                            |
| actor_role | VARCHAR(20)|                                       |
| old_status | VARCHAR(30)| NULL for initial creation             |
| new_status | VARCHAR(30)|                                       |
| note       | TEXT       | optional admin note                   |
| changed_at | TIMESTAMP  |                                       |

### `notices`
| Column      | Type         | Notes                     |
|------------|-------------|--------------------------|
| id         | SERIAL PK   |                          |
| admin_id   | INTEGER FK  | → users.id               |
| title      | VARCHAR(200)|                          |
| body       | TEXT        |                          |
| is_important| BOOLEAN    | pins to top + email sent |
| created_at | TIMESTAMP   |                          |

### `settings`
| Column | Type         | Notes                       |
|-------|-------------|----------------------------|
| id    | SERIAL PK   |                            |
| key   | VARCHAR(100)| UNIQUE                     |
| value | VARCHAR(255)| e.g. overdue_days = "7"   |

---

## 📡 API Documentation

Base URL: `http://localhost:5000/api`

All protected routes require: `Authorization: Bearer <token>`

### Auth

| Method | Endpoint          | Auth | Description         |
|--------|------------------|------|---------------------|
| POST   | /auth/register   | No   | Register as resident|
| POST   | /auth/login      | No   | Login (any role)    |

**Register body:**
```json
{ "name": "Jane Doe", "email": "jane@example.com", "password": "secret", "flat_number": "B-101" }
```

**Login response:**
```json
{ "token": "...", "user": { "id": 1, "name": "Jane", "role": "resident", ... } }
```

---

### Complaints

| Method | Endpoint                          | Role     | Description                    |
|--------|----------------------------------|----------|-------------------------------|
| POST   | /complaints                      | Resident | Raise complaint (multipart)    |
| GET    | /complaints/my                   | Resident | Get own complaints + history  |
| GET    | /complaints                      | Admin    | Get all with filters          |
| GET    | /complaints/dashboard/stats      | Admin    | Dashboard statistics          |
| PATCH  | /complaints/:id                  | Admin    | Update status/priority/note   |
| PATCH  | /complaints/:id/overdue          | Admin    | Mark as overdue               |
| PUT    | /complaints/settings/overdue     | Admin    | Set overdue threshold (days)  |

**Query params for GET /complaints:**
`?category=Plumbing&status=Open&from_date=2024-01-01&to_date=2024-12-31`

**POST /complaints (multipart/form-data):**
```
category: Plumbing
description: Leaking pipe in bathroom
photo: <file>
```

**PATCH /complaints/:id body:**
```json
{ "status": "In Progress", "priority": "High", "note": "Plumber scheduled for tomorrow" }
```

---

### Notices

| Method | Endpoint       | Role     | Description                     |
|--------|--------------|----------|---------------------------------|
| GET    | /notices     | Any      | Get all notices (important first)|
| POST   | /notices     | Admin    | Post a notice                   |
| DELETE | /notices/:id | Admin    | Delete a notice                 |

**POST /notices body:**
```json
{ "title": "Water supply cut", "body": "No water from 10am-2pm on Sunday.", "is_important": true }
```

---

## 🏗 System Design

See [`SYSTEM_DESIGN.md`](./SYSTEM_DESIGN.md) for the full write-up covering complaint history model, overdue detection, photo handling, and notification flow.
