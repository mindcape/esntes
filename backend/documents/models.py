from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from backend.core.database import Base
import enum
from datetime import datetime

class AccessLevel(str, enum.Enum):
    PUBLIC = "Public"
    BOARD_ONLY = "Board Only"

class DocumentCategory(str, enum.Enum):
    BYLAWS = "Bylaws"
    MINUTES = "Meeting Minutes"
    FINANCIALS = "Financial Reports"
    POLICIES = "Policies"
    OTHER = "Other"

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    category = Column(String)
    access_level = Column(String)
    description = Column(String, nullable=True)
    file_url = Column(String)
    upload_date = Column(DateTime, default=datetime.utcnow)
    uploaded_by = Column(String)
    community_id = Column(Integer, ForeignKey("communities.id"), nullable=False, server_default="1")
