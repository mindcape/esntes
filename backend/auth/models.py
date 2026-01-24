from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from ..core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    auth0_id = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    full_name = Column(String)
    hashed_password = Column(String, nullable=True)
    is_setup_complete = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    
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
