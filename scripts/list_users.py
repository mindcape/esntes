
from backend.core.database import SessionLocal
from backend.auth.models import User
from backend.community.models import Community

def list_users():
    db = SessionLocal()
    users = db.query(User).all()
    print(f"Total Users: {len(users)}")
    for user in users:
        print(f"- {user.email} (Role: {user.role.name if user.role else 'None'})")
    db.close()

if __name__ == "__main__":
    list_users()
