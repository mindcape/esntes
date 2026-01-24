from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
import json

from backend.core.database import get_db
from backend.auth.dependencies import get_current_user
from backend.auth.models import User

router = APIRouter(
    tags=["user"]
)

# Models
class CommunicationPreferences(BaseModel):
    general_email: bool = False
    general_paper: bool = False
    ccr_email: bool = False
    ccr_paper: bool = False
    collection_email: bool = False
    collection_paper: bool = False
    billing_email: bool = False
    billing_paper: bool = False
    mgmt_committee_notifications: bool = False
    phone_communications: bool = False

class UserProfile(BaseModel):
    name: str
    display_name: str
    address: Optional[str] = None
    status: Optional[str] = None  # Owner / Occupant
    email: str
    phone: Optional[str] = None
    mailing_address: Optional[str] = None
    preferences: CommunicationPreferences

class UserProfileUpdate(BaseModel):
    email: Optional[str] = None
    phone: Optional[str] = None
    mailing_address: Optional[str] = None
    preferences: Optional[CommunicationPreferences] = None

@router.get("/profile", response_model=UserProfile)
async def get_profile(current_user: User = Depends(get_current_user)):
    # Parse preferences from JSON string
    prefs_dict = {}
    if current_user.preferences:
        try:
            prefs_dict = json.loads(current_user.preferences)
        except json.JSONDecodeError:
            prefs_dict = {}
            
    return UserProfile(
        name=current_user.full_name,
        display_name=current_user.full_name,
        address=current_user.address, # Residential Address
        status=current_user.resident_type if current_user.resident_type else "Resident",
        email=current_user.email,
        phone=current_user.phone,
        mailing_address=current_user.mailing_address, 
        preferences=CommunicationPreferences(**prefs_dict)
    )

@router.put("/profile", response_model=UserProfile)
async def update_profile(update: UserProfileUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    
    if update.email:
        current_user.email = update.email
    if update.phone:
        current_user.phone = update.phone
    if update.mailing_address:
        current_user.mailing_address = update.mailing_address

    if update.preferences:
        current_user.preferences = json.dumps(update.preferences.dict())

    db.commit()
    db.refresh(current_user)
    
    # Re-fetch to return
    prefs_dict = {}
    if current_user.preferences:
        try:
            prefs_dict = json.loads(current_user.preferences)
        except:
            prefs_dict = {}

    return UserProfile(
        name=current_user.full_name,
        display_name=current_user.full_name,
        address=current_user.address,
        status=current_user.resident_type if current_user.resident_type else "Resident",
        email=current_user.email,
        phone=current_user.phone,
        mailing_address=current_user.mailing_address,
        preferences=CommunicationPreferences(**prefs_dict)
    )
