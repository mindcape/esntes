
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.core.database import get_db
from backend.finance.models import Account, Transaction as DBTransaction, JournalEntry, AccountType
from backend.auth.models import User
from backend.auth.dependencies import get_current_user, require_role
from backend.community.models import Community
from backend.finance.utils import ensure_coa_exists
from datetime import datetime, timedelta

router = APIRouter()

# --- Pydantic Schemas ---

class AccountResponse(BaseModel):
    id: int
    code: str
    name: str
    type: AccountType
    parent_id: Optional[int]
    
    class Config:
        orm_mode = True

class JournalEntryCreate(BaseModel):
    account_id: int
    debit: float = 0.0
    credit: float = 0.0
    description: Optional[str] = None
    
    class Config:
        orm_mode = True

class JournalEntryResponse(BaseModel):
    id: int
    account_id: int
    debit: float
    credit: float
    description: Optional[str]
    account_name: Optional[str] = None # Helper

    class Config:
        orm_mode = True

class TransactionCreate(BaseModel):
    date: Optional[datetime] = None
    description: str
    entries: List[JournalEntryCreate]

class TransactionResponse(BaseModel):
    id: int
    date: datetime
    description: str
    entries: List[JournalEntryResponse]
    
    class Config:
        orm_mode = True

# --- API Endpoints ---

@router.get("/{community_id}/finance/accounts", response_model=List[AccountResponse])
async def get_accounts(
    community_id: int,
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    # Verify community
    community = db.query(Community).filter(Community.id == community_id).first()
    if not community:
        raise HTTPException(status_code=404, detail="Community not found")
        
    if current_user.community_id != community_id and current_user.role_id != 3:
         raise HTTPException(status_code=403, detail="Not a member of this community")

    return db.query(Account).filter(
        Account.community_id == community_id
    ).order_by(Account.code).all()

@router.post("/{community_id}/finance/transactions", response_model=TransactionResponse)
async def create_transaction(
    community_id: int,
    tx: TransactionCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "treasurer", "board"]))
):
    # Verify community
    community = db.query(Community).filter(Community.id == community_id).first()
    if not community:
        raise HTTPException(status_code=404, detail="Community not found")
        
    if current_user.community_id != community_id and current_user.role_id != 3:
         raise HTTPException(status_code=403, detail="Not a member of this community")

    # Permission check (Board/Admin only)
    if not (current_user.role and current_user.role.name in ['board', 'admin']) and current_user.role_id != 3:
        raise HTTPException(status_code=403, detail="Only board members can create transactions")

    # Validate debits == credits
    total_debit = sum(e.debit for e in tx.entries)
    total_credit = sum(e.credit for e in tx.entries)
    
    if abs(total_debit - total_credit) > 0.01:
        raise HTTPException(status_code=400, detail=f"Transaction unbalanced: Debits {total_debit} != Credits {total_credit}")

    new_tx = DBTransaction(
        date=tx.date or datetime.utcnow(),
        description=tx.description,
        community_id=community_id  # Important: Transaction belongs to community
    )
    db.add(new_tx)
    db.commit() # Commit to get ID
    
    for entry in tx.entries:
        # Security: verify account belongs to same community
        account = db.query(Account).filter(Account.id == entry.account_id).first()
        if not account or account.community_id != community_id:
             raise HTTPException(status_code=400, detail=f"Invalid Account ID: {entry.account_id}")

        new_entry = JournalEntry(
            transaction_id=new_tx.id,
            account_id=entry.account_id,
            debit=entry.debit,
            credit=entry.credit,
            description=entry.description,
            community_id=community_id # Also tag entry for easier filtering
        )
        db.add(new_entry)
    
    db.commit()
    db.refresh(new_tx)
    return new_tx

