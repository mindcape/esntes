import pytest
from datetime import datetime, timedelta
from backend.auth.models import User
from backend.community.models import Community
from backend.main import app

@pytest.mark.asyncio
async def test_calendar_flow(client, db_session):
    # 1. Setup Data
    community = Community(
        name="Cal Community", 
        modules_enabled={"calendar": True}
    )
    db_session.add(community)
    db_session.commit()
    
    board = User(email="c_board@test.com", full_name="Board C", community_id=community.id, role_id=3) # 3=SuperAdmin/Board
    resident = User(email="c_res@test.com", full_name="Res C", community_id=community.id, role_id=1)
    db_session.add_all([board, resident])
    db_session.commit()

    from backend.auth.dependencies import get_current_user
    
    # 2. Board creates Event
    app.dependency_overrides[get_current_user] = lambda: board
    
    # Using 'Meeting' from Enum. Check models.py EventType: MEETING = "Meeting"
    start = datetime.now().isoformat()
    end = (datetime.now() + timedelta(hours=1)).isoformat()
    
    event_data = {
        "title": "Town Hall",
        "event_type": "Meeting",
        "start_date": start,
        "end_date": end,
        "description": "Discuss logic"
    }
    
    response = await client.post(f"/api/communities/{community.id}/events", json=event_data)
    assert response.status_code == 200
    event_id = response.json()["id"]

    # 3. Resident lists events
    app.dependency_overrides[get_current_user] = lambda: resident
    response = await client.get(f"/api/communities/{community.id}/events")
    assert response.status_code == 200
    assert len(response.json()) >= 1
    assert response.json()[0]["title"] == "Town Hall"

    # Cleanup
    app.dependency_overrides.clear()
