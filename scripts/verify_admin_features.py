
import sys
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.auth.models import User, Role
from backend.community.models import Community
from passlib.context import CryptContext

# Setup DB
SQLALCHEMY_DATABASE_URL = "sqlite:///./esntes.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_update():
    print("Verifying Member Update...")
    # Get a test user (not admin)
    user = db.query(User).filter(User.role_id != 3).first() # Admin is 3
    if not user:
        print("No non-admin user found to update.")
        return

    original_name = user.full_name
    print(f"Original Name: {original_name}")
    
    # Simulate Update
    new_name = original_name + " (Updated)"
    user.full_name = new_name
    db.commit()
    db.refresh(user)
    
    if user.full_name == new_name:
        print(f"SUCCESS: Name updated to {user.full_name}")
    else:
        print(f"FAILURE: Name not updated. {user.full_name}")
        
    # Revert
    user.full_name = original_name
    db.commit()

def verify_password_reset():
    print("\nVerifying Password Reset...")
    user = db.query(User).filter(User.role_id != 3).first()
    if not user:
        return

    old_hash = user.hashed_password
    
    # Simulate Reset
    import secrets
    import string
    alphabet = string.ascii_letters + string.digits
    new_password = ''.join(secrets.choice(alphabet) for i in range(10))
    print(f"Generated Password: {new_password}")
    
    user.hashed_password = pwd_context.hash(new_password)
    db.commit()
    db.refresh(user)
    
    if user.hashed_password != old_hash:
        print("SUCCESS: Password hash changed.")
    else:
        print("FAILURE: Password hash did not change.")

    # Verify new password works
    if pwd_context.verify(new_password, user.hashed_password):
        print("SUCCESS: New password verifies correctly.")
    else:
        print("FAILURE: New password verification failed.")

if __name__ == "__main__":
    try:
        verify_update()
        verify_password_reset()
    except Exception as e:
        print(f"Error: {e}")
