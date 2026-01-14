from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from enum import Enum

router = APIRouter()

class EventType(str, Enum):
    MEETING = "Meeting"
    MAINTENANCE = "Maintenance"
    SOCIAL = "Social"
    HOLIDAY = "Holiday"
    OTHER = "Other"

class EventBase(BaseModel):
    title: str
    description: Optional[str] = None
    event_type: EventType
    start_date: datetime
    end_date: datetime
    location: Optional[str] = None

class Event(EventBase):
    id: int
    created_by: str

class EventCreate(BaseModel):
    title: str
    description: Optional[str] = None
    event_type: EventType
    start_date: str  # ISO format string
    end_date: str    # ISO format string
    location: Optional[str] = None

# Mock Database
mock_events = [
    {
        "id": 1,
        "title": "HOA Board Meeting",
        "description": "Monthly board meeting to discuss community matters.",
        "event_type": EventType.MEETING,
        "start_date": datetime(2026, 1, 15, 18, 0),
        "end_date": datetime(2026, 1, 15, 20, 0),
        "location": "Community Center",
        "created_by": "Board Admin"
    },
    {
        "id": 2,
        "title": "Pool Maintenance",
        "description": "Annual pool cleaning and maintenance. Pool will be closed.",
        "event_type": EventType.MAINTENANCE,
        "start_date": datetime(2026, 1, 20, 8, 0),
        "end_date": datetime(2026, 1, 22, 17, 0),
        "location": "Community Pool",
        "created_by": "Management"
    },
    {
        "id": 3,
        "title": "New Year's Day",
        "description": "Office closed for holiday.",
        "event_type": EventType.HOLIDAY,
        "start_date": datetime(2026, 1, 1, 0, 0),
        "end_date": datetime(2026, 1, 1, 23, 59),
        "location": None,
        "created_by": "System"
    }
]

@router.get("/events", response_model=List[Event])
async def get_events(start_date: Optional[str] = None, end_date: Optional[str] = None):
    """Get all events, optionally filtered by date range"""
    events = mock_events
    
    if start_date:
        start_dt = datetime.fromisoformat(start_date)
        events = [e for e in events if e["start_date"] >= start_dt]
    
    if end_date:
        end_dt = datetime.fromisoformat(end_date)
        events = [e for e in events if e["end_date"] <= end_dt]
    
    return events

@router.post("/events", response_model=Event)
async def create_event(event: EventCreate):
    """Create new event (Board/Management only)"""
    # Validate required fields
    if not event.title or not event.title.strip():
        raise HTTPException(status_code=400, detail="Event title is required.")
    
    if not event.start_date or not event.end_date:
        raise HTTPException(status_code=400, detail="Start and end dates are required.")
    
    # Parse dates
    try:
        start_dt = datetime.fromisoformat(event.start_date)
        end_dt = datetime.fromisoformat(event.end_date)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use ISO format (YYYY-MM-DDTHH:MM:SS).")
    
    # Validate end date is after start date
    if end_dt <= start_dt:
        raise HTTPException(status_code=400, detail="End date must be after start date.")
    
    new_event = {
        "id": len(mock_events) + 1,
        "title": event.title,
        "description": event.description,
        "event_type": event.event_type,
        "start_date": start_dt,
        "end_date": end_dt,
        "location": event.location,
        "created_by": "Board Admin"  # In real app, get from auth context
    }
    mock_events.append(new_event)
    return new_event

@router.put("/events/{event_id}", response_model=Event)
async def update_event(event_id: int, event: EventCreate):
    """Update event (Board/Management only)"""
    for e in mock_events:
        if e["id"] == event_id:
            # Validate dates
            try:
                start_dt = datetime.fromisoformat(event.start_date)
                end_dt = datetime.fromisoformat(event.end_date)
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid date format.")
            
            if end_dt <= start_dt:
                raise HTTPException(status_code=400, detail="End date must be after start date.")
            
            # Update event
            e["title"] = event.title
            e["description"] = event.description
            e["event_type"] = event.event_type
            e["start_date"] = start_dt
            e["end_date"] = end_dt
            e["location"] = event.location
            return e
    
    raise HTTPException(status_code=404, detail="Event not found")

@router.delete("/events/{event_id}")
async def delete_event(event_id: int):
    """Delete event (Board/Management only)"""
    for i, e in enumerate(mock_events):
        if e["id"] == event_id:
            deleted_event = mock_events.pop(i)
            return {"message": f"Event '{deleted_event['title']}' deleted successfully."}
    
    raise HTTPException(status_code=404, detail="Event not found")
