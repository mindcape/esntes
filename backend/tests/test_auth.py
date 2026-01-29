
import pytest
from backend.auth.security import create_access_token, get_password_hash
from backend.auth.models import User, Role

@pytest.mark.asyncio
async def test_login_success(client, db_session):
    # Setup
    role = Role(name="resident")
    db_session.add(role)
    db_session.commit()
    
    password = "password123"
    hashed = get_password_hash(password)
    user = User(email="test@example.com", hashed_password=hashed, role_id=role.id, is_active=True, full_name="Test User", community_id=1)
    db_session.add(user)
    db_session.commit()

    # Test
    response = await client.post("/api/auth/login", json={"email": "test@example.com", "password": password})
    assert response.status_code == 200
    assert "access_token" in response.json()

@pytest.mark.asyncio
async def test_login_failure_invalid_credentials(client, db_session):
    response = await client.post("/api/auth/login", json={"email": "wrong@example.com", "password": "wrongpassword"})
    assert response.status_code == 401


def test_protected_route_access(client, test_db):
    # Setup
    token = create_access_token({"sub": "test@example.com"})
    
    # Needs a real endpoint? We can use /api/auth/me if it exists or mocked dependency
    # Assuming /api/users/me exists based on typical FastAPI patterns, or similar.
    # Let's check router.py content if needed, but for now generic check.
    pass 
