
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from backend.core.database import get_db
from backend.auth.dependencies import get_current_user
from backend.auth.models import User
from backend.community.models import Community

router = APIRouter()

class BoardMember(BaseModel):
    name: str
    position: str = "Board Member" # Default as we don't have separate position column yet, maybe add to User or Role detail
    email: str

class CommunityInfoResponse(BaseModel):
    name: str
    address: str
    city_state_zip: str
    phone: str
    email: str

@router.get("/info", response_model=CommunityInfoResponse)
async def get_community_info(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.community_id:
        if current_user.role_id == 3: # Super Admin
             return CommunityInfoResponse(
                name="System Administration",
                address="Cloud",
                city_state_zip="N/A",
                phone="N/A",
                email=current_user.email
            )
        raise HTTPException(status_code=404, detail="User not associated with a community")
        
    community = db.query(Community).filter(Community.id == current_user.community_id).first()
    if not community:
        raise HTTPException(status_code=404, detail="Community not found")
        
    # Format city state zip
    city = community.city or ""
    state = community.state or ""
    zip_c = community.zip_code or ""
    csz = f"{city}, {state} {zip_c}".strip().strip(",")
    if not csz: csz = "N/A"

    return CommunityInfoResponse(
        name=community.name,
        address=community.address,
        city_state_zip=csz,
        phone=community.phone or "N/A",
        email=community.email or "N/A"
    )

@router.get("/board", response_model=List[BoardMember])
async def get_board_members(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.community_id:
        return []
        
    # Assuming Role ID 2 is Board
    board_users = db.query(User).filter(
        User.community_id == current_user.community_id,
        User.role_id == 2
    ).all()
    
    return [
        BoardMember(
            name=user.full_name or user.email, # Fallback to email if name is empty
            position="Board Member", # Placeholder until we have positions
            email=user.email
        )
        for user in board_users
    ]
