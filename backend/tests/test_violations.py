import pytest
from backend.auth.models import User
from backend.community.models import Community
from backend.main import app

@pytest.mark.asyncio
async def test_violations_flow(client, db_session):
    # 1. Setup Data
    community = Community(
        name="Violations Community", 
        modules_enabled={"violations": True}
    )
    db_session.add(community)
    db_session.commit()
    
    board = User(email="v_board@test.com", full_name="Board V", community_id=community.id, role_id=3) # super admin / board
    resident = User(email="v_res@test.com", full_name="Resident V", community_id=community.id, role_id=1)
    db_session.add_all([board, resident])
    db_session.commit()

    from backend.auth.dependencies import get_current_user
    
    # 2. Board creates violation
    app.dependency_overrides[get_current_user] = lambda: board
    
    violation_data = {
        "resident_id": resident.id,
        "resident_name": resident.full_name,
        "resident_address": "123 Test St",
        "description": "Loud noise",
        "action": "warning"
    }
    
    response = await client.post(f"/api/communities/{community.id}/violations", json=violation_data)
    assert response.status_code == 200
    v_id = response.json()["id"]
    assert response.json()["status"] == "Warning"

    # 3. Resident views violations
    app.dependency_overrides[get_current_user] = lambda: resident
    response = await client.get(f"/api/communities/{community.id}/violations/my")
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["description"] == "Loud noise"

    # 4. Board Updates Status to Fined
    app.dependency_overrides[get_current_user] = lambda: board
    response = await client.put(
        f"/api/communities/{community.id}/violations/{v_id}/status", 
        params={"status": "Fined", "fine_amount": 50.0}
    )
    assert response.status_code == 200
    assert response.json()["status"] == "Fined"
    assert response.json()["fine_amount"] == 50.0

    # Cleanup
    app.dependency_overrides.clear()
