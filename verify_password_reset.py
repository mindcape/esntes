
from fastapi.testclient import TestClient
from backend.main import app
from backend.auth.security import get_password_hash
from backend.core.database import get_db, Base
import random
import string

client = TestClient(app)

# Login as Super Admin
def get_admin_token():
    res = client.post("/api/auth/login", json={"email": "mlax1980@gmail.com", "password": "admin123"})
    if res.status_code != 200:
        print(f"Login failed: {res.text}")
        exit(1)
    return res.json()["access_token"]

def verify_password_reset():
    token = get_admin_token()
    headers = {"Authorization": f"Bearer {token}"}
    
    # 1. Create a dummy user to reset
    unique = "".join(random.choices(string.ascii_letters, k=5))
    # This is Google's standard test key, matches frontend and backend bypass
    RECAPTCHA_TEST_SITE_KEY = "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI" 
    
    # We need a token. For the *test* key, the token is not a real opaque string,
    # but the verification endpoint accepts any string if we use the test secret key?
    # Actually, for the global test keys, the widget generates a special token.
    # But for backend testing against RECAPTCHA_TEST_SECRET_KEY, we might just need a dummy token 
    # if the backend bypasses validation or if we use the "always valid" test token.
    # However, our backend implementation tries to verify against Google using the token.
    # For automated testing without a browser, we might need to skip captcha or mock it.
    # BUT, the goal here is to verify the whole flow.
    # The user is manually testing or we use browser tool.
    # This script seems to just hit the endpoint. The endpoint verifies the token.
    # We can't easily generate a valid token without a browser (or using the 'always pass' token?).
    # https://developers.google.com/recaptcha/docs/faq#id-5404364 says for v2 invisible,
    # "The response token can be any string."
    # For checkbox: "The verification response is always true."
    # So we can send "test_token" if we use the TEST SECRET KEY in backend.
    
    captcha_token = "00000000-0000-0000-0000-000000000000" # Dummy token for test key
    email = f"reset.test.{unique}@example.com"
    
    # We need a community first (can reuse existing or create one)
    # Let's assume community 1 exists (from seed)
    
    create_payload = {
        "full_name": "Reset Test User",
        "email": email,
        "role_name": "resident"
    }
    
    print("1. Creating User...")
    # Assuming community ID 1 exists
    res = client.post("/api/admin/communities/1/members", json=create_payload, headers=headers)
    if res.status_code == 404:
        print("   -> Community 1 not found, creating one...")
        comm_res = client.post("/api/admin/communities", json={"name": f"Reset Comm {unique}", "address": "123 St", "community_code": f"RES-{unique}"}, headers=headers)
        comm_id = comm_res.json()["id"]
        res = client.post(f"/api/admin/communities/{comm_id}/members", json=create_payload, headers=headers)
    else:
        comm_id = 1
        
    assert res.status_code == 200, f"User creation failed: {res.text}"
    
    # Get user ID
    list_res = client.get(f"/api/admin/communities/{comm_id}/members", headers=headers)
    user_id = next(u["id"] for u in list_res.json() if u["email"] == email)
    print(f"   -> User created: {user_id}")

    # 2. Test Manual Reset
    manual_pass = "ManualPass123!"
    print(f"2. Testing Manual Reset to '{manual_pass}'...")
    res = client.post(f"/api/admin/users/{user_id}/reset-password", json={"password": manual_pass}, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["new_password"] == manual_pass
    print("   -> Manual reset confirmed.")

    # 3. Test Auto Reset
    print("3. Testing Auto Reset...")
    res = client.post(f"/api/admin/users/{user_id}/reset-password", json={}, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["new_password"] != manual_pass
    assert len(data["new_password"]) == 10
    print(f"   -> Auto reset confirmed (New: {data['new_password']}).")
    
    print("\nPASSWORD RESET VERIFICATION PASSED ✅")

if __name__ == "__main__":
    verify_password_reset()
