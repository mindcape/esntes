
from sqlalchemy.orm import Session
from backend.core.database import SessionLocal, engine, Base
from backend.auth.models import User, Role
from backend.community.models import Community
from backend.auth.security import get_password_hash

def seed_db():
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Create Roles
        roles = ["super_admin", "admin", "board", "resident"]
        for role_name in roles:
            role = db.query(Role).filter(Role.name == role_name).first()
        if not role:
                role = Role(name=role_name, description=f"{role_name} role")
                db.add(role)
        db.commit()

        # Define Permissions
        permissions = {
            "manage_communities": "super_admin", # Manage HOAs
            "manage_residents": "super_admin,admin,board", # Add/Edit Residents
            "manage_community_settings": "super_admin,admin", # Edit Community Info
            "manage_documents": "super_admin,admin,board", # Upload/Delete Docs
            "view_documents": "super_admin,admin,board,resident", 
            "manage_events": "super_admin,admin,board", # Create Calendar Events
            "view_events": "super_admin,admin,board,resident",
            "manage_financials": "super_admin,admin,board,treasurer", 
            "view_financials": "super_admin,admin,board,resident", # View own ledger
            "vote": "super_admin,admin,board,resident", # Cast votes
            "manage_elections": "super_admin,admin,board", # Create/Manage Elections
            "manage_violations": "super_admin,admin,board",
            "view_violations": "super_admin,admin,board,resident", # View own
            "manage_maintenance": "super_admin,admin,board,treasurer",
            "view_maintenance": "super_admin,admin,board,resident",
            "submit_request": "super_admin,admin,board,resident", 
        }

        # Create Permissions and Assign to Roles
        from backend.auth.models import Permission
        
        # 1. Create all permission objects
        for perm_name, roles_str in permissions.items():
            perm = db.query(Permission).filter(Permission.name == perm_name).first()
            if not perm:
                perm = Permission(name=perm_name, scope="general", description=f"Permission to {perm_name.replace('_', ' ')}")
                db.add(perm)
        db.commit()

        # 2. Assign to Roles
        for perm_name, roles_str in permissions.items():
            perm = db.query(Permission).filter(Permission.name == perm_name).first()
            allowed_roles = roles_str.split(",")
            
            for role_name in allowed_roles:
                role = db.query(Role).filter(Role.name == role_name).first()
                if role and perm not in role.permissions:
                    role.permissions.append(perm)
        
        db.commit()
        
        # Create Super Admin
        super_admin_email = "admin@esntes.com"
        super_admin = db.query(User).filter(User.email == super_admin_email).first()
        if not super_admin:
            role_super_admin = db.query(Role).filter(Role.name == "super_admin").first()
            user = User(
                email=super_admin_email,
                hashed_password=get_password_hash("admin123"),
                full_name="Super Admin",
                is_active=True,
                is_setup_complete=True,
                role=role_super_admin
            )
            db.add(user)
            print(f"Super Admin created: {super_admin_email} / admin123")
        
        # Create Demo Community
        community = db.query(Community).filter(Community.name == "Sunset Valley").first()
        if not community:
            community = Community(
                name="Sunset Valley",
                address="123 Sunset Blvd",
                community_code="SUNSET123"
            )
            db.add(community)
            print("Demo Community 'Sunset Valley' created (Code: SUNSET123)")
            
        db.commit()
        print("Database seeded successfully.")
        
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
