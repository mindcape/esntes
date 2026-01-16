from fastapi import APIRouter, HTTPException, Depends, File, UploadFile
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
import csv
import io

from backend.core.database import get_db
from backend.community.models import Community
from backend.auth.models import User, Role
from passlib.context import CryptContext

router = APIRouter()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

@router.post("/communities/{community_id}/import")
async def import_residents(community_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    # Verify community exists
    community = db.query(Community).filter(Community.id == community_id).first()
    if not community:
        raise HTTPException(status_code=404, detail="Community not found")

    # Read and decode file
    content = await file.read()
    decoded = content.decode('utf-8')
    csv_reader = csv.DictReader(io.StringIO(decoded))

    # Pre-fetch roles
    roles = {r.name: r.id for r in db.query(Role).all()}
    
    imported_count = 0
    errors = []

    for row in csv_reader:
        email = row.get('email')
        name = row.get('name')
        address = row.get('address')
        role_name = row.get('role', 'resident').lower() # Default to resident

        if not email:
            continue
            
        # Check existing
        if db.query(User).filter(User.email == email).first():
            errors.append(f"Skipped {email}: Already exists")
            continue

        # Get Role ID
        role_id = roles.get(role_name)
        if not role_id:
            # Fallback mapping if needed or default
            if 'board' in role_name: role_id = roles.get('board')
            else: role_id = roles.get('resident')
        
        # Create User
        new_user = User(
            email=email,
            full_name=name,
            address=address,
            community_id=community_id,
            role_id=role_id,
            auth0_id=f"import|{email}", # Mock Auth0 ID
            is_active=True,
            is_opted_in=True
        )
        # Set default password (welcom123) - In real app, trigger reset email
        new_user.hashed_password = pwd_context.hash("welcome123") 
        
        db.add(new_user)
        imported_count += 1

    db.commit()
    
    return {
        "message": f"Successfully imported {imported_count} residents",
        "errors": errors
    }

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

class CommunityUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    units_count: Optional[int] = None
    amenities: Optional[List[str]] = None
    subdomain: Optional[str] = None
    branding_settings: Optional[dict] = None
    modules_enabled: Optional[dict] = None
    payment_gateway_id: Optional[str] = None

@router.put("/communities/{community_id}", response_model=CommunityResponse)
async def update_community(community_id: int, community: CommunityUpdate, db: Session = Depends(get_db)):
    db_community = db.query(Community).filter(Community.id == community_id).first()
    if not db_community:
        raise HTTPException(status_code=404, detail="Community not found")
    
    update_data = community.dict(exclude_unset=True)
    
    # Check uniqueness if name or subdomain is being updated
    if "name" in update_data:
        existing = db.query(Community).filter(Community.name == update_data["name"]).filter(Community.id != community_id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Community name already taken")
            
    if "subdomain" in update_data and update_data["subdomain"]:
        existing_sub = db.query(Community).filter(Community.subdomain == update_data["subdomain"]).filter(Community.id != community_id).first()
        if existing_sub:
            raise HTTPException(status_code=400, detail="Subdomain already taken")

    for key, value in update_data.items():
        setattr(db_community, key, value)

    db.commit()
    db.refresh(db_community)
    return db_community
