
import pytest
from backend.auth.models import User, Role
from backend.community.models import Community
from backend.vendor.models import Vendor
from backend.maintenance.models import WorkOrder, MaintenanceRequest
from backend.auth.security import create_access_token, get_password_hash

@pytest.fixture
def board_ops_token(db_session):
    # Ensure board role
    role = db_session.query(Role).filter(Role.name == "board").first()
    if not role:
        role = Role(name="board")
        db_session.add(role)
        db_session.commit()
    
    # Ensure community
    community = db_session.query(Community).filter(Community.id == 1).first()
    if not community:
        community = Community(name="Ops Community", community_code="OPS001", address="Ops St", is_active=True)
        db_session.add(community)
        db_session.commit()

    # Create board user
    hashed = get_password_hash("password123")
    user = User(email="ops_board@example.com", hashed_password=hashed, role_id=role.id, is_active=True, full_name="Ops Board", community_id=1)
    db_session.add(user)
    db_session.commit()
    
    return create_access_token(subject=user.id)

@pytest.mark.asyncio
async def test_create_vendor(client, board_ops_token):
    headers = {"Authorization": f"Bearer {board_ops_token}"}
    payload = {
        "name": "Trusted Plumbers",
        "email": "plumber@example.com",
        "category": "Plumbing",
        "valild_phone": "5550000000" # Needs 10 digits
    }
    # Adjusted phone to pass validation if any
    # Actually checking model validation: 10-15 digits
    payload["phone"] = "5551234567" 

    response = await client.post("/api/vendors/", json=payload, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Trusted Plumbers"
    assert data["id"] is not None

@pytest.mark.asyncio
async def test_create_maintenance_request(client, board_ops_token):
    headers = {"Authorization": f"Bearer {board_ops_token}"}
    payload = {
        "title": "Leaky Faucet",
        "description": "Lobby restroom faucet is leaking",
        "category": "Plumbing"
    }
    # Create request
    response = await client.post("/api/communities/1/maintenance", json=payload, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Leaky Faucet"
    
    # Verify DB
    # We can rely on the response ID
    return data["id"]

@pytest.mark.asyncio
async def test_create_work_order(client, board_ops_token):
    headers = {"Authorization": f"Bearer {board_ops_token}"}
    
    # 1. Create Request
    req_payload = {"title": "Fix Roof", "description": "Leak", "category": "Roofing"}
    req_resp = await client.post("/api/communities/1/maintenance", json=req_payload, headers=headers)
    req_id = req_resp.json()["id"]
    
    # 2. Create WO linked to Request
    # Path is /api/communities/work-orders based on main.py mount
    wo_payload = {
        "title": "Repair Roof Leak",
        "description": "Urgent repair",
        "maintenance_request_id": req_id,
        "priority": "High"
    }
    response = await client.post("/api/communities/work-orders", json=wo_payload, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Repair Roof Leak"
    assert data["maintenance_request_id"] == req_id
