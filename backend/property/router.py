
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from backend.core.database import get_db
from backend.property.models import ARCRequest, ARCStatus
from backend.auth.models import User
from backend.auth.dependencies import get_current_user


from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from backend.core.database import get_db
from backend.property.models import ARCRequest, ARCStatus
from backend.auth.models import User
from backend.auth.dependencies import get_current_user
from backend.community.models import Community

router = APIRouter()

class ARCRequestBase(BaseModel):
    resident_id: int 
    resident_address: str
    description: str
    contractor_name: str
    projected_start: str
    anticipated_end: Optional[str] = None
    terms_accepted: bool = False

class ARCRequestResponse(ARCRequestBase):
    id: int
    submission_date: datetime
    status: ARCStatus
    comments: List[str] = []
    work_started_before_approval: bool = False
    
    class Config:
        orm_mode = True

@router.get("/{community_id}/arc/my", response_model=List[ARCRequestResponse])
async def get_my_requests(
    community_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify community
    community = db.query(Community).filter(Community.id == community_id).first()
    if not community:
        raise HTTPException(status_code=404, detail="Community not found")

    if current_user.community_id != community_id and current_user.role_id != 3:
         raise HTTPException(status_code=403, detail="Not a member of this community")

    # Filter by user ID AND community ID
    return db.query(ARCRequest).filter(
        ARCRequest.resident_id == current_user.id,
        ARCRequest.community_id == community_id
    ).all()

@router.get("/{community_id}/arc", response_model=List[ARCRequestResponse])
async def get_all_requests(
    community_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify community
    community = db.query(Community).filter(Community.id == community_id).first()
    if not community:
        raise HTTPException(status_code=404, detail="Community not found")
        
    # Permission Check (Board/Admin)
    if current_user.role_id != 3: # If not super admin
        if current_user.community_id != community_id:
             raise HTTPException(status_code=403, detail="Access denied")
        # Check if board role
        if not (current_user.role and current_user.role.name in ['board', 'admin']):
             raise HTTPException(status_code=403, detail="Only board members can view ARC requests")

    return db.query(ARCRequest).filter(
        ARCRequest.community_id == community_id
    ).all()

@router.post("/{community_id}/arc", response_model=ARCRequestResponse)
async def submit_request(
    community_id: int,
    request: ARCRequestBase, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify community
    community = db.query(Community).filter(Community.id == community_id).first()
    if not community:
        raise HTTPException(status_code=404, detail="Community not found")
        
    if current_user.community_id != community_id and current_user.role_id != 3:
         raise HTTPException(status_code=403, detail="Not a member of this community")

    if not request.terms_accepted:
        raise HTTPException(status_code=400, detail="Terms must be accepted.")
    
    new_req = ARCRequest(
        resident_id=current_user.id, # Use authenticated user ID
        resident_address=request.resident_address,
        description=request.description,
        contractor_name=request.contractor_name,
        projected_start=request.projected_start,
        anticipated_end=request.anticipated_end,
        terms_accepted=request.terms_accepted,
        submission_date=datetime.utcnow(),
        status=ARCStatus.PENDING,
        community_id=community_id
    )
    db.add(new_req)
    db.commit()
    db.refresh(new_req)
    return new_req

@router.put("/{community_id}/arc/{request_id}/status", response_model=ARCRequestResponse)
async def update_status(
    community_id: int,
    request_id: int, 
    status: ARCStatus, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify community context
    req = db.query(ARCRequest).filter(ARCRequest.id == request_id, ARCRequest.community_id == community_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found in this community")
    
    # Permission Check
    if current_user.role_id != 3:
        if current_user.community_id != community_id:
             raise HTTPException(status_code=403, detail="Access denied")
        if not (current_user.role and current_user.role.name in ['board', 'admin']):
             raise HTTPException(status_code=403, detail="Only board members can update ARC status")

    req.status = status
    db.commit()
    db.refresh(req)
    return req
