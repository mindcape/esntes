from fastapi import APIRouter, HTTPException, Depends, File, UploadFile
from sqlalchemy.orm import Session
from pydantic import BaseModel, validator
from typing import List, Optional
import csv
import io
import re

from backend.core.database import get_db
from backend.community.models import Community
from backend.auth.models import User, Role
from backend.auth.security import get_password_hash
from backend.auth.dependencies import get_current_user

router = APIRouter()

class SiteAdminCreate(BaseModel):
    email: str
    name: str

    @validator('email')
    def validate_email(cls, v):
        if not re.match(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$", v):
             raise ValueError('Invalid email format')
        return v

class RoleResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None

    class Config:
        orm_mode = True

@router.get("/roles", response_model=List[RoleResponse])
async def get_roles(db: Session = Depends(get_db)):
    return db.query(Role).filter(Role.name != "super_admin").all()

class SiteAdminResponse(BaseModel):
    id: int
    email: str
    full_name: str
    
    class Config:
        orm_mode = True

@router.get("/communities/{community_id}/admins", response_model=List[SiteAdminResponse])
async def list_site_admins(community_id: int, db: Session = Depends(get_db)):
    # Get Admin Role
    admin_role = db.query(Role).filter(Role.name == "admin").first()
    if not admin_role:
        raise HTTPException(status_code=500, detail="Admin role not configured")

    admins = db.query(User).filter(
        User.community_id == community_id,
        User.role_id == admin_role.id
    ).all()
    return admins

class MemberResponse(BaseModel):
    id: int
    full_name: Optional[str] = None
    email: str
    role: str
    address: Optional[str] = None
    is_active: bool
    is_setup_complete: bool

    class Config:
        orm_mode = True

@router.get("/communities/{community_id}/members", response_model=List[MemberResponse])
async def list_community_members(community_id: int, db: Session = Depends(get_db)):
    # Verify Community exists
    community = db.query(Community).filter(Community.id == community_id).first()
    if not community:
        raise HTTPException(status_code=404, detail="Community not found")

    members = db.query(User).filter(User.community_id == community_id).all()
    
    response = []
    for m in members:
        role_name = m.role.name if m.role else "Unknown"
        response.append(MemberResponse(
            id=m.id,
            full_name=m.full_name,
            email=m.email,
            role=role_name,
            address=m.address,
            is_active=m.is_active,
            is_setup_complete=m.is_setup_complete
        ))
    return response

class MemberCreate(BaseModel):
    full_name: str
    email: str
    role_name: str = "resident" # 'resident', 'board', 'admin'
    address: Optional[str] = None
    resident_type: Optional[str] = "owner"
    owner_type: Optional[str] = "individual"

    @validator('email')
    def validate_email(cls, v):
        if not re.match(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$", v):
             raise ValueError('Invalid email format')
        return v

@router.post("/communities/{community_id}/members")
async def create_community_member(community_id: int, member: MemberCreate, db: Session = Depends(get_db)):
    import logging
    logger = logging.getLogger(__name__)
    
    logger.info(f"Creating member in community {community_id}: email={member.email}, role={member.role_name}")
    
    # 1. Verify Community
    community = db.query(Community).filter(Community.id == community_id).first()
    if not community:
        logger.error(f"Community not found: {community_id}")
        raise HTTPException(status_code=404, detail="Community not found")
    
    logger.debug(f"Community verified: {community.name}")
        
    # 2. Check if email exists
    existing_user = db.query(User).filter(User.email == member.email).first()
    if existing_user:
        logger.warning(f"Member creation failed: Email already registered - {member.email}")
        raise HTTPException(status_code=400, detail="Email already registered")
    
    logger.debug(f"Email check passed: {member.email}")

    # 3. Get Role ID
    role = db.query(Role).filter(Role.name == member.role_name).first()
    if not role:
        logger.info(f"Role '{member.role_name}' not found, creating new role")
        # Fallback creation if role doesn't exist
        role = Role(name=member.role_name, description="Created via Admin")
        db.add(role)
        db.commit()
        logger.debug(f"Created new role: {member.role_name} (id: {role.id})")
    else:
        logger.debug(f"Role found: {member.role_name} (id: {role.id})")

    # 4. Create User
    logger.debug(f"Creating user object for {member.email}")
    new_user = User(
        email=member.email,
        full_name=member.full_name,
        community_id=community_id,
        role_id=role.id,
        address=member.address,
        is_active=True,
        is_opted_in=True,
        resident_type=member.resident_type,
        owner_type=member.owner_type,
        auth0_id=f"admin_created|{member.email}" 
    )
    new_user.hashed_password = get_password_hash("welcome123")
    
    db.add(new_user)
    db.commit()
    
    logger.info(f"Member created successfully: {member.email} (user_id: {new_user.id}, community: {community.name}, role: {member.role_name})")
    
    return {"message": "Member created successfully"}

class MemberUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    role_name: Optional[str] = None
    address: Optional[str] = None
    resident_type: Optional[str] = None
    owner_type: Optional[str] = None
    
    @validator('email')
    def validate_email(cls, v):
        if v and not re.match(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$", v):
             raise ValueError('Invalid email format')
        return v
    is_active: Optional[bool] = None
    is_setup_complete: Optional[bool] = None

@router.put("/communities/{community_id}/members/{user_id}")
async def update_community_member(community_id: int, user_id: int, member: MemberUpdate, db: Session = Depends(get_db)):
    # 1. Verify Community
    community = db.query(Community).filter(Community.id == community_id).first()
    if not community:
        raise HTTPException(status_code=404, detail="Community not found")

    # 2. Get User
    user = db.query(User).filter(User.id == user_id, User.community_id == community_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found in this community")

    # 3. Update Fields
    if member.full_name: user.full_name = member.full_name
    if member.email: user.email = member.email
    if member.address: user.address = member.address
    if member.resident_type: user.resident_type = member.resident_type
    if member.owner_type: user.owner_type = member.owner_type
    if member.is_active is not None: user.is_active = member.is_active
    if member.is_setup_complete is not None: user.is_setup_complete = member.is_setup_complete

    # 4. Update Role if provided
    if member.role_name:
        role = db.query(Role).filter(Role.name == member.role_name).first()
        if not role:
             # Fallback creation 
            role = Role(name=member.role_name, description="Created via Admin")
            db.add(role)
            db.commit()
        user.role_id = role.id

    db.commit()
    db.commit()
    return {"message": "Member updated successfully"}

class BulkDeleteRequest(BaseModel):
    user_ids: List[int]

@router.post("/communities/{community_id}/members/bulk-delete")
async def bulk_delete_members(community_id: int, request: BulkDeleteRequest, db: Session = Depends(get_db)):
    # 1. Verify Community
    community = db.query(Community).filter(Community.id == community_id).first()
    if not community:
        raise HTTPException(status_code=404, detail="Community not found")

    # 2. Deactivate users
    # We only deactivate users belonging to this community to prevent accidental cross-tenant deletion
    result = db.query(User).filter(
        User.id.in_(request.user_ids),
        User.community_id == community_id
    ).update({User.is_active: False}, synchronize_session=False)

    db.commit()
    
    return {"message": f"Successfully deactivated {result} members"}

class ResetPasswordRequest(BaseModel):
    password: Optional[str] = None

@router.post("/users/{user_id}/reset-password")
async def reset_user_password(user_id: int, request: ResetPasswordRequest = None, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if request and request.password:
        new_password = request.password
    else:
        # Generate a random password
        import secrets
        import string
        alphabet = string.ascii_letters + string.digits
        new_password = ''.join(secrets.choice(alphabet) for i in range(10))
    
    user.hashed_password = get_password_hash(new_password)
    db.commit()
    
    return {"message": "Password reset successfully", "new_password": new_password}

@router.post("/communities/{community_id}/admins")
async def create_site_admin(community_id: int, admin_data: SiteAdminCreate, db: Session = Depends(get_db)):
    # 1. Verify Community
    community = db.query(Community).filter(Community.id == community_id).first()
    if not community:
        raise HTTPException(status_code=404, detail="Community not found")
        
    # 2. Get Admin Role
    admin_role = db.query(Role).filter(Role.name == "admin").first()
    if not admin_role:
        # Fallback if roles aren't seeded, though they should be
        admin_role = Role(name="admin", description="Community Administrator")
        db.add(admin_role)
        db.commit()
    
    # 3. Check if user exists
    existing_user = db.query(User).filter(User.email == admin_data.email).first()
    
    if existing_user:
        # Update existing user to be admin of this community
        # Note: This might overwrite their previous role/community.
        # For simplicity in this iteration, we assume a user belongs to one community.
        existing_user.role_id = admin_role.id
        existing_user.community_id = community_id
        db.commit()
        return {"message": f"User {existing_user.email} promoted to Site Admin for {community.name}"}
    else:
        # Create new user
        new_user = User(
            email=admin_data.email,
            full_name=admin_data.name,
            community_id=community_id,
            role_id=admin_role.id,
            auth0_id=f"admin|{admin_data.email}", # Mock Auth0 ID
            is_active=True
        )
        new_user.hashed_password = get_password_hash("welcome123")
        db.add(new_user)
        db.commit()
        return {"message": f"Created new Site Admin {new_user.email} for {community.name}"}

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
        new_user.hashed_password = get_password_hash("welcome123") 
        
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
class CommunityCreate(BaseModel):
    name: str
    address: str
    units_count: int = 0
    amenities: Optional[List[str]] = []
    # New Fields
    subdomain: Optional[str] = None
    community_code: str # Mandatory now
    is_active: bool = True
    branding_settings: Optional[dict] = {}
    modules_enabled: Optional[dict] = {
        "finance": True,
        "arc": True,
        "violations": True,
        "documents": True,
        "calendar": True
    }
    payment_gateway_id: Optional[str] = None
    
    # Detailed Address
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    address2: Optional[str] = None
    county: Optional[str] = None
    
    # POC
    poc_name: Optional[str] = None
    poc_email: Optional[str] = None
    poc_phone: Optional[str] = None

    @validator('poc_email')
    def validate_email(cls, v):
        if v and not re.match(r"[^@]+@[^@]+\.[^@]+", v):
            raise ValueError('Invalid email format')
        return v

    @validator('poc_phone')
    def validate_phone(cls, v):
        # Allow basic formats: (123) 456-7890, 123-456-7890, 1234567890, +1...
        if v and not re.match(r'^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$', v):
            raise ValueError('Invalid phone format')
        return v

class CommunityResponse(CommunityCreate):
    id: int
    
    class Config:
        orm_mode = True

@router.post("/communities", response_model=CommunityResponse)
async def create_community(community: CommunityCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Check for duplicate name
    existing = db.query(Community).filter(Community.name == community.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Community with this name already exists")
    
    # Check for duplicate community code
    existing_code = db.query(Community).filter(Community.community_code == community.community_code).first()
    if existing_code:
        raise HTTPException(status_code=400, detail="Community code already exists")

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
        community_code=community.community_code,
        is_active=community.is_active,
        branding_settings=community.branding_settings,
        modules_enabled=community.modules_enabled,
        payment_gateway_id=community.payment_gateway_id,
        city=community.city,
        state=community.state,
        zip_code=community.zip_code,
        address2=community.address2,
        county=community.county,
        poc_name=community.poc_name,
        poc_email=community.poc_email,
        poc_phone=community.poc_phone
    )
    db.add(new_community)
    db.commit()
    db.refresh(new_community)
    return new_community

@router.get("/communities", response_model=List[CommunityResponse])
async def list_communities(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Community).all()

class CommunityUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    units_count: Optional[int] = None
    is_active: Optional[bool] = None
    amenities: Optional[List[str]] = None
    subdomain: Optional[str] = None
    branding_settings: Optional[dict] = None
    modules_enabled: Optional[dict] = None
    payment_gateway_id: Optional[str] = None
    
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    address2: Optional[str] = None
    county: Optional[str] = None
    poc_name: Optional[str] = None
    poc_email: Optional[str] = None
    poc_phone: Optional[str] = None

    @validator('poc_email')
    def validate_email(cls, v):
        if v and not re.match(r"[^@]+@[^@]+\.[^@]+", v):
            raise ValueError('Invalid email format')
        return v

    @validator('poc_phone')
    def validate_phone(cls, v):
        if v and not re.match(r'^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$', v):
            raise ValueError('Invalid phone format')
        return v


@router.get("/communities/{community_id}", response_model=CommunityResponse)
async def get_community(community_id: int, db: Session = Depends(get_db)):
    community = db.query(Community).filter(Community.id == community_id).first()
    if not community:
        raise HTTPException(status_code=404, detail="Community not found")
    return community

@router.put("/communities/{community_id}", response_model=CommunityResponse)
async def update_community(community_id: int, community: CommunityUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
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
