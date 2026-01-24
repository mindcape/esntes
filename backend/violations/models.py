
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum as SQLEnum, Float
from sqlalchemy.orm import relationship
from backend.core.database import Base
from datetime import datetime
import enum

class ViolationStatus(str, enum.Enum):
    OPEN = "Open"
    WARNING = "Warning"
    FINED = "Fined"
    PAID = "Paid"
    CLOSED = "Closed"

class Violation(Base):
    __tablename__ = "violations"

    id = Column(Integer, primary_key=True, index=True)
    resident_id = Column(Integer, ForeignKey("users.id"))
    resident_name = Column(String) # Snapshot, or use relation
    resident_address = Column(String)
    description = Column(String)
    bylaw_reference = Column(String, nullable=True)
    date = Column(DateTime, default=datetime.utcnow)
    status = Column(SQLEnum(ViolationStatus, native_enum=False), default=ViolationStatus.WARNING)
    fine_amount = Column(Float, default=0.0)
    photo_url = Column(String, nullable=True)
    community_id = Column(Integer, ForeignKey("communities.id"), nullable=False, server_default="1")

    resident = relationship("User", backref="violations")
