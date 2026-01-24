from sqlalchemy import Column, Integer, String, Float, DateTime, Date, ForeignKey, Enum as SQLEnum, Boolean
from sqlalchemy.orm import relationship
from backend.core.database import Base
from datetime import datetime
import enum

class VendorDocumentType(str, enum.Enum):
    CONTRACT = "Contract"
    COI = "COI" # Certificate of Insurance
    W9 = "W9"
    OTHER = "Other"

class Vendor(Base):
    __tablename__ = "vendors"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    address = Column(String, nullable=True)
    category = Column(String, nullable=True) # e.g. Plumbing, Landscaping
    tax_id = Column(String, nullable=True) # EIN/SSN
    payment_terms = Column(String, nullable=True) # e.g. Net 30
    
    is_active = Column(Boolean, default=True)
    community_id = Column(Integer, ForeignKey("communities.id"), nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    documents = relationship("VendorDocument", back_populates="vendor", cascade="all, delete-orphan")
    payments = relationship("VendorPayment", back_populates="vendor")
    community = relationship("Community")

class VendorDocument(Base):
    __tablename__ = "vendor_documents"

    id = Column(Integer, primary_key=True, index=True)
    vendor_id = Column(Integer, ForeignKey("vendors.id"))
    type = Column(SQLEnum(VendorDocumentType))
    title = Column(String)
    url = Column(String)
    expiration_date = Column(Date, nullable=True)
    upload_date = Column(DateTime, default=datetime.utcnow)
    
    vendor = relationship("Vendor", back_populates="documents")

class VendorPayment(Base):
    __tablename__ = "vendor_payments"
    
    id = Column(Integer, primary_key=True, index=True)
    vendor_id = Column(Integer, ForeignKey("vendors.id"))
    community_id = Column(Integer, ForeignKey("communities.id"))
    
    amount = Column(Float)
    payment_date = Column(Date, default=datetime.utcnow)
    method = Column(String) # Check, ACH, etc.
    reference_number = Column(String, nullable=True)
    description = Column(String, nullable=True)
    status = Column(String, default="Completed")
    
    vendor = relationship("Vendor", back_populates="payments")
