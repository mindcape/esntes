
from sqlalchemy import Column, Integer, String, DateTime, Enum as SQLEnum, ForeignKey
from sqlalchemy.orm import relationship
from backend.core.database import Base
from datetime import datetime
import enum

class EventType(str, enum.Enum):
    MEETING = "Meeting"
    MAINTENANCE = "Maintenance"
    SOCIAL = "Social"
    HOLIDAY = "Holiday"
    OTHER = "Other"

class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(String, nullable=True)
    event_type = Column(SQLEnum(EventType, native_enum=False), default=EventType.OTHER)
    start_date = Column(DateTime)
    end_date = Column(DateTime)
    location = Column(String, nullable=True)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Optional: Link to community? Assuming single tenant for now or implied by user
    # But usually good to have community_id
    community_id = Column(Integer, ForeignKey("communities.id"), nullable=True)
    
    # Recurrence Fields
    recurrence_rule = Column(String, nullable=True) # e.g., 'DAILY', 'WEEKLY', 'MONTHLY'
    recurrence_end_date = Column(DateTime, nullable=True)
