<div align="center">

# 🚀🎯 RecruitFlow ✨🎓

### *Campus placements, minus the chaos.*

![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Gemini](https://img.shields.io/badge/Gemini_AI-8E75B2?style=for-the-badge&logo=googlegemini&logoColor=white)
![JWT](https://img.shields.io/badge/JWT_Auth-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)

🟢 **Status:** Placement season ready 📅

</div>

---

## 🌈 What is RecruitFlow?

RecruitFlow is a **placement management platform** that brings **Training & Placement Officers (TPOs)** and **students** onto the same page — literally. 📋

No more WhatsApp group spam for every job opening, no more manually tracking who applied where in a spreadsheet. TPOs post jobs, students apply in one click, and there's even an **AI career coach** on standby to help students prep for interviews. 🤖💼

---

## 🚀 Features

### 🧑‍💼 For TPOs
- ➕ Post new job openings (On-Campus / Off-Campus)
- 🎯 Set batch eligibility & application deadlines
- ✏️ Edit or 🗑️ delete listings anytime
- 👀 View the full applicant list for any job
- 📊 Export applicants to **Excel** with one click

### 🧑‍🎓 For Students
- 🪪 Build a profile — GPA, branch, batch, backlog count, resume link
- 🔍 See only the jobs **you're actually eligible for**
- ⚡ Apply in a single click
- 🗺️ Generate a **personalized AI prep roadmap** for any company + role
- 💬 Chat with an **AI career advisor** for resume & interview tips

### 🔐 Under the Hood
- 🔑 JWT-based authentication
- 🛡️ Role-based access control (TPO vs. Student)
- 🔒 Passwords hashed with bcrypt
- 🧠 AI features powered by **Google Gemini** (`gemini-2.5-flash`)

---

## 🛠️ Tech Stack

| Layer | Tech |
|---|---|
| 🎨 **Frontend** | React 19, React Router, shadcn/ui + Radix UI, Tailwind CSS |
| ⚙️ **Backend** | FastAPI (Python), Motor (async MongoDB driver) |
| 🗄️ **Database** | MongoDB |
| 🤖 **AI** | Google Gemini API |
| 🔒 **Security** | PyJWT, Passlib (bcrypt) |
| 📄 **Extras** | React Hook Form + Zod, Axios, Sonner (toasts), OpenPyXL (Excel export) |

---

## 🗂️ Project Structure

```
RecruitFlow-Placement-System/
├── ⚙️ backend/
│   ├── server.py              # FastAPI app — auth, jobs, applicants, AI routes
│   └── requirements.txt
├── 🎨 frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LandingPage.js
│   │   │   ├── LoginPage.js
│   │   │   ├── RegisterPage.js
│   │   │   ├── ProfileSetupPage.js
│   │   │   ├── StudentDashboard.js
│   │   │   ├── TPODashboard.js
│   │   │   └── JobApplicantsPage.js
│   │   ├── components/ui/      # shadcn/ui component library
│   │   ├── hooks/
│   │   └── lib/
│   └── package.json
├── 🧪 backend_test.py
├── 🧪 tests/
└── 📄 README.md
```

---

## 🧬 Data Model (Quick Peek)

| Model | Purpose |
|---|---|
| 👤 `User` | Shared login info + role (`TPO` / `Student`) |
| 🪪 `StudentProfile` | GPA, branch, batch, backlogs, resume link |
| 💼 `Job` | Title, company, type, eligibility, deadline |
| 📨 `Applicant` | Links a student to a job they applied to |
| 🗺️ `AIRoadmapRequest` | Company + role → AI-generated prep plan |
| 💬 `AIChatRequest` | Free-form question to the AI career advisor |

---

## ⚙️ Getting Started

### ✅ Prerequisites
- 🐍 Python 3.11+
- 🟩 Node.js 18+ and Yarn
- 🗄️ A MongoDB instance (local or Atlas)
- 🔑 A Google Gemini API key (for the AI features)

### 📥 Backend Setup

```bash
cd backend
pip install -r requirements.txt
```

Create a `.env` file inside `backend/`:

```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=recruitflow
JWT_SECRET=your-secret-key
AI_API_KEY=your-gemini-api-key
```

Run it 🚀
```bash
uvicorn server:app --reload
```
API lives at `http://localhost:8000/api` 🌐

### 📥 Frontend Setup

```bash
cd frontend
yarn install
yarn start
```
App lives at `http://localhost:3000` 🎉

### 🧪 Running Tests

```bash
pytest backend_test.py
```

---

## 🛣️ How It Works

1. 🧑‍💼 A TPO **posts a job** with eligibility criteria & deadline
2. 🧑‍🎓 Eligible students **see it** on their dashboard automatically
3. ⚡ Student **applies** in one click
4. 🗺️ Student generates an **AI roadmap** to prep for that specific role
5. 💬 Student **chats with the AI advisor** for extra tips
6. 📊 TPO **downloads the applicant list** as an Excel sheet when ready

---

## 📡 API Overview

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register a new user (TPO or Student) |
| `POST` | `/api/auth/login` | Log in and get a JWT 🔑 |
| `POST` | `/api/auth/profile-setup` | Complete a student's profile |
| `GET` | `/api/auth/me` | Get the current user |
| `POST` | `/api/jobs` | Create a job (TPO only) |
| `GET` | `/api/jobs/all` | List all jobs (TPO only) |
| `PUT` | `/api/jobs/{job_id}` | Update a job (TPO only) |
| `DELETE` | `/api/jobs/{job_id}` | Delete a job (TPO only) |
| `GET` | `/api/jobs/{job_id}/applicants` | View applicants (TPO only) |
| `GET` | `/api/jobs/{job_id}/applicants/download` | Export applicants to Excel 📊 |
| `GET` | `/api/jobs/my-batch` | Jobs eligible for the student's batch |
| `POST` | `/api/jobs/{job_id}/apply` | Apply to a job (Student only) |
| `POST` | `/api/ai/roadmap` | Generate an AI prep roadmap 🗺️ |
| `POST` | `/api/ai/chat` | Chat with the AI career advisor 💬 |

---

## 🌟 Author

Built with 🧠 + ☕ by **[Soumika](https://github.com/soumika-RM)**

<div align="center">

*If RecruitFlow helped you imagine placement season without the panic, drop a ⭐!*

</div>
