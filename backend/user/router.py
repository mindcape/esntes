from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter(
    tags=["user"]
)

# Models
class CommunicationPreferences(BaseModel):
    general_email: bool
    general_paper: bool
    ccr_email: bool
    ccr_paper: bool
    collection_email: bool
    collection_paper: bool
    billing_email: bool
    billing_paper: bool
    mgmt_committee_notifications: bool
    phone_communications: bool

class UserProfile(BaseModel):
    name: str
    display_name: str
    address: str
    status: str  # Owner / Occupant
    email: str
    phone: str
    mailing_address: str
    preferences: CommunicationPreferences

class UserProfileUpdate(BaseModel):
    email: Optional[str] = None
    phone: Optional[str] = None
    mailing_address: Optional[str] = None
    preferences: Optional[CommunicationPreferences] = None

# Mock Data Storage
current_profile = UserProfile(
    name="John Doe",
    display_name="John D.",
    address="123 Maple St, Unit 4B",
    status="Owner",
    email="john.doe@example.com",
    phone="(555) 123-4567",
    mailing_address="123 Maple St, Unit 4B, Springfield, IL 62704",
    preferences=CommunicationPreferences(
        general_email=True,
        general_paper=False,
        ccr_email=True,
        ccr_paper=False,
        collection_email=True,
        collection_paper=True,
        billing_email=True,
        billing_paper=False,
        mgmt_committee_notifications=True,
        phone_communications=False
    )
)

@router.get("/profile", response_model=UserProfile)
async def get_profile():
    return current_profile

@router.put("/profile", response_model=UserProfile)
async def update_profile(update: UserProfileUpdate):
    global current_profile
    if update.email:
        current_profile.email = update.email
    if update.phone:
        current_profile.phone = update.phone
    if update.mailing_address:
        current_profile.mailing_address = update.mailing_address
    if update.preferences:
        current_profile.preferences = update.preferences
    return current_profile
