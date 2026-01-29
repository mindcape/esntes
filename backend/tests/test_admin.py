
import pytest
from backend.auth.models import User, Role
from backend.auth.security import create_access_token, get_password_hash
from backend.community.models import Community

@pytest.fixture
def super_admin_token(db_session):
    # Create super_admin role if not exists
    role = db_session.query(Role).filter(Role.name == "super_admin").first()
    if not role:
        role = Role(name="super_admin")
        db_session.add(role)
        db_session.commit()
    
    # Create super admin user
    hashed = get_password_hash("admin123")
    user = User(email="admin@esntes.com", hashed_password=hashed, role_id=role.id, is_active=True, full_name="Super Admin")
    db_session.add(user)
    db_session.commit()
    
    return create_access_token(subject=user.id)

@pytest.mark.asyncio
async def test_list_communities_unauthorized(client):
    response = await client.get("/api/admin/communities")
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_create_community_success(client, super_admin_token):
    headers = {"Authorization": f"Bearer {super_admin_token}"}
    payload = {
        "name": "New Test Community",
        "community_code": "NTC001",
        "units_count": 100,
        "address": "123 Test St",
        "city": "Test City",
        "state": "TS",
        "zip_code": "12345",
        "poc_name": "John Doe",
        "poc_email": "john@example.com",
        "poc_phone": "555-123-4567"
    }
    response = await client.post("/api/admin/communities", json=payload, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "New Test Community"
    assert data["id"] is not None

@pytest.mark.asyncio
async def test_create_community_validation_error(client, super_admin_token):
    headers = {"Authorization": f"Bearer {super_admin_token}"}
    payload = {
        "name": "Bad Community",
        "community_code": "BAD001",
        "units_count": 100,
        "address": "123 Test St",
        "poc_email": "invalid-email", # Invalid
        "poc_phone": "123" # Invalid
    }
    response = await client.post("/api/admin/communities", json=payload, headers=headers)
    assert response.status_code == 422 # Pydantic validation error

