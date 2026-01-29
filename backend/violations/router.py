
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from backend.core.database import get_db
from backend.violations.models import Violation, ViolationStatus
from backend.auth.models import User
from backend.auth.dependencies import get_current_user


from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from backend.core.database import get_db
from backend.violations.models import Violation, ViolationStatus
from backend.auth.models import User
from backend.auth.dependencies import get_current_user
from backend.community.models import Community
import logging

logger = logging.getLogger(__name__)


router = APIRouter()

class ViolationCreate(BaseModel):
    resident_id: int
    resident_name: str
    resident_address: str
    description: str
    bylaw_reference: Optional[str] = None
    action: str  # "warning" or "fine"
    fine_amount: Optional[float] = 0.0
    photo_url: Optional[str] = None

class ViolationResponse(BaseModel):
    id: int
    resident_id: int
    resident_name: str
    resident_address: str
    description: str
    bylaw_reference: Optional[str]
    date: datetime
    status: ViolationStatus
    fine_amount: float
    photo_url: Optional[str]
    
    class Config:
        orm_mode = True

@router.get("/{community_id}/violations/my", response_model=List[ViolationResponse])
async def get_my_violations(
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

    return db.query(Violation).filter(
        Violation.resident_id == current_user.id,
        Violation.community_id == community_id
    ).all()

@router.get("/{community_id}/violations", response_model=List[ViolationResponse])
async def get_all_violations(
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
             raise HTTPException(status_code=403, detail="Only board members can view all violations")

    return db.query(Violation).filter(
        Violation.community_id == community_id
    ).all()

@router.post("/{community_id}/violations", response_model=ViolationResponse)
async def create_violation(
    community_id: int,
    violation: ViolationCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify community
    community = db.query(Community).filter(Community.id == community_id).first()
    if not community:
        raise HTTPException(status_code=404, detail="Community not found")

    # Permission Check (Board/Admin)
    if current_user.role_id != 3:
        if current_user.community_id != community_id:
             raise HTTPException(status_code=403, detail="Access denied")
        if not (current_user.role and current_user.role.name in ['board', 'admin']):
             raise HTTPException(status_code=403, detail="Only board members can log violations")

    if violation.action.lower() == "fine":
        status = ViolationStatus.FINED
        fine_amount = violation.fine_amount if violation.fine_amount else 100.0
    else:
        status = ViolationStatus.WARNING
        fine_amount = 0.0
    
    new_violation = Violation(
        resident_id=violation.resident_id,
        resident_name=violation.resident_name,
        resident_address=violation.resident_address,
        description=violation.description,
        bylaw_reference=violation.bylaw_reference,
        status=status,
        fine_amount=fine_amount,
        photo_url=violation.photo_url,
        date=datetime.utcnow(),
        community_id=community_id
    )
    db.add(new_violation)
    db.commit()
    db.refresh(new_violation)
    return new_violation

@router.put("/{community_id}/violations/{violation_id}/status", response_model=ViolationResponse)
async def update_violation_status(
    community_id: int,
    violation_id: int, 
    status: ViolationStatus, 
    fine_amount: Optional[float] = None, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify community context for violation
    v = db.query(Violation).filter(Violation.id == violation_id, Violation.community_id == community_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Violation not found in this community")
        
    # Permission Check
    if current_user.role_id != 3:
        if current_user.community_id != community_id:
             raise HTTPException(status_code=403, detail="Access denied")
        if not (current_user.role and current_user.role.name in ['board', 'admin']):
             raise HTTPException(status_code=403, detail="Only board members can update violations")

    v.status = status
    if fine_amount is not None and status == ViolationStatus.FINED:
        v.fine_amount = fine_amount
    elif status != ViolationStatus.FINED:
        v.fine_amount = 0.0
        
    db.commit()
    db.refresh(v)
    return v

@router.post("/{community_id}/violations/{violation_id}/pay")
async def pay_violation(
    community_id: int,
    violation_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    v = db.query(Violation).filter(Violation.id == violation_id, Violation.community_id == community_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Violation not found")
    
    # Permission: Resident paying their own fine, or Admin marking as paid?
    # Usually resident pays
    if current_user.role_id != 3:
         if v.resident_id != current_user.id and not (current_user.role and current_user.role.name in ['board', 'admin']):
              raise HTTPException(status_code=403, detail="Not authorized to pay this fine")

    if v.status != ViolationStatus.FINED:
        raise HTTPException(status_code=400, detail="No outstanding fine.")
        
    v.status = ViolationStatus.PAID
    # Integration with Ledger would happen here (create JournalEntry)
    db.commit()
    
    return {"message": "Paid", "amount": v.fine_amount}
