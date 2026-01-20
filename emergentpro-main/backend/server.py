from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
from enum import Enum
import io
import csv
import json
from contextlib import asynccontextmanager

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db_name = os.environ.get('DB_NAME', 'defense_pm')
db = client[db_name]

# JWT Settings
JWT_SECRET = os.environ.get('JWT_SECRET', 'defense-pm-secret-key-2024')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

security = HTTPBearer()

# Lifespan event handler
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Nothing needed here as MongoDB client is already initialized
    yield
    # Shutdown: Close MongoDB client
    client.close()

app = FastAPI(title="Defense Project Management System", lifespan=lifespan)
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ================= ENUMS =================
class UserRole(str, Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    USER = "user"

class ProjectStatus(str, Enum):
    PLANNING = "planning"
    IN_PROGRESS = "in_progress"
    ON_HOLD = "on_hold"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class TaskStatus(str, Enum):
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    REVIEW = "review"
    COMPLETED = "completed"
    BLOCKED = "blocked"

class TaskPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class RiskLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class ProjectTemplate(str, Enum):
    RND = "R&D"
    INFRASTRUCTURE = "Infrastructure"
    WEAPON_SYSTEMS = "Weapon Systems"
    IT = "IT"
    LOGISTICS = "Logistics"

class ClearanceLevel(str, Enum):
    PUBLIC = "public"
    CONFIDENTIAL = "confidential"
    SECRET = "secret"
    TOP_SECRET = "top_secret"

class ApprovalStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    ESCALATED = "escalated"

# ================= BASE MODELS =================
class UserBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    name: str
    role: UserRole = UserRole.USER
    clearance_level: ClearanceLevel = ClearanceLevel.PUBLIC
    department: Optional[str] = None
    rank: Optional[str] = None
    can_delegate: bool = False
    delegated_to: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    email: str
    password: str
    name: str
    role: UserRole = UserRole.USER
    clearance_level: ClearanceLevel = ClearanceLevel.PUBLIC
    department: Optional[str] = None
    rank: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: UserRole
    clearance_level: ClearanceLevel
    department: Optional[str] = None
    rank: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# Program Model
class ProgramBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    code: str
    description: Optional[str] = None
    objectives: List[str] = []
    charter: Optional[str] = None
    mandate: Optional[str] = None
    start_date: str
    end_date: str
    budget_total: float = 0
    budget_allocated: float = 0
    status: ProjectStatus = ProjectStatus.PLANNING
    health_score: int = 100
    owner_id: Optional[str] = None
    success_kpis: List[Dict[str, Any]] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProgramCreate(BaseModel):
    name: str
    code: str
    description: Optional[str] = None
    objectives: List[str] = []
    charter: Optional[str] = None
    mandate: Optional[str] = None
    start_date: str
    end_date: str
    budget_total: float = 0

# Project Model with enhanced fields
class ProjectBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    program_id: str
    parent_project_id: Optional[str] = None
    name: str
    code: str
    description: Optional[str] = None
    template: ProjectTemplate = ProjectTemplate.IT
    start_date: str
    end_date: str
    planned_start: Optional[str] = None
    planned_end: Optional[str] = None
    actual_start: Optional[str] = None
    actual_end: Optional[str] = None
    budget_allocated: float = 0
    budget_spent: float = 0
    budget_forecast: float = 0
    status: ProjectStatus = ProjectStatus.PLANNING
    health_score: int = 100
    progress: int = 0
    phase: str = "Phase 1"
    phase_gate_status: str = "pending"
    milestones: List[Dict[str, Any]] = []
    dependencies: List[Dict[str, Any]] = []
    kpis: List[Dict[str, Any]] = []
    manager_id: Optional[str] = None
    clearance_level: ClearanceLevel = ClearanceLevel.PUBLIC
    buffer_days: int = 0
    contingency_budget: float = 0
    schedule_variance: float = 0
    cost_variance: float = 0
    critical_path: List[str] = []
    go_no_go_status: Optional[str] = None
    scenarios: List[Dict[str, Any]] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProjectCreate(BaseModel):
    program_id: str
    parent_project_id: Optional[str] = None
    name: str
    code: str
    description: Optional[str] = None
    template: ProjectTemplate = ProjectTemplate.IT
    start_date: str
    end_date: str
    budget_allocated: float = 0
    buffer_days: int = 0
    contingency_budget: float = 0

# Task Model with enhanced WBS
class TaskBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    project_id: str
    parent_task_id: Optional[str] = None
    wbs_code: str
    wbs_level: int = 1
    name: str
    description: Optional[str] = None
    status: TaskStatus = TaskStatus.TODO
    priority: TaskPriority = TaskPriority.MEDIUM
    start_date: str
    end_date: str
    planned_start: Optional[str] = None
    planned_end: Optional[str] = None
    actual_start: Optional[str] = None
    actual_end: Optional[str] = None
    estimated_hours: float = 0
    actual_hours: float = 0
    progress: int = 0
    assigned_to: List[str] = []
    assigned_unit: Optional[str] = None
    assigned_vendor: Optional[str] = None
    dependencies: List[Dict[str, Any]] = []
    tags: List[str] = []
    classification: Optional[str] = None
    clearance_level: ClearanceLevel = ClearanceLevel.PUBLIC
    acceptance_criteria: Optional[str] = None
    acceptance_status: Optional[str] = None
    accepted_by: Optional[str] = None
    accepted_at: Optional[str] = None
    closure_notes: Optional[str] = None
    is_critical_path: bool = False
    float_days: float = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TaskCreate(BaseModel):
    project_id: str
    parent_task_id: Optional[str] = None
    wbs_code: str
    name: str
    description: Optional[str] = None
    priority: TaskPriority = TaskPriority.MEDIUM
    start_date: str
    end_date: str
    estimated_hours: float = 0
    assigned_to: List[str] = []
    assigned_unit: Optional[str] = None
    assigned_vendor: Optional[str] = None
    acceptance_criteria: Optional[str] = None

# Resource Model with enhanced capacity planning
class ResourceBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    type: str
    department: Optional[str] = None
    unit: Optional[str] = None
    skills: List[str] = []
    certifications: List[str] = []
    clearance_level: ClearanceLevel = ClearanceLevel.PUBLIC
    availability: int = 100
    capacity_hours: float = 160
    allocated_hours: float = 0
    hourly_rate: float = 0
    allocated_projects: List[str] = []
    utilization: int = 0
    burnout_risk: str = "low"
    conflicts: List[Dict[str, Any]] = []
    leave_schedule: List[Dict[str, Any]] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ResourceCreate(BaseModel):
    name: str
    type: str
    department: Optional[str] = None
    unit: Optional[str] = None
    skills: List[str] = []
    certifications: List[str] = []
    clearance_level: ClearanceLevel = ClearanceLevel.PUBLIC
    capacity_hours: float = 160
    hourly_rate: float = 0

# Budget Model with fund release tracking
class BudgetEntryBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    project_id: str
    category: str
    sub_category: Optional[str] = None
    description: str
    amount_planned: float
    amount_actual: float = 0
    amount_forecast: float = 0
    amount_released: float = 0
    fiscal_year: str
    quarter: str
    status: str = "pending"
    approval_id: Optional[str] = None
    approved_by: Optional[str] = None
    approved_at: Optional[str] = None
    release_stage: Optional[str] = None
    variance: float = 0
    variance_reason: Optional[str] = None
    is_overrun: bool = False
    overrun_alert_sent: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class BudgetCreate(BaseModel):
    project_id: str
    category: str
    sub_category: Optional[str] = None
    description: str
    amount_planned: float
    fiscal_year: str
    quarter: str
    release_stage: Optional[str] = None

# Risk Model with mitigation tracking
class RiskBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    project_id: str
    title: str
    description: Optional[str] = None
    category: str
    probability: int = 1
    impact: int = 1
    risk_score: int = 1
    level: RiskLevel = RiskLevel.LOW
    mitigation_plan: Optional[str] = None
    mitigation_status: str = "not_started"
    mitigation_progress: int = 0
    contingency_plan: Optional[str] = None
    contingency_triggered: bool = False
    owner_id: Optional[str] = None
    status: str = "open"
    escalation_level: int = 0
    escalated_to: Optional[str] = None
    escalation_reason: Optional[str] = None
    related_dependencies: List[str] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class RiskCreate(BaseModel):
    project_id: str
    title: str
    description: Optional[str] = None
    category: str
    probability: int = 1
    impact: int = 1
    mitigation_plan: Optional[str] = None
    contingency_plan: Optional[str] = None

# Vendor Model with contract tracking
class VendorBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    code: str
    contact_email: str
    contact_phone: Optional[str] = None
    category: str
    rating: int = 0
    contracts_active: int = 0
    total_value: float = 0
    status: str = "active"
    risk_flags: List[str] = []
    performance_history: List[Dict[str, Any]] = []
    due_diligence_status: str = "pending"
    due_diligence_date: Optional[str] = None
    blacklist_reason: Optional[str] = None
    sla_compliance: float = 100
    penalty_amount: float = 0
    contracts: List[Dict[str, Any]] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class VendorCreate(BaseModel):
    name: str
    code: str
    contact_email: str
    contact_phone: Optional[str] = None
    category: str

# Contract Model
class ContractBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    vendor_id: str
    project_id: str
    contract_number: str
    title: str
    value: float
    start_date: str
    end_date: str
    status: str = "active"
    milestones: List[Dict[str, Any]] = []
    deliverables: List[Dict[str, Any]] = []
    sla_terms: List[Dict[str, Any]] = []
    penalties: List[Dict[str, Any]] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ContractCreate(BaseModel):
    vendor_id: str
    project_id: str
    contract_number: str
    title: str
    value: float
    start_date: str
    end_date: str

# Approval Workflow Model
class ApprovalBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    entity_type: str
    entity_id: str
    title: str
    description: Optional[str] = None
    amount: Optional[float] = None
    requested_by: str
    requested_by_name: Optional[str] = None
    current_level: int = 1
    total_levels: int = 3
    approvers: List[Dict[str, Any]] = []
    approval_chain: List[Dict[str, Any]] = []
    status: ApprovalStatus = ApprovalStatus.PENDING
    sla_hours: int = 48
    sla_deadline: Optional[str] = None
    is_escalated: bool = False
    is_emergency: bool = False
    emergency_override_by: Optional[str] = None
    emergency_reason: Optional[str] = None
    digital_signature: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ApprovalCreate(BaseModel):
    entity_type: str
    entity_id: str
    title: str
    description: Optional[str] = None
    amount: Optional[float] = None
    total_levels: int = 3
    sla_hours: int = 48

# Issue Model
class IssueBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    project_id: str
    title: str
    description: Optional[str] = None
    category: str
    severity: str = "medium"
    status: str = "open"
    reported_by: str
    assigned_to: Optional[str] = None
    resolution: Optional[str] = None
    escalation_level: int = 0
    escalated_to: Optional[str] = None
    due_date: Optional[str] = None
    resolved_at: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class IssueCreate(BaseModel):
    project_id: str
    title: str
    description: Optional[str] = None
    category: str
    severity: str = "medium"
    assigned_to: Optional[str] = None
    due_date: Optional[str] = None

# ================= AUTH HELPERS =================
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict:
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ================= AUTH ROUTES =================
@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user = UserBase(
        email=user_data.email,
        name=user_data.name,
        role=user_data.role,
        clearance_level=user_data.clearance_level,
        department=user_data.department,
        rank=user_data.rank
    )
    
    user_dict = user.model_dump()
    user_dict['password_hash'] = hash_password(user_data.password)
    user_dict['created_at'] = user_dict['created_at'].isoformat()
    
    await db.users.insert_one(user_dict)
    
    token = create_token(user.id, user.email, user.role.value)
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user.id,
            email=user.email,
            name=user.name,
            role=user.role,
            clearance_level=user.clearance_level,
            department=user.department,
            rank=user.rank
        )
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
        
    # Check password
    stored_hash = user.get('password_hash', '')
    if not verify_password(credentials.password, stored_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(user['id'], user['email'], user['role'])
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user['id'],
            email=user['email'],
            name=user['name'],
            role=user['role'],
            clearance_level=user['clearance_level'],
            department=user.get('department'),
            rank=user.get('rank')
        )
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: Dict = Depends(get_current_user)):
    return UserResponse(**current_user)

