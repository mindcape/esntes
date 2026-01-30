from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from backend.core.database import get_db
from backend.auth.dependencies import get_current_user
from backend.auth.models import User
from backend.communication.models import MessageTemplate, Campaign
from backend.communication.service import CampaignService
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()

# Schemas
class TemplateCreate(BaseModel):
    name: str
    subject_template: str
    content_html: str

class TemplateRead(TemplateCreate):
    id: int
    created_at: datetime
    class Config:
        orm_mode = True

class CampaignCreate(BaseModel):
    title: str
    template_id: int
    audience_filter: dict
    scheduled_at: Optional[datetime] = None

class CampaignRead(CampaignCreate):
    id: int
    status: str
    total_recipients: int
    sent_count: int
    failed_count: int
    class Config:
        orm_mode = True

# --- Template Endpoints ---

@router.post("/templates", response_model=TemplateRead)
def create_template(
    template: TemplateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_template = MessageTemplate(
        **template.dict(),
        community_id=current_user.community_id,
        created_by_id=current_user.id
    )
    db.add(db_template)
    db.commit()
    db.refresh(db_template)
    return db_template

@router.get("/templates", response_model=List[TemplateRead])
def list_templates(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(MessageTemplate).filter(
        MessageTemplate.community_id == current_user.community_id
    ).all()

# --- Campaign Endpoints ---

@router.post("/campaigns", response_model=CampaignRead)
def create_campaign(
    campaign: CampaignCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = CampaignService(db)
    new_campaign = service.create_campaign(
        title=campaign.title,
        template_id=campaign.template_id,
        audience_filter=campaign.audience_filter,
        scheduled_at=campaign.scheduled_at or datetime.utcnow(),
        community_id=current_user.community_id, # type: ignore
        user_id=current_user.id
    )
    return new_campaign

@router.get("/campaigns", response_model=List[CampaignRead])
def list_campaigns(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Campaign).filter(
        Campaign.community_id == current_user.community_id
    ).all()

# --- Failed Email Management ---

class EmailQueueRead(BaseModel):
    id: int
    recipient_email: str
    subject: str
    status: str
    attempts: int
    last_error: Optional[str]
    updated_at: datetime
    class Config:
        orm_mode = True

@router.get("/emails/failed", response_model=List[EmailQueueRead])
def list_failed_emails(
    campaign_id: Optional[int] = None,
    community_id: Optional[int] = None, # Super Admin override
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from backend.communication.models import EmailQueue, EmailStatus
    
    # RBAC
    target_community_id = current_user.community_id
    if current_user.role.name == "super_admin" and community_id:
        target_community_id = community_id
    
    query = db.query(EmailQueue).join(Campaign).filter(
        EmailQueue.status.in_([EmailStatus.FAILED, EmailStatus.RETRY]),
        Campaign.community_id == target_community_id
    )
    
    if campaign_id:
        query = query.filter(EmailQueue.campaign_id == campaign_id)
        
    return query.limit(100).all()

@router.post("/emails/{email_id}/retry")
def retry_email(
    email_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from backend.communication.models import EmailQueue, EmailStatus
    
    email = db.query(EmailQueue).join(Campaign).filter(EmailQueue.id == email_id).first()
    if not email:
        raise HTTPException(status_code=404, detail="Email not found")
    
    # RBAC Check
    campaign = db.query(Campaign).get(email.campaign_id)
    if campaign.community_id != current_user.community_id and current_user.role.name != "super_admin":
        raise HTTPException(status_code=403, detail="Not authorized")
        
    email.status = EmailStatus.PENDING
    email.attempts = 0
    email.last_error = None
    db.commit()
    return {"message": "Email queued for retry"}

@router.post("/campaigns/{campaign_id}/retry")
def retry_campaign_failures(
    campaign_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from backend.communication.models import EmailQueue, EmailStatus
    
    campaign = db.query(Campaign).get(campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
        
    if campaign.community_id != current_user.community_id and current_user.role.name != "super_admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Bulk Update
    db.query(EmailQueue).filter(
        EmailQueue.campaign_id == campaign_id,
        EmailQueue.status.in_([EmailStatus.FAILED, EmailStatus.RETRY])
    ).update({
        EmailQueue.status: EmailStatus.PENDING,
        EmailQueue.attempts: 0,
        EmailQueue.last_error: None
    }, synchronize_session=False)
    
    db.commit()
    return {"message": "All failed emails queued for retry"}
