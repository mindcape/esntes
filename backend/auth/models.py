from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from ..core.database import Base
from sqlalchemy import Table

# Association Table for Many-to-Many Role <-> Permission
role_permissions = Table('role_permissions', Base.metadata,
    Column('role_id', Integer, ForeignKey('roles.id')),
    Column('permission_id', Integer, ForeignKey('permissions.id'))
)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    auth0_id = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    full_name = Column(String)
    hashed_password = Column(String, nullable=True)
    is_setup_complete = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    user_code = Column(String, unique=True, index=True, nullable=True) # Generated Code (e.g. 5902PCD)
    
    # Advanced Auth
    mfa_secret = Column(String, nullable=True)
    mfa_enabled = Column(Boolean, default=False)
    failed_login_attempts = Column(Integer, default=0)
    reset_token = Column(String, nullable=True)
    reset_token_expires = Column(DateTime, nullable=True)
    
    role_id = Column(Integer, ForeignKey("roles.id"))
    role = relationship("Role", back_populates="users")

    # Profile Fields
    address = Column(String, nullable=True)
    mailing_address = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    bio = Column(String, nullable=True)
    is_opted_in = Column(Boolean, default=False)
    preferences = Column(String, nullable=True) # Stored as JSON string

    # Link Unit/Residency Info
    resident_type = Column(String, nullable=True) # 'owner', 'tenant', 'pm'
    owner_type = Column(String, nullable=True) # 'individual', 'business' (Only if resident_type == 'owner')

    # Multi-Tenancy
    community_id = Column(Integer, ForeignKey("communities.id"), nullable=True) # Nullable for Super Admin? Or default community?
    community = relationship("Community", back_populates="users")

class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True) # Resident, Board Member, Admin
    description = Column(String)
    
    users = relationship("User", back_populates="role")
    permissions = relationship("Permission", secondary=role_permissions, back_populates="roles")

class Permission(Base):
    __tablename__ = "permissions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True) # e.g. "manage_community", "view_financials"
    scope = Column(String, index=True) # e.g. "community", "finance", "system"
    description = Column(String)

    roles = relationship("Role", secondary=role_permissions, back_populates="permissions")
