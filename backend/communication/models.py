from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum as SQLEnum, Text, JSON
from sqlalchemy.orm import relationship
from backend.core.database import Base
from datetime import datetime
import enum

class AnnouncementAudience(str, enum.Enum):
    ALL_RESIDENTS = "All Residents"
    OWNERS_ONLY = "Owners Only"
    RENTAL_TENANTS = "Rental Tenants"
    BOARD_ONLY = "Board Only"

class AnnouncementStatus(str, enum.Enum):
    DRAFT = "Draft"
    SENT = "Sent"

class Announcement(Base):
    __tablename__ = "announcements"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    content = Column(Text) # HTML or Markdown
    audience = Column(SQLEnum(AnnouncementAudience), default=AnnouncementAudience.ALL_RESIDENTS)
    status = Column(SQLEnum(AnnouncementStatus), default=AnnouncementStatus.SENT)
    created_at = Column(DateTime, default=datetime.utcnow)
    sent_at = Column(DateTime, nullable=True)
    
    # Metadata about delivery stats (simple for now)
    delivery_stats = Column(JSON, default={"total": 0, "sent": 0, "failed": 0})
    
    community_id = Column(Integer, ForeignKey("communities.id"), nullable=False)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    community = relationship("Community")
    created_by = relationship("User")
