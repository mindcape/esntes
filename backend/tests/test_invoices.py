import pytest
from backend.auth.models import User, Role
from backend.community.models import Community
from backend.vendor.models import Vendor
from backend.finance.models import Account, AccountType, Invoice, InvoiceStatus
from backend.maintenance.models import WorkOrder
from backend.main import app

@pytest.mark.asyncio
async def test_invoice_flow(client, db_session):
    # 1. Setup Data
    # Roles
    if not db_session.query(Role).filter_by(name="vendor").first():
        r_vendor = Role(id=4, name="vendor")
        db_session.add(r_vendor)
    if not db_session.query(Role).filter_by(name="board").first():
        r_board = Role(id=3, name="board")
        db_session.add(r_board)
        
    community = Community(name="Inv Community")
    db_session.add(community)
    db_session.commit()
    
    # Board User
    board_user = User(email="inv_board@test.com", full_name="Board Inv", community_id=community.id, role_id=3)
    db_session.add(board_user)
    
    # Vendor User
    vendor_user = User(email="inv_vendor@test.com", full_name="Vendor Inv", community_id=community.id, role_id=4)
    db_session.add(vendor_user)
    db_session.commit()
    
    # Vendor Profile linked to User
    vendor = Vendor(name="Inv Vendor Inc", community_id=community.id, user_id=vendor_user.id)
    db_session.add(vendor)
    db_session.commit()
    db_session.refresh(vendor)
    
    # Work Order assigned to Vendor
    wo = WorkOrder(
        title="Fix AC",
        description="AC not cooling",
        community_id=community.id,
        status="In Progress",
        assigned_vendor_id=vendor.id,
        budget=500.0
    )
    db_session.add(wo)
    db_session.commit()
    db_session.refresh(wo)
    
    # Create Accounts for Payment
    acc_exp = Account(code="5000", name="Maint Expense", type=AccountType.EXPENSE, community_id=community.id)
    acc_asset = Account(code="1000", name="Checking", type=AccountType.ASSET, community_id=community.id)
    db_session.add_all([acc_exp, acc_asset])
    db_session.commit()

    # 2. Login as Vendor (check vendor_id)
    # We can mock this or actually hit the endpoint if we set passwords, but dependency override is faster for sub-steps
    # But let's verify login response structure manually? 
    # Let's trust the unit test for auth later, here focus on Invoice flow.
    
    from backend.auth.dependencies import get_current_user
    app.dependency_overrides[get_current_user] = lambda: vendor_user

    # 3. Create Invoice
    inv_data = {
        "vendor_id": vendor.id,
        "work_order_id": wo.id,
        "amount": 500.0,
        "notes": "Fixed compressor"
    }
    
    response = await client.post("/api/communities/finance/invoices", json=inv_data)
    # Correct path is /api/payments/invoices or finance? 
    # Check main.py: finance_router is /api/communities
    # Wait, create_invoice is in finance router.
    # Route in router.py is @router.post("/invoices")
    # So full path: /api/communities/invoices? 
    # main.py: app.include_router(finance_router.router, prefix="/api/communities", tags=["finance"])
    # So yes, /api/communities/invoices. 
    
    response = await client.post("/api/communities/invoices", json=inv_data)
    assert response.status_code == 200, response.text
    inv_id = response.json()["id"]
    assert response.json()["status"] == "Submitted"

    # 4. List Invoices (Vendor)
    response = await client.get("/api/communities/invoices")
    assert response.status_code == 200
    assert len(response.json()) == 1
    
    # 5. Pay Invoice (Board)
    app.dependency_overrides[get_current_user] = lambda: board_user
    
    response = await client.post(f"/api/communities/invoices/{inv_id}/pay")
    assert response.status_code == 200, response.text
    assert response.json()["description"] == f"Payment for Invoice #{inv_id} - {wo.title}"

    # Verify Invoice Status
    # Re-fetch invoice? Or check DB
    db_session.expire_all()
    inv_db = db_session.query(Invoice).get(inv_id)
    assert inv_db.status == InvoiceStatus.PAID
    assert inv_db.paid_at is not None

    # Cleanup
    app.dependency_overrides.clear()
