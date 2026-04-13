from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Literal
from datetime import datetime, timezone, timedelta
import jwt
from passlib.context import CryptContext
from io import BytesIO
from openpyxl import Workbook

import asyncio
import httpx  # For making HTTP requests to Gemini API

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT and Password Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-super-secret-jwt-key-change-in-production')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 24

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# AI API Key - Replace with your own API key if needed
AI_API_KEY = os.environ.get('AI_API_KEY', '')

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# ============= MODELS =============

class StudentProfile(BaseModel):
    fullName: str
    rollNo: str
    email: EmailStr
    gpa: float = Field(ge=0.0, le=10.0)
    branch: str
    batch: int
    backlogsCount: int = Field(ge=0, default=0)
    resumeURL: Optional[str] = None

class UserBase(BaseModel):
    username: str
    role: Literal['TPO', 'Student']

class UserRegister(UserBase):
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class User(UserBase):
    model_config = ConfigDict(extra="ignore")
    id: str
    profile: Optional[StudentProfile] = None
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProfileSetup(BaseModel):
    fullName: str
    rollNo: str
    email: EmailStr
    gpa: float = Field(ge=0.0, le=10.0)
    branch: str
    batch: int
    backlogsCount: int = Field(ge=0, default=0)
    resumeURL: Optional[str] = None

class Applicant(BaseModel):
    studentId: str
    appliedDate: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class JobBase(BaseModel):
    title: str
    company: str
    jobType: Literal['On-Campus', 'Off-Campus']
    batchEligibility: int
    description: Optional[str] = None
    eligibilityCriteria: Optional[str] = None
    applicationLink: Optional[str] = None
    lastDateToApply: datetime

class JobCreate(JobBase):
    pass

class JobUpdate(BaseModel):
    title: Optional[str] = None
    company: Optional[str] = None
    jobType: Optional[Literal['On-Campus', 'Off-Campus']] = None
    batchEligibility: Optional[int] = None
    description: Optional[str] = None
    eligibilityCriteria: Optional[str] = None
    applicationLink: Optional[str] = None
    lastDateToApply: Optional[datetime] = None

class Job(JobBase):
    model_config = ConfigDict(extra="ignore")
    id: str
    applicants: List[Applicant] = []
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AIRoadmapRequest(BaseModel):
    companyName: str
    jobRole: str

class AIChatRequest(BaseModel):
    query: str

class TokenResponse(BaseModel):
    token: str
    role: str
    needsProfile: bool = False

# ============= HELPER FUNCTIONS =============

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_jwt_token(user_id: str, role: str) -> str:
    expiration = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    payload = {
        "sub": user_id,
        "role": role,
        "exp": expiration
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        role = payload.get("role")
        if not user_id or not role:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        return {"user_id": user_id, "role": role}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

async def require_tpo(auth_data: dict = Depends(verify_token)):
    if auth_data["role"] != "TPO":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="TPO access required")
    return auth_data

async def require_student(auth_data: dict = Depends(verify_token)):
    if auth_data["role"] != "Student":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Student access required")
    return auth_data

