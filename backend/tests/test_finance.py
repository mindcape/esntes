
import pytest
from backend.auth.models import User, Role
from backend.community.models import Community
from backend.finance.models import Account, AccountType
from backend.auth.security import create_access_token, get_password_hash

@pytest.fixture
def board_member_token(db_session):
    # Ensure board role exists
    role = db_session.query(Role).filter(Role.name == "board").first()
    if not role:
        role = Role(name="board")
        db_session.add(role)
        db_session.commit()
    
    # Ensure community exists
    community = db_session.query(Community).filter(Community.id == 1).first()
    if not community:
        community = Community(name="Test Community", community_code="TC001", address="123 St", is_active=True)
        db_session.add(community)
        db_session.commit()

    # Create board user
    hashed = get_password_hash("password123")
    user = User(email="board@example.com", hashed_password=hashed, role_id=role.id, is_active=True, full_name="Board Member", community_id=1)
    db_session.add(user)
    db_session.commit()
    
    return create_access_token(subject=user.id)

@pytest.fixture
def setup_coa(db_session):
    # Create basic accounts for Community 1
    accounts = [
        Account(code="1000", name="Checking", type=AccountType.ASSET, community_id=1),
        Account(code="4000", name="Assessments", type=AccountType.REVENUE, community_id=1),
        Account(code="6000", name="Landscaping", type=AccountType.EXPENSE, community_id=1)
    ]
    for acc in accounts:
        # Check if exists to prevent duplicate error if re-run
        exists = db_session.query(Account).filter(Account.code == acc.code, Account.community_id == 1).first()
        if not exists:
            db_session.add(acc)
    db_session.commit()
    
    # Return account IDs for usage
    return {
        "asset": db_session.query(Account).filter(Account.code == "1000").first().id,
        "revenue": db_session.query(Account).filter(Account.code == "4000").first().id,
        "expense": db_session.query(Account).filter(Account.code == "6000").first().id
    }

@pytest.mark.asyncio
async def test_get_accounts(client, board_member_token, setup_coa):
    headers = {"Authorization": f"Bearer {board_member_token}"}
    response = await client.get("/api/communities/1/finance/accounts", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 3
    codes = [d["code"] for d in data]
    assert "1000" in codes

@pytest.mark.asyncio
async def test_create_transaction_success(client, board_member_token, setup_coa):
    headers = {"Authorization": f"Bearer {board_member_token}"}
    payload = {
        "description": "Test Transaction",
        "entries": [
            {"account_id": setup_coa["expense"], "debit": 100.0, "credit": 0.0, "description": "Pay Landscaping"},
            {"account_id": setup_coa["asset"], "debit": 0.0, "credit": 100.0, "description": "Cash Out"}
        ]
    }
    response = await client.post("/api/communities/1/finance/transactions", json=payload, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["description"] == "Test Transaction"
    assert len(data["entries"]) == 2

@pytest.mark.asyncio
async def test_create_transaction_unbalanced(client, board_member_token, setup_coa):
    headers = {"Authorization": f"Bearer {board_member_token}"}
    payload = {
        "description": "Unbalanced",
        "entries": [
            {"account_id": setup_coa["expense"], "debit": 100.0, "credit": 0.0},
            {"account_id": setup_coa["asset"], "debit": 0.0, "credit": 50.0} # Missing 50
        ]
    }
    response = await client.post("/api/communities/1/finance/transactions", json=payload, headers=headers)
    assert response.status_code == 400
    assert "unbalanced" in response.json()["detail"].lower()

@pytest.mark.asyncio
async def test_get_balance_sheet(client, board_member_token, setup_coa):
    headers = {"Authorization": f"Bearer {board_member_token}"}
    response = await client.get("/api/communities/1/finance/reports/balance-sheet", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "assets" in data
    assert "liabilities" in data
    assert "equity" in data
