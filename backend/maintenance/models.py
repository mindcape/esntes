
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum as SQLEnum
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
