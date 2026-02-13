import requests
import os

# Configuration
API_URL = "http://localhost:8000"
# Login to get token first
def get_token():
    # Helper to get token (assuming test user exists, adjust credentials if needed)
    # Using the credentials from previous context or default super admin
    response = requests.post(f"{API_URL}/api/auth/login", json={
        "email": "test_upload_user@example.com", 
        "password": "TestPassword123!" 
    })
    return response.json().get("access_token")

def test_upload_restrictions():
    token = get_token()
    if not token:
        print("Failed to get token. Skipped.")
        return

    headers = {"Authorization": f"Bearer {token}"}
    
    # 1. Test Valid File (PDF)
    with open("test.pdf", "wb") as f:
        f.write(b"%PDF-1.4 content")
    
    files = {'file': ('test.pdf', open('test.pdf', 'rb'), 'application/pdf')}
    res = requests.post(f"{API_URL}/api/upload", headers=headers, files=files)
    print(f"Valid PDF Upload: {res.status_code}") # Should be 200
    
    # 2. Test Invalid Extension (.txt)
    with open("test.txt", "wb") as f:
        f.write(b"plain text")
        
    files = {'file': ('test.txt', open('test.txt', 'rb'), 'text/plain')}
    res = requests.post(f"{API_URL}/api/upload", headers=headers, files=files)
    print(f"Invalid .txt Upload: {res.status_code}") # Should be 400
    print(f"Response: {res.json()}")

    # Cleanup
    os.remove("test.pdf")
    os.remove("test.txt")

if __name__ == "__main__":
    test_upload_restrictions()
