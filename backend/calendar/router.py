
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from backend.core.database import get_db
from backend.calendar.models import Event, EventType
from backend.auth.dependencies import get_current_user # Assuming we want auth
from backend.auth.models import User


from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from backend.core.database import get_db
from backend.calendar.models import Event, EventType
from backend.auth.dependencies import get_current_user
from backend.auth.models import User
from backend.community.models import Community
import logging

logger = logging.getLogger(__name__)


router = APIRouter()

class EventBase(BaseModel):
    title: str
    description: Optional[str] = None
    event_type: EventType
    start_date: datetime
    end_date: datetime
    location: Optional[str] = None
    recurrence_rule: Optional[str] = None
    recurrence_end_date: Optional[datetime] = None

class EventResponse(EventBase):
    id: int
    created_by_id: Optional[int]
    community_id: Optional[int]

    class Config:
        orm_mode = True

class EventCreate(EventBase):
    pass

@router.get("/{community_id}/events", response_model=List[EventResponse])
async def get_events(
    community_id: int,
    start_date: Optional[str] = None, 
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify community exists
    community = db.query(Community).filter(Community.id == community_id).first()
    if not community:
        raise HTTPException(status_code=404, detail="Community not found")

    # Verify user access to community (Optional: depends on if public/private)
    if current_user.community_id != community_id and current_user.role_id != 3: # Allow super admin
        # For now we might restrict to members only
        raise HTTPException(status_code=403, detail="Not a member of this community")

    query = db.query(Event).filter(Event.community_id == community_id)
    
    if start_date:
        try:
            start_dt = datetime.fromisoformat(start_date)
            query = query.filter(Event.start_date >= start_dt)
        except ValueError:
            pass
    
    if end_date:
        try:
            end_dt = datetime.fromisoformat(end_date)
            query = query.filter(Event.end_date <= end_dt)
        except ValueError:
            pass
            
    return query.all()

@router.post("/{community_id}/events", response_model=EventResponse)
async def create_event(
    community_id: int,
    event: EventCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify community
    community = db.query(Community).filter(Community.id == community_id).first()
    if not community:
        raise HTTPException(status_code=404, detail="Community not found")

    # Verify authorization (Must be board member or admin of THIS community)
    if current_user.community_id != community_id and current_user.role_id != 3:
         raise HTTPException(status_code=403, detail="Not authorized to create events for this community")
         
    # Check permissions (Board/Admin only usually)
    # Assuming standard roles: 1=Resident, 2=Board, 3=SuperAdmin
    is_board = False
    if current_user.role and current_user.role.name in ['board', 'admin', 'super_admin']:
        is_board = True
        
    if not is_board and current_user.role_id != 3:
         raise HTTPException(status_code=403, detail="Only board members can create events")

    # Validate dates
    if event.end_date <= event.start_date:
        raise HTTPException(status_code=400, detail="End date must be after start date.")
        
    db_event = Event(
        title=event.title,
        description=event.description,
        event_type=event.event_type,
        start_date=event.start_date,
        end_date=event.end_date,
        location=event.location,
        recurrence_rule=event.recurrence_rule,
        recurrence_end_date=event.recurrence_end_date,
        created_by_id=current_user.id,
        community_id=community_id
    )
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return db_event

@router.put("/{community_id}/events/{event_id}", response_model=EventResponse)
async def update_event(
    community_id: int,
    event_id: int, 
    event: EventCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Validate community context matches event
    db_event = db.query(Event).filter(Event.id == event_id, Event.community_id == community_id).first()
    if not db_event:
        raise HTTPException(status_code=404, detail="Event not found in this community")
        
    # Permission check
    is_board = False
    if current_user.role and current_user.role.name in ['board', 'admin', 'super_admin']:
        is_board = True
    
    # Must be board of this community or super admin
    if (current_user.community_id != community_id and current_user.role_id != 3) or (not is_board and current_user.role_id != 3):
        raise HTTPException(status_code=403, detail="Not authorized to edit events")

    db_event.title = event.title
    db_event.description = event.description
    db_event.event_type = event.event_type
    db_event.start_date = event.start_date
    db_event.end_date = event.end_date
    db_event.location = event.location
    db_event.recurrence_rule = event.recurrence_rule
    db_event.recurrence_end_date = event.recurrence_end_date
    
    db.commit()
    db.refresh(db_event)
    return db_event

@router.delete("/{community_id}/events/{event_id}")
async def delete_event(
    community_id: int,
    event_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_event = db.query(Event).filter(Event.id == event_id, Event.community_id == community_id).first()
    if not db_event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Permission check
    is_board = False
    if current_user.role and current_user.role.name in ['board', 'admin', 'super_admin']:
        is_board = True
        
    if (current_user.community_id != community_id and current_user.role_id != 3) or (not is_board and current_user.role_id != 3):
        raise HTTPException(status_code=403, detail="Not authorized to delete events")
        
    db.delete(db_event)
    db.commit()
    return {"message": "Event deleted"}
