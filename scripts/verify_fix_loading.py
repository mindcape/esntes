
import requests
import sys

def verify_community_endpoint(community_id):
    url = f"http://localhost:8000/api/admin/communities/{community_id}"
    try:
        print(f"Testing GET {url}...")
        response = requests.get(url)
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Success! Community data retrieved:")
            print(f"ID: {data.get('id')}")
            print(f"Name: {data.get('name')}")
            print(f"Code: {data.get('community_code')}")
            return True
        else:
            print(f"❌ Failed. Status Code: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Connection Error. Is the backend running on port 8000?")
        return False

if __name__ == "__main__":
    # Test with ID 1 (which usually exists from seed data)
    success = verify_community_endpoint(1)
    if not success:
        sys.exit(1)
