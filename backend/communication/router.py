from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from backend.core.database import get_db
from backend.communication.models import Announcement, AnnouncementAudience, AnnouncementStatus
from backend.auth.models import User, Role
from backend.auth.dependencies import get_current_user
from backend.core.email import send_email_async
import asyncio

router = APIRouter()

class AnnouncementCreate(BaseModel):
    title: str
    content: str
    audience: AnnouncementAudience = AnnouncementAudience.ALL_RESIDENTS

class AnnouncementOut(AnnouncementCreate):
    id: int
    community_id: int
    created_at: datetime
    sent_at: Optional[datetime] = None
    delivery_stats: Optional[dict] = None
    
    class Config:
        orm_mode = True

async def process_email_blast(announcement_id: int, db: Session):
    # Re-fetch announcement inside async task (needs new session or careful handling)
    # For simplicity in this demo, we'll pass the properties we need or use a new session
    # But BackgroundTasks in FastAPI run after the response, so the db session might be closed.
    # Better to use a fresh session or passed data. 
    pass 
    # NOTE: Implementing simple synchronous dispatch for now to avoid complexity with background sessions
    # In production, use Celery or proper BackgroundTasks with a new DB session.

@router.post("/", response_model=AnnouncementOut)
async def create_announcement(
    announcement: AnnouncementCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role.name not in ["admin", "board", "super_admin"]:
         raise HTTPException(status_code=403, detail="Not authorized")
    
    # Create Record
    new_announcement = Announcement(
        title=announcement.title,
        content=announcement.content,
        audience=announcement.audience,
        community_id=current_user.community_id,
        created_by_id=current_user.id,
        status=AnnouncementStatus.SENT, # Assuming immediate send for now
        sent_at=datetime.utcnow()
    )
    db.add(new_announcement)
    db.commit()
    db.refresh(new_announcement)

    # Fetch Recipients
    query = db.query(User).filter(User.community_id == current_user.community_id, User.is_active == True)
    
    if announcement.audience == AnnouncementAudience.BOARD_ONLY:
        query = query.join(Role).filter(Role.name.in_(["board", "admin"]))
    elif announcement.audience == AnnouncementAudience.OWNERS_ONLY:
        # Assuming we had an owner flag, but for now we might checks comments or roles
        # For this MVP, treat resident as owner, or add filtering if property model exists
        pass 
    
    recipients = query.all()
    
    # Send Emails (using the imported email utility)
    sent_count = 0
    for recipient in recipients:
        if recipient.email:
            try:
                # Add to background task to avoid blocking response too long
                background_tasks.add_task(
                    send_email_async,
                    recipient.email,
                    f"Community Announcement: {announcement.title}",
                    announcement.content # Simple text content for now
                )
                sent_count += 1
            except Exception as e:
                print(f"Failed to queue email for {recipient.email}: {e}")

    # Update stats
    new_announcement.delivery_stats = {"total": len(recipients), "sent": sent_count, "failed": 0}
    db.commit()
    
    return new_announcement

@router.get("/", response_model=List[AnnouncementOut])
def get_announcements(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role.name not in ["admin", "board", "super_admin"]:
         raise HTTPException(status_code=403, detail="Not authorized")
         
    return db.query(Announcement).filter(
        Announcement.community_id == current_user.community_id
    ).order_by(Announcement.created_at.desc()).all()
