import pytest
from backend.auth.models import User
from backend.community.models import Community
from backend.main import app

from backend.auth.models import User, Role

@pytest.mark.asyncio
async def test_maintenance_flow(client, db_session):
    # 1. Setup Data
    # Seed Roles
    r_res = Role(id=1, name="resident")
    r_board = Role(id=3, name="board") # matching check in router
    db_session.add_all([r_res, r_board])
    db_session.commit()

    community = Community(name="Maint Community")
    db_session.add(community)
    db_session.commit()
    
    board = User(email="m_board@test.com", full_name="Board M", community_id=community.id, role_id=3)
    resident = User(email="m_res@test.com", full_name="Res M", community_id=community.id, role_id=1)
    db_session.add_all([board, resident])
    db_session.commit()

    from backend.auth.dependencies import get_current_user
    
    # 2. Resident creates Maintenance Request
    app.dependency_overrides[get_current_user] = lambda: resident
    
    req_data = {
        "title": "Leaky Pipe",
        "description": "Kitchen sink leaking",
        "category": "Plumbing"
    }
    
    response = await client.post(f"/api/communities/{community.id}/maintenance", json=req_data)
    assert response.status_code == 200
    req_id = response.json()["id"]
    assert response.json()["status"] == "Open"

    # 3. Board creates Work Order linked to request
    app.dependency_overrides[get_current_user] = lambda: board
    
    wo_data = {
        "title": "Fix Leak",
        "description": "Call mario",
        "maintenance_request_id": req_id,
        "budget": 200.0
    }
    
    # Endpoint is /api/communities/work-orders (prefix defined in main.py)
    response = await client.post("/api/communities/work-orders", json=wo_data)
    assert response.status_code == 200
    wo_id = response.json()["id"]
    
    # 4. Board adds Vendor Bid
    bid_data = {
        "vendor_id": 99, # Mock vendor ID
        "amount": 150.0,
        "notes": "Will fix today"
    }
    
    response = await client.post(f"/api/communities/work-orders/{wo_id}/bids", json=bid_data)
    assert response.status_code == 200
    assert response.json()["amount"] == 150.0

    # Cleanup
    app.dependency_overrides.clear()