@router.get("/{community_id}/finance/ledger", response_model=List[TransactionResponse])
async def get_ledger(
    community_id: int,
    limit: int = 50, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify community
    community = db.query(Community).filter(Community.id == community_id).first()
    if not community:
        raise HTTPException(status_code=404, detail="Community not found")
        
    if current_user.community_id != community_id and current_user.role_id != 3:
         raise HTTPException(status_code=403, detail="Not a member of this community")

    # Fetch last N transactions
    transactions = db.query(DBTransaction).filter(
        DBTransaction.community_id == community_id
    ).order_by(DBTransaction.date.desc()).limit(limit).all()
    
    return transactions

@router.get("/{community_id}/finance/balance") 
async def get_balance(
    community_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get current balance for Resident (Simulated)
    In a real app, this would query the Accounts Receivable for the specific user/unit.
    """
    # Verify community
    community = db.query(Community).filter(Community.id == community_id).first()
    if not community:
        raise HTTPException(status_code=404, detail="Community not found")
        
    if current_user.community_id != community_id and current_user.role_id != 3:
         raise HTTPException(status_code=403, detail="Not a member of this community")
         
    # Mock balance for now
    # Get User's AR balance
    ensure_coa_exists(db, community_id)
    ar_account = db.query(Account).filter(Account.community_id == community_id, Account.name.like("%Receivable%")).first()
    
    balance = 0.0
    if ar_account:
        result = db.query(
            (func.sum(JournalEntry.debit) - func.sum(JournalEntry.credit)).label("balance")
        ).filter(
            JournalEntry.account_id == ar_account.id,
            JournalEntry.user_id == current_user.id
        ).first()
        
        if result and result.balance:
            balance = result.balance
            
    return {"current_balance": balance}

# --- Reports ---

class ReportItem(BaseModel):
    category: str
    amount: float

class BalanceSheet(BaseModel):
    assets: List[ReportItem]
    liabilities: List[ReportItem]
    equity: List[ReportItem]
    total_assets: float
    total_liabilities_equity: float

class IncomeStatementItem(BaseModel):
    category: str
    actual: float
    budget: float = 0.0
    variance: float = 0.0

class IncomeStatement(BaseModel):
    revenue: List[IncomeStatementItem]
    expenses: List[IncomeStatementItem]
    net_income: float

class DelinquentResident(BaseModel):
    id: int
    name: str
    address: str
    balance: float
    days_overdue: int

# Mock Delinquencies (Placeholder until Phase 5)
mock_delinquencies = [
    {"id": 1, "name": "John Doe", "address": "123 Main St", "balance": 450.00, "days_overdue": 45}
]

@router.get("/{community_id}/finance/delinquencies", response_model=List[DelinquentResident])
async def get_delinquencies(
    community_id: int,
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    # Verify community
    community = db.query(Community).filter(Community.id == community_id).first()
    if not community:
        raise HTTPException(status_code=404, detail="Community not found")
        
    # Permission check
    if not (current_user.role and current_user.role.name in ['board', 'admin']) and current_user.role_id != 3:
        raise HTTPException(status_code=403, detail="Board access required")

    ensure_coa_exists(db, community_id)
    
    # 1. Get Accounts Receivable Account
    ar_account = db.query(Account).filter(Account.community_id == community_id, Account.name.like("%Receivable%")).first()
    if not ar_account:
        return []

    # 2. Aggregate Balances by User
    # Query: Select user_id, sum(debit)-sum(credit) from entries where account=AR group by user_id having balance > 0
    results = db.query(
        JournalEntry.user_id,
        (func.sum(JournalEntry.debit) - func.sum(JournalEntry.credit)).label("balance")
    ).filter(
        JournalEntry.account_id == ar_account.id,
        JournalEntry.community_id == community_id,
        JournalEntry.user_id.isnot(None)
    ).group_by(JournalEntry.user_id).having(
        (func.sum(JournalEntry.debit) - func.sum(JournalEntry.credit)) > 0
    ).all()
    
    delinquents = []
    today = datetime.utcnow()
    
    for row in results:
        user_id = row.user_id
        balance = row.balance
        
        # Verify user still exists
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            # Calculate days overdue?
            # Simplified: Find oldest unpaid debit?
            # For now, just placeholder or calc from first transaction date?
            days = 30 # Placeholder logic or fetch oldest open invoice date
            
            delinquents.append(DelinquentResident(
                id=user.id,
                name=user.full_name,
                address=user.address or "Unknown",
                balance=balance,
                days_overdue=days
            ))
            
    return delinquents

@router.post("/{community_id}/finance/assessments/generate")
async def generate_assessments(
    community_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify community
    community = db.query(Community).filter(Community.id == community_id).first()
    if not community:
        raise HTTPException(status_code=404, detail="Community not found")
        
    # Permission check
    if not (current_user.role and current_user.role.name in ['board', 'admin']) and current_user.role_id != 3:
        raise HTTPException(status_code=403, detail="Board access required")
        
    # Ensure COA
    ensure_coa_exists(db, community_id)
    
    # Get configuration due amount
    amount = community.monthly_assessment_amount or 0.0
    if amount <= 0:
        return {"message": "Monthly assessment amount is 0. No assessments generated."}

    # Find Accounts: AR (Asset) and Assessment Income (Revenue)
    # Simplified lookup by code or name pattern matching
    ar_account = db.query(Account).filter(Account.community_id == community_id, Account.name.like("%Receivable%")).first()
    income_account = db.query(Account).filter(Account.community_id == community_id, Account.name.like("%Assessment%")).first()
    
    if not ar_account or not income_account:
        raise HTTPException(status_code=500, detail="Missing required accounts (AR or Assessment Income).")

    # Get Residents (Owners)
    # Filtering usage of 'resident_type' if available, otherwise assume all residents?
    # Based on models, resident_type='owner'
    owners = db.query(User).filter(
        User.community_id == community_id,
        User.resident_type == 'owner'
    ).all()
    
    # Batch Operation
    target_date = datetime.utcnow()
    month_str = target_date.strftime("%B %Y")
    count = 0
    
    # Create one Master Transaction or Individual Transactions? Individual is better for clear sub-ledger
    # But usually "Assessments Batch" is one transaction with many splits. 
    # Let's do Individual for simplicity in "My Ledger" view logic.
    
    for owner in owners:
        # Check if already assessed this month? (Skipping for simplicity in prototype)
        
        tx = DBTransaction(
            date=target_date,
            description=f"Monthly Assessment - {month_str}",
            community_id=community_id,
            reference="AUTO-ASSESS"
        )
        db.add(tx)
        db.commit() # Get ID
        
        # DR Accounts Receivable (User ID linked)
        entry_dr = JournalEntry(
            transaction_id=tx.id,
            account_id=ar_account.id,
            debit=amount,
            credit=0.0,
            description=f"Assessment for {owner.full_name}",
            community_id=community_id,
            user_id=owner.id
        )
        
        # CR Assessment Income
        entry_cr = JournalEntry(
            transaction_id=tx.id,
            account_id=income_account.id,
            debit=0.0,
            credit=amount,
            description="Assessment Revenue",
            community_id=community_id
            # No user_id needed for revenue, or maybe for tracking who paid? Revenue is general.
        )
        
        db.add_all([entry_dr, entry_cr])
        count += 1
        
    db.commit()
    
    return {"message": f"Generated assessments for {count} owners totaling ${count * amount}"}

@router.post("/{community_id}/finance/assessments/late-fees")
async def calculate_late_fees(
    community_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify community
    community = db.query(Community).filter(Community.id == community_id).first()
    if not community:
        raise HTTPException(status_code=404, detail="Community not found")
        
    # Permission check
    if not (current_user.role and current_user.role.name in ['board', 'admin']) and current_user.role_id != 3:
        raise HTTPException(status_code=403, detail="Board access required")

    # Configuration Check
    late_fee = community.late_fee_amount or 0.0
    due_day = community.late_fee_due_day or 15
    
    if late_fee <= 0:
         return {"message": "Late fee amount is 0. No fees assessed."}

    today = datetime.utcnow()
    # Logic: Only run if today > due_day ? Or assume admin runs it appropriately?
    # Warn if running too early?
    if today.day <= due_day:
        # Just a warning in message, or strict block? Let's allow but warn.
        pass

    ensure_coa_exists(db, community_id)
    
    # Accounts
    ar_account = db.query(Account).filter(Account.community_id == community_id, Account.name.like("%Receivable%")).first()
    fee_income_account = db.query(Account).filter(Account.community_id == community_id, Account.name.like("%Late Fee%")).first()

    if not ar_account or not fee_income_account:
        # Fallback for fee income if not found?
        if not fee_income_account:
             # Try generic income
             fee_income_account = db.query(Account).filter(Account.community_id == community_id, Account.name.like("%Income%")).first()
        
        if not ar_account or not fee_income_account:
             raise HTTPException(status_code=500, detail="Missing AR or Income accounts.")

    # Get Owners
    owners = db.query(User).filter(
        User.community_id == community_id,
        User.resident_type == 'owner'
    ).all()
    
    count = 0
    month_str = today.strftime("%B %Y")
    
    for owner in owners:
        # Calculate Balance
        # Sum debits - Sum credits for this user in AR account
        result = db.query(
            func.sum(JournalEntry.debit).label("total_debit"),
            func.sum(JournalEntry.credit).label("total_credit")
        ).filter(
            JournalEntry.account_id == ar_account.id,
            JournalEntry.user_id == owner.id
        ).first()
        
        debit = result.total_debit or 0.0
        credit = result.total_credit or 0.0
        balance = debit - credit
        
        # Threshold (e.g. > $10)
        if balance > 10.0:
            # Check if already charged late fee this month?
            # Creating a transaction
            tx = DBTransaction(
                date=today,
                description=f"Late Fee - {month_str}",
                community_id=community_id,
                reference="AUTO-FEE"
            )
            db.add(tx)
            db.commit()
            
            # DR AR
            entry_dr = JournalEntry(
                transaction_id=tx.id,
                account_id=ar_account.id,
                debit=late_fee,
                credit=0.0,
                description=f"Late Fee for {owner.full_name}",
                community_id=community_id,
                user_id=owner.id
            )
            
            # CR Income
            entry_cr = JournalEntry(
                transaction_id=tx.id,
                account_id=fee_income_account.id,
                debit=0.0,
                credit=late_fee,
                description="Late Fee Revenue",
                community_id=community_id
            )
            
            db.add_all([entry_dr, entry_cr])
            count += 1
            
    db.commit()
    
    return {"message": f"Assessed late fees for {count} residents."}

def calculate_balance(db: Session, account_type: AccountType, community_id: int):
    """
    Calculates balance based on normal balance type.
    Assets, Expenses: Debit - Credit
    Liabilities, Equity, Revenue: Credit - Debit
    """
    accounts = db.query(Account).filter(
        Account.type == account_type,
        Account.community_id == community_id
    ).all()
    items = []
    total = 0.0
    
    for acc in accounts:
        # Aggregate logic
        result = db.query(
            func.sum(JournalEntry.debit).label("total_debit"),
            func.sum(JournalEntry.credit).label("total_credit")
        ).filter(JournalEntry.account_id == acc.id).first()
        
        debit = result.total_debit or 0.0
        credit = result.total_credit or 0.0
        
        if account_type in [AccountType.ASSET, AccountType.EXPENSE]:
            bal = debit - credit
        else:
            bal = credit - debit
            
        if abs(bal) > 0.001:
            # Map ReportItem to IncomeStatementItem if needed, or simple ReportItem
            items.append(ReportItem(category=acc.name, amount=bal))
            total += bal
            
    return items, total

@router.get("/{community_id}/finance/reports/balance-sheet", response_model=BalanceSheet)
async def get_balance_sheet(
    community_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify community
    community = db.query(Community).filter(Community.id == community_id).first()
    if not community:
        raise HTTPException(status_code=404, detail="Community not found")
        
    if current_user.community_id != community_id and current_user.role_id != 3:
         raise HTTPException(status_code=403, detail="Not a member of this community")
         
    # Permission check (Reports usually Board only or transparent?)
    # Permission check (Reports usually Board only or transparent?)
    if not (current_user.role and current_user.role.name in ['board', 'admin', 'treasurer']) and current_user.role_id != 3:
         raise HTTPException(status_code=403, detail="Financial reports are restricted to Board and Treasurer.") 

    cid = community_id
    assets, total_assets = calculate_balance(db, AccountType.ASSET, cid)
    liabilities, total_liab = calculate_balance(db, AccountType.LIABILITY, cid)
    equity, total_eq = calculate_balance(db, AccountType.EQUITY, cid)
    
    # Net Income = Revenue - Expenses
    _, total_rev = calculate_balance(db, AccountType.REVENUE, cid)
    _, total_exp = calculate_balance(db, AccountType.EXPENSE, cid)
    net_income = total_rev - total_exp
    
    # Add Net Income to Equity (Retained Earnings simulation)
    if abs(net_income) > 0.001:
        equity.append(ReportItem(category="Current Net Income", amount=net_income))
        total_eq += net_income

    return BalanceSheet(
        assets=assets,
        liabilities=liabilities,
        equity=equity,
        total_assets=total_assets,
        total_liabilities_equity=total_liab + total_eq 
    )

@router.get("/{community_id}/finance/reports/income-statement", response_model=IncomeStatement)
async def get_income_statement(
    community_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify community
    community = db.query(Community).filter(Community.id == community_id).first()
    if not community:
        raise HTTPException(status_code=404, detail="Community not found")
        
    if current_user.community_id != community_id and current_user.role_id != 3:
         raise HTTPException(status_code=403, detail="Not a member of this community")

    cid = community_id
    revenue_items, total_rev = calculate_balance(db, AccountType.REVENUE, cid)
    expense_items, total_exp = calculate_balance(db, AccountType.EXPENSE, cid)
    
    # Convert ReportItem to IncomeStatementItem
    rev_formatted = [
        IncomeStatementItem(category=i.category, actual=i.amount, budget=0, variance=0) 
        for i in revenue_items
    ]
    exp_formatted = [
        IncomeStatementItem(category=i.category, actual=i.amount, budget=0, variance=0) 
        for i in expense_items
    ]

    return IncomeStatement(
        revenue=rev_formatted,
        expenses=exp_formatted,
        net_income=total_rev - total_exp
    )

# --- Invoice Endpoints ---
from backend.finance.models import Invoice, InvoiceStatus
from backend.vendor.models import Vendor
from backend.maintenance.models import WorkOrder
import logging

logger = logging.getLogger(__name__)


class InvoiceCreate(BaseModel):
    vendor_id: int
    work_order_id: int
    amount: float
    file_url: Optional[str] = None
    notes: Optional[str] = None
    
    class Config:
        orm_mode = True

class InvoiceOut(InvoiceCreate):
    id: int
    status: InvoiceStatus
    created_at: datetime
    paid_at: Optional[datetime]
    vendor_name: Optional[str] = None # Helper
    work_order_title: Optional[str] = None # Helper
    
    class Config:
        orm_mode = True

@router.post("/invoices", response_model=InvoiceOut)
def create_invoice(
    invoice: InvoiceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify User is Vendor linked
    vendor = db.query(Vendor).filter(Vendor.id == invoice.vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
        
    # If user is a vendor, ensure they match the vendor_id
    if current_user.role.name == "vendor":
        # Check if this user owns this vendor profile
       if vendor.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized for this vendor")

    # Verify Work Order exists and is assigned to this vendor
    wo = db.query(WorkOrder).filter(WorkOrder.id == invoice.work_order_id).first()
    if not wo:
        raise HTTPException(status_code=404, detail="Work Order not found")
    
    if wo.assigned_vendor_id != invoice.vendor_id:
        raise HTTPException(status_code=400, detail="Work Order not assigned to this vendor")

    new_invoice = Invoice(
        vendor_id=invoice.vendor_id,
        work_order_id=invoice.work_order_id,
        community_id=wo.community_id, 
        amount=invoice.amount,
        file_url=invoice.file_url,
        notes=invoice.notes,
        status=InvoiceStatus.SUBMITTED
    )
    db.add(new_invoice)
    db.commit()
    db.refresh(new_invoice)
    return new_invoice

@router.get("/invoices", response_model=List[InvoiceOut])
def get_invoices(
    community_id: Optional[int] = None, # Optional if vendor checks across? Or standard pattern?
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Invoice)

    if current_user.role.name == "vendor":
        # Vendor sees only their invoices
        # Find which vendor this user is
        vendor = db.query(Vendor).filter(Vendor.user_id == current_user.id).first()
        if not vendor:
             return []
        query = query.filter(Invoice.vendor_id == vendor.id)
        
    elif current_user.role.name in ["board", "admin", "super_admin"]:
        # Board sees invoices for their community
        if not community_id:
            # Fallback to user community
            community_id = current_user.community_id
            
        query = query.filter(Invoice.community_id == community_id)
    else:
        # Residents? No access
        return []

    invoices = query.order_by(Invoice.created_at.desc()).all()
    
    # Enrich response with names
    results = []
    for inv in invoices:
        # Load relationships if not eager
        v_name = inv.vendor.name if inv.vendor else "Unknown"
        wo_title = inv.work_order.title if inv.work_order else "Unknown"
        
        # Pydantic create
        out = InvoiceOut.from_orm(inv)
        out.vendor_name = v_name
        out.work_order_title = wo_title
        results.append(out)
        
    return results

from backend.auth.dependencies import require_role

@router.post("/invoices/{invoice_id}/pay", response_model=TransactionResponse)
def pay_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["treasurer", "admin"])) 
):
    # Additional check: If treasurer, ensure same community? (Handled by simple logic below usually)
    # Role logic handled by dependency.
    
    # if current_user.role.name not in ["admin", "board", "super_admin"]:
    #      raise HTTPException(status_code=403, detail="Not authorized")
         
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
        
    if invoice.community_id != current_user.community_id and current_user.role_id != 3:
         raise HTTPException(status_code=403, detail="Not authorized for this community")
         
    if invoice.status == InvoiceStatus.PAID:
        raise HTTPException(status_code=400, detail="Invoice already paid")
        
    # Create Transaction
    # 1. Expense Account (Maintenance Expense)
    # 2. Asset Account (Checking)
    # Find relevant accounts - Simplification: Use first available or hardcoded codes
    
    # Create Transaction
    new_tx = DBTransaction(
        date=datetime.utcnow(),
        description=f"Payment for Invoice #{invoice.id} - {invoice.work_order.title}",
        community_id=invoice.community_id,
        reference=f"INV-{invoice.id}"
    )
    db.add(new_tx)
    db.commit()

    # Create Journal Entries
    # Debit Expense
    # Credit Asset (Cash)
    # Finding accounts by type for simplicity
    expense_acc = db.query(Account).filter(Account.community_id == invoice.community_id, Account.type == AccountType.EXPENSE).first()
    asset_acc = db.query(Account).filter(Account.community_id == invoice.community_id, Account.type == AccountType.ASSET).first()
    
    if not expense_acc or not asset_acc:
        # Create default ones if missing? Or error
        # For prototype, error
        raise HTTPException(status_code=400, detail="Missing Expense/Asset accounts for this community. Please setup Chart of Accounts.")

    entry_dr = JournalEntry(
        transaction_id=new_tx.id,
        account_id=expense_acc.id,
        debit=invoice.amount,
        credit=0.0,
        description=f"Expense: {invoice.notes or 'Vendor Payment'}",
        community_id=invoice.community_id
    )
    
    entry_cr = JournalEntry(
        transaction_id=new_tx.id,
        account_id=asset_acc.id,
        debit=0.0,
        credit=invoice.amount,
        description="Cash Payment",
        community_id=invoice.community_id
    )
    
    db.add_all([entry_dr, entry_cr])
    
    # Update Invoice Status
    invoice.status = InvoiceStatus.PAID
    invoice.paid_at = datetime.utcnow()
    
    db.commit()
    db.refresh(new_tx)
    return new_tx

