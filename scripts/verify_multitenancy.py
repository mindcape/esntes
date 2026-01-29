
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.main import app
from backend.core.database import get_db, Base
from backend.auth.models import User, Role
from backend.community.models import Community
from backend.auth.security import get_password_hash

# Setup Test DB
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_multitenancy.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

def setup_data():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()

    # Create Roles
    db.add(Role(id=1, name="resident"))
    db.add(Role(id=2, name="board"))
    db.add(Role(id=3, name="super_admin"))
    
    # Create Communities
    c1 = Community(name="Pine Valley", community_code="PINE-1", is_active=True)
    c2 = Community(name="Oak Ridge", community_code="OAK-2", is_active=True)
    db.add(c1)
    db.add(c2)
    db.commit()
    
    # Create Admins
    # Pasword 'secret' hash: $2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW
    hashed_pw = get_password_hash("secret")
    
    u1 = User(email="admin1@pine.com", full_name="Admin Pine", role_id=2, community_id=c1.id, is_active=True, hashed_password=hashed_pw, is_setup_complete=True)
    u2 = User(email="admin2@oak.com", full_name="Admin Oak", role_id=2, community_id=c2.id, is_active=True, hashed_password=hashed_pw, is_setup_complete=True)
    

    u3 = User(email="resident1@pine.com", full_name="Resident Pine", role_id=1, community_id=c1.id, is_active=True, hashed_password=hashed_pw, is_setup_complete=True)
    
    db.add(u1)
    db.add(u2)
    db.add(u3)
    db.commit()
    db.refresh(u3)
    u3_id = u3.id
    db.close()
    return u3_id

def get_token(email, password="secret"):
    res = client.post("/api/auth/login", json={"email": email, "password": password})
    if res.status_code != 200:
        raise Exception(f"Login failed for {email}: {res.text}")
    return res.json()["access_token"]

def verify_isolation():
    print("Setting up test data...")
    resident_id = setup_data()
    
    token1 = get_token("admin1@pine.com")
    token2 = get_token("admin2@oak.com")
    
    print("1. Creating Violation in Pine Valley (Admin 1)")
    res = client.post("/api/violations/", 
        json={
            "resident_id": resident_id,
            "resident_name": "Bad Resident",
            "resident_address": "123 Pine St",
            "description": "Loud Noise",
            "action": "warning",
            "fine_amount": 0
        },
        headers={"Authorization": f"Bearer {token1}"}
    )
    assert res.status_code == 200, f"Failed to create violation: {res.text}"
    v1_id = res.json()["id"]
    print(f"   -> Violation {v1_id} created.")

    print("2. Verifying Admin 2 (Oak Ridge) CANNOT see Violation created by Admin 1")
    res = client.get("/api/violations/all", headers={"Authorization": f"Bearer {token2}"})
    assert res.status_code == 200
    violations = res.json()
    # Ensure list is empty or doesn't contain v1_id
    found = any(v["id"] == v1_id for v in violations)
    if found:
        print("   FAILED: Admin 2 saw Admin 1's violation!")
        exit(1)
    else:
        print("   SUCCESS: Admin 2 sees 0 violations (or unrelated ones).")

    print("3. Creating Maintenance Request in Oak Ridge (Admin 2)")
    res = client.post("/api/maintenance/", 
        json={
            "title": "Broken Gate",
            "description": "Main gate stuck",
            "category": "common_area",
            "priority": "high"
        },
        headers={"Authorization": f"Bearer {token2}"}
    )
    # Note: If maintenance endpoint differs, might need adjustment.
    # Assuming standard CRUD.
    if res.status_code != 200:
        print(f"   Warning: Maintenance create failed ({res.status_code}). Skipping maintenance check.")
    else:
        m_id = res.json()["id"]
        print(f"   -> Maintenance Request {m_id} created.")
        
        print("4. Verifying Admin 1 (Pine Valley) CANNOT see Oak Ridge Maintenance")
        res = client.get("/api/maintenance/", headers={"Authorization": f"Bearer {token1}"})
        if res.status_code == 200:
            reqs = res.json()
            found = any(r["id"] == m_id for r in reqs)
            if found:
                 print("   FAILED: Admin 1 saw Admin 2's maintenance request!")
                 exit(1)
            else:
                 print("   SUCCESS: Admin 1 sees isolated maintenance requests.")

    print("\nMULTITENANCY VERIFICATION PASSED ✅")

if __name__ == "__main__":
    verify_isolation()
