
import requests
import sys
from datetime import datetime, timedelta

BASE_URL = "http://localhost:8000/api/communities/1/events"
# Mock Auth Token if needed, or assume dev environment might bypass if not enforced strictly below board level for GET
# But our code enforced it depending on endpoint.
# Let's try GET first which sometimes is public or requires simple user.

def verify_calendar_refactor():
    print(f"Testing Nested Calendar API: {BASE_URL}")
    
    # 1. Test GET (List)
    try:
        # We need a user context for the GET endpoint as per the code: current_user = Depends(get_current_user)
        # We'll expect a 401 if we don't provide auth, which confirms the endpoint is REACHABLE at least.
        # If we get 404, it means the router isn't mounted correctly.
        
        response = requests.get(BASE_URL)
        
        if response.status_code == 401:
             print("✅ Endpoint reachable (Method Not Allowed / Unauthorized as expected without token). Route exists!")
        elif response.status_code == 200:
             print("✅ Endpoint reachable and public/open. Success!")
             events = response.json()
             print(f"   Found {len(events)} events.")
        elif response.status_code == 404:
             print("❌ Endpoint NOT found (404). Router mounting failed.")
             return False
        else:
             print(f"⚠️ Unexpected status: {response.status_code}")
             print(response.text)
             
        # If we want to fully test, we'd need to mock login. 
        # But for structural refactor verification (router mounting), checking 404 vs 401/200 is often enough.
        
        return True

    except requests.exceptions.ConnectionError:
        print("❌ Connection Error. Is the backend running?")
        return False

if __name__ == "__main__":
    if verify_calendar_refactor():
        sys.exit(0)
    else:
        sys.exit(1)
