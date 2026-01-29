
from fastapi.testclient import TestClient
from backend.main import app
from backend.auth.security import get_password_hash
from backend.core.database import get_db, Base
from backend.admin.router import CommunityUpdate
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

def verify_community_edit():
    token = get_admin_token()
    headers = {"Authorization": f"Bearer {token}"}
    
    # 1. First create a community to edit
    unique_suffix = "".join(random.choices(string.ascii_letters, k=5))
    create_payload = {
        "name": f"Edit Test {unique_suffix}",
        "address": "Original Address",
        "units_count": 50,
        "community_code": f"EDIT-{unique_suffix}"
    }

    print("1. Creating Community...")
    res = client.post("/api/admin/communities", json=create_payload, headers=headers)
    assert res.status_code == 200, f"Creation failed: {res.text}"
    comm_id = res.json()["id"]
    print(f"   -> Created ID: {comm_id}")
    
    # 2. Update the community
    update_payload = {
        "address": "Updated Address 1",
        "address2": "Suite 99",
        "city": "New City",
        "state": "XY",
        "zip_code": "90210",
        "county": "New County",
        "poc_name": "New Manager",
        "poc_email": "manager@new.com",
        "poc_phone": "555-9999"
    }
    
    print("2. Updating Community Details...")
    res = client.put(f"/api/admin/communities/{comm_id}", json=update_payload, headers=headers)
    assert res.status_code == 200, f"Update failed: {res.text}"
    data = res.json()
    
    # Verify Response
    assert data["address"] == "Updated Address 1"
    assert data["address2"] == "Suite 99"
    assert data["poc_name"] == "New Manager"
    print("   -> Update response verified.")
    
    # 3. Verify Persistence via GET
    print("3. Verifying Persistence...")
    res = client.get("/api/admin/communities", headers=headers)
    communities = res.json()
    updated = next((c for c in communities if c["id"] == comm_id), None)
    
    assert updated is not None
    assert updated["city"] == "New City"
    assert updated["poc_phone"] == "555-9999"
    print("   -> GET persistence verified.")
    
    print("\nCOMMUNITY EDIT VERIFICATION PASSED ✅")

if __name__ == "__main__":
    verify_community_edit()
