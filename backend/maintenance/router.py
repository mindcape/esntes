from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from backend.core.database import get_db
from backend.maintenance.models import MaintenanceRequest, MaintenanceStatus, WorkOrder, WorkOrderStatus, VendorBid, VendorBidStatus
from backend.auth.models import User
from backend.auth.dependencies import get_current_user
from backend.community.models import Community
import logging

logger = logging.getLogger(__name__)


from backend.vendor.models import Vendor

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

# --- Work Orders ---

class WorkOrderBase(BaseModel):
    title: str
    description: Optional[str] = None
    status: WorkOrderStatus = WorkOrderStatus.OPEN
    budget: Optional[float] = None
    maintenance_request_id: Optional[int] = None
    assigned_vendor_id: Optional[int] = None

class WorkOrderCreate(WorkOrderBase):
    pass

class WorkOrderOut(WorkOrderBase):
    id: int
    community_id: int
    created_at: datetime
    
    class Config:
        orm_mode = True

@router.post("/work-orders", response_model=WorkOrderOut)
def create_work_order(
    item: WorkOrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role.name not in ["admin", "board", "super_admin"]:
         raise HTTPException(status_code=403, detail="Not authorized")
         
    new_wo = WorkOrder(**item.dict(), community_id=current_user.community_id)
    db.add(new_wo)
    db.commit()
    db.refresh(new_wo)
    return new_wo

@router.get("/work-orders", response_model=List[WorkOrderOut])
def get_work_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role.name not in ["admin", "board", "super_admin"]:
         raise HTTPException(status_code=403, detail="Not authorized")
         
    return db.query(WorkOrder).filter(WorkOrder.community_id == current_user.community_id).all()

@router.put("/work-orders/{wo_id}", response_model=WorkOrderOut)
def update_work_order(
    wo_id: int,
    item: WorkOrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role.name not in ["admin", "board", "super_admin"]:
         raise HTTPException(status_code=403, detail="Not authorized")
         
    wo = db.query(WorkOrder).filter(WorkOrder.id == wo_id, WorkOrder.community_id == current_user.community_id).first()
    if not wo:
        raise HTTPException(status_code=404, detail="Work Order not found")
    
    for key, value in item.dict().items():
        setattr(wo, key, value)
        
    db.commit()
    db.refresh(wo)
    return wo

# --- Bidding ---

class VendorBidCreate(BaseModel):
    vendor_id: Optional[int] # Optional for Vendor Users (inferred)
    amount: float
    notes: Optional[str] = None

class VendorBidOut(VendorBidCreate):
    id: int
    status: VendorBidStatus
    submitted_at: datetime
    
    class Config:
        orm_mode = True

@router.post("/work-orders/{wo_id}/bids", response_model=VendorBidOut)
def add_bid(
    wo_id: int,
    item: VendorBidCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Allow Vendor, Admin, Board
    allowed = ["admin", "board", "super_admin", "vendor"]
    if current_user.role.name not in allowed:
         raise HTTPException(status_code=403, detail="Not authorized")
    
    # Resolve Vendor ID
    vendor_id = item.vendor_id
    if current_user.role.name == "vendor":
        # Find vendor profile linked to user
        v_profile = db.query(Vendor).filter(Vendor.user_id == current_user.id).first()
        if not v_profile:
             raise HTTPException(status_code=400, detail="No vendor profile linked to this user")
        vendor_id = v_profile.id
    elif not vendor_id:
        raise HTTPException(status_code=400, detail="Vendor ID required for manual entry")

    # Verify Work Order
    # Vendors can only bid on assignments? Or Open Bids?
    # Assuming "Public" bidding for vendors in the community?
    # Vendors usually bid on "Open" WOs.
    # WO must be in user's community if user is board/admin.
    # If Vendor, they must be in same community (v_profile.community_id).
    
    wo = db.query(WorkOrder).filter(WorkOrder.id == wo_id).first()
    if not wo:
        raise HTTPException(status_code=404, detail="Work Order not found")
        
    if current_user.role.name == "vendor":
        if wo.community_id != v_profile.community_id:
             raise HTTPException(status_code=403, detail="Work Order not in your community")
    elif wo.community_id != current_user.community_id and current_user.role_id != 3:
         raise HTTPException(status_code=403, detail="Access denied")
        
    new_bid = VendorBid(
        vendor_id=vendor_id,
        work_order_id=wo_id,
        amount=item.amount,
        notes=item.notes
    )
    db.add(new_bid)
    db.commit()
    db.refresh(new_bid)
    return new_bid

@router.get("/work-orders/{wo_id}/bids", response_model=List[VendorBidOut])
def get_bids(
    wo_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role.name not in ["admin", "board", "super_admin"]:
         raise HTTPException(status_code=403, detail="Not authorized")
         
    wo = db.query(WorkOrder).filter(WorkOrder.id == wo_id, WorkOrder.community_id == current_user.community_id).first()
    if not wo:
        raise HTTPException(status_code=404, detail="Work Order not found")
        
    return wo.bids

@router.post("/work-orders/{wo_id}/award/{bid_id}", response_model=WorkOrderOut)
def award_bid(
    wo_id: int,
    bid_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role.name not in ["admin", "board", "super_admin"]:
         raise HTTPException(status_code=403, detail="Not authorized")
    
    wo = db.query(WorkOrder).filter(WorkOrder.id == wo_id, WorkOrder.community_id == current_user.community_id).first()
    if not wo:
        raise HTTPException(status_code=404, detail="Work Order not found")
        
    target_bid = db.query(VendorBid).filter(VendorBid.id == bid_id, VendorBid.work_order_id == wo_id).first()
    if not target_bid:
        raise HTTPException(status_code=404, detail="Bid not found")
        
    if wo.status != WorkOrderStatus.OPEN:
        raise HTTPException(status_code=400, detail="Work Order is not open")

    # update Work Order details
    wo.assigned_vendor_id = target_bid.vendor_id
    wo.budget = target_bid.amount
    wo.status = WorkOrderStatus.IN_PROGRESS
    
    # Update Bids
    for bid in wo.bids:
        if bid.id == bid_id:
            bid.status = VendorBidStatus.ACCEPTED
        else:
            bid.status = VendorBidStatus.REJECTED
            
    db.commit()
    db.refresh(wo)
    return wo
