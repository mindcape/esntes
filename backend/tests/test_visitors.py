import pytest
from backend.auth.models import User
from backend.community.models import Community
from backend.main import app

@pytest.mark.asyncio
async def test_visitors_mock_flow(client, db_session):
    # 1. Setup Data
    community = Community(
        name="Visitor Community", 
        modules_enabled={"visitors": True}
    )
    db_session.add(community)
    db_session.commit()
    
    user = User(email="visitee@test.com", full_name="Host User", community_id=community.id, role_id=1)
    db_session.add(user)
    db_session.commit()

    from backend.auth.dependencies import get_current_user
    app.dependency_overrides[get_current_user] = lambda: user

    # 2. Register Visitor
    visitor_data = {
        "name": "Guest 1",
        "arrival_date": "2024-01-01T12:00:00"
    }
    response = await client.post("/api/visitors/", json=visitor_data)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Guest 1"
    assert "access_code" in data

    # 3. List Visitors
    response = await client.get("/api/visitors/")
    assert response.status_code == 200
    assert len(response.json()) > 0
    
    # Mock state persists in memory, so length depends on test order if not cleared.
    # Since mock_visitors is global list in module, it persists across tests in same session unless reset.
    # For unit test, it's fine.

    # Cleanup
    app.dependency_overrides.clear()
