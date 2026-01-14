from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from enum import Enum

router = APIRouter()

class ViolationStatus(str, Enum):
    OPEN = "Open"
    WARNING = "Warning"
    FINED = "Fined"
    PAID = "Paid"
    CLOSED = "Closed"

class ViolationBase(BaseModel):
    resident_id: int
    resident_name: str
    resident_address: str
    description: str
    bylaw_reference: Optional[str] = None
    fine_amount: float = 0.0
    photo_url: Optional[str] = None

class Violation(ViolationBase):
    id: int
    date: datetime
    status: ViolationStatus

class ViolationCreate(BaseModel):
    resident_id: int
    resident_name: str
    resident_address: str
    description: str
    bylaw_reference: Optional[str] = None
    action: str  # "warning" or "fine"
    fine_amount: Optional[float] = 0.0
    photo_url: Optional[str] = None

# Mock Database
mock_violations = [
    {
        "id": 1,
        "resident_id": 1,
        "resident_name": "John Doe",
        "resident_address": "123 Main St",
        "description": "Lawn not maintained per community standards (grass height exceeds 6 inches).",
        "bylaw_reference": "Section 4.2 - Landscaping Standards",
        "date": datetime(2026, 1, 5),
        "status": ViolationStatus.WARNING,
        "fine_amount": 0.0,
        "photo_url": None
    },
    {
        "id": 2,
        "resident_id": 102,
        "resident_name": "Dwight Schrute",
        "resident_address": "Schrute Farms",
        "description": "Unauthorized structure (beet stand) erected without ARC approval.",
        "bylaw_reference": "Section 8.1 - Architectural Review",
        "date": datetime(2025, 12, 20),
        "status": ViolationStatus.FINED,
        "fine_amount": 250.00,
        "photo_url": None
    }
]

@router.get("/my", response_model=List[Violation])
async def get_my_violations(user_id: int = 1):  # Mock auth
    """Resident view: Get their own violations (read-only)"""
    return [v for v in mock_violations if v["resident_id"] == user_id]

@router.get("/all", response_model=List[Violation])
async def get_all_violations():
    """Board view: Get all violations"""
    return mock_violations

@router.post("/", response_model=Violation)
async def create_violation(violation: ViolationCreate):
    """Board only: Create new violation"""
    # Validate required fields
    if not violation.description or not violation.description.strip():
        raise HTTPException(status_code=400, detail="Violation description is required.")
    
    if not violation.resident_name or not violation.resident_name.strip():
        raise HTTPException(status_code=400, detail="Resident name is required.")
    
    # Determine status and fine based on action
    if violation.action.lower() == "fine":
        status = ViolationStatus.FINED
        fine_amount = violation.fine_amount if violation.fine_amount else 100.0
    else:
        status = ViolationStatus.WARNING
        fine_amount = 0.0
    
    new_violation = {
        "id": len(mock_violations) + 1,
        "resident_id": violation.resident_id,
        "resident_name": violation.resident_name,
        "resident_address": violation.resident_address,
        "description": violation.description,
        "bylaw_reference": violation.bylaw_reference,
        "date": datetime.now(),
        "status": status,
        "fine_amount": fine_amount,
        "photo_url": violation.photo_url
    }
    mock_violations.append(new_violation)
    return new_violation

@router.put("/{violation_id}/status", response_model=Violation)
async def update_violation_status(violation_id: int, status: ViolationStatus, fine_amount: Optional[float] = None):
    """Board only: Update violation status and optionally fine amount"""
    for v in mock_violations:
        if v["id"] == violation_id:
            v["status"] = status
            # Update fine amount if provided and status is FINED
            if fine_amount is not None and status == ViolationStatus.FINED:
                v["fine_amount"] = fine_amount
            # Clear fine if status is not FINED
            elif status != ViolationStatus.FINED:
                v["fine_amount"] = 0.0
            return v
    raise HTTPException(status_code=404, detail="Violation not found")

@router.post("/{violation_id}/pay")
async def pay_violation(violation_id: int):
    """Resident: Pay fine for a violation"""
    for v in mock_violations:
        if v["id"] == violation_id:
            if v["status"] != ViolationStatus.FINED:
                raise HTTPException(status_code=400, detail="This violation does not have an outstanding fine.")
            
            # Update status to PAID
            v["status"] = ViolationStatus.PAID
            
            # In real implementation, would integrate with finance/ledger
            return {
                "message": f"Fine of ${v['fine_amount']} paid successfully.",
                "violation_id": violation_id,
                "amount_paid": v["fine_amount"]
            }
    
    raise HTTPException(status_code=404, detail="Violation not found")
