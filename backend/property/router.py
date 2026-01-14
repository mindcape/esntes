from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from enum import Enum

router = APIRouter()

class ARCStatus(str, Enum):
    PENDING = "Pending"
    UNDER_REVIEW = "Under Review"
    APPROVED = "Approved"
    DENIED = "Denied"
    MORE_INFO = "More Info Needed"

class ARCRequestBase(BaseModel):
    resident_id: int # In real app, get from auth context
    resident_address: str
    description: str
    contractor_name: str  # Now required
    projected_start: str  # Now required
    anticipated_end: Optional[str] = None
    terms_accepted: bool = False

class ARCRequest(ARCRequestBase):
    id: int
    submission_date: datetime
    status: ARCStatus
    comments: List[str] = []
    work_started_before_approval: bool = False

# Mock Database
mock_arc_requests = [
    {
        "id": 1,
        "resident_id": 1,
        "resident_address": "123 Main St",
        "description": "Install 6ft cedar fence in backyard.",
        "contractor_name": "Fence Masters Inc.",
        "projected_start": "2026-03-01",
        "anticipated_end": "2026-03-15",
        "submission_date": datetime(2026, 1, 10),
        "status": ARCStatus.PENDING,
        "comments": [],
        "terms_accepted": True,
        "work_started_before_approval": False
    },
    {
        "id": 2,
        "resident_id": 102,
        "resident_address": "Schrute Farms",
        "description": "Paint barn 'Beet Red'.",
        "contractor_name": "Mose",
        "projected_start": "2026-02-15",
        "anticipated_end": "2026-02-20",
        "submission_date": datetime(2026, 1, 5),
        "status": ARCStatus.UNDER_REVIEW,
        "comments": ["Board checking color pallette restrictions."],
        "terms_accepted": True,
        "work_started_before_approval": False
    }
]

@router.get("/arc/my", response_model=List[ARCRequest])
async def get_my_requests(user_id: int = 1): # Mock auth dependency
    # Filter for current user
    return [req for req in mock_arc_requests if req["resident_id"] == user_id]

@router.get("/arc/all", response_model=List[ARCRequest])
async def get_all_requests():
    # Board only access in real app
    return mock_arc_requests

@router.post("/arc", response_model=ARCRequest)
async def submit_request(request: ARCRequestBase):
    # Validate terms acceptance
    if not request.terms_accepted:
        raise HTTPException(status_code=400, detail="You must accept the terms and conditions to submit a request.")
    
    # Validate required fields
    if not request.contractor_name or not request.contractor_name.strip():
        raise HTTPException(status_code=400, detail="Contractor name is required. Enter 'Self' for DIY projects.")
    
    if not request.projected_start:
        raise HTTPException(status_code=400, detail="Projected start date is required.")
    
    # Validate date logic: end date must be after start date
    if request.anticipated_end and request.projected_start:
        try:
            from datetime import datetime as dt
            start_date = dt.fromisoformat(request.projected_start)
            end_date = dt.fromisoformat(request.anticipated_end)
            if end_date <= start_date:
                raise HTTPException(status_code=400, detail="Anticipated end date must be after the projected start date.")
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format.")
    
    new_req = {
        "id": len(mock_arc_requests) + 1,
        "resident_id": request.resident_id,
        "resident_address": request.resident_address,
        "description": request.description,
        "contractor_name": request.contractor_name,
        "projected_start": request.projected_start,
        "anticipated_end": request.anticipated_end,
        "submission_date": datetime.now(),
        "status": ARCStatus.PENDING,
        "comments": [],
        "terms_accepted": request.terms_accepted,
        "work_started_before_approval": False
    }
    mock_arc_requests.append(new_req)
    return new_req

@router.put("/arc/{request_id}/status", response_model=ARCRequest)
async def update_status(request_id: int, status: ARCStatus):
    for req in mock_arc_requests:
        if req["id"] == request_id:
            req["status"] = status
            return req
    raise HTTPException(status_code=404, detail="Request not found")
