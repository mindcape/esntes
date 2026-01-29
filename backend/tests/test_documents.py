import pytest
from backend.auth.models import User
from backend.community.models import Community
from backend.documents import models
from backend.main import app

@pytest.mark.asyncio
async def test_documents_flow(client, db_session):
    # 1. Setup Data
    community = Community(
        name="Docs Community", 
        modules_enabled={"documents": True}
    )
    db_session.add(community)
    db_session.commit()
    
    board_user = User(email="board@test.com", full_name="Board User", community_id=community.id, role_id=3) # 3=SuperAdmin/Board mock
    resident_user = User(email="resident@test.com", full_name="Res User", community_id=community.id, role_id=1)
    db_session.add_all([board_user, resident_user])
    db_session.commit()

    # Mock Auth - Start as Board Member
    from backend.auth.dependencies import get_current_user
    app.dependency_overrides[get_current_user] = lambda: board_user

    # 2. Upload Document (Board)
    doc_data = {
        "title": "Board Meeting Minutes",
        "category": "Meeting Minutes",
        "file_url": "http://example.com/file.pdf",
        "access_level": "Public" # Case sensitive Enum
    }
    # Note: Logic in router expects params via Pydantic model at body, but router arg says 'document: schemas.DocumentCreate'
    # so json=doc_data works.
    response = await client.post(f"/api/communities/{community.id}/documents", json=doc_data)
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Board Meeting Minutes"
    doc_id = data["id"]

    # 3. Get Documents (Resident)
    # Switch to resident
    app.dependency_overrides[get_current_user] = lambda: resident_user
    
    response = await client.get(f"/api/communities/{community.id}/documents")
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["title"] == "Board Meeting Minutes"

    # 4. Try Delete (Resident) - Should Fail
    response = await client.delete(f"/api/communities/{community.id}/documents/{doc_id}")
    assert response.status_code == 403

    # Cleanup
    app.dependency_overrides.clear()
