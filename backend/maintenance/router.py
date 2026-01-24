
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from backend.core.database import get_db
from backend.maintenance.models import MaintenanceRequest, MaintenanceStatus
from backend.auth.models import User
from backend.auth.dependencies import get_current_user


from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from backend.core.database import get_db
from backend.maintenance.models import MaintenanceRequest, MaintenanceStatus
from backend.auth.models import User
from backend.auth.dependencies import get_current_user
from backend.community.models import Community

router = APIRouter()

class MaintenanceCreate(BaseModel):
    title: str
    description: str
    category: str
    image_url: Optional[str] = None

class MaintenanceResponse(BaseModel):
    id: int
    title: str
    description: str
    category: str
    status: MaintenanceStatus
    submitted_at: datetime
    image_url: Optional[str] = None

    class Config:
        orm_mode = True

@router.get("/{community_id}/maintenance", response_model=List[MaintenanceResponse])
async def get_requests(
    community_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify community
    community = db.query(Community).filter(Community.id == community_id).first()
    if not community:
        raise HTTPException(status_code=404, detail="Community not found")
        
    # Permission check: User must be in the community or super admin
    if current_user.community_id != community_id and current_user.role_id != 3:
         raise HTTPException(status_code=403, detail="Not a member of this community")

    return db.query(MaintenanceRequest).filter(
        MaintenanceRequest.community_id == community_id
    ).all()

@router.post("/{community_id}/maintenance", response_model=MaintenanceResponse)
async def create_request(
    community_id: int,
    request: MaintenanceCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify community
    community = db.query(Community).filter(Community.id == community_id).first()
    if not community:
        raise HTTPException(status_code=404, detail="Community not found")
        
    # Permission check
    if current_user.community_id != community_id and current_user.role_id != 3:
         raise HTTPException(status_code=403, detail="Not a member of this community")

    new_req = MaintenanceRequest(
        title=request.title,
        description=request.description,
        category=request.category,
        image_url=request.image_url,
        submitted_at=datetime.utcnow(),
        status=MaintenanceStatus.OPEN,
        community_id=community_id
    )
    db.add(new_req)
    db.commit()
    db.refresh(new_req)
    return new_req
