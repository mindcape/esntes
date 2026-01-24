
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from backend.core.database import Base
from datetime import datetime
import enum

class MaintenanceStatus(str, enum.Enum):
    OPEN = "Open"
    IN_PROGRESS = "In Progress"
    COMPLETED = "Completed"

class MaintenanceRequest(Base):
    __tablename__ = "maintenance_requests"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    description = Column(String)
    category = Column(String) # Plumbing, Electrical, etc.
    status = Column(SQLEnum(MaintenanceStatus, native_enum=False), default=MaintenanceStatus.OPEN)
    submitted_at = Column(DateTime, default=datetime.utcnow)
    image_url = Column(String, nullable=True)
    # Ideally link to requester, but for now standalone or board only
    # Ideally link to requester, but for now standalone or board only
    # requester_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    community_id = Column(Integer, ForeignKey("communities.id"), nullable=False, server_default="1")
    
    # Relationship to WorkOrder
    work_order = relationship("WorkOrder", back_populates="maintenance_request", uselist=False)

class WorkOrderStatus(str, enum.Enum):
    OPEN = "Open"
    IN_PROGRESS = "In Progress"
    COMPLETED = "Completed"
    CANCELLED = "Cancelled"

class WorkOrder(Base):
    __tablename__ = "work_orders"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    description = Column(String)
    status = Column(SQLEnum(WorkOrderStatus), default=WorkOrderStatus.OPEN)
    budget = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    community_id = Column(Integer, ForeignKey("communities.id"), nullable=False)
    maintenance_request_id = Column(Integer, ForeignKey("maintenance_requests.id"), nullable=True)
    assigned_vendor_id = Column(Integer, ForeignKey("vendors.id"), nullable=True)
    
    # Relationships
    maintenance_request = relationship("MaintenanceRequest", back_populates="work_order")
    vendor = relationship("Vendor") # One-way for now
    bids = relationship("VendorBid", back_populates="work_order", cascade="all, delete-orphan")

class VendorBidStatus(str, enum.Enum):
    SUBMITTED = "Submitted"
    ACCEPTED = "Accepted"
    REJECTED = "Rejected"

class VendorBid(Base):
    __tablename__ = "vendor_bids"
    
    id = Column(Integer, primary_key=True, index=True)
    work_order_id = Column(Integer, ForeignKey("work_orders.id"), nullable=False)
    vendor_id = Column(Integer, ForeignKey("vendors.id"), nullable=False)
    amount = Column(Float)
    notes = Column(String, nullable=True)
    status = Column(SQLEnum(VendorBidStatus), default=VendorBidStatus.SUBMITTED)
    submitted_at = Column(DateTime, default=datetime.utcnow)
    
    work_order = relationship("WorkOrder", back_populates="bids")
    vendor = relationship("Vendor")
