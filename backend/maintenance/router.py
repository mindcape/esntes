from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from enum import Enum

router = APIRouter()

class MaintenanceStatus(str, Enum):
    OPEN = "Open"
    IN_PROGRESS = "In Progress"
    COMPLETED = "Completed"

class MaintenanceRequest(BaseModel):
    id: int
    title: str
    description: str
    category: str
    status: MaintenanceStatus
    submitted_at: datetime
    image_url: Optional[str] = None

class MaintenanceCreate(BaseModel):
    title: str
    description: str
    category: str
    image_url: Optional[str] = None

# Mock Database
mock_maintenance_requests = [
    {
        "id": 1,
        "title": "Leaky Faucet in Gym",
        "description": "The faucet in the men's locker room is dripping constantly.",
        "category": "Plumbing",
        "status": MaintenanceStatus.OPEN,
        "submitted_at": datetime.now(),
        "image_url": None
    }
]

@router.get("/", response_model=List[MaintenanceRequest])
async def get_requests():
    return mock_maintenance_requests

@router.post("/", response_model=MaintenanceRequest)
async def create_request(request: MaintenanceCreate):
    new_req = {
        "id": len(mock_maintenance_requests) + 1,
        "title": request.title,
        "description": request.description,
        "category": request.category,
        "status": MaintenanceStatus.OPEN,
        "submitted_at": datetime.now(),
        "image_url": request.image_url
    }
    mock_maintenance_requests.append(new_req)
    return new_req
