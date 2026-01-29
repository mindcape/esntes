import pytest
from backend.auth.models import User
from backend.community.models import Community
from backend.main import app

@pytest.mark.asyncio
async def test_module_restrictions(client, db_session):
    # 1. Setup Data
    # Create Community with "visitors" disabled
    community = Community(
        name="Test Community", 
        modules_enabled={"visitors": False, "documents": True}
    )
    db_session.add(community)
    db_session.commit()
    
    # Create User
    user = User(
        email="test@example.com",
        full_name="Test User",
        community_id=community.id,
        role_id=1 # Resident
    )
    db_session.add(user)
    db_session.commit()
    
    # Needs auth token mock (simplified for this example, or use a bypass)
    # Since we use dependency override for get_current_user in real tests, 
    # we can override it here as well.
    
    from backend.auth.dependencies import get_current_user
    app.dependency_overrides[get_current_user] = lambda: user

    # 2. Test Visitors (Disabled)
    response = await client.get("/api/visitors/")
    # Should be 403 Forbidden because module is disabled
    assert response.status_code == 403
    assert "not enabled" in response.json()["detail"]

    # 3. Test Documents (Enabled)
    # Note: Documents router path is /{community_id}/documents
    response = await client.get(f"/api/communities/{community.id}/documents")
    # Should be 200 (empty list) or 403 (role access), but NOT module disabled
    # If it was module disabled, it would be "not enabled".
    # Since user is resident and doc access logic might return empty list or 200.
    # We mainly check it's NOT the module error.
    assert response.status_code != 404 # It exists
    if response.status_code == 403:
         assert "not enabled" not in response.json().get("detail", "")
    else:
         assert response.status_code == 200

    # Cleanup handled by rollback fixture
    # Cleanup handled by rollback fixture
    app.dependency_overrides.clear()
