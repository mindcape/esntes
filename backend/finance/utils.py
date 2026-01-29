from sqlalchemy.orm import Session
from backend.finance.models import Account, AccountType

DEFAULT_COA = [
    {"code": "1000", "name": "Cash (Operating)", "type": AccountType.ASSET},
    {"code": "1100", "name": "Accounts Receivable", "type": AccountType.ASSET},
    {"code": "1200", "name": "Prepaid Expenses", "type": AccountType.ASSET},
    {"code": "2000", "name": "Accounts Payable", "type": AccountType.LIABILITY},
    {"code": "3000", "name": "Retained Earnings", "type": AccountType.EQUITY},
    {"code": "4000", "name": "Assessment Income", "type": AccountType.REVENUE},
    {"code": "4100", "name": "Late Fee Income", "type": AccountType.REVENUE},
    {"code": "6000", "name": "Maintenance Expense", "type": AccountType.EXPENSE},
    {"code": "6100", "name": "Utilities Expense", "type": AccountType.EXPENSE},
    {"code": "6200", "name": "Administrative Expense", "type": AccountType.EXPENSE},
]

def ensure_coa_exists(db: Session, community_id: int):
    """
    Checks if COA exists for community, if not seeded, creates defaults.
    """
    existing = db.query(Account).filter(Account.community_id == community_id).first()
    if existing:
        return # Assume COA setup

    print(f"Seeding COA for Community {community_id}...")
    for acc in DEFAULT_COA:
        new_acc = Account(
            code=acc["code"],
            name=acc["name"],
            type=acc["type"],
            community_id=community_id,
            description="System Default"
        )
        db.add(new_acc)
    
    db.commit()
