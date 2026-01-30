
import sys
import os
import sqlite3

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from backend.core.database import engine, Base, SessionLocal
from backend.auth.models import Role, Permission, User
from backend.community.models import Community # Required for relationships
from sqlalchemy.orm import Session

def migrate_db():
    print("Starting Phase 9 Migration...")
    
    # 1. Add user_code to users table (SQLite doesn't support IF NOT EXISTS for ADD COLUMN well in all versions, checking first)
    # We use raw sqlite connection for alter table
    db_path = "esntes.db"
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        cursor.execute("SELECT user_code FROM users LIMIT 1")
        print("Column 'user_code' already exists.")
    except sqlite3.OperationalError:
        print("Adding 'user_code' column to users table...")
        # SQLite limitation: Cannot add UNIQUE column with ADD COLUMN directly if there's data usually, 
        # but since nullable=True is set in model, we can add it as nullable first.
        # But we want it to be unique. For existing users, it will be NULL.
        # Unique constraints on NULL allow multiple NULLs in SQLite.
        cursor.execute("ALTER TABLE users ADD COLUMN user_code TEXT")
        # Manually create index if needed, or rely on model sync? 
        # SQLAlchemy create_all won't create index for existing table column unless we drop/recreate.
        # Let's create index manually.
        cursor.execute("CREATE UNIQUE INDEX IF NOT EXISTS ix_users_user_code ON users (user_code)")
        print("Column 'user_code' added.")
        conn.commit()
    finally:
        conn.close()

    # 2. Create new tables (Permissions, RolePermissions)
    print("Creating new tables...")
    Base.metadata.create_all(bind=engine)
    print("Tables created.")

    # 3. Seed Permissions
    db = SessionLocal()
    seed_permissions(db)
    db.close()
    
    print("Migration Complete.")

def seed_permissions(db: Session):
    print("Seeding Permissions & Roles...")
    
    # Define Permissions Scopes
    perms = [
        # User Management
        {"name": "manage_users", "scope": "community", "description": "Create, update, delete community members"},
        {"name": "view_users", "scope": "community", "description": "View functionality for community directory"},
        
        # Financials
        {"name": "manage_financials", "scope": "finance", "description": "Manage invoices, payments, budgets"},
        {"name": "view_financials", "scope": "finance", "description": "View financial reports"},
        {"name": "pay_assessments", "scope": "finance", "description": "Pay personal assessments"},
        
        # Violations
        {"name": "manage_violations", "scope": "compliance", "description": "Issue and update violations"},
        {"name": "view_violations", "scope": "compliance", "description": "View violations"},
        
        # Maintenance
        {"name": "manage_maintenance", "scope": "maintenance", "description": "Manage work orders"},
        {"name": "create_work_order", "scope": "maintenance", "description": "Create work orders"},
        
        # System
        {"name": "manage_system", "scope": "system", "description": "Super admin system management"},
    ]
    
    for p in perms:
        existing = db.query(Permission).filter(Permission.name == p["name"]).first()
        if not existing:
            perm = Permission(**p)
            db.add(perm)
            print(f"Added permission: {p['name']}")
    db.commit()
    
    # Map Permissions to Roles
    # 1. Resident
    resident_role = db.query(Role).filter(Role.name == "resident").first()
    if resident_role:
        assign_perms(db, resident_role, ["pay_assessments", "create_work_order", "view_users"])
        
    # 2. Board
    board_role = db.query(Role).filter(Role.name == "board").first()
    if board_role:
        assign_perms(db, board_role, [
            "view_users", "view_financials", "view_violations", 
            "manage_maintenance", "create_work_order", "pay_assessments"
        ])

    # 3. Admin / President / VP / Treasurer (Simplification: Treat Admin as super-community-admin for now)
    admin_role = db.query(Role).filter(Role.name == "admin").first()
    if admin_role:
        # Give all community scoped permissions
        assign_perms(db, admin_role, [
            "manage_users", "view_users", 
            "manage_financials", "view_financials", 
            "manage_violations", "view_violations",
            "manage_maintenance", "create_work_order"
        ])
        
    # 4. Super Admin
    super_admin_role = db.query(Role).filter(Role.name == "super_admin").first()
    if super_admin_role:
         # Give ALL permissions
         all_perms = db.query(Permission).all()
         for p in all_perms:
             if p not in super_admin_role.permissions:
                 super_admin_role.permissions.append(p)
         db.commit()

def assign_perms(db, role, perm_names):
    for name in perm_names:
        perm = db.query(Permission).filter(Permission.name == name).first()
        if perm and perm not in role.permissions:
            role.permissions.append(perm)
    db.commit()
    print(f"Updated permissions for role: {role.name}")

if __name__ == "__main__":
    migrate_db()
