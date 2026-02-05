
import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from backend.core.database import SessionLocal
from backend.auth.models import Role, Permission
from backend.community.models import Community # Required for relationships

def fix_permissions():
    db = SessionLocal()
    try:
        print("Fixing Admin Permissions...")
        
        # 1. Get Permission
        perm_manage = db.query(Permission).filter(Permission.name == "manage_communities").first()
        if not perm_manage:
            print("Error: 'manage_communities' permission not found.")
            return

        # 2. Get Admin Role
        admin_role = db.query(Role).filter(Role.name == "admin").first()
        if not admin_role:
             print("Error: 'admin' role not found.")
             return

        # 3. Assign
        if perm_manage not in admin_role.permissions:
            admin_role.permissions.append(perm_manage)
            db.commit()
            print("Successfully added 'manage_communities' to 'admin' role.")
        else:
            print("'admin' role already has 'manage_communities'.")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    fix_permissions()
