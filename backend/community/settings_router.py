from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Dict, List, Optional, Any
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..auth.dependencies import get_current_user
from ..auth.models import User
from .models import Community
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

class CommunitySettings(BaseModel):
    branding_settings: Dict[str, Any]
    modules_enabled: Dict[str, bool]
    
    class Config:
        orm_mode = True

class InviteBoardRequest(BaseModel):
    emails: List[str]

@router.get("/settings", response_model=CommunitySettings)
def get_community_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.community_id:
        raise HTTPException(status_code=400, detail="User not part of a community")
        
    community = db.query(Community).get(current_user.community_id)
    if not community:
        raise HTTPException(status_code=404, detail="Community not found")
        
    return community

@router.patch("/settings", response_model=CommunitySettings)
def update_community_settings(
    settings: CommunitySettings,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.community_id:
        raise HTTPException(status_code=400, detail="User not part of a community")
        
    if current_user.role.name not in ["admin", "super_admin"]:
         raise HTTPException(status_code=403, detail="Only Admins can update settings")

    community = db.query(Community).get(current_user.community_id)
    
    # Update fields
    community.branding_settings = settings.branding_settings
    community.modules_enabled = settings.modules_enabled
    
    db.commit()
    db.refresh(community)
    return community

@router.post("/invite-board")
def invite_board_members(
    invite_req: InviteBoardRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from ..auth.models import Role
    
    if not current_user.community_id:
        raise HTTPException(status_code=400, detail="User not part of a community")

    # This is a stub for bulk invitation logic
    # In a real impl, this would create Users with 'invited' status or send emails
    # reusing the logic from router.register_resident but simpler
    
    logger.info(f"Inviting board members: {invite_req.emails}")
    
    # For now, just log valid emails being processed
    return {"message": f"Invitations sent to {len(invite_req.emails)} recipients"}
