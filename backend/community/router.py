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

# Mock Database
mock_events = [
    {
        "id": 1,
        "title": "Annual Board Meeting",
        "date": datetime.now() + timedelta(days=5),
        "description": "Election of new officers.",
        "type": EventType.MEETING,
        "location": "Community Hall"
    },
    {
        "id": 2,
        "title": "Trash Pickup",
        "date": datetime.now() + timedelta(days=1),
        "description": "Regular weekly pickup.",
        "type": EventType.MAINTENANCE,
        "location": "Curbside"
    },
    {
        "id": 3,
        "title": "Summer BBQ",
        "date": datetime.now() + timedelta(days=20),
        "description": "Burgers and hot dogs provided!",
        "type": EventType.SOCIAL,
        "location": "Pool Area"
    }
]

mock_directory = [
    {
        "id": 1,
        "name": "John Doe",
        "address": "123 Maple St",
        "email": "john@example.com",
        "phone": "555-0100",
        "bio": "Loves gardening and board games.",
        "is_opted_in": True,
        "preferences": {
            "general_email": True, "general_paper": False,
            "ccr_email": True, "ccr_paper": False,
            "collection_email": True, "collection_paper": True,
            "billing_email": True, "billing_paper": False,
            "mgmt_committee_notifications": True,
            "phone_communications": False
        }
    },
    {
        "id": 2,
        "name": "Jane Smith",
        "address": "125 Maple St",
        "email": "jane@hoa.com",
        "phone": "555-0200",
        "bio": "Board President.",
        "is_opted_in": True,
        "preferences": {
            "general_email": True, "general_paper": False,
            "ccr_email": True, "ccr_paper": False,
            "collection_email": False, "collection_paper": True,
            "billing_email": True, "billing_paper": False,
            "mgmt_committee_notifications": True,
            "phone_communications": True
        }
    },
    {
        "id": 3,
        "name": "Bob Wilson",
        "address": "127 Maple St",
        "email": "bob@example.com",
        "phone": None,
        "bio": None,
        "is_opted_in": False, # Should not be returned in public list normally, mocked logic below
        "preferences": {
            "general_email": False, "general_paper": True,
            "ccr_email": False, "ccr_paper": True,
            "collection_email": False, "collection_paper": True,
            "billing_email": False, "billing_paper": True,
            "mgmt_committee_notifications": False,
            "phone_communications": False
        }
    }
]

@router.get("/events", response_model=List[Event])
async def get_events():
    return sorted(mock_events, key=lambda x: x["date"])

@router.get("/directory", response_model=List[DirectoryProfile])
async def get_directory():
    # Filter for opted-in users
    return [p for p in mock_directory if p["is_opted_in"]]

@router.get("/all-residents", response_model=List[DirectoryProfile])
async def get_all_residents():
    # Board only - returns everyone plus preferences
    return mock_directory

@router.post("/directory/opt-in")
async def toggle_opt_in(user_id: int, status: bool):
    # Mock update
    for p in mock_directory:
        if p["id"] == user_id:
            p["is_opted_in"] = status
            return p
    raise HTTPException(status_code=404, detail="User not found")
