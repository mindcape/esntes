
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.core.database import get_db
from backend.auth.dependencies import get_current_user
from backend.auth.models import User
from backend.maintenance.models import MaintenanceRequest, MaintenanceStatus
from backend.calendar.models import Event
from backend.finance.models import Account, Transaction
from backend.violations.models import Violation
from datetime import datetime
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

from backend.communication.models import Campaign, EmailStatus

@router.get("/resident/stats")
async def get_resident_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Open Requests
    # Filtering generally for now as we lack requester_id
    open_requests = db.query(MaintenanceRequest).filter(
        MaintenanceRequest.status != MaintenanceStatus.COMPLETED
    ).count()

    # 2. Next Event
    next_event = db.query(Event).filter(
        Event.start_date >= datetime.utcnow()
    ).order_by(Event.start_date.asc()).first()
    
    next_event_data = {
        "date": next_event.start_date.strftime("%b %d") if next_event else "N/A",
        "title": next_event.title if next_event else "No upcoming events"
    }

    # 3. Balance (Mock logic for now)
    current_balance = 0.00 
    
    # 4. Recent Activity (New)
    activities = []
    
    # Recent Events
    recent_events = db.query(Event).filter(
        Event.start_date >= datetime.utcnow()
    ).order_by(Event.start_date.asc()).limit(3).all()
    for e in recent_events:
        activities.append({
            "id": f"event-{e.id}",
            "type": "event",
            "title": f"Event: {e.title}",
            "date": e.start_date.isoformat(),
            "description": e.description[:50] + "..." if e.description else ""
        })
        
    # Recent Maintenance (Community)
    recent_maint = db.query(MaintenanceRequest).order_by(
        MaintenanceRequest.submitted_at.desc()
    ).limit(3).all()
    for m in recent_maint:
        activities.append({
            "id": f"maint-{m.id}",
            "type": "maintenance",
            "title": f"Maintenance: {m.title}",
            "date": m.submitted_at.isoformat(),
            "description": f"Status: {m.status}"
        })
        
    # Sort by date desc
    activities.sort(key=lambda x: x['date'], reverse=True)
    
    return {
        "balance": current_balance,
        "open_requests": open_requests,
        "next_event": next_event_data,
        "recent_activity": activities[:5], # Top 5 latest
        "quick_actions": [
            {"label": "Report Issue", "path": "/maintenance", "icon": "wrench"},
            {"label": "Community Calendar", "path": "/calendar", "icon": "calendar"},
            {"label": "My Documents", "path": "/documents", "icon": "folder"},
        ]
    }

@router.get("/board/stats")
async def get_board_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Total Delinquency (Sum of all positive balances from our delinquency logic - simplistic here)
    # This requires summing up user balances. We'll return a placeholder or 0 if no logic ready.
    total_delinquency = 1240.00 # Placeholder until we have a proper aggregate view

    # 2. Open Work Orders
    open_work_orders = db.query(MaintenanceRequest).filter(
        MaintenanceRequest.status != MaintenanceStatus.COMPLETED
    ).count()

    # 3. Operating Account Balance
    # Find account '1010'
    operating_account = db.query(Account).filter(Account.code == "1010").first()
    operating_balance = 0.0
    if operating_account:
        from backend.finance.models import JournalEntry
        result = db.query(func.sum(JournalEntry.debit), func.sum(JournalEntry.credit)).filter(JournalEntry.account_id == operating_account.id).first()
        if result:
            debits = result[0] or 0
            credits = result[1] or 0
            operating_balance = debits - credits
            
    # 4. Pending ARC
    # Need to import ARCRequest model 
    from backend.property.models import ARCRequest, ARCStatus

    pending_arc = db.query(ARCRequest).filter(ARCRequest.status == ARCStatus.PENDING).count()

    return {
        "delinquency": total_delinquency,
        "open_work_orders": open_work_orders,
        "operating_account": operating_balance,
        "pending_arc": pending_arc
    }