@api_router.get("/users")
async def get_users(current_user: Dict = Depends(get_current_user)):
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(1000)
    return users

# ================= PROGRAMS ROUTES =================
@api_router.get("/programs")
async def get_programs():
    programs = await db.programs.find({}, {"_id": 0}).to_list(1000)
    return programs

@api_router.get("/programs/{program_id}")
async def get_program(program_id: str):
    program = await db.programs.find_one({"id": program_id}, {"_id": 0})
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")
    return program

@api_router.post("/programs")
async def create_program(program_data: ProgramCreate, current_user: Dict = Depends(get_current_user)):
    program = ProgramBase(**program_data.model_dump(), owner_id=current_user['id'])
    program_dict = program.model_dump()
    program_dict['created_at'] = program_dict['created_at'].isoformat()
    program_dict['updated_at'] = program_dict['updated_at'].isoformat()
    await db.programs.insert_one(program_dict)
    program_dict.pop('_id', None)
    return program_dict

@api_router.put("/programs/{program_id}")
async def update_program(program_id: str, update_data: Dict[str, Any], current_user: Dict = Depends(get_current_user)):
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    result = await db.programs.update_one({"id": program_id}, {"$set": update_data})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Program not found")
    return await db.programs.find_one({"id": program_id}, {"_id": 0})

