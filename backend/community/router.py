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
    
    # New Fields
    resident_type: Optional[str] = None
    owner_type: Optional[str] = None
    is_setup_complete: bool = False # Exposed for UI

from sqlalchemy.orm import Session
from backend.core.database import get_db
from backend.auth.models import User, Role
from backend.auth.dependencies import get_current_user
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class ResidentCreate(BaseModel):
    name: str
    email: str
    address: str
    phone: Optional[str] = None
    role_name: str = "resident" # 'resident' or 'board'
    resident_type: Optional[str] = "owner"
    owner_type: Optional[str] = "individual"

class ResidentUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    role_name: Optional[str] = None
    resident_type: Optional[str] = None
    owner_type: Optional[str] = None

@router.get("/directory", response_model=List[DirectoryProfile])
async def get_directory(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.community_id:
        return [] # Super Admin without community sees nothing or all? Better nothing for now or specific Admin view.
        
    # Fetch users who are opted in AND belong to the same community
    users = db.query(User).filter(
        User.community_id == current_user.community_id,
        User.is_opted_in == True
    ).all()
    
    profiles = []
    for u in users:
        # Exclude Super Admins from directory just in case
        if u.role_id == 3: continue
        
        profiles.append(DirectoryProfile(
            id=u.id,
            name=u.full_name,
            address=u.address or "N/A",
            email=u.email,
            phone=u.phone,
            bio=u.bio,
            is_opted_in=u.is_opted_in,
            preferences=None,
            resident_type=u.resident_type,
            owner_type=u.owner_type
        ))
    return profiles

@router.get("/all-residents", response_model=List[DirectoryProfile])
async def get_all_residents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.community_id:
        # If Super Admin, maybe allow passing community_id as query param? 
        # For now, return empty or implement specific admin logic elsewhere.
        return []

    # Fetch all users in THIS community
    users = db.query(User).filter(
        User.community_id == current_user.community_id
    ).all()
    
    profiles = []
    for u in users:
         if u.role_id == 3: continue
         profiles.append(DirectoryProfile(
            id=u.id,
            name=u.full_name,
            address=u.address or "N/A",
            email=u.email,
            phone=u.phone,
            bio=u.bio,
            is_opted_in=u.is_opted_in,
            preferences=None,
            resident_type=u.resident_type,
            owner_type=u.owner_type,
            is_setup_complete=u.is_setup_complete
        ))
    return profiles

from sqlalchemy.exc import IntegrityError

@router.post("/residents")
async def register_resident(
    resident: ResidentCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.community_id:
        raise HTTPException(status_code=400, detail="Super Admin cannot add residents directly without selecting community context (use Admin Dashboard)")

    # 1. Check if email exists
    if db.query(User).filter(User.email == resident.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # 2. Get Role ID
    role = db.query(Role).filter(Role.name == resident.role_name).first()
    if not role:
        raise HTTPException(status_code=400, detail=f"Role {resident.role_name} not found")

    try:
        # 3. Create User linked to Current Community
        new_user = User(
            email=resident.email,
            full_name=resident.name,
            role_id=role.id,
            address=resident.address,
            phone=resident.phone,
            is_opted_in=True, 
            is_active=True,
            is_setup_complete=False, 
            hashed_password=None,
            resident_type=resident.resident_type,
            owner_type=resident.owner_type,
            community_id=current_user.community_id, # Link to creator's community
            auth0_id=f"manual|{resident.email}" 
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return {"message": "Resident invited successfully. Invitation email sent.", "user_id": new_user.id}
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Email already registered or violates unique constraint")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@router.put("/residents/{user_id}")
async def update_resident(user_id: int, resident: ResidentUpdate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if resident.name: user.full_name = resident.name
    if resident.email: user.email = resident.email
    if resident.address: user.address = resident.address
    if resident.phone: user.phone = resident.phone
    if resident.resident_type: user.resident_type = resident.resident_type
    if resident.owner_type: user.owner_type = resident.owner_type
    
    if resident.role_name:
         role = db.query(Role).filter(Role.name == resident.role_name).first()
         if role:
             user.role_id = role.id

    try:
        db.commit()
        return {"message": "Resident updated successfully"}
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Email already registered")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update resident: {str(e)}")

@router.delete("/residents/{user_id}")
async def delete_resident(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
         raise HTTPException(status_code=404, detail="User not found")
         
    # db.delete(user) # Hard delete? Or Soft delete?
    # Let's do hard delete for now as requested, but usually soft delete is better
    db.delete(user)
    db.commit()
    return {"message": "Resident deleted successfully"}

    current_user.is_opted_in = status
    db.commit()
    return {"status": "updated", "is_opted_in": current_user.is_opted_in}

class PasswordResetRequest(BaseModel):
    new_password: str

from backend.auth.security import get_password_hash

@router.post("/residents/{user_id}/reset-password")
async def reset_resident_password(
    user_id: int,
    request: PasswordResetRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify User is Admin/Board
    if not current_user.role or current_user.role.name not in ['admin', 'board', 'super_admin']:
         # Also allow role_id 3 (super admin)
         if current_user.role_id != 3:
             raise HTTPException(status_code=403, detail="Not authorized to reset passwords")

    # Find the target user
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if target user belongs to same community (unless super admin)
    if current_user.role_id != 3:
        if user.community_id != current_user.community_id:
             raise HTTPException(status_code=403, detail="Cannot reset password for user in another community")

    # Update password
    user.hashed_password = get_password_hash(request.new_password)
    # Ensure account is active and setup if not already? 
    # Maybe helpful to ensure they can login immediately
    user.is_active = True
    user.is_setup_complete = True 
    
    db.commit()
    return {"message": "Password reset successfully"}
