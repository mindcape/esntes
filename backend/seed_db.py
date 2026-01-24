
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
