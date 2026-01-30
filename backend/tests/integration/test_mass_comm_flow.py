import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.communication.models import EmailQueue, EmailStatus, Campaign, MessageTemplate
from backend.auth.models import User, Role
from backend.core.database import get_db

# We will use the client inside the test to ensure overrides are active

def mock_get_current_user():
    # Return a mock object that behaves like a User model
    # We use a simple class to avoid SQLAlchemy attachment issues if we passed a transient model
    class MockRole:
        name = "board"
    class MockUser:
        id = 1
        email = "admin@example.com"
        community_id = 1
        role = MockRole()
        community = None
    return MockUser()

from backend.auth.dependencies import get_current_user

def test_mass_comm_full_flow(db_session):
    # Override DB
    def get_test_db():
        try:
            yield db_session
        finally:
            pass
            
    app.dependency_overrides[get_db] = get_test_db
    app.dependency_overrides[get_current_user] = mock_get_current_user
    
    client = TestClient(app)

    # Setup DB Data
    # 1. Roles
    role_board = Role(name="board")
    role_resident = Role(name="resident")
    db_session.add(role_board)
    db_session.add(role_resident)
    db_session.commit()
    
    # 2. Users
    # Admin (Current user mock ID=1)
    admin = User(id=1, email="admin@example.com", full_name="Admin", community_id=1, role=role_board)
    res1 = User(id=2, email="res1@test.com", full_name="Res 1", community_id=1, role=role_resident)
    res2 = User(id=3, email="res2@test.com", full_name="Res 2", community_id=1, role=role_resident)
    
    db_session.add(admin)
    db_session.add(res1)
    db_session.add(res2)
    db_session.commit()
    
    # 3. Create Template
    template_payload = {
        "name": "Integration Test Template",
        "subject_template": "Hello {{first_name}}",
        "content_html": "<p>Welcome {{first_name}}</p>"
    }
    
    resp = client.post("/api/communication/templates", json=template_payload)
    assert resp.status_code == 200, resp.text
    template_id = resp.json()["id"]
    
    # 4. Create Campaign
    campaign_payload = {
        "title": "Integration Campaign",
        "template_id": template_id,
        "audience_filter": {"role": "resident"},
        "scheduled_at": None # Immediate
    }
    resp = client.post("/api/communication/campaigns", json=campaign_payload)
    assert resp.status_code == 200, f"Campaign creation failed: {resp.text}"
    campaign_data = resp.json()
    campaign_id = campaign_data["id"]
    
    # 5. Verify Queue
    # Check Response Stats: Admin (Board) excluded, 2 Residents included
    assert campaign_data["total_recipients"] == 2
    
    # Check DB directly
    queue_items = db_session.query(EmailQueue).filter(EmailQueue.campaign_id == campaign_id).all()
    assert len(queue_items) == 2
    assert queue_items[0].status == "PENDING"
    # Verify template rendering
    assert "Res" in queue_items[0].subject 

    # 6. Verify Retry Logic (Full Integration)
    # Manually mark as failed
    queue_items[0].status = "FAILED"
    queue_items[0].attempts = 3
    db_session.commit()
    
    # Call Retry Endpoint
    retry_resp = client.post(f"/api/communication/emails/{queue_items[0].id}/retry")
    assert retry_resp.status_code == 200
    
    db_session.refresh(queue_items[0])
    assert queue_items[0].status == "PENDING"
    assert queue_items[0].attempts == 0

    app.dependency_overrides.clear() 
