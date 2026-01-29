import pytest
from backend.auth.models import User, Role
from backend.community.models import Community
from backend.vendor.models import Vendor
from backend.maintenance.models import MaintenanceRequest, WorkOrder, VendorBid
from backend.main import app

@pytest.mark.asyncio
async def test_award_bid_flow(client, db_session):
    # 1. Setup Data
    # Seed Roles if not exist (conftest might do this, but safe to check/add)
    if not db_session.query(Role).filter_by(id=3).first():
        r_board = Role(id=3, name="board")
        db_session.add(r_board)
    
    community = Community(name="Award Community")
    db_session.add(community)
    db_session.commit()
    
    board_user = User(email="award_board@test.com", full_name="Board Award", community_id=community.id, role_id=3)
    db_session.add(board_user)
    db_session.commit()

    # Create Vendors
    v1 = Vendor(name="Vendor One", community_id=community.id)
    v2 = Vendor(name="Vendor Two", community_id=community.id)
    db_session.add_all([v1, v2])
    db_session.commit()
    db_session.refresh(v1)
    db_session.refresh(v2)

    # 2. Create Work Order
    # Bypass API for setup to speed up
    wo = WorkOrder(
        title="Fix Roof",
        description="Leaking roof",
        community_id=community.id,
        status="Open"
    )
    db_session.add(wo)
    db_session.commit()
    db_session.refresh(wo)

    # 3. Create Bids
    bid1 = VendorBid(work_order_id=wo.id, vendor_id=v1.id, amount=1000.0, status="Submitted")
    bid2 = VendorBid(work_order_id=wo.id, vendor_id=v2.id, amount=1200.0, status="Submitted")
    db_session.add_all([bid1, bid2])
    db_session.commit()
    db_session.refresh(bid1)
    db_session.refresh(bid2)

    # 4. Award Bid 1
    from backend.auth.dependencies import get_current_user
    app.dependency_overrides[get_current_user] = lambda: board_user

    response = await client.post(f"/api/communities/work-orders/{wo.id}/award/{bid1.id}")
    assert response.status_code == 200, response.text
    
    data = response.json()
    assert data["status"] == "In Progress"
    assert data["assigned_vendor_id"] == v1.id
    assert data["budget"] == 1000.0

    # 5. Verify Bids Status in DB
    db_session.refresh(bid1)
    db_session.refresh(bid2)
    assert bid1.status == "Accepted"
    assert bid2.status == "Rejected"

    # Cleanup
    app.dependency_overrides.clear()
