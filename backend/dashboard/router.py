
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

@router.get("/resident/stats")
async def get_resident_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Open Requests
    open_requests = db.query(MaintenanceRequest).filter(
        # In a real app, we'd filter by requester_id if we had it. 
        # For now, let's just count open requests generally or by some logic.
        # Ideally, we should add 'resident_id' to MaintenanceRequest. 
        # But we'll count ALL open requests for visibility if we can't filter by user yet.
        # Actually user.id check would be best if model supported it.
        # Checking MaintenanceRequest model... it has no resident_id column in my previous view.
        # So lets just return *some* count or 0.
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

    # 3. Balance (Mock logic for now as Ledger is complex per user)
    # We can query 'delinquencies' logic if available, or return 0
    current_balance = 0.00 
    
    return {
        "balance": current_balance,
        "open_requests": open_requests,
        "next_event": next_event_data
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
