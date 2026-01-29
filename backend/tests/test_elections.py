import pytest
from datetime import datetime, timedelta
from backend.auth.models import User
from backend.community.models import Community
from backend.main import app

@pytest.mark.asyncio
async def test_voting_flow(client, db_session):
    # 1. Setup Data
    community = Community(
        name="Vote Community", 
        modules_enabled={"elections": True}
    )
    db_session.add(community)
    db_session.commit()
    
    user = User(email="voter@test.com", full_name="Voter User", community_id=community.id, role_id=1)
    db_session.add(user)
    db_session.commit()

    from backend.auth.dependencies import get_current_user
    app.dependency_overrides[get_current_user] = lambda: user

    # 2. Create Election
    # Note: In real app, only board creates. Adjust override if needed. Assuming user can for test simplification 
    # OR setup user as board if router enforces it strictly.
    # Router: "Create a new election... (Board Only)". But let's check router code.
    # It checks `current_user.community_id` but doesn't explicit check role in the snippet I read?
    # Ah, I see "In real app verify user.role == 'board'" comment in router. So maybe it doesn't enforce yet.
    # Let's try.
    
    election_data = {
        "title": "Annual Election",
        "description": "Vote for board",
        "start_date": datetime.now().isoformat(),
        "end_date": (datetime.now() + timedelta(days=7)).isoformat(),
        "is_active": True,
        "election_type": "board",
        "allowed_selections": 1,
        "candidates": [
            {"name": "Alice", "bio": "Incumbent", "photo_url": ""},
            {"name": "Bob", "bio": "Challenger", "photo_url": ""}
        ]
    }
    
    response = await client.post("/api/elections/", json=election_data)
    assert response.status_code == 200
    e_data = response.json()
    assert e_data["title"] == "Annual Election"
    election_id = e_data["id"]
    alice_id = e_data["candidates"][0]["id"]

    # 3. Cast Vote
    vote_data = {
        "election_id": election_id,
        "candidate_ids": [alice_id]
    }
    response = await client.post("/api/elections/vote", json=vote_data)
    assert response.status_code == 200
    assert response.json()["message"] == "Vote cast successfully"

    # 4. Prevent Double Vote
    response = await client.post("/api/elections/vote", json=vote_data)
    assert response.status_code == 400
    assert "already cast" in response.json()["detail"]

    # Cleanup
    app.dependency_overrides.clear()
