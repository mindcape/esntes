from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
from pydantic import BaseModel, validator
from backend.core.database import get_db
from backend.auth.dependencies import get_current_user
from backend.auth.models import User
from backend.vendor.models import Vendor, VendorDocument, VendorPayment, VendorDocumentType
from backend.community.models import Community
import logging

logger = logging.getLogger(__name__)


router = APIRouter()

# --- Schemas ---
class VendorBase(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    category: Optional[str] = None
    tax_id: Optional[str] = None
    payment_terms: Optional[str] = None
    is_active: bool = True

    @validator('phone')
    def validate_phone(cls, v):
        if v is None:
            return v
        # Remove non-digit characters for checking length
        digits = "".join(filter(str.isdigit, v))
        if not (10 <= len(digits) <= 15):
             raise ValueError('Phone number must contain 10 to 15 digits')
        return v

class VendorCreate(VendorBase):
    pass

class VendorUpdate(VendorBase):
    pass

class VendorOut(VendorBase):
    id: int
    community_id: int
    created_at: Optional[date] = None
    
    class Config:
        orm_mode = True

class DocumentCreate(BaseModel):
    type: VendorDocumentType
    title: str
    url: str
    expiration_date: Optional[date] = None

class DocumentOut(DocumentCreate):
    id: int
    upload_date: Optional[date] = None
    
    class Config:
        orm_mode = True
    class Config:
        orm_mode = True

# --- Endpoints ---

@router.get("/", response_model=List[VendorOut])
def get_vendors(
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    # Board can see all vendors. Residents? Maybe not.
    # Assuming Board/Admin only for now.
    if current_user.role.name not in ["admin", "board", "super_admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    return db.query(Vendor).filter(Vendor.community_id == current_user.community_id).all()

@router.post("/", response_model=VendorOut)
def create_vendor(
    vendor: VendorCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role.name not in ["admin", "board", "super_admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    new_vendor = Vendor(**vendor.dict(), community_id=current_user.community_id)
    db.add(new_vendor)
    db.commit()
    db.refresh(new_vendor)
    return new_vendor

@router.get("/{vendor_id}", response_model=VendorOut)
def get_vendor(
    vendor_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role.name not in ["admin", "board", "super_admin"]:
         raise HTTPException(status_code=403, detail="Not authorized")

    vendor = db.query(Vendor).filter(Vendor.id == vendor_id, Vendor.community_id == current_user.community_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    return vendor

@router.put("/{vendor_id}", response_model=VendorOut)
def update_vendor(
    vendor_id: int,
    vendor_update: VendorUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role.name not in ["admin", "board", "super_admin"]:
         raise HTTPException(status_code=403, detail="Not authorized")
         
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id, Vendor.community_id == current_user.community_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
        
    for key, value in vendor_update.dict().items():
        setattr(vendor, key, value)
        
    db.commit()
    db.refresh(vendor)
    return vendor

@router.delete("/{vendor_id}")
def delete_vendor(
    vendor_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role.name not in ["admin", "board", "super_admin"]:
         raise HTTPException(status_code=403, detail="Not authorized")

    vendor = db.query(Vendor).filter(Vendor.id == vendor_id, Vendor.community_id == current_user.community_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
        
    db.delete(vendor)
    db.commit()
    return {"message": "Vendor deleted"}

# --- Document Endpoints ---

@router.post("/{vendor_id}/documents", response_model=DocumentOut)
def add_document(
    vendor_id: int,
    document: DocumentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role.name not in ["admin", "board", "super_admin"]:
         raise HTTPException(status_code=403, detail="Not authorized")
    
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id, Vendor.community_id == current_user.community_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
        
    new_doc = VendorDocument(**document.dict(), vendor_id=vendor_id)
    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)
    return new_doc

@router.get("/{vendor_id}/documents", response_model=List[DocumentOut])
def get_documents(
    vendor_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role.name not in ["admin", "board", "super_admin"]:
         raise HTTPException(status_code=403, detail="Not authorized")
         
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id, Vendor.community_id == current_user.community_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
        
    return vendor.documents
