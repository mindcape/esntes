from backend.core.database import SessionLocal
from backend.auth.models import User, Role
from backend.community.models import Community

db = SessionLocal()

print("--- Roles ---")
roles = db.query(Role).all()
for role in roles:
    print(f"Role ID: {role.id}, Name: '{role.name}'")

print("\n--- Users and their Roles ---")
users = db.query(User).all()
for user in users:
    role_name = user.role.name if user.role else "No Role"
    print(f"User: {user.email}, Role: '{role_name}'")

db.close()
