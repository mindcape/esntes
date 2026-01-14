from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
from datetime import datetime
from enum import Enum

router = APIRouter()

class TransactionType(str, Enum):
    ASSESSMENT = "Assessment"
    PAYMENT = "Payment"
    LATE_FEE = "Late Fee"
    FINE = "Fine"

class PaymentRequest(BaseModel):
    amount: float
    card_Last4: str

class Transaction(BaseModel):
    id: int
    date: datetime
    description: str
    amount: float
    type: TransactionType
    balance_after: float

class LedgerSummary(BaseModel):
    current_balance: float
    last_payment_date: datetime = None

class DelinquentResident(BaseModel):
    id: int
    name: str
    address: str
    balance: float
    days_overdue: int

class BalanceSheetItem(BaseModel):
    category: str
    amount: float

class BalanceSheet(BaseModel):
    assets: List[BalanceSheetItem]
    liabilities: List[BalanceSheetItem]
    equity: List[BalanceSheetItem]
    total_assets: float
    total_liabilities_equity: float

class IncomeStatementItem(BaseModel):
    category: str
    actual: float
    budget: float
    variance: float

class IncomeStatement(BaseModel):
    revenue: List[IncomeStatementItem]
    expenses: List[IncomeStatementItem]
    net_income: float

# Mock Database

# Mock Database
mock_transactions = [
    {
        "id": 1,
        "date": datetime(2025, 1, 1),
        "description": "January 2025 Assessment",
        "amount": 250.00,
        "type": TransactionType.ASSESSMENT,
        "balance_after": 250.00
    },
    {
        "id": 2,
        "date": datetime(2025, 1, 15),
        "description": "Late Fee - Jan",
        "amount": 25.00,
        "type": TransactionType.LATE_FEE,
        "balance_after": 275.00
    }
]

# Mock Assessments/Resident Balances
# In a real DB, this would be a separate table linking User to Transactions
mock_delinquencies = [
    {
        "id": 101,
        "name": "Michael Scott",
        "address": "1725 Slough Ave",
        "balance": 450.00,
        "days_overdue": 45
    },
    {
        "id": 102,
        "name": "Dwight Schrute",
        "address": "Schrute Farms",
        "balance": 1200.00,
        "days_overdue": 90
    }
]

@router.get("/ledger", response_model=List[Transaction])
async def get_ledger():
    return mock_transactions

@router.post("/pay", response_model=Transaction)
async def make_payment(payment: PaymentRequest):
    current_bal = mock_transactions[-1]["balance_after"] if mock_transactions else 0.0
    new_bal = current_bal - payment.amount
    
    new_tx = {
        "id": len(mock_transactions) + 1,
        "date": datetime.now(),
        "description": f"Online Payment (xxxx-{payment.card_Last4})",
        "amount": -payment.amount, # Negative for payment logic if summing, but here strictly display
        "type": TransactionType.PAYMENT,
        "balance_after": new_bal
    }
    mock_transactions.append(new_tx)
    return new_tx

@router.get("/balance", response_model=LedgerSummary)
async def get_balance():
    # Calculate balance from mock transactions (simple sum of last state)
    current_bal = mock_transactions[-1]["balance_after"] if mock_transactions else 0.0
    return {
        "current_balance": current_bal,
        "last_payment_date": None # No payments in mock yet
    }

@router.post("/assessments/generate")
async def generate_assessments():
    # Logic to add monthly assessment to all residents
    # Mocking single addition to current user ledger
    new_tx = {
        "id": len(mock_transactions) + 1,
        "date": datetime.now(),
        "description": "Monthly HOA Assessment",
        "amount": 250.00,
        "type": TransactionType.ASSESSMENT,
        "balance_after": (mock_transactions[-1]["balance_after"] if mock_transactions else 0) + 250.00
    }
    mock_transactions.append(new_tx)
    return {"message": "Assessments generated for 150 residents", "count": 150}

@router.post("/assessments/late-fees")
async def assess_late_fees():
    # Logic to scan for delinquencies and apply fees
    # Mocking single addition
    current_bal = mock_transactions[-1]["balance_after"] if mock_transactions else 0
    if current_bal > 0:
        new_tx = {
            "id": len(mock_transactions) + 1,
            "date": datetime.now(),
            "description": "Late Fee - Overdue Balance",
            "amount": 25.00,
            "type": TransactionType.LATE_FEE,
            "balance_after": current_bal + 25.00
        }
        mock_transactions.append(new_tx)
        return {"message": "Late fees assessed on 2 delinquent accounts", "count": 2}
    return {"message": "No delinquencies found eligible for late fees"}

@router.get("/delinquencies", response_model=List[DelinquentResident])
async def get_delinquencies():
    return mock_delinquencies

@router.get("/reports/balance-sheet", response_model=BalanceSheet)
async def get_balance_sheet():
    assets = [
        {"category": "Operating Account", "amount": 125000.00},
        {"category": "Reserve Account", "amount": 350000.00},
        {"category": "Accounts Receivable", "amount": 4500.00} # Matches mock delinquencies approx
    ]
    liabilities = [
        {"category": "Prepaid Assessments", "amount": 12000.00},
        {"category": "Accounts Payable", "amount": 8500.00}
    ]
    equity = [
        {"category": "Retained Earnings", "amount": 459000.00}
    ]
    
    total_assets = sum(a["amount"] for a in assets)
    total_liab = sum(l["amount"] for l in liabilities)
    total_eq = sum(e["amount"] for e in equity)
    
    return {
        "assets": assets,
        "liabilities": liabilities,
        "equity": equity,
        "total_assets": total_assets,
        "total_liabilities_equity": total_liab + total_eq
    }

@router.get("/reports/income-statement", response_model=IncomeStatement)
async def get_income_statement():
    revenue = [
        {"category": "Assessment Income", "actual": 450000.00, "budget": 440000.00, "variance": 10000.00},
        {"category": "Late Fees / Fines", "actual": 2500.00, "budget": 1000.00, "variance": 1500.00},
        {"category": "Interest Income", "actual": 4500.00, "budget": 3000.00, "variance": 1500.00}
    ]
    expenses = [
        {"category": "Landscaping", "actual": 55000.00, "budget": 60000.00, "variance": 5000.00}, # Under budget (positive variance interpretation depends on convention, here positive = good)
        {"category": "Pool Maintenance", "actual": 25000.00, "budget": 20000.00, "variance": -5000.00}, # Over budget
        {"category": "Utilities", "actual": 32000.00, "budget": 30000.00, "variance": -2000.00},
        {"category": "Insurance", "actual": 18000.00, "budget": 18000.00, "variance": 0.00},
        {"category": "Management Fees", "actual": 48000.00, "budget": 48000.00, "variance": 0.00}
    ]
    
    total_rev = sum(r["actual"] for r in revenue)
    total_exp = sum(e["actual"] for e in expenses)
    
    return {
        "revenue": revenue,
        "expenses": expenses,
        "net_income": total_rev - total_exp
    }
