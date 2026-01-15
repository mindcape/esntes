from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from backend.user.router import CommunicationPreferences
from typing import List, Optional
from datetime import datetime, timedelta
from enum import Enum

router = APIRouter()

class EventType(str, Enum):
    MEETING = "Meeting"
    SOCIAL = "Social"
    MAINTENANCE = "Maintenance"  # e.g., Trash Pickup

class Event(BaseModel):
    id: int
    title: str
    date: datetime
    description: str
    type: EventType
    location: Optional[str] = None

class DirectoryProfile(BaseModel):
    id: int
    name: str # From User
    address: str
    email: str
    phone: Optional[str] = None
    bio: Optional[str] = None
    is_opted_in: bool
    preferences: Optional[CommunicationPreferences] = None

from sqlalchemy.orm import Session
from backend.core.database import get_db
from backend.auth.models import User, Role
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class ResidentCreate(BaseModel):
    name: str
    email: str
    address: str
    phone: Optional[str] = None
    role_name: str = "resident" # 'resident' or 'board'

@router.get("/directory", response_model=List[DirectoryProfile])
async def get_directory(db: Session = Depends(get_db)):
    # Fetch users who are opted in
    users = db.query(User).filter(User.is_opted_in == True).all()
    profiles = []
    for u in users:
        profiles.append(DirectoryProfile(
            id=u.id,
            name=u.full_name,
            address=u.address or "N/A",
            email=u.email,
            phone=u.phone,
            bio=u.bio,
            is_opted_in=u.is_opted_in,
            preferences=None # TODO: Parse JSON preferences if needed
        ))
    return profiles

@router.get("/all-residents", response_model=List[DirectoryProfile])
async def get_all_residents(db: Session = Depends(get_db)):
    # Fetch all users (Board view)
    users = db.query(User).all()
    profiles = []
    for u in users:
        profiles.append(DirectoryProfile(
            id=u.id,
            name=u.full_name,
            address=u.address or "N/A",
            email=u.email,
            phone=u.phone,
            bio=u.bio,
            is_opted_in=u.is_opted_in,
            preferences=None
        ))
    return profiles

@router.post("/residents")
async def register_resident(resident: ResidentCreate, db: Session = Depends(get_db)):
    # 1. Check if email exists
    if db.query(User).filter(User.email == resident.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # 2. Get Role ID
    role = db.query(Role).filter(Role.name == resident.role_name).first()
    if not role:
        # Fallback or create if not exists (for now assuming seeded)
        raise HTTPException(status_code=400, detail=f"Role {resident.role_name} not found")

    # 3. Create User
    # Default password for now (in real app, send invite email)
    hashed_password = pwd_context.hash("welcome123") 
    
    new_user = User(
        email=resident.email,
        full_name=resident.name,
        role_id=role.id,
        address=resident.address,
        phone=resident.phone,
        is_opted_in=True, # Default to opt-in or False? Let's say True for convenience
        is_active=True,
        # auth0_id needs to be handled? reusing email for now as place holder or UUID
        auth0_id=f"manual|{resident.email}" 
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "Resident created successfully", "user_id": new_user.id}

@router.post("/directory/opt-in")
async def toggle_opt_in(user_id: int, status: bool, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.is_opted_in = status
    db.commit()
    return {"status": "updated", "is_opted_in": user.is_opted_in}
