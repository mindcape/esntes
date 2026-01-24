
from fastapi.testclient import TestClient
from backend.main import app
from backend.auth.security import get_password_hash
from backend.core.database import get_db, Base
from backend.admin.router import CommunityCreate as RouterCommunityCreate
import random
import string

client = TestClient(app)

# Login as Super Admin
def get_admin_token():
    # Use the seeded super admin
    res = client.post("/api/auth/login", json={"email": "mlax1980@gmail.com", "password": "admin123"})
    if res.status_code != 200:
        print(f"Login failed: {res.text}")
        exit(1)
    return res.json()["access_token"]

def verify_enhanced_creation():
    token = get_admin_token()
    headers = {"Authorization": f"Bearer {token}"}
    
    unique_suffix = "".join(random.choices(string.ascii_letters, k=5))
    payload = {
        "name": f"Test Community {unique_suffix}",
        "address": "123 Test Blvd",
        "units_count": 100,
        "community_code": f"TEST-{unique_suffix}",
        
        # New Fields
        "address2": "Suite 500",
        "city": "Testopolis",
        "state": "TX",
        "zip_code": "75001",
        "county": "Dallas",
        "poc_name": "Jane Manager",
        "poc_email": f"jane.{unique_suffix}@example.com",
        "poc_phone": "555-0100"
    }

    print("1. Creating Community with Enhanced Fields...")
    res = client.post("/api/admin/communities", json=payload, headers=headers)
    assert res.status_code == 200, f"Creation failed: {res.text}"
    data = res.json()
    
    # Verification
    print("   -> Success. ID:", data["id"])
    assert data["address2"] == "Suite 500"
    assert data["city"] == "Testopolis"
    assert data["county"] == "Dallas"
    assert data["poc_name"] == "Jane Manager"
    print("   -> Verified response fields.")

    print("2. Verifying persistence via GET...")
    res = client.get("/api/admin/communities", headers=headers)
    communities = res.json()
    created = next((c for c in communities if c["id"] == data["id"]), None)
    assert created is not None
    assert created["county"] == "Dallas"
    assert created["poc_email"] == f"jane.{unique_suffix}@example.com"
    print("   -> Verified persistence.")
    
    print("\nENHANCED FORM VERIFICATION PASSED ✅")

if __name__ == "__main__":
    verify_enhanced_creation()
