
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.core.database import get_db
from backend.finance.models import Account, Transaction as DBTransaction, JournalEntry, AccountType
from backend.auth.models import User
from backend.auth.dependencies import get_current_user
from backend.community.models import Community

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
    current_user: User = Depends(get_current_user)
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
    mock_balance = 0.00
    # Simulate finding user's AR account balance?
    # For now, return a placeholder or zero if no delinquencies found
    
    return {"current_balance": mock_balance}

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
        
    return mock_delinquencies

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
    if not (current_user.role and current_user.role.name in ['board', 'admin']) and current_user.role_id != 3:
         # Assuming transparency allowed for residents, but if not, restrict here
         pass 

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
