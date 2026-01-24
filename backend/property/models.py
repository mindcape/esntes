
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum as SQLEnum, JSON, Boolean
from sqlalchemy.orm import relationship
from backend.core.database import Base
from datetime import datetime
import enum

class ARCStatus(str, enum.Enum):
    PENDING = "Pending"
    UNDER_REVIEW = "Under Review"
    APPROVED = "Approved"
    DENIED = "Denied"
    MORE_INFO = "More Info Needed"

class ARCRequest(Base):
    __tablename__ = "arc_requests"

    id = Column(Integer, primary_key=True, index=True)
    resident_id = Column(Integer, ForeignKey("users.id"))
    resident_address = Column(String)
    description = Column(String)
    contractor_name = Column(String)
    projected_start = Column(String) # Storing as ISO string for simplicity or Date
    anticipated_end = Column(String, nullable=True)
    submission_date = Column(DateTime, default=datetime.utcnow)
    status = Column(SQLEnum(ARCStatus, native_enum=False), default=ARCStatus.PENDING)
    comments = Column(JSON, default=[]) # List of strings
    terms_accepted = Column(Boolean, default=True)
    work_started_before_approval = Column(Boolean, default=False)
    community_id = Column(Integer, ForeignKey("communities.id"), nullable=False, server_default="1")

    resident = relationship("User", backref="arc_requests")
