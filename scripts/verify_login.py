
from backend.core.database import SessionLocal
from backend.auth.models import User
from backend.community.models import Community
from backend.auth.security import verify_password
import sys

def verify_login():
    db = SessionLocal()
    email = "admin@esntes.com"
    password = "admin123"
    
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            print(f"User not found: {email}")
            return

        print(f"User found: {user.email}")
        print(f"ID: {user.id}")
        print(f"Role: {user.role.name if user.role else 'None'}")
        print(f"Is Active: {user.is_active}")
        print(f"Hashed Password: {user.hashed_password}")
        
        if verify_password(password, user.hashed_password):
            print("Password verification SUCCEEDED")
        else:
            print("Password verification FAILED")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    verify_login()
