from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, JSON
from sqlalchemy.orm import relationship
from backend.core.database import Base
from datetime import datetime
import enum

class CampaignStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    SCHEDULED = "SCHEDULED"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

class EmailStatus(str, enum.Enum):
    PENDING = "PENDING"
    SENT = "SENT"
    FAILED = "FAILED"
    RETRY = "RETRY"

class MessageTemplate(Base):
    __tablename__ = "message_templates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    subject_template = Column(String)
    content_html = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Ownership
    community_id = Column(Integer, ForeignKey("communities.id"))
    created_by_id = Column(Integer, ForeignKey("users.id"))

    campaigns = relationship("Campaign", back_populates="template")

class Campaign(Base):
    __tablename__ = "campaigns"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    status = Column(String, default=CampaignStatus.DRAFT)
    
    scheduled_at = Column(DateTime, nullable=True)
    sent_at = Column(DateTime, nullable=True)
    
    audience_filter = Column(JSON) # e.g. {"role": "resident", "is_delinquent": true}
    
    template_id = Column(Integer, ForeignKey("message_templates.id"))
    template = relationship("MessageTemplate", back_populates="campaigns")
    
    community_id = Column(Integer, ForeignKey("communities.id"))
    created_by_id = Column(Integer, ForeignKey("users.id"))
    
    # Stats
    total_recipients = Column(Integer, default=0)
    sent_count = Column(Integer, default=0)
    failed_count = Column(Integer, default=0)

class EmailQueue(Base):
    __tablename__ = "email_queue"
    
    id = Column(Integer, primary_key=True, index=True)
    
    campaign_id = Column(Integer, ForeignKey("campaigns.id"), nullable=True)
    recipient_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    recipient_email = Column(String, index=True)
    
    subject = Column(String)
    body = Column(Text)
    
    status = Column(String, default=EmailStatus.PENDING)
    attempts = Column(Integer, default=0)
    last_error = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
