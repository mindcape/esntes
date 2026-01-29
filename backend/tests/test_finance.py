import pytest
from backend.auth.models import User
from backend.community.models import Community
from backend.finance.models import Account, AccountType
from backend.main import app

from backend.auth.models import User, Role

@pytest.mark.asyncio
async def test_finance_flow(client, db_session):
    # 1. Setup Data
    # Seed Roles
    r_board = Role(id=3, name="board")
    db_session.add(r_board)
    db_session.commit()

    community = Community(name="Fin Community")
    db_session.add(community)
    db_session.commit()
    
    board = User(email="f_board@test.com", full_name="Board F", community_id=community.id, role_id=3)
    db_session.add(board)
    
    # Setup Chart of Accounts for test
    bank = Account(code="1000", name="Checking", type=AccountType.ASSET, community_id=community.id)
    dues_rev = Account(code="4000", name="Dues Revenue", type=AccountType.REVENUE, community_id=community.id)
    db_session.add_all([bank, dues_rev])
    db_session.commit()
    
    from backend.auth.dependencies import get_current_user
    app.dependency_overrides[get_current_user] = lambda: board

    # 2. Create Transaction (Deposit Dues)
    tx_data = {
        "description": "January Dues",
        "entries": [
            {
                "account_id": bank.id,
                "debit": 1000.0,
                "credit": 0.0,
                "description": "Cash In"
            },
            {
                "account_id": dues_rev.id,
                "debit": 0.0,
                "credit": 1000.0,
                "description": "Revenue Rec"
            }
        ]
    }
    
    response = await client.post(f"/api/communities/{community.id}/finance/transactions", json=tx_data)
    assert response.status_code == 200
    assert len(response.json()["entries"]) == 2

    # 3. Verify Ledger
    response = await client.get(f"/api/communities/{community.id}/finance/ledger")
    assert response.status_code == 200
    assert len(response.json()) >= 1
    
    # 4. Verify Balance Sheet (Asset should be 1000)
    response = await client.get(f"/api/communities/{community.id}/finance/reports/balance-sheet")
    assert response.status_code == 200
    data = response.json()
    
    # Check Checking Account in Assets
    checking = next((x for x in data["assets"] if x["category"] == "Checking"), None)
    assert checking is not None
    assert checking["amount"] == 1000.0
    
    assert data["total_assets"] == 1000.0
    # Net Income (1000) flows to Equity
    # Equity = 0 + Net Income = 1000
    assert data["total_liabilities_equity"] == 1000.0

    # Cleanup
    app.dependency_overrides.clear()
