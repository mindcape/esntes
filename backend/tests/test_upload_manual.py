from fastapi.testclient import TestClient
from backend.main import app
from backend.auth.dependencies import get_current_user
import os
import shutil

# Mock user for testing
def override_get_current_user():
    return type('User', (), {
        'id': 1, 
        'email': 'test@example.com', 
        'full_name': 'Test User',
        'community_id': 99
    })

app.dependency_overrides[get_current_user] = override_get_current_user
client = TestClient(app)

def test_upload_flow():
    # 1. Create a dummy file
    filename = "test_image.png"
    with open(filename, "wb") as f:
        f.write(b"fake image content")

    try:
        # 2. Upload the file
        with open(filename, "rb") as f:
            response = client.post(
                "/api/upload",
                files={"file": (filename, f, "image/png")}
            )
        
        print(f"Status Code: {response.status_code}")
        # print(f"Response: {response.json()}") # Debug
        
        if response.status_code != 200:
             print(f"Error Response: {response.text}")
        
        assert response.status_code == 200
        data = response.json()
        
        print(f"Response Data: {data}")
        
        assert "url" in data
        assert "key" in data
        
        # Check folder structure
        # Since our mock user has community_id (wait, does it?), let's verify mock user
        # In dependency override, we returned a simple object. 
        # We need to simulate community_id in the mock user
        
        assert data["url"].startswith("/static/")
        
        # Verify file exists in uploads/community_X/
        saved_key = data["key"]
        local_path = f"uploads/{saved_key}"
        assert os.path.exists(local_path)
        print(f"File successfully saved to {local_path}")
        
        # 4. Verify static serving
        # The URL for local storage is /static/{key}
        # If key is "community_1/file.png", URL is "/static/community_1/file.png"
        static_response = client.get(data["url"])
        print(f"Static GET Status: {static_response.status_code}")
        assert static_response.status_code == 200
        assert static_response.content == b"fake image content"
        print("Static file serving verified!")
        
    finally:
        # Cleanup
        if os.path.exists(filename):
            os.remove(filename)
        # We might want to keep the uploaded file for inspection or clean it up
        if 'saved_key' in locals() and os.path.exists(f"uploads/{saved_key}"):
            os.remove(f"uploads/{saved_key}")

if __name__ == "__main__":
    test_upload_flow()