@api_router.delete("/programs/{program_id}")
async def delete_program(program_id: str, current_user: Dict = Depends(get_current_user)):
    result = await db.programs.delete_one({"id": program_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Program not found")
    return {"message": "Program deleted"}

# ================= PROJECTS ROUTES =================
@api_router.get("/projects")
async def get_projects(program_id: Optional[str] = None, include_subprojects: bool = True):
    query = {}
    if program_id:
        query["program_id"] = program_id
    projects = await db.projects.find(query, {"_id": 0}).to_list(1000)
    return projects

@api_router.get("/projects/{project_id}")
async def get_project(project_id: str):
    project = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@api_router.post("/projects")
async def create_project(project_data: ProjectCreate, current_user: Dict = Depends(get_current_user)):
    project = ProjectBase(**project_data.model_dump(), manager_id=current_user['id'])
    project_dict = project.model_dump()
    project_dict['created_at'] = project_dict['created_at'].isoformat()
    project_dict['updated_at'] = project_dict['updated_at'].isoformat()
    await db.projects.insert_one(project_dict)
    project_dict.pop('_id', None)
    return project_dict

@api_router.put("/projects/{project_id}")
async def update_project(project_id: str, update_data: Dict[str, Any], current_user: Dict = Depends(get_current_user)):
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    # Calculate health score based on various factors
    if 'progress' in update_data or 'budget_spent' in update_data:
        project = await db.projects.find_one({"id": project_id}, {"_id": 0})
        if project:
            progress = update_data.get('progress', project.get('progress', 0))
            budget_allocated = project.get('budget_allocated', 1)
            budget_spent = update_data.get('budget_spent', project.get('budget_spent', 0))
            
            # Simple health score calculation
            budget_health = 100 - min(100, max(0, ((budget_spent / budget_allocated) - 1) * 100)) if budget_allocated > 0 else 100
            schedule_health = min(100, progress + 20)  # Simplified
            update_data['health_score'] = int((budget_health + schedule_health) / 2)
            
            # Calculate variance
            if budget_allocated > 0:
                update_data['cost_variance'] = ((budget_allocated - budget_spent) / budget_allocated) * 100
    
    result = await db.projects.update_one({"id": project_id}, {"$set": update_data})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    return await db.projects.find_one({"id": project_id}, {"_id": 0})

@api_router.delete("/projects/{project_id}")
async def delete_project(project_id: str, current_user: Dict = Depends(get_current_user)):
    result = await db.projects.delete_one({"id": project_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"message": "Project deleted"}

@api_router.post("/projects/{project_id}/go-no-go")
async def update_go_no_go(project_id: str, decision: Dict[str, Any], current_user: Dict = Depends(get_current_user)):
    update_data = {
        "go_no_go_status": decision.get("status", "pending"),
        "phase_gate_status": decision.get("status", "pending"),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    result = await db.projects.update_one({"id": project_id}, {"$set": update_data})
    return await db.projects.find_one({"id": project_id}, {"_id": 0})

@api_router.post("/projects/{project_id}/scenarios")
async def add_scenario(project_id: str, scenario: Dict[str, Any], current_user: Dict = Depends(get_current_user)):
    scenario['id'] = str(uuid.uuid4())
    scenario['created_at'] = datetime.now(timezone.utc).isoformat()
    result = await db.projects.update_one(
        {"id": project_id},
        {"$push": {"scenarios": scenario}}
    )
    return await db.projects.find_one({"id": project_id}, {"_id": 0})

# ================= GANTT / SCHEDULING ROUTES =================
@api_router.get("/projects/{project_id}/gantt")
async def get_gantt_data(project_id: str):
    tasks = await db.tasks.find({"project_id": project_id}, {"_id": 0}).to_list(1000)
    project = await db.projects.find_one({"id": project_id}, {"_id": 0})
    
    gantt_data = []
    for task in tasks:
        gantt_data.append({
            "id": task['id'],
            "name": task['name'],
            "wbs_code": task['wbs_code'],
            "start": task['start_date'],
            "end": task['end_date'],
            "progress": task.get('progress', 0),
            "dependencies": task.get('dependencies', []),
            "status": task.get('status', 'todo'),
            "is_critical": task.get('is_critical_path', False),
            "assignees": task.get('assigned_to', [])
        })
    
    return {
        "project": project,
        "tasks": gantt_data,
        "milestones": project.get('milestones', []) if project else []
    }

@api_router.get("/projects/{project_id}/critical-path")
async def get_critical_path(project_id: str):
    tasks = await db.tasks.find({"project_id": project_id}, {"_id": 0}).to_list(1000)
    
    # Simple critical path calculation based on dependencies and duration
    critical_tasks = []
    for task in tasks:
        if task.get('is_critical_path') or task.get('float_days', 0) == 0:
            critical_tasks.append(task['id'])
    
    return {
        "critical_path": critical_tasks,
        "total_duration_days": len(tasks) * 5  # Simplified
    }

# ================= TASKS ROUTES =================
@api_router.get("/tasks")
async def get_tasks(project_id: Optional[str] = None):
    query = {"project_id": project_id} if project_id else {}
    tasks = await db.tasks.find(query, {"_id": 0}).to_list(1000)
    return tasks

@api_router.get("/tasks/{task_id}")
async def get_task(task_id: str):
    task = await db.tasks.find_one({"id": task_id}, {"_id": 0})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

@api_router.post("/tasks")
async def create_task(task_data: TaskCreate, current_user: Dict = Depends(get_current_user)):
    # Calculate WBS level
    wbs_level = len(task_data.wbs_code.split('.'))
    
    task = TaskBase(**task_data.model_dump(), wbs_level=wbs_level)
    task_dict = task.model_dump()
    task_dict['created_at'] = task_dict['created_at'].isoformat()
    task_dict['updated_at'] = task_dict['updated_at'].isoformat()
    await db.tasks.insert_one(task_dict)
    task_dict.pop('_id', None)
    return task_dict

@api_router.put("/tasks/{task_id}")
async def update_task(task_id: str, update_data: Dict[str, Any], current_user: Dict = Depends(get_current_user)):
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    result = await db.tasks.update_one({"id": task_id}, {"$set": update_data})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    return await db.tasks.find_one({"id": task_id}, {"_id": 0})

@api_router.delete("/tasks/{task_id}")
async def delete_task(task_id: str, current_user: Dict = Depends(get_current_user)):
    result = await db.tasks.delete_one({"id": task_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"message": "Task deleted"}

@api_router.post("/tasks/{task_id}/accept")
async def accept_task(task_id: str, acceptance: Dict[str, Any], current_user: Dict = Depends(get_current_user)):
    update_data = {
        "acceptance_status": acceptance.get("status", "accepted"),
        "accepted_by": current_user['id'],
        "accepted_at": datetime.now(timezone.utc).isoformat(),
        "status": "completed" if acceptance.get("status") == "accepted" else "review",
        "closure_notes": acceptance.get("notes", ""),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    result = await db.tasks.update_one({"id": task_id}, {"$set": update_data})
    return await db.tasks.find_one({"id": task_id}, {"_id": 0})

# # ================= RESOURCES ROUTES =================
# @api_router.get("/resources")
# async def get_resources(type: Optional[str] = None, clearance: Optional[str] = None):
#     query = {}
#     if type:
#         query["type"] = type
#     if clearance:
#         query["clearance_level"] = clearance
#     resources = await db.resources.find(query, {"_id": 0}).to_list(1000)
#     return resources

# @api_router.get("/resources/{resource_id}")
# async def get_resource(resource_id: str):
#     resource = await db.resources.find_one({"id": resource_id}, {"_id": 0})
#     if not resource:
#         raise HTTPException(status_code=404, detail="Resource not found")
#     return resource

# @api_router.post("/resources")
# async def create_resource(resource_data: ResourceCreate, current_user: Dict = Depends(get_current_user)):
#     resource = ResourceBase(**resource_data.model_dump())
#     resource_dict = resource.model_dump()
#     resource_dict['created_at'] = resource_dict['created_at'].isoformat()
#     await db.resources.insert_one(resource_dict)
#     resource_dict.pop('_id', None)
#     return resource_dict

# @api_router.put("/resources/{resource_id}")
# async def update_resource(resource_id: str, update_data: Dict[str, Any], current_user: Dict = Depends(get_current_user)):
#     # Calculate utilization and burnout risk
#     if 'allocated_hours' in update_data:
#         resource = await db.resources.find_one({"id": resource_id}, {"_id": 0})
#         if resource:
#             capacity = resource.get('capacity_hours', 160)
#             allocated = update_data.get('allocated_hours', 0)
#             utilization = min(100, int((allocated / capacity) * 100)) if capacity > 0 else 0
#             update_data['utilization'] = utilization
            
#             if utilization > 100:
#                 update_data['burnout_risk'] = "critical"
#             elif utilization > 85:
#                 update_data['burnout_risk'] = "high"
#             elif utilization > 70:
#                 update_data['burnout_risk'] = "medium"
#             else:
#                 update_data['burnout_risk'] = "low"
    
#     result = await db.resources.update_one({"id": resource_id}, {"$set": update_data})
#     if result.modified_count == 0:
#         raise HTTPException(status_code=404, detail="Resource not found")
#     return await db.resources.find_one({"id": resource_id}, {"_id": 0})

# @api_router.get("/resources/conflicts/check")
# async def check_resource_conflicts():
#     resources = await db.resources.find({}, {"_id": 0}).to_list(1000)
#     conflicts = []
    
#     for resource in resources:
#         if resource.get('utilization', 0) > 100:
#             conflicts.append({
#                 "resource_id": resource['id'],
#                 "resource_name": resource['name'],
#                 "type": "over_allocation",
#                 "utilization": resource.get('utilization', 0),
#                 "allocated_projects": resource.get('allocated_projects', [])
#             })
    
#     return conflicts

# ================= RESOURCES ROUTES =================
@api_router.get("/resources")
async def get_resources(type: Optional[str] = None, clearance: Optional[str] = None):
    query = {}
    if type:
        query["type"] = type
    if clearance:
        query["clearance_level"] = clearance
    resources = await db.resources.find(query, {"_id": 0}).to_list(1000)
    return resources

@api_router.get("/resources/{resource_id}")
async def get_resource(resource_id: str):
    resource = await db.resources.find_one({"id": resource_id}, {"_id": 0})
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    return resource

@api_router.post("/resources")
async def create_resource(resource_data: ResourceCreate, current_user: Dict = Depends(get_current_user)):
    resource = ResourceBase(**resource_data.model_dump())
    resource_dict = resource.model_dump()
    resource_dict['created_at'] = resource_dict['created_at'].isoformat()
    await db.resources.insert_one(resource_dict)
    resource_dict.pop('_id', None)
    return resource_dict

@api_router.put("/resources/{resource_id}")
async def update_resource(resource_id: str, update_data: Dict[str, Any], current_user: Dict = Depends(get_current_user)):
    # Calculate utilization and burnout risk
    if 'allocated_hours' in update_data:
        resource = await db.resources.find_one({"id": resource_id}, {"_id": 0})
        if resource:
            capacity = resource.get('capacity_hours', 160)
            allocated = update_data.get('allocated_hours', 0)
            utilization = min(100, int((allocated / capacity) * 100)) if capacity > 0 else 0
            update_data['utilization'] = utilization
            
            if utilization > 100:
                update_data['burnout_risk'] = "critical"
            elif utilization > 85:
                update_data['burnout_risk'] = "high"
            elif utilization > 70:
                update_data['burnout_risk'] = "medium"
            else:
                update_data['burnout_risk'] = "low"
    
    result = await db.resources.update_one({"id": resource_id}, {"$set": update_data})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Resource not found")
    return await db.resources.find_one({"id": resource_id}, {"_id": 0})

@api_router.get("/resources/conflicts/check")
async def check_resource_conflicts():
    resources = await db.resources.find({}, {"_id": 0}).to_list(1000)
    conflicts = []
    
    for resource in resources:
        if resource.get('utilization', 0) > 100:
            conflicts.append({
                "resource_id": resource['id'],
                "resource_name": resource['name'],
                "type": "over_allocation",
                "utilization": resource.get('utilization', 0),
                "allocated_projects": resource.get('allocated_projects', [])
            })
    
    return conflicts

# Delete resource
@api_router.delete("/resources/{resource_id}")
async def delete_resource(resource_id: str, current_user: Dict = Depends(get_current_user)):
    resource = await db.resources.find_one({"id": resource_id}, {"_id": 0})
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    
    result = await db.resources.delete_one({"id": resource_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Resource not found")
    
    return {"message": "Resource deleted successfully", "id": resource_id}

# Allocate resource to project
@api_router.post("/resources/{resource_id}/allocate")
async def allocate_resource(resource_id: str, allocation: Dict[str, Any], current_user: Dict = Depends(get_current_user)):
    resource = await db.resources.find_one({"id": resource_id}, {"_id": 0})
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    
    project_id = allocation.get("project_id")
    hours = allocation.get("hours", 0)
    
    # Check project exists
    project = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Check clearance level compatibility
    clearance_order = ["public", "confidential", "secret", "top_secret"]
    resource_clearance = resource.get("clearance_level", "public")
    project_clearance = project.get("clearance_level", "public")
    
    if clearance_order.index(resource_clearance) < clearance_order.index(project_clearance):
        raise HTTPException(
            status_code=403, 
            detail=f"Resource clearance level ({resource_clearance}) insufficient for project ({project_clearance})"
        )
    
    # Update allocation
    allocated_projects = resource.get("allocated_projects", [])
    if project_id not in allocated_projects:
        allocated_projects.append(project_id)
    
    new_allocated_hours = resource.get("allocated_hours", 0) + hours
    capacity = resource.get("capacity_hours", 160)
    utilization = min(150, int((new_allocated_hours / capacity) * 100)) if capacity > 0 else 0
    
    # Calculate burnout risk
    if utilization > 100:
        burnout_risk = "critical"
    elif utilization > 85:
        burnout_risk = "high"
    elif utilization > 70:
        burnout_risk = "medium"
    else:
        burnout_risk = "low"
    
    update_data = {
        "allocated_projects": allocated_projects,
        "allocated_hours": new_allocated_hours,
        "utilization": utilization,
        "burnout_risk": burnout_risk,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.resources.update_one({"id": resource_id}, {"$set": update_data})
    return await db.resources.find_one({"id": resource_id}, {"_id": 0})

# Deallocate resource from project
@api_router.post("/resources/{resource_id}/deallocate")
async def deallocate_resource(resource_id: str, deallocation: Dict[str, Any], current_user: Dict = Depends(get_current_user)):
    resource = await db.resources.find_one({"id": resource_id}, {"_id": 0})
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    
    project_id = deallocation.get("project_id")
    hours = deallocation.get("hours", 0)
    
    allocated_projects = resource.get("allocated_projects", [])
    if project_id in allocated_projects:
        allocated_projects.remove(project_id)
    
    new_allocated_hours = max(0, resource.get("allocated_hours", 0) - hours)
    capacity = resource.get("capacity_hours", 160)
    utilization = min(150, int((new_allocated_hours / capacity) * 100)) if capacity > 0 else 0
    
    # Calculate burnout risk
    if utilization > 100:
        burnout_risk = "critical"
    elif utilization > 85:
        burnout_risk = "high"
    elif utilization > 70:
        burnout_risk = "medium"
    else:
        burnout_risk = "low"
    
    update_data = {
        "allocated_projects": allocated_projects,
        "allocated_hours": new_allocated_hours,
        "utilization": utilization,
        "burnout_risk": burnout_risk,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.resources.update_one({"id": resource_id}, {"$set": update_data})
    return await db.resources.find_one({"id": resource_id}, {"_id": 0})

# Search resources by skills
@api_router.get("/resources/search/skills")
async def search_resources_by_skills(skills: str = Query(..., description="Comma-separated skills to search")):
    skill_list = [s.strip().lower() for s in skills.split(",")]
    
    resources = await db.resources.find({}, {"_id": 0}).to_list(1000)
    
    matched = []
    for resource in resources:
        resource_skills = [s.lower() for s in resource.get("skills", [])]
        matching_skills = [s for s in skill_list if s in resource_skills]
        if matching_skills:
            matched.append({
                **resource,
                "matching_skills": matching_skills,
                "match_score": len(matching_skills) / len(skill_list) * 100
            })
    
    # Sort by match score
    matched.sort(key=lambda x: x["match_score"], reverse=True)
    return matched

# Search resources by certification
@api_router.get("/resources/search/certifications")
async def search_resources_by_certifications(certifications: str = Query(..., description="Comma-separated certifications")):
    cert_list = [c.strip().lower() for c in certifications.split(",")]
    
    resources = await db.resources.find({}, {"_id": 0}).to_list(1000)
    
    matched = []
    for resource in resources:
        resource_certs = [c.lower() for c in resource.get("certifications", [])]
        matching_certs = [c for c in cert_list if c in resource_certs]
        if matching_certs:
            matched.append({
                **resource,
                "matching_certifications": matching_certs,
                "match_score": len(matching_certs) / len(cert_list) * 100
            })
    
    matched.sort(key=lambda x: x["match_score"], reverse=True)
    return matched

# Get resources by clearance level
@api_router.get("/resources/clearance/{level}")
async def get_resources_by_clearance(level: str):
    clearance_order = ["public", "confidential", "secret", "top_secret"]
    if level not in clearance_order:
        raise HTTPException(status_code=400, detail="Invalid clearance level")
    
    # Get resources with clearance >= specified level
    min_index = clearance_order.index(level)
    valid_clearances = clearance_order[min_index:]
    
    resources = await db.resources.find(
        {"clearance_level": {"$in": valid_clearances}}, 
        {"_id": 0}
    ).to_list(1000)
    return resources

# Get capacity planning overview
@api_router.get("/resources/capacity/overview")
async def get_capacity_overview():
    resources = await db.resources.find({}, {"_id": 0}).to_list(1000)
    
    total_capacity = sum(r.get("capacity_hours", 0) for r in resources)
    total_allocated = sum(r.get("allocated_hours", 0) for r in resources)
    avg_utilization = sum(r.get("utilization", 0) for r in resources) / len(resources) if resources else 0
    
    # Group by type
    by_type = {}
    for r in resources:
        rtype = r.get("type", "unknown")
        if rtype not in by_type:
            by_type[rtype] = {"count": 0, "capacity": 0, "allocated": 0, "avg_utilization": 0}
        by_type[rtype]["count"] += 1
        by_type[rtype]["capacity"] += r.get("capacity_hours", 0)
        by_type[rtype]["allocated"] += r.get("allocated_hours", 0)
        by_type[rtype]["avg_utilization"] += r.get("utilization", 0)
    
    for rtype in by_type:
        if by_type[rtype]["count"] > 0:
            by_type[rtype]["avg_utilization"] = round(by_type[rtype]["avg_utilization"] / by_type[rtype]["count"], 1)
    
    # Burnout risk distribution
    burnout_distribution = {"low": 0, "medium": 0, "high": 0, "critical": 0}
    for r in resources:
        risk = r.get("burnout_risk", "low")
        burnout_distribution[risk] = burnout_distribution.get(risk, 0) + 1
    
    # Available resources (< 70% utilization)
    available = [r for r in resources if r.get("utilization", 0) < 70]
    
    # Over-allocated resources (> 100%)
    over_allocated = [r for r in resources if r.get("utilization", 0) > 100]
    
    return {
        "total_resources": len(resources),
        "total_capacity_hours": total_capacity,
        "total_allocated_hours": total_allocated,
        "overall_utilization": round(avg_utilization, 1),
        "available_capacity_hours": total_capacity - total_allocated,
        "by_type": by_type,
        "burnout_distribution": burnout_distribution,
        "available_count": len(available),
        "over_allocated_count": len(over_allocated),
        "available_resources": [{"id": r["id"], "name": r["name"], "utilization": r.get("utilization", 0)} for r in available[:10]],
        "over_allocated_resources": [{"id": r["id"], "name": r["name"], "utilization": r.get("utilization", 0)} for r in over_allocated]
    }

# Get skills summary
@api_router.get("/resources/skills/summary")
async def get_skills_summary():
    resources = await db.resources.find({}, {"_id": 0}).to_list(1000)
    
    # Aggregate all skills
    skills_count = {}
    for r in resources:
        for skill in r.get("skills", []):
            skills_count[skill] = skills_count.get(skill, 0) + 1
    
    # Sort by count
    sorted_skills = sorted(skills_count.items(), key=lambda x: x[1], reverse=True)
    
    return {
        "total_unique_skills": len(skills_count),
        "skills": [{"skill": s, "count": c} for s, c in sorted_skills]
    }

# Get certifications summary
@api_router.get("/resources/certifications/summary")
async def get_certifications_summary():
    resources = await db.resources.find({}, {"_id": 0}).to_list(1000)
    
    certs_count = {}
    for r in resources:
        for cert in r.get("certifications", []):
            certs_count[cert] = certs_count.get(cert, 0) + 1
    
    sorted_certs = sorted(certs_count.items(), key=lambda x: x[1], reverse=True)
    
    return {
        "total_unique_certifications": len(certs_count),
        "certifications": [{"certification": c, "count": cnt} for c, cnt in sorted_certs]
    }

# Get resource workload for a specific project
@api_router.get("/resources/project/{project_id}/allocation")
async def get_project_resource_allocation(project_id: str):
    resources = await db.resources.find(
        {"allocated_projects": project_id}, 
        {"_id": 0}
    ).to_list(1000)
    
    project = await db.projects.find_one({"id": project_id}, {"_id": 0})
    
    return {
        "project_id": project_id,
        "project_name": project.get("name") if project else "Unknown",
        "allocated_resources": len(resources),
        "resources": resources,
        "total_hours": sum(r.get("allocated_hours", 0) for r in resources),
        "clearance_breakdown": {
            level: len([r for r in resources if r.get("clearance_level") == level])
            for level in ["public", "confidential", "secret", "top_secret"]
        }
    }

# Bulk update resource allocations
@api_router.post("/resources/bulk/allocate")
async def bulk_allocate_resources(allocations: List[Dict[str, Any]], current_user: Dict = Depends(get_current_user)):
    results = []
    for alloc in allocations:
        resource_id = alloc.get("resource_id")
        project_id = alloc.get("project_id")
        hours = alloc.get("hours", 0)
        
        try:
            resource = await db.resources.find_one({"id": resource_id}, {"_id": 0})
            if not resource:
                results.append({"resource_id": resource_id, "status": "error", "message": "Resource not found"})
                continue
            
            allocated_projects = resource.get("allocated_projects", [])
            if project_id not in allocated_projects:
                allocated_projects.append(project_id)
            
            new_allocated_hours = resource.get("allocated_hours", 0) + hours
            capacity = resource.get("capacity_hours", 160)
            utilization = min(150, int((new_allocated_hours / capacity) * 100)) if capacity > 0 else 0
            
            burnout_risk = "low"
            if utilization > 100:
                burnout_risk = "critical"
            elif utilization > 85:
                burnout_risk = "high"
            elif utilization > 70:
                burnout_risk = "medium"
            
            await db.resources.update_one({"id": resource_id}, {"$set": {
                "allocated_projects": allocated_projects,
                "allocated_hours": new_allocated_hours,
                "utilization": utilization,
                "burnout_risk": burnout_risk,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }})
            
            results.append({"resource_id": resource_id, "status": "success", "utilization": utilization})
        except Exception as e:
            results.append({"resource_id": resource_id, "status": "error", "message": str(e)})
    
    return {"results": results}

# ================= BUDGET ROUTES =================
@api_router.get("/budget")
async def get_budget_entries(project_id: Optional[str] = None, fiscal_year: Optional[str] = None):
    query = {}
    if project_id:
        query["project_id"] = project_id
    if fiscal_year:
        query["fiscal_year"] = fiscal_year
    entries = await db.budget.find(query, {"_id": 0}).to_list(1000)
    return entries

@api_router.post("/budget")
async def create_budget_entry(budget_data: BudgetCreate, current_user: Dict = Depends(get_current_user)):
    entry = BudgetEntryBase(**budget_data.model_dump())
    entry_dict = entry.model_dump()
    entry_dict['created_at'] = entry_dict['created_at'].isoformat()
    await db.budget.insert_one(entry_dict)
    entry_dict.pop('_id', None)
    return entry_dict

@api_router.put("/budget/{entry_id}")
async def update_budget_entry(entry_id: str, update_data: Dict[str, Any], current_user: Dict = Depends(get_current_user)):
    # Calculate variance and check for overrun
    entry = await db.budget.find_one({"id": entry_id}, {"_id": 0})
    if entry:
        planned = entry.get('amount_planned', 0)
        actual = update_data.get('amount_actual', entry.get('amount_actual', 0))
        update_data['variance'] = planned - actual
        update_data['is_overrun'] = actual > planned
        
        if update_data['is_overrun'] and not entry.get('overrun_alert_sent'):
            update_data['overrun_alert_sent'] = True
            # In real app, trigger alert notification
    
    result = await db.budget.update_one({"id": entry_id}, {"$set": update_data})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Budget entry not found")
    return await db.budget.find_one({"id": entry_id}, {"_id": 0})

@api_router.post("/budget/{entry_id}/release")
async def release_budget(entry_id: str, release_data: Dict[str, Any], current_user: Dict = Depends(get_current_user)):
    update_data = {
        "amount_released": release_data.get("amount", 0),
        "status": "released",
        "approved_by": current_user['id'],
        "approved_at": datetime.now(timezone.utc).isoformat(),
        "release_stage": release_data.get("stage", "initial")
    }
    result = await db.budget.update_one({"id": entry_id}, {"$set": update_data})
    return await db.budget.find_one({"id": entry_id}, {"_id": 0})

# ================= RISKS ROUTES =================
@api_router.get("/risks")
async def get_risks(project_id: Optional[str] = None, level: Optional[str] = None):
    query = {}
    if project_id:
        query["project_id"] = project_id
    if level:
        query["level"] = level
    risks = await db.risks.find(query, {"_id": 0}).to_list(1000)
    return risks

@api_router.post("/risks")
async def create_risk(risk_data: RiskCreate, current_user: Dict = Depends(get_current_user)):
    risk_score = risk_data.probability * risk_data.impact
    level = RiskLevel.LOW
    if risk_score >= 15:
        level = RiskLevel.CRITICAL
    elif risk_score >= 10:
        level = RiskLevel.HIGH
    elif risk_score >= 5:
        level = RiskLevel.MEDIUM
    
    risk = RiskBase(**risk_data.model_dump(), risk_score=risk_score, level=level, owner_id=current_user['id'])
    risk_dict = risk.model_dump()
    risk_dict['created_at'] = risk_dict['created_at'].isoformat()
    risk_dict['updated_at'] = risk_dict['updated_at'].isoformat()
    await db.risks.insert_one(risk_dict)
    risk_dict.pop('_id', None)
    return risk_dict

@api_router.put("/risks/{risk_id}")
async def update_risk(risk_id: str, update_data: Dict[str, Any], current_user: Dict = Depends(get_current_user)):
    if 'probability' in update_data or 'impact' in update_data:
        current = await db.risks.find_one({"id": risk_id}, {"_id": 0})
        prob = update_data.get('probability', current.get('probability', 1))
        imp = update_data.get('impact', current.get('impact', 1))
        update_data['risk_score'] = prob * imp
        if update_data['risk_score'] >= 15:
            update_data['level'] = 'critical'
        elif update_data['risk_score'] >= 10:
            update_data['level'] = 'high'
        elif update_data['risk_score'] >= 5:
            update_data['level'] = 'medium'
        else:
            update_data['level'] = 'low'
    
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    result = await db.risks.update_one({"id": risk_id}, {"$set": update_data})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Risk not found")
    return await db.risks.find_one({"id": risk_id}, {"_id": 0})

@api_router.post("/risks/{risk_id}/escalate")
async def escalate_risk(risk_id: str, escalation: Dict[str, Any], current_user: Dict = Depends(get_current_user)):
    update_data = {
        "escalation_level": escalation.get("level", 1),
        "escalated_to": escalation.get("escalated_to"),
        "escalation_reason": escalation.get("reason", ""),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    result = await db.risks.update_one({"id": risk_id}, {"$set": update_data})
    return await db.risks.find_one({"id": risk_id}, {"_id": 0})

# ================= ISSUES ROUTES =================
@api_router.get("/issues")
async def get_issues(project_id: Optional[str] = None, status: Optional[str] = None):
    query = {}
    if project_id:
        query["project_id"] = project_id
    if status:
        query["status"] = status
    issues = await db.issues.find(query, {"_id": 0}).to_list(1000)
    return issues

@api_router.post("/issues")
async def create_issue(issue_data: IssueCreate, current_user: Dict = Depends(get_current_user)):
    issue = IssueBase(**issue_data.model_dump(), reported_by=current_user['id'])
    issue_dict = issue.model_dump()
    issue_dict['created_at'] = issue_dict['created_at'].isoformat()
    issue_dict['updated_at'] = issue_dict['updated_at'].isoformat()
    await db.issues.insert_one(issue_dict)
    issue_dict.pop('_id', None)
    return issue_dict

@api_router.put("/issues/{issue_id}")
async def update_issue(issue_id: str, update_data: Dict[str, Any], current_user: Dict = Depends(get_current_user)):
    if update_data.get('status') == 'resolved':
        update_data['resolved_at'] = datetime.now(timezone.utc).isoformat()
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    result = await db.issues.update_one({"id": issue_id}, {"$set": update_data})
    return await db.issues.find_one({"id": issue_id}, {"_id": 0})

@api_router.post("/issues/{issue_id}/escalate")
async def escalate_issue(issue_id: str, escalation: Dict[str, Any], current_user: Dict = Depends(get_current_user)):
    update_data = {
        "escalation_level": escalation.get("level", 1),
        "escalated_to": escalation.get("escalated_to"),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    result = await db.issues.update_one({"id": issue_id}, {"$set": update_data})
    return await db.issues.find_one({"id": issue_id}, {"_id": 0})

# ================= VENDORS ROUTES =================
@api_router.get("/vendors")
async def get_vendors(status: Optional[str] = None, category: Optional[str] = None):
    query = {}
    if status:
        query["status"] = status
    if category:
        query["category"] = category
    vendors = await db.vendors.find(query, {"_id": 0}).to_list(1000)
    return vendors

@api_router.post("/vendors")
async def create_vendor(vendor_data: VendorCreate, current_user: Dict = Depends(get_current_user)):
    vendor = VendorBase(**vendor_data.model_dump())
    vendor_dict = vendor.model_dump()
    vendor_dict['created_at'] = vendor_dict['created_at'].isoformat()
    await db.vendors.insert_one(vendor_dict)
    vendor_dict.pop('_id', None)
    return vendor_dict

@api_router.put("/vendors/{vendor_id}")
async def update_vendor(vendor_id: str, update_data: Dict[str, Any], current_user: Dict = Depends(get_current_user)):
    result = await db.vendors.update_one({"id": vendor_id}, {"$set": update_data})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Vendor not found")
    return await db.vendors.find_one({"id": vendor_id}, {"_id": 0})

@api_router.post("/vendors/{vendor_id}/due-diligence")
async def complete_due_diligence(vendor_id: str, diligence: Dict[str, Any], current_user: Dict = Depends(get_current_user)):
    update_data = {
        "due_diligence_status": diligence.get("status", "completed"),
        "due_diligence_date": datetime.now(timezone.utc).isoformat()
    }
    result = await db.vendors.update_one({"id": vendor_id}, {"$set": update_data})
    return await db.vendors.find_one({"id": vendor_id}, {"_id": 0})

@api_router.post("/vendors/{vendor_id}/blacklist")
async def blacklist_vendor(vendor_id: str, reason: Dict[str, Any], current_user: Dict = Depends(get_current_user)):
    update_data = {
        "status": "blacklisted",
        "blacklist_reason": reason.get("reason", ""),
        "risk_flags": reason.get("flags", [])
    }
    result = await db.vendors.update_one({"id": vendor_id}, {"$set": update_data})
    return await db.vendors.find_one({"id": vendor_id}, {"_id": 0})

# ================= CONTRACTS ROUTES =================
@api_router.get("/contracts")
async def get_contracts(vendor_id: Optional[str] = None, project_id: Optional[str] = None):
    query = {}
    if vendor_id:
        query["vendor_id"] = vendor_id
    if project_id:
        query["project_id"] = project_id
    contracts = await db.contracts.find(query, {"_id": 0}).to_list(1000)
    return contracts

@api_router.post("/contracts")
async def create_contract(contract_data: ContractCreate, current_user: Dict = Depends(get_current_user)):
    contract = ContractBase(**contract_data.model_dump())
    contract_dict = contract.model_dump()
    contract_dict['created_at'] = contract_dict['created_at'].isoformat()
    await db.contracts.insert_one(contract_dict)
    
    # Update vendor contract count
    await db.vendors.update_one(
        {"id": contract_data.vendor_id},
        {"$inc": {"contracts_active": 1, "total_value": contract_data.value}}
    )
    
    contract_dict.pop('_id', None)
    return contract_dict

@api_router.put("/contracts/{contract_id}")
async def update_contract(contract_id: str, update_data: Dict[str, Any], current_user: Dict = Depends(get_current_user)):
    result = await db.contracts.update_one({"id": contract_id}, {"$set": update_data})
    return await db.contracts.find_one({"id": contract_id}, {"_id": 0})

# ================= APPROVALS ROUTES =================
@api_router.get("/approvals")
async def get_approvals(status: Optional[str] = None, entity_type: Optional[str] = None):
    query = {}
    if status:
        query["status"] = status
    if entity_type:
        query["entity_type"] = entity_type
    approvals = await db.approvals.find(query, {"_id": 0}).to_list(1000)
    return approvals

@api_router.post("/approvals")
async def create_approval(approval_data: ApprovalCreate, current_user: Dict = Depends(get_current_user)):
    sla_deadline = datetime.now(timezone.utc) + timedelta(hours=approval_data.sla_hours)
    
    approval = ApprovalBase(
        **approval_data.model_dump(),
        requested_by=current_user['id'],
        requested_by_name=current_user.get('name', ''),
        sla_deadline=sla_deadline.isoformat()
    )
    approval_dict = approval.model_dump()
    approval_dict['created_at'] = approval_dict['created_at'].isoformat()
    approval_dict['updated_at'] = approval_dict['updated_at'].isoformat()
    await db.approvals.insert_one(approval_dict)
    approval_dict.pop('_id', None)
    return approval_dict

@api_router.post("/approvals/{approval_id}/approve")
async def approve_request(approval_id: str, approval_data: Dict[str, Any], current_user: Dict = Depends(get_current_user)):
    approval = await db.approvals.find_one({"id": approval_id}, {"_id": 0})
    if not approval:
        raise HTTPException(status_code=404, detail="Approval not found")
    
    # Add to approval chain
    approval_entry = {
        "level": approval['current_level'],
        "approved_by": current_user['id'],
        "approved_by_name": current_user.get('name', ''),
        "approved_at": datetime.now(timezone.utc).isoformat(),
        "comments": approval_data.get("comments", ""),
        "digital_signature": f"SIG-{current_user['id'][:8]}-{datetime.now().strftime('%Y%m%d%H%M%S')}"
    }
    
    if approval['current_level'] >= approval['total_levels']:
        update_data = {
            "status": "approved",
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
    else:
        update_data = {
            "current_level": approval['current_level'] + 1,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
    
    await db.approvals.update_one(
        {"id": approval_id},
        {"$set": update_data, "$push": {"approval_chain": approval_entry}}
    )
    return await db.approvals.find_one({"id": approval_id}, {"_id": 0})

@api_router.post("/approvals/{approval_id}/reject")
async def reject_request(approval_id: str, rejection: Dict[str, Any], current_user: Dict = Depends(get_current_user)):
    rejection_entry = {
        "level": 0,
        "rejected_by": current_user['id'],
        "rejected_at": datetime.now(timezone.utc).isoformat(),
        "reason": rejection.get("reason", "")
    }
    
    result = await db.approvals.update_one(
        {"id": approval_id},
        {"$set": {"status": "rejected", "updated_at": datetime.now(timezone.utc).isoformat()},
         "$push": {"approval_chain": rejection_entry}}
    )
    return await db.approvals.find_one({"id": approval_id}, {"_id": 0})

@api_router.post("/approvals/{approval_id}/delegate")
async def delegate_approval(approval_id: str, delegation: Dict[str, Any], current_user: Dict = Depends(get_current_user)):
    delegate_entry = {
        "delegated_from": current_user['id'],
        "delegated_to": delegation.get("delegate_to"),
        "delegated_at": datetime.now(timezone.utc).isoformat(),
        "reason": delegation.get("reason", "")
    }
    
    result = await db.approvals.update_one(
        {"id": approval_id},
        {"$set": {"updated_at": datetime.now(timezone.utc).isoformat()},
         "$push": {"approval_chain": delegate_entry}}
    )
    return await db.approvals.find_one({"id": approval_id}, {"_id": 0})

@api_router.post("/approvals/{approval_id}/emergency-override")
async def emergency_override(approval_id: str, override: Dict[str, Any], current_user: Dict = Depends(get_current_user)):
    if current_user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Only admins can use emergency override")
    
    update_data = {
        "status": "approved",
        "is_emergency": True,
        "emergency_override_by": current_user['id'],
        "emergency_reason": override.get("reason", ""),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    result = await db.approvals.update_one({"id": approval_id}, {"$set": update_data})
    return await db.approvals.find_one({"id": approval_id}, {"_id": 0})

# ================= DASHBOARD ROUTES =================
@api_router.get("/dashboard/stats")
async def get_dashboard_stats():
    programs_count = await db.programs.count_documents({})
    projects_count = await db.projects.count_documents({})
    tasks_count = await db.tasks.count_documents({})
    resources_count = await db.resources.count_documents({})
    
    projects = await db.projects.find({}, {"_id": 0, "status": 1, "budget_allocated": 1, "budget_spent": 1, "health_score": 1, "budget_forecast": 1}).to_list(1000)
    status_breakdown = {}
    total_budget = 0
    total_spent = 0
    total_forecast = 0
    avg_health = 0
    
    for p in projects:
        status = p.get('status', 'planning')
        status_breakdown[status] = status_breakdown.get(status, 0) + 1
        total_budget += p.get('budget_allocated', 0)
        total_spent += p.get('budget_spent', 0)
        total_forecast += p.get('budget_forecast', 0)
        avg_health += p.get('health_score', 100)
    
    if projects:
        avg_health = avg_health // len(projects)
    
    risks = await db.risks.find({}, {"_id": 0, "level": 1}).to_list(1000)
    risk_breakdown = {}
    for r in risks:
        level = r.get('level', 'low')
        risk_breakdown[level] = risk_breakdown.get(level, 0) + 1
    
    tasks = await db.tasks.find({}, {"_id": 0, "status": 1}).to_list(1000)
    task_breakdown = {}
    for t in tasks:
        status = t.get('status', 'todo')
        task_breakdown[status] = task_breakdown.get(status, 0) + 1
    
    pending_approvals = await db.approvals.count_documents({"status": "pending"})
    
    return {
        "counts": {
            "programs": programs_count,
            "projects": projects_count,
            "tasks": tasks_count,
            "resources": resources_count,
            "pending_approvals": pending_approvals
        },
        "projects": {
            "status_breakdown": status_breakdown,
            "total_budget": total_budget,
            "total_spent": total_spent,
            "total_forecast": total_forecast,
            "budget_utilization": round((total_spent / total_budget * 100) if total_budget > 0 else 0, 1),
            "avg_health_score": avg_health
        },
        "risks": risk_breakdown,
        "tasks": task_breakdown
    }

# ================= EXPORT ROUTES =================
@api_router.get("/export/projects")
async def export_projects(format: str = "csv"):
    projects = await db.projects.find({}, {"_id": 0}).to_list(1000)
    
    if format == "csv":
        output = io.StringIO()
        if projects:
            writer = csv.DictWriter(output, fieldnames=projects[0].keys())
            writer.writeheader()
            writer.writerows(projects)
        
        output.seek(0)
        return StreamingResponse(
            io.BytesIO(output.getvalue().encode()),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=projects.csv"}
        )
    else:
        return projects

@api_router.get("/export/tasks")
async def export_tasks(project_id: Optional[str] = None, format: str = "csv"):
    query = {"project_id": project_id} if project_id else {}
    tasks = await db.tasks.find(query, {"_id": 0}).to_list(1000)
    
    if format == "csv":
        output = io.StringIO()
        if tasks:
            writer = csv.DictWriter(output, fieldnames=tasks[0].keys())
            writer.writeheader()
            writer.writerows(tasks)
        
        output.seek(0)
        return StreamingResponse(
            io.BytesIO(output.getvalue().encode()),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=tasks.csv"}
        )
    else:
        return tasks

@api_router.get("/export/budget")
async def export_budget(project_id: Optional[str] = None, format: str = "csv"):
    query = {"project_id": project_id} if project_id else {}
    budget = await db.budget.find(query, {"_id": 0}).to_list(1000)
    
    if format == "csv":
        output = io.StringIO()
        if budget:
            writer = csv.DictWriter(output, fieldnames=budget[0].keys())
            writer.writeheader()
            writer.writerows(budget)
        
        output.seek(0)
        return StreamingResponse(
            io.BytesIO(output.getvalue().encode()),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=budget.csv"}
        )
    else:
        return budget

@api_router.get("/export/risks")
async def export_risks(project_id: Optional[str] = None, format: str = "csv"):
    query = {"project_id": project_id} if project_id else {}
    risks = await db.risks.find(query, {"_id": 0}).to_list(1000)
    
    if format == "csv":
        output = io.StringIO()
        if risks:
            writer = csv.DictWriter(output, fieldnames=risks[0].keys())
            writer.writeheader()
            writer.writerows(risks)
        
        output.seek(0)
        return StreamingResponse(
            io.BytesIO(output.getvalue().encode()),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=risks.csv"}
        )
    else:
        return risks

# ================= SEED DATA ROUTE =================
@api_router.post("/seed")
async def seed_data():
    # Clear existing data
    await db.programs.delete_many({})
    await db.projects.delete_many({})
    await db.tasks.delete_many({})
    await db.resources.delete_many({})
    await db.risks.delete_many({})
    await db.vendors.delete_many({})
    await db.budget.delete_many({})
    await db.approvals.delete_many({})
    await db.contracts.delete_many({})
    await db.issues.delete_many({})
    
    # Force delete existing specific users to ensure password reset
    await db.users.delete_many({"email": {"$in": ["admin@defense.gov", "manager@defense.gov", "user@defense.gov"]}})

    # Create fresh admin user (Always)
    print("Creating fresh admin user...")
    await db.users.insert_one({
        "id": "user-admin-001",
        "email": "admin@defense.gov",
        "name": "Col. Rajesh Kumar",
        "role": "admin",
        "clearance_level": "top_secret",
        "department": "Command Operations",
        "rank": "Colonel",
        "can_delegate": True,
        "password_hash": hash_password("admin123"),
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Create additional users (Always)
    users_to_create = [
        {"id": "user-mgr-001", "email": "manager@defense.gov", "name": "Maj. Priya Singh", "role": "manager", "clearance_level": "secret", "department": "Engineering", "rank": "Major"},
        {"id": "user-usr-001", "email": "user@defense.gov", "name": "Capt. Amit Sharma", "role": "user", "clearance_level": "confidential", "department": "Operations", "rank": "Captain"}
    ]
    
    for user in users_to_create:
        user["password_hash"] = hash_password("password123")
        user["created_at"] = datetime.now(timezone.utc).isoformat()
        await db.users.insert_one(user)
    
    now = datetime.now(timezone.utc).isoformat()
    
    # Programs (₹ values in crores)
    programs = [
        {
            "id": "prog-001",
            "name": "AEGIS Defence Shield",
            "code": "ADS-2024",
            "description": "Multi-layered air defence system integration programme",
            "objectives": ["Unified command structure", "Real-time threat detection", "Automated response protocols"],
            "charter": "To establish comprehensive air defence coverage across strategic sectors",
            "mandate": "Ministry of Defence Directive 2024/DEF/001",
            "start_date": "2024-01-01",
            "end_date": "2028-12-31",
            "budget_total": 45000000000,
            "budget_allocated": 12500000000,
            "status": "in_progress",
            "health_score": 87,
            "owner_id": "user-admin-001",
            "success_kpis": [
                {"name": "Coverage Area", "target": 95, "current": 78, "unit": "%"},
                {"name": "Response Time", "target": 2, "current": 2.3, "unit": "sec"}
            ],
            "created_at": now,
            "updated_at": now
        },
        {
            "id": "prog-002",
            "name": "TITAN Infrastructure Modernisation",
            "code": "TIM-2024",
            "description": "Critical infrastructure upgrade across all military bases",
            "objectives": ["Power grid modernisation", "Communication network upgrade", "Facility hardening"],
            "charter": "Modernise defence infrastructure to meet 2030 strategic requirements",
            "start_date": "2024-03-01",
            "end_date": "2027-06-30",
            "budget_total": 28000000000,
            "budget_allocated": 8500000000,
            "status": "in_progress",
            "health_score": 72,
            "owner_id": "user-admin-001",
            "created_at": now,
            "updated_at": now
        },
        {
            "id": "prog-003",
            "name": "PHANTOM Cyber Operations",
            "code": "PCO-2024",
            "description": "Advanced cyber warfare and defence capabilities",
            "objectives": ["Offensive capabilities", "Network defence", "AI-driven threat detection"],
            "start_date": "2024-06-01",
            "end_date": "2026-12-31",
            "budget_total": 18000000000,
            "budget_allocated": 6000000000,
            "status": "planning",
            "health_score": 95,
            "owner_id": "user-admin-001",
            "created_at": now,
            "updated_at": now
        }
    ]
    
    # Projects
    projects = [
        {
            "id": "proj-001",
            "program_id": "prog-001",
            "name": "Radar Integration Phase 1",
            "code": "ADS-RAD-001",
            "description": "Integration of coastal radar systems into unified network",
            "template": "Weapon Systems",
            "start_date": "2024-01-15",
            "end_date": "2025-06-30",
            "budget_allocated": 4500000000,
            "budget_spent": 1850000000,
            "budget_forecast": 4200000000,
            "status": "in_progress",
            "health_score": 82,
            "progress": 41,
            "phase": "Phase 2",
            "phase_gate_status": "approved",
            "buffer_days": 30,
            "contingency_budget": 450000000,
            "schedule_variance": -5.2,
            "cost_variance": 8.5,
            "milestones": [
                {"name": "Requirements Complete", "date": "2024-03-01", "status": "completed"},
                {"name": "System Design", "date": "2024-06-01", "status": "completed"},
                {"name": "Integration Testing", "date": "2024-12-01", "status": "in_progress"},
                {"name": "Deployment", "date": "2025-06-30", "status": "pending"}
            ],
            "dependencies": [
                {"type": "vendor", "id": "vendor-001", "description": "Radar unit delivery"},
                {"type": "approval", "id": "approval-001", "description": "Security clearance"}
            ],
            "kpis": [
                {"name": "Detection Range", "target": 500, "current": 420, "unit": "km"},
                {"name": "Response Time", "target": 2, "current": 2.5, "unit": "sec"}
            ],
            "scenarios": [
                {"name": "Best Case", "end_date": "2025-04-30", "budget": 4000000000},
                {"name": "Worst Case", "end_date": "2025-09-30", "budget": 5200000000},
                {"name": "Most Likely", "end_date": "2025-06-30", "budget": 4500000000}
            ],
            "clearance_level": "secret",
            "manager_id": "user-mgr-001",
            "created_at": now,
            "updated_at": now
        },
        {
            "id": "proj-002",
            "program_id": "prog-001",
            "name": "Command Centre Upgrade",
            "code": "ADS-CMD-002",
            "description": "Central command centre modernisation with AI integration",
            "template": "IT",
            "start_date": "2024-04-01",
            "end_date": "2025-12-31",
            "budget_allocated": 3500000000,
            "budget_spent": 820000000,
            "status": "in_progress",
            "health_score": 91,
            "progress": 23,
            "phase": "Phase 1",
            "milestones": [
                {"name": "Architecture Design", "date": "2024-06-01", "status": "completed"},
                {"name": "Hardware Procurement", "date": "2024-09-01", "status": "in_progress"},
                {"name": "Software Development", "date": "2025-06-01", "status": "pending"},
                {"name": "Go Live", "date": "2025-12-31", "status": "pending"}
            ],
            "clearance_level": "top_secret",
            "manager_id": "user-admin-001",
            "created_at": now,
            "updated_at": now
        },
        {
            "id": "proj-003",
            "program_id": "prog-002",
            "name": "Power Grid Hardening",
            "code": "TIM-PWR-001",
            "description": "EMP-resistant power infrastructure deployment",
            "template": "Infrastructure",
            "start_date": "2024-03-15",
            "end_date": "2026-03-15",
            "budget_allocated": 5200000000,
            "budget_spent": 1280000000,
            "status": "in_progress",
            "health_score": 68,
            "progress": 25,
            "phase": "Phase 1",
            "clearance_level": "confidential",
            "created_at": now,
            "updated_at": now
        },
        {
            "id": "proj-004",
            "program_id": "prog-003",
            "name": "AI Threat Detection System",
            "code": "PCO-AI-001",
            "description": "Machine learning based cyber threat detection",
            "template": "R&D",
            "start_date": "2024-06-15",
            "end_date": "2025-12-31",
            "budget_allocated": 2800000000,
            "budget_spent": 450000000,
            "status": "planning",
            "health_score": 95,
            "progress": 16,
            "phase": "Research",
            "clearance_level": "top_secret",
            "created_at": now,
            "updated_at": now
        },
        {
            "id": "proj-005",
            "program_id": "prog-002",
            "name": "Secure Communications Network",
            "code": "TIM-COM-002",
            "description": "Encrypted communication infrastructure upgrade",
            "template": "IT",
            "start_date": "2024-05-01",
            "end_date": "2025-08-31",
            "budget_allocated": 1800000000,
            "budget_spent": 720000000,
            "status": "in_progress",
            "health_score": 78,
            "progress": 40,
            "phase": "Phase 2",
            "clearance_level": "secret",
            "created_at": now,
            "updated_at": now
        }
    ]
    
    # Tasks
    tasks = [
        {
            "id": "task-001",
            "project_id": "proj-001",
            "wbs_code": "1.1.1",
            "wbs_level": 3,
            "name": "Site Survey - Northern Sector",
            "description": "Complete radar site survey for northern coastal installations",
            "status": "completed",
            "priority": "high",
            "start_date": "2024-01-15",
            "end_date": "2024-02-28",
            "estimated_hours": 480,
            "actual_hours": 520,
            "progress": 100,
            "assigned_to": ["user-admin-001"],
            "assigned_unit": "Survey Division",
            "clearance_level": "secret",
            "acceptance_status": "accepted",
            "is_critical_path": True,
            "created_at": now,
            "updated_at": now
        },
        {
            "id": "task-002",
            "project_id": "proj-001",
            "wbs_code": "1.1.2",
            "wbs_level": 3,
            "name": "Equipment Procurement",
            "description": "Procure radar units and support equipment",
            "status": "in_progress",
            "priority": "critical",
            "start_date": "2024-03-01",
            "end_date": "2024-08-31",
            "estimated_hours": 200,
            "actual_hours": 85,
            "progress": 42,
            "assigned_to": ["user-mgr-001"],
            "assigned_vendor": "vendor-001",
            "clearance_level": "confidential",
            "is_critical_path": True,
            "dependencies": [{"task_id": "task-001", "type": "finish_to_start"}],
            "created_at": now,
            "updated_at": now
        },
        {
            "id": "task-003",
            "project_id": "proj-001",
            "wbs_code": "1.2.1",
            "wbs_level": 3,
            "name": "Network Infrastructure",
            "description": "Deploy secure network backbone for radar integration",
            "status": "in_progress",
            "priority": "high",
            "start_date": "2024-04-01",
            "end_date": "2024-10-31",
            "estimated_hours": 640,
            "actual_hours": 280,
            "progress": 44,
            "clearance_level": "secret",
            "is_critical_path": False,
            "float_days": 15,
            "created_at": now,
            "updated_at": now
        },
        {
            "id": "task-004",
            "project_id": "proj-002",
            "wbs_code": "2.1.1",
            "wbs_level": 3,
            "name": "Server Room Preparation",
            "description": "Prepare secure server room with required cooling and power",
            "status": "completed",
            "priority": "high",
            "start_date": "2024-04-01",
            "end_date": "2024-06-30",
            "estimated_hours": 320,
            "actual_hours": 340,
            "progress": 100,
            "clearance_level": "top_secret",
            "acceptance_status": "accepted",
            "created_at": now,
            "updated_at": now
        },
        {
            "id": "task-005",
            "project_id": "proj-002",
            "wbs_code": "2.1.2",
            "wbs_level": 3,
            "name": "Hardware Installation",
            "description": "Install servers and networking equipment",
            "status": "in_progress",
            "priority": "critical",
            "start_date": "2024-07-01",
            "end_date": "2024-10-31",
            "estimated_hours": 480,
            "actual_hours": 120,
            "progress": 25,
            "clearance_level": "top_secret",
            "dependencies": [{"task_id": "task-004", "type": "finish_to_start"}],
            "created_at": now,
            "updated_at": now
        },
        {
            "id": "task-006",
            "project_id": "proj-003",
            "wbs_code": "3.1.1",
            "wbs_level": 3,
            "name": "Assessment Phase",
            "description": "Assess current power infrastructure vulnerabilities",
            "status": "completed",
            "priority": "medium",
            "start_date": "2024-03-15",
            "end_date": "2024-05-31",
            "estimated_hours": 240,
            "actual_hours": 260,
            "progress": 100,
            "created_at": now,
            "updated_at": now
        },
        {
            "id": "task-007",
            "project_id": "proj-003",
            "wbs_code": "3.1.2",
            "wbs_level": 3,
            "name": "Equipment Design",
            "description": "Design EMP-resistant power systems",
            "status": "in_progress",
            "priority": "high",
            "start_date": "2024-06-01",
            "end_date": "2024-12-31",
            "estimated_hours": 800,
            "actual_hours": 350,
            "progress": 44,
            "created_at": now,
            "updated_at": now
        },
        {
            "id": "task-008",
            "project_id": "proj-004",
            "wbs_code": "4.1.1",
            "wbs_level": 3,
            "name": "ML Model Research",
            "description": "Research and select ML models for threat detection",
            "status": "in_progress",
            "priority": "medium",
            "start_date": "2024-06-15",
            "end_date": "2024-09-30",
            "estimated_hours": 400,
            "actual_hours": 180,
            "progress": 45,
            "clearance_level": "top_secret",
            "created_at": now,
            "updated_at": now
        }
    ]
    
    # Resources
    resources = [
        {
            "id": "res-001",
            "name": "Lt. Col. Sarah Khan",
            "type": "human",
            "department": "Engineering",
            "unit": "Technical Division",
            "skills": ["Systems Integration", "Network Security", "Project Management"],
            "certifications": ["PMP", "CISSP", "TS/SCI"],
            "clearance_level": "top_secret",
            "availability": 100,
            "capacity_hours": 160,
            "allocated_hours": 136,
            "hourly_rate": 12500,
            "utilization": 85,
            "burnout_risk": "medium",
            "allocated_projects": ["proj-001", "proj-002"],
            "created_at": now
        },
        {
            "id": "res-002",
            "name": "Dr. Vikram Patel",
            "type": "human",
            "department": "R&D",
            "unit": "AI Research Lab",
            "skills": ["Machine Learning", "Cyber Security", "Data Science"],
            "certifications": ["PhD CS", "CISM"],
            "clearance_level": "top_secret",
            "availability": 100,
            "capacity_hours": 160,
            "allocated_hours": 112,
            "hourly_rate": 15000,
            "utilization": 70,
            "burnout_risk": "low",
            "allocated_projects": ["proj-004"],
            "created_at": now
        },
        {
            "id": "res-003",
            "name": "Mobile Radar Unit Alpha",
            "type": "equipment",
            "department": "Operations",
            "skills": [],
            "clearance_level": "secret",
            "availability": 100,
            "capacity_hours": 720,
            "allocated_hours": 432,
            "hourly_rate": 50000,
            "utilization": 60,
            "allocated_projects": ["proj-001"],
            "created_at": now
        },
        {
            "id": "res-004",
            "name": "Secure Data Centre - Building 7",
            "type": "facility",
            "department": "IT",
            "skills": [],
            "clearance_level": "top_secret",
            "availability": 100,
            "capacity_hours": 720,
            "allocated_hours": 324,
            "hourly_rate": 100000,
            "utilization": 45,
            "allocated_projects": ["proj-002", "proj-004"],
            "created_at": now
        }
    ]
    
    # Risks
    risks = [
        {
            "id": "risk-001",
            "project_id": "proj-001",
            "title": "Vendor Delivery Delays",
            "description": "Critical radar components may face supply chain delays",
            "category": "Supply Chain",
            "probability": 4,
            "impact": 4,
            "risk_score": 16,
            "level": "critical",
            "mitigation_plan": "Identify alternative vendors and maintain 3-month buffer stock",
            "mitigation_status": "in_progress",
            "mitigation_progress": 45,
            "contingency_plan": "Fast-track procurement from secondary vendor",
            "status": "open",
            "owner_id": "user-admin-001",
            "related_dependencies": ["vendor-001"],
            "created_at": now,
            "updated_at": now
        },
        {
            "id": "risk-002",
            "project_id": "proj-001",
            "title": "Integration Compatibility Issues",
            "description": "Legacy systems may not integrate seamlessly",
            "category": "Technical",
            "probability": 3,
            "impact": 4,
            "risk_score": 12,
            "level": "high",
            "mitigation_plan": "Conduct thorough compatibility testing in staging environment",
            "mitigation_status": "in_progress",
            "mitigation_progress": 60,
            "status": "mitigating",
            "created_at": now,
            "updated_at": now
        },
        {
            "id": "risk-003",
            "project_id": "proj-002",
            "title": "Budget Overrun",
            "description": "Hardware costs increasing due to market conditions",
            "category": "Financial",
            "probability": 3,
            "impact": 3,
            "risk_score": 9,
            "level": "medium",
            "mitigation_plan": "Lock in prices with long-term contracts",
            "status": "open",
            "created_at": now,
            "updated_at": now
        },
        {
            "id": "risk-004",
            "project_id": "proj-003",
            "title": "Weather Delays",
            "description": "Outdoor installation work may be delayed due to monsoon",
            "category": "Environmental",
            "probability": 2,
            "impact": 2,
            "risk_score": 4,
            "level": "low",
            "mitigation_plan": "Build weather contingency into schedule",
            "status": "open",
            "created_at": now,
            "updated_at": now
        },
        {
            "id": "risk-005",
            "project_id": "proj-004",
            "title": "Security Clearance Delays",
            "description": "New personnel clearances taking longer than expected",
            "category": "Administrative",
            "probability": 4,
            "impact": 3,
            "risk_score": 12,
            "level": "high",
            "mitigation_plan": "Start clearance process early, use existing cleared personnel",
            "status": "open",
            "created_at": now,
            "updated_at": now
        }
    ]
    
    # Vendors
    vendors = [
        {
            "id": "vendor-001",
            "name": "Bharat Defence Systems",
            "code": "BDS-001",
            "contact_email": "contracts@bharatdefence.in",
            "contact_phone": "+91-11-23456789",
            "category": "Weapon Systems",
            "rating": 92,
            "contracts_active": 3,
            "total_value": 8500000000,
            "status": "active",
            "risk_flags": [],
            "due_diligence_status": "completed",
            "sla_compliance": 95,
            "created_at": now
        },
        {
            "id": "vendor-002",
            "name": "SecureNet Communications",
            "code": "SNC-002",
            "contact_email": "sales@securenetcomm.in",
            "contact_phone": "+91-80-98765432",
            "category": "IT",
            "rating": 88,
            "contracts_active": 2,
            "total_value": 1200000000,
            "status": "active",
            "risk_flags": [],
            "due_diligence_status": "completed",
            "sla_compliance": 92,
            "created_at": now
        },
        {
            "id": "vendor-003",
            "name": "PowerGrid Solutions",
            "code": "PGS-003",
            "contact_email": "projects@powergrid.in",
            "contact_phone": "+91-22-11223344",
            "category": "Infrastructure",
            "rating": 75,
            "contracts_active": 1,
            "total_value": 2800000000,
            "status": "active",
            "risk_flags": ["Delivery delays reported"],
            "due_diligence_status": "completed",
            "sla_compliance": 78,
            "created_at": now
        },
        {
            "id": "vendor-004",
            "name": "AI Defence Labs",
            "code": "AIDL-004",
            "contact_email": "research@aidefencelabs.in",
            "category": "R&D",
            "rating": 95,
            "contracts_active": 1,
            "total_value": 1500000000,
            "status": "active",
            "risk_flags": [],
            "due_diligence_status": "completed",
            "sla_compliance": 98,
            "created_at": now
        }
    ]
    
    # Budget entries
    budget_entries = [
        {
            "id": "budget-001",
            "project_id": "proj-001",
            "category": "CAPEX",
            "sub_category": "Equipment",
            "description": "Radar unit procurement",
            "amount_planned": 2500000000,
            "amount_actual": 1200000000,
            "amount_forecast": 2400000000,
            "amount_released": 1500000000,
            "fiscal_year": "2024",
            "quarter": "Q2",
            "status": "released",
            "release_stage": "Phase 1",
            "variance": 1300000000,
            "created_at": now
        },
        {
            "id": "budget-002",
            "project_id": "proj-001",
            "category": "OPEX",
            "sub_category": "Services",
            "description": "Installation and integration services",
            "amount_planned": 800000000,
            "amount_actual": 350000000,
            "amount_forecast": 780000000,
            "fiscal_year": "2024",
            "quarter": "Q3",
            "status": "approved",
            "created_at": now
        },
        {
            "id": "budget-003",
            "project_id": "proj-002",
            "category": "CAPEX",
            "sub_category": "Hardware",
            "description": "Server and networking equipment",
            "amount_planned": 1500000000,
            "amount_actual": 600000000,
            "fiscal_year": "2024",
            "quarter": "Q3",
            "status": "approved",
            "created_at": now
        }
    ]
    
    # Approvals
    approvals = [
        {
            "id": "approval-001",
            "entity_type": "budget",
            "entity_id": "budget-002",
            "title": "Budget Release - Phase 2 Installation Services",
            "description": "Request for fund release for installation services",
            "amount": 450000000,
            "requested_by": "user-mgr-001",
            "requested_by_name": "Maj. Priya Singh",
            "current_level": 2,
            "total_levels": 3,
            "status": "pending",
            "sla_hours": 48,
            "approval_chain": [
                {"level": 1, "approved_by": "user-mgr-001", "approved_at": now, "digital_signature": "SIG-MGR001-20241215"}
            ],
            "created_at": now,
            "updated_at": now
        },
        {
            "id": "approval-002",
            "entity_type": "project",
            "entity_id": "proj-001",
            "title": "Phase Gate Approval - Move to Phase 3",
            "description": "Go/No-Go decision for moving to Phase 3 of radar integration",
            "requested_by": "user-admin-001",
            "requested_by_name": "Col. Rajesh Kumar",
            "current_level": 1,
            "total_levels": 2,
            "status": "pending",
            "sla_hours": 72,
            "created_at": now,
            "updated_at": now
        }
    ]
    
    # Issues
    issues = [
        {
            "id": "issue-001",
            "project_id": "proj-001",
            "title": "Network latency in northern sector",
            "description": "High latency observed in communication between radar units",
            "category": "Technical",
            "severity": "high",
            "status": "open",
            "reported_by": "user-usr-001",
            "assigned_to": "user-mgr-001",
            "escalation_level": 0,
            "due_date": "2024-12-30",
            "created_at": now,
            "updated_at": now
        },
        {
            "id": "issue-002",
            "project_id": "proj-003",
            "title": "Permit delays for site access",
            "description": "Environmental clearance pending for 3 installation sites",
            "category": "Administrative",
            "severity": "medium",
            "status": "in_progress",
            "reported_by": "user-mgr-001",
            "escalation_level": 1,
            "escalated_to": "user-admin-001",
            "created_at": now,
            "updated_at": now
        }
    ]
    
    # Insert all data
    await db.programs.insert_many(programs)
    await db.projects.insert_many(projects)
    await db.tasks.insert_many(tasks)
    await db.resources.insert_many(resources)
    await db.risks.insert_many(risks)
    await db.vendors.insert_many(vendors)
    await db.budget.insert_many(budget_entries)
    await db.approvals.insert_many(approvals)
    await db.issues.insert_many(issues)
    
    return {"message": "Demo data seeded successfully", "counts": {
        "programs": len(programs),
        "projects": len(projects),
        "tasks": len(tasks),
        "resources": len(resources),
        "risks": len(risks),
        "vendors": len(vendors),
        "budget_entries": len(budget_entries),
        "approvals": len(approvals),
        "issues": len(issues)
    }}

# Health check
@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# Include the router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "server:app",
        host=os.environ.get('HOST', '0.0.0.0'),
        port=int(os.environ.get('PORT', 8000)),
        reload=True,
        log_level="info"
    )