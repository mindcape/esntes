from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional

from backend.core.database import get_db
from backend.community.models import Community

router = APIRouter()

class CommunityCreate(BaseModel):
    name: str
    address: str
    units_count: int = 0
    amenities: Optional[List[str]] = []
    # New Fields
    subdomain: Optional[str] = None
    branding_settings: Optional[dict] = {}
    modules_enabled: Optional[dict] = {
        "finance": True,
        "arc": True,
        "voting": True,
        "violations": True,
        "documents": True,
        "calendar": True
    }
    payment_gateway_id: Optional[str] = None

class CommunityResponse(CommunityCreate):
    id: int
    
    class Config:
        orm_mode = True

@router.post("/communities", response_model=CommunityResponse)
async def create_community(community: CommunityCreate, db: Session = Depends(get_db)):
    # Check for duplicate name
    existing = db.query(Community).filter(Community.name == community.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Community with this name already exists")
    
    # Check for duplicate subdomain
    if community.subdomain:
        existing_sub = db.query(Community).filter(Community.subdomain == community.subdomain).first()
        if existing_sub:
            raise HTTPException(status_code=400, detail="Subdomain already exists")

    new_community = Community(
        name=community.name,
        address=community.address,
        units_count=community.units_count,
        amenities=community.amenities,
        subdomain=community.subdomain,
        branding_settings=community.branding_settings,
        modules_enabled=community.modules_enabled,
        payment_gateway_id=community.payment_gateway_id
    )
    db.add(new_community)
    db.commit()
    db.refresh(new_community)
    return new_community

@router.get("/communities", response_model=List[CommunityResponse])
async def list_communities(db: Session = Depends(get_db)):
    return db.query(Community).all()
