# RecruitFlow – Placement Management System

RecruitFlow is a full-stack campus placement management platform that connects **Training & Placement Officers (TPOs)** with **students**. TPOs can post and manage job openings, track applicants, and export applicant data, while students can build their profile, apply to eligible jobs, and get AI-powered interview preparation help.

## Features

**For TPOs**
- Post, update, and delete job listings (On-Campus / Off-Campus)
- Set batch eligibility criteria and application deadlines
- View the list of applicants for each job
- Export applicants to an Excel sheet with one click

**For Students**
- Register and complete a profile (roll number, GPA, branch, batch, backlog count, resume link)
- Browse jobs filtered to their batch's eligibility
- Apply to jobs in a single click
- Generate an AI-powered, step-by-step preparation roadmap for a specific company and role
- Chat with an AI career advisor for interview and resume guidance

**Platform**
- JWT-based authentication with role-based access control (TPO vs. Student)
- Passwords hashed with bcrypt
- Responsive UI built with shadcn/ui and Tailwind CSS

## Tech Stack

**Backend**
- [FastAPI](https://fastapi.tiangolo.com/) (Python)
- [Motor](https://motor.readthedocs.io/) – async MongoDB driver
- MongoDB
- PyJWT + Passlib (bcrypt) for authentication
- Google Gemini API (`gemini-2.5-flash`) for AI roadmap generation and career chat
- OpenPyXL for Excel export of applicant data

**Frontend**
- React 19
- React Router
- shadcn/ui + Radix UI primitives
- Tailwind CSS
- React Hook Form + Zod for form validation
- Axios for API calls
- Sonner for toast notifications

**Testing**
- Pytest (backend test suite in `backend_test.py`)

## Project Structure

```
RecruitFlow-Placement-System/
├── backend/
│   ├── server.py            # FastAPI app: auth, jobs, applicants, AI routes
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/           # LandingPage, LoginPage, RegisterPage,
│   │   │                    # ProfileSetupPage, StudentDashboard,
│   │   │                    # TPODashboard, JobApplicantsPage
│   │   ├── components/ui/   # shadcn/ui component library
│   │   ├── hooks/
│   │   └── lib/
│   └── package.json
├── tests/
├── backend_test.py
└── README.md
```

## Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+ and Yarn
- A MongoDB instance (local or Atlas)
- A Google Gemini API key (for the AI roadmap/chat features)

### Backend Setup

```bash
cd backend
pip install -r requirements.txt
```

Create a `.env` file inside `backend/` with:

```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=recruitflow
JWT_SECRET=your-secret-key
AI_API_KEY=your-gemini-api-key
```

Run the API server:

```bash
uvicorn server:app --reload
```

The API will be available at `http://localhost:8000/api`.

### Frontend Setup

```bash
cd frontend
yarn install
yarn start
```

The app will be available at `http://localhost:3000`.

### Running Tests

```bash
pytest backend_test.py
```

## API Overview

| Method | Endpoint                          | Description                          |
|--------|------------------------------------|---------------------------------------|
| POST   | `/api/auth/register`              | Register a new user (TPO or Student) |
| POST   | `/api/auth/login`                 | Log in and receive a JWT             |
| POST   | `/api/auth/profile-setup`         | Complete a student's profile         |
| GET    | `/api/auth/me`                    | Get the current authenticated user   |
| POST   | `/api/jobs`                       | Create a job listing (TPO only)      |
| GET    | `/api/jobs/all`                   | List all jobs (TPO only)             |
| PUT    | `/api/jobs/{job_id}`              | Update a job listing (TPO only)      |
| DELETE | `/api/jobs/{job_id}`              | Delete a job listing (TPO only)      |
| GET    | `/api/jobs/{job_id}/applicants`   | View applicants for a job (TPO only) |
| GET    | `/api/jobs/{job_id}/applicants/download` | Export applicants to Excel    |
| GET    | `/api/jobs/my-batch`              | List jobs eligible for the student's batch |
| POST   | `/api/jobs/{job_id}/apply`        | Apply to a job (Student only)        |
| POST   | `/api/ai/roadmap`                 | Generate an AI preparation roadmap   |
| POST   | `/api/ai/chat`                    | Chat with the AI career advisor      |


