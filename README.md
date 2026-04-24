# Ministry of the Word — Full Stack Web Application

A complete web application for a ministry/evangelist featuring:
- Public ministry website (Home, About, Contact, Media, Gallery, Projects)
- Course/Training platform (Convert Class, Missionary, Discipleship)
- User enrollment, progress tracking & certificates
- Admin control panel
- Media library with video, audio, PDF, Word, image support
- Donation system

---

## Tech Stack

| Layer     | Technology                                        |
|-----------|---------------------------------------------------|
| Backend   | Python · Flask · Flask-JWT-Extended · RESTful API |
| Database  | MySQL · SQLAlchemy · Flask-Migrate                |
| Frontend  | React 19 · Vite · Bootstrap 5 · React Router 7   |
| Auth      | JWT (access + refresh tokens)                     |
| Files     | Local uploads (video, audio, PDF, Word, images)   |
| Certs     | Auto-generated PDF certificates via ReportLab     |

---

## Project Structure

```
New project/
├── backend/
│   ├── app/
│   │   ├── models/         ← User, Course, Lesson, Media, etc.
│   │   ├── routes/         ← auth, courses, media, admin, contact, etc.
│   │   ├── utils/          ← helpers, certificate generator, decorators
│   │   └── __init__.py     ← App factory
│   ├── uploads/            ← All uploaded files (auto-created)
│   ├── .env                ← Your config (edit this!)
│   ├── requirements.txt
│   └── run.py
├── frontend/
│   ├── src/
│   │   ├── pages/          ← All page components
│   │   │   └── admin/      ← Admin panel pages
│   │   ├── components/     ← Navbar, Footer, AdminLayout, etc.
│   │   ├── contexts/       ← AuthContext (JWT state)
│   │   └── api/            ← Axios instance + interceptors
│   ├── .env
│   └── vite.config.js
├── start-backend.bat
├── start-frontend.bat
└── setup-database.bat
```

---

## QUICK START

### 1. Prerequisites
- **Python 3.11+** (you have 3.14 — works great)
- **Node.js 18+** (you have v24 — works great)
- **MySQL** — Download from https://dev.mysql.com/downloads/mysql/

### 2. Set up MySQL
```sql
-- In your MySQL client:
CREATE DATABASE ministry_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. Configure the backend
Edit `backend/.env`:
```
DB_PASSWORD=your_mysql_root_password
```

### 4. Initialize the database
Double-click **`setup-database.bat`**, OR run manually:
```bash
cd backend
python -c "from run import app; from app.extensions import db; app.app_context().__enter__(); db.create_all()"
```

### 5. Start the backend
Double-click **`start-backend.bat`**, OR:
```bash
cd backend
python run.py
# API runs at http://localhost:5000
```

### 6. Start the frontend
Double-click **`start-frontend.bat`**, OR:
```bash
cd frontend
npm run dev
# App runs at http://localhost:5173
```

### 7. First Login (Admin)
Register the **first account** at http://localhost:5173/register  
→ It automatically becomes the **admin** account.

---

## API Endpoints Summary

### Auth
| Method | Endpoint                  | Description          |
|--------|---------------------------|----------------------|
| POST   | /api/auth/register        | Register new user    |
| POST   | /api/auth/login           | Login                |
| POST   | /api/auth/refresh         | Refresh access token |
| GET    | /api/auth/me              | Get my profile       |
| PUT    | /api/auth/me              | Update my profile    |
| POST   | /api/auth/change-password | Change password      |

### Courses
| Method | Endpoint                                         | Description              |
|--------|--------------------------------------------------|--------------------------|
| GET    | /api/courses                                     | List all courses         |
| GET    | /api/courses/:id                                 | Course detail + lessons  |
| POST   | /api/courses/:id/enroll                          | Enroll in course         |
| GET    | /api/courses/:id/lessons/:lid                    | Get lesson content       |
| POST   | /api/courses/:id/lessons/:lid/complete           | Mark lesson complete     |
| GET    | /api/courses/my-enrollments                      | My enrollments           |
| GET    | /api/courses/my-certificates                     | My certificates          |
| POST   | /api/courses/admin                               | Create course (admin)    |
| POST   | /api/courses/admin/:id/lessons                   | Add lesson (admin)       |

### Media
| Method | Endpoint               | Description               |
|--------|------------------------|---------------------------|
| GET    | /api/media             | List media (filter by section/type) |
| GET    | /api/media/:id/download| Download file             |
| POST   | /api/media/upload      | Upload media (admin)      |

### Other
- `POST /api/contact` — Submit contact form
- `POST /api/donations` — Make donation
- `GET /api/projects` — List ministry projects
- `GET /api/site/content` — Get all site content
- `PUT /api/site/content/:section` — Update content (admin)
- `GET /api/admin/dashboard` — Admin stats

---

## Course Categories
| Category      | Access    | Price  |
|---------------|-----------|--------|
| `convert`     | Free      | $0     |
| `missionary`  | Paid      | Set by admin |
| `discipleship`| Enrollment| Admin approval |
| `other`       | Flexible  | Set by admin |

---

## Features
- Self-paced learning with per-lesson progress tracking
- Visual progress bar for each enrolled course
- Auto PDF certificate issued on 100% course completion
- Unique certificate number per student per course
- Lesson types: video, audio, image, PDF, Word doc, text
- Admin can upload files directly as lesson content
- Media section: Messages (ministry media) + Gallery (outreach media)
- Anyone can download gallery items
- Donation form (anonymous or logged-in)
- Site content editable by admin (no code needed)
- JWT authentication with auto token refresh
