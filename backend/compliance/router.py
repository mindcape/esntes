from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
from datetime import datetime
from enum import Enum
import logging

logger = logging.getLogger(__name__)


router = APIRouter()

class ViolationStatus(str, Enum):
    OPEN = "Open"
    RESOLVED = "Resolved"
    DISPUTED = "Disputed"

class Violation(BaseModel):
    id: int
    title: str
    description: str
    status: ViolationStatus
    fine_amount: float
    issued_date: datetime
    # In real app, would link to a specific User ID

class ViolationCreate(BaseModel):
    title: str
    description: str
    fine_amount: float = 0.0

# Mock Database
mock_violations = [
    {
        "id": 1,
        "title": "Unapproved Fence Color",
        "description": "Fence painted bright purple without ARC approval.",
        "status": ViolationStatus.OPEN,
        "fine_amount": 50.00,
        "issued_date": datetime.now()
    }
]

@router.get("/", response_model=List[Violation])
async def get_violations():
    # Board sees all, Resident sees theirs. Mock returns all.
    return mock_violations

@router.post("/", response_model=Violation)
async def create_violation(violation: ViolationCreate):
    new_v = {
        "id": len(mock_violations) + 1,
        "title": violation.title,
        "description": violation.description,
        "status": ViolationStatus.OPEN,
        "fine_amount": violation.fine_amount,
        "issued_date": datetime.now()
    }
    mock_violations.append(new_v)
    return new_v