# ============= AUTH ROUTES =============

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserRegister):
    # Check if username already exists
    existing_user = await db.users.find_one({"username": user_data.username})
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username already exists")
    
    # Hash password
    hashed_pwd = hash_password(user_data.password)
    
    # Create user document
    from uuid import uuid4
    user_id = str(uuid4())
    user_doc = {
        "id": user_id,
        "username": user_data.username,
        "password": hashed_pwd,
        "role": user_data.role,
        "createdAt": datetime.now(timezone.utc).isoformat()
    }
    
    if user_data.role == "Student":
        user_doc["profile"] = None
    
    await db.users.insert_one(user_doc)
    
    # Generate token
    token = create_jwt_token(user_id, user_data.role)
    
    return TokenResponse(
        token=token,
        role=user_data.role,
        needsProfile=(user_data.role == "Student")
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    # Find user
    user = await db.users.find_one({"username": credentials.username})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    
    # Generate token
    token = create_jwt_token(user["id"], user["role"])
    
    needs_profile = False
    if user["role"] == "Student" and user.get("profile") is None:
        needs_profile = True
    
    return TokenResponse(
        token=token,
        role=user["role"],
        needsProfile=needs_profile
    )

@api_router.post("/auth/profile-setup")
async def profile_setup(profile_data: ProfileSetup, auth_data: dict = Depends(require_student)):
    user_id = auth_data["user_id"]
    
    # Check if rollNo or email already exists
    existing = await db.users.find_one({
        "id": {"$ne": user_id},
        "$or": [
            {"profile.rollNo": profile_data.rollNo},
            {"profile.email": profile_data.email}
        ]
    })
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Roll number or email already exists")
    
    # Update user profile
    profile_dict = profile_data.model_dump()
    result = await db.users.update_one(
        {"id": user_id},
        {"$set": {"profile": profile_dict}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    return {"message": "Profile setup complete"}

@api_router.get("/auth/me", response_model=User)
async def get_current_user(auth_data: dict = Depends(verify_token)):
    user = await db.users.find_one({"id": auth_data["user_id"]}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user

# ============= JOB ROUTES (TPO) =============

@api_router.post("/jobs", response_model=Job)
async def create_job(job_data: JobCreate, auth_data: dict = Depends(require_tpo)):
    from uuid import uuid4
    job_id = str(uuid4())
    
    job_doc = job_data.model_dump()
    job_doc["id"] = job_id
    job_doc["applicants"] = []
    job_doc["createdAt"] = datetime.now(timezone.utc).isoformat()
    job_doc["lastDateToApply"] = job_doc["lastDateToApply"].isoformat()
    
    await db.jobs.insert_one(job_doc)
    
    job_doc["lastDateToApply"] = job_data.lastDateToApply
    job_doc["createdAt"] = datetime.fromisoformat(job_doc["createdAt"])
    return job_doc

@api_router.get("/jobs/all", response_model=List[Job])
async def get_all_jobs(auth_data: dict = Depends(require_tpo)):
    jobs = await db.jobs.find({}, {"_id": 0}).to_list(1000)
    
    for job in jobs:
        if isinstance(job.get('createdAt'), str):
            job['createdAt'] = datetime.fromisoformat(job['createdAt'])
        if isinstance(job.get('lastDateToApply'), str):
            job['lastDateToApply'] = datetime.fromisoformat(job['lastDateToApply'])
        for applicant in job.get('applicants', []):
            if isinstance(applicant.get('appliedDate'), str):
                applicant['appliedDate'] = datetime.fromisoformat(applicant['appliedDate'])
    
    return jobs

@api_router.put("/jobs/{job_id}", response_model=Job)
async def update_job(job_id: str, job_data: JobUpdate, auth_data: dict = Depends(require_tpo)):
    update_dict = {k: v for k, v in job_data.model_dump().items() if v is not None}
    
    if "lastDateToApply" in update_dict:
        update_dict["lastDateToApply"] = update_dict["lastDateToApply"].isoformat()
    
    if not update_dict:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No fields to update")
    
    result = await db.jobs.update_one({"id": job_id}, {"$set": update_dict})
    
    if result.matched_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
    
    job = await db.jobs.find_one({"id": job_id}, {"_id": 0})
    if isinstance(job.get('createdAt'), str):
        job['createdAt'] = datetime.fromisoformat(job['createdAt'])
    if isinstance(job.get('lastDateToApply'), str):
        job['lastDateToApply'] = datetime.fromisoformat(job['lastDateToApply'])
    for applicant in job.get('applicants', []):
        if isinstance(applicant.get('appliedDate'), str):
            applicant['appliedDate'] = datetime.fromisoformat(applicant['appliedDate'])
    
    return job

@api_router.delete("/jobs/{job_id}")
async def delete_job(job_id: str, auth_data: dict = Depends(require_tpo)):
    result = await db.jobs.delete_one({"id": job_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
    
    return {"message": "Job deleted successfully"}

@api_router.get("/jobs/{job_id}/applicants")
async def get_job_applicants(job_id: str, auth_data: dict = Depends(require_tpo)):
    job = await db.jobs.find_one({"id": job_id}, {"_id": 0})
    
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
    
    applicant_ids = [app["studentId"] for app in job.get("applicants", [])]
    
    if not applicant_ids:
        return []
    
    # Fetch student details
    students = await db.users.find(
        {"id": {"$in": applicant_ids}, "role": "Student"},
        {"_id": 0, "password": 0}
    ).to_list(1000)
    
    # Combine with application dates
    applicant_map = {app["studentId"]: app["appliedDate"] for app in job["applicants"]}
    
    result = []
    for student in students:
        applied_date = applicant_map.get(student["id"])
        if isinstance(applied_date, str):
            applied_date = datetime.fromisoformat(applied_date)
        result.append({
            **student,
            "appliedDate": applied_date.isoformat() if applied_date else None
        })
    
    return result

@api_router.get("/jobs/{job_id}/applicants/download")
async def download_applicants(job_id: str, auth_data: dict = Depends(require_tpo)):
    job = await db.jobs.find_one({"id": job_id}, {"_id": 0})
    
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
    
    applicant_ids = [app["studentId"] for app in job.get("applicants", [])]
    
    if not applicant_ids:
        # Return empty Excel file
        wb = Workbook()
        ws = wb.active
        ws.title = "Applicants"
        ws.append(["Full Name", "Roll No", "Email", "GPA", "Branch", "Batch", "Backlogs"])
        
        output = BytesIO()
        wb.save(output)
        output.seek(0)
        
        return StreamingResponse(
            output,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename=applicants_{job_id}.xlsx"}
        )
    
    # Fetch student details
    students = await db.users.find(
        {"id": {"$in": applicant_ids}, "role": "Student"},
        {"_id": 0, "profile": 1}
    ).to_list(1000)
    
    # Create Excel file
    wb = Workbook()
    ws = wb.active
    ws.title = "Applicants"
    
    # Headers
    ws.append(["Full Name", "Roll No", "Email", "GPA", "Branch", "Batch", "Backlogs"])
    
    # Data rows
    for student in students:
        profile = student.get("profile", {})
        if profile:
            ws.append([
                profile.get("fullName", ""),
                profile.get("rollNo", ""),
                profile.get("email", ""),
                profile.get("gpa", ""),
                profile.get("branch", ""),
                profile.get("batch", ""),
                profile.get("backlogsCount", 0)
            ])
    
    # Save to BytesIO
    output = BytesIO()
    wb.save(output)
    output.seek(0)
    
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename=applicants_{job['company']}_{job['title']}.xlsx"}
    )

# ============= JOB ROUTES (STUDENT) =============

@api_router.get("/jobs/my-batch", response_model=List[Job])
async def get_student_jobs(auth_data: dict = Depends(require_student)):
    user_id = auth_data["user_id"]
    
    # Get student profile
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user or not user.get("profile"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Profile not set up")
    
    student_batch = user["profile"]["batch"]
    
    # Get jobs for this batch
    jobs = await db.jobs.find(
        {"batchEligibility": student_batch},
        {"_id": 0}
    ).to_list(1000)
    
    for job in jobs:
        if isinstance(job.get('createdAt'), str):
            job['createdAt'] = datetime.fromisoformat(job['createdAt'])
        if isinstance(job.get('lastDateToApply'), str):
            job['lastDateToApply'] = datetime.fromisoformat(job['lastDateToApply'])
        for applicant in job.get('applicants', []):
            if isinstance(applicant.get('appliedDate'), str):
                applicant['appliedDate'] = datetime.fromisoformat(applicant['appliedDate'])
    
    return jobs

@api_router.post("/jobs/{job_id}/apply")
async def apply_to_job(job_id: str, auth_data: dict = Depends(require_student)):
    user_id = auth_data["user_id"]
    
    # Check if job exists
    job = await db.jobs.find_one({"id": job_id})
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
    
    # Check if already applied
    if any(app["studentId"] == user_id for app in job.get("applicants", [])):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Already applied to this job")
    
    # Add applicant
    applicant = {
        "studentId": user_id,
        "appliedDate": datetime.now(timezone.utc).isoformat()
    }
    
    result = await db.jobs.update_one(
        {"id": job_id},
        {"$push": {"applicants": applicant}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to apply")
    
    return {"message": "Successfully applied to job"}

# ============= AI ROUTES =============

@api_router.post("/ai/roadmap")
async def generate_roadmap(request: AIRoadmapRequest, auth_data: dict = Depends(require_student)):
    if not AI_API_KEY:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="AI API key not configured")
    
    try:
        # Gemini API configuration - using gemini-2.5-flash model
        gemini_api_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={AI_API_KEY}"
        
        prompt = f"Generate a detailed 5-step preparation roadmap for a student applying for the {request.jobRole} role at {request.companyName}. Focus on key technical skills, behavioral preparation, company research, and interview strategies. Make it specific, actionable, and present it in a well-formatted Markdown list with clear headings and sub-points."
        
        payload = {
            "contents": [{
                "parts": [{
                    "text": prompt
                }]
            }],
            "generationConfig": {
                "temperature": 0.7,
                "topK": 1,
                "topP": 1,
                "maxOutputTokens": 4096,
            }
        }
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(gemini_api_url, json=payload)
            response.raise_for_status()
            
        result = response.json()
        
        # Extract the generated text from Gemini response
        if "candidates" in result and len(result["candidates"]) > 0:
            candidate = result["candidates"][0]
            
            # Try multiple response formats that Gemini might return
            generated_text = None
            
            # Format 1: Standard parts format
            if "content" in candidate and "parts" in candidate["content"] and len(candidate["content"]["parts"]) > 0:
                if "text" in candidate["content"]["parts"][0]:
                    generated_text = candidate["content"]["parts"][0]["text"]
            
            # Format 2: Direct text in content
            elif "content" in candidate and "text" in candidate["content"]:
                generated_text = candidate["content"]["text"]
            
            # Format 3: Check for other possible structures
            elif "content" in candidate and isinstance(candidate["content"], str):
                generated_text = candidate["content"]
            
            # Format 4: Check if there's a direct text field in candidate
            elif "text" in candidate:
                generated_text = candidate["text"]
            
            if generated_text:
                return {"roadmap": generated_text}
            else:
                # Log the full response for debugging
                logger.error(f"Could not extract text from Gemini response: {result}")
                raise ValueError(f"Could not extract text from Gemini response")
        else:
            raise ValueError("No response generated from Gemini API")
            
    except Exception as e:
        logger.error(f"AI roadmap error: {str(e)}", exc_info=True)
        # Fallback to hardcoded roadmap if API fails
        roadmap_md = (
            f"## {request.jobRole} at {request.companyName} - Preparation Roadmap\n\n"
            f"### 1. **Company & Role Research**\n"
            f"- Study {request.companyName}'s products, culture, and recent news\n"
            f"- Understand the {request.jobRole} responsibilities and requirements\n"
            f"- Review the company's tech stack and engineering practices\n\n"
            f"### 2. **Technical Skills Strengthening**\n"
            f"- Practice data structures and algorithms relevant to {request.jobRole}\n"
            f"- Review system design concepts and scalability principles\n"
            f"- Prepare for coding challenges and technical assessments\n\n"
            f"### 3. **Project & Portfolio Preparation**\n"
            f"- Showcase projects that demonstrate relevant skills for {request.jobRole}\n"
            f"- Prepare detailed explanations of your project architecture and decisions\n"
            f"- Have code samples ready that highlight your best work\n\n"
            f"### 4. **Interview Practice**\n"
            f"- Practice behavioral questions using STAR method\n"
            f"- Prepare for technical interviews with mock sessions\n"
            f"- Research common {request.jobRole} interview questions at {request.companyName}\n\n"
            f"### 5. **Final Preparation & Review**\n"
            f"- Review your resume and ensure it aligns with the job requirements\n"
            f"- Prepare thoughtful questions to ask the interviewer\n"
            f"- Practice your communication skills and professional presentation"
        )
        return {"roadmap": roadmap_md}

@api_router.post("/ai/chat")
async def ai_chat(request: AIChatRequest, auth_data: dict = Depends(require_student)):
    if not AI_API_KEY:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="AI service not configured")
    
    try:
        # Gemini API configuration - using gemini-2.5-flash model
        gemini_api_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={AI_API_KEY}"
        
        system_message = "You are a helpful career advisor for students preparing for job interviews. Provide helpful, specific advice about interview preparation, resume building, and career development. Keep responses concise and actionable."
        
        payload = {
            "contents": [{
                "parts": [{
                    "text": f"{system_message}\n\nUser: {request.query}"
                }]
            }],
            "generationConfig": {
                "temperature": 0.7,
                "topK": 1,
                "topP": 1,
                "maxOutputTokens": 2048,
            }
        }
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(gemini_api_url, json=payload)
            response.raise_for_status()
            
        result = response.json()
        
        # Log the full response for debugging
        logger.info(f"Gemini API response: {result}")
        
        # Extract the generated text from Gemini response
        if "candidates" in result and len(result["candidates"]) > 0:
            candidate = result["candidates"][0]
            
            # Try multiple response formats that Gemini might return
            generated_text = None
            
            # Format 1: Standard parts format
            if "content" in candidate and "parts" in candidate["content"] and len(candidate["content"]["parts"]) > 0:
                if "text" in candidate["content"]["parts"][0]:
                    generated_text = candidate["content"]["parts"][0]["text"]
            
            # Format 2: Direct text in content
            elif "content" in candidate and "text" in candidate["content"]:
                generated_text = candidate["content"]["text"]
            
            # Format 3: Check for other possible structures
            elif "content" in candidate and isinstance(candidate["content"], str):
                generated_text = candidate["content"]
            
            # Format 4: Check if there's a direct text field in candidate
            elif "text" in candidate:
                generated_text = candidate["text"]
            
            if generated_text:
                return {"response": generated_text}
            else:
                # Log the full response for debugging
                logger.error(f"Could not extract text from Gemini response: {result}")
                raise ValueError(f"Could not extract text from Gemini response")
        else:
            raise ValueError("No response generated from Gemini API")
            
    except Exception as e:
        logger.error(f"AI chat error: {str(e)}", exc_info=True)
        # Fallback response if API fails
        return {"response": "I'm currently unable to process your request. Please try again later or contact support if the issue persists."}

# Include the router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)