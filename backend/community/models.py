from sqlalchemy import Column, Integer, String, Boolean, JSON
from sqlalchemy.orm import relationship
from backend.core.database import Base

class Community(Base):
    __tablename__ = "communities"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    address = Column(String)
    units_count = Column(Integer, default=0, server_default="0")
    amenities = Column(JSON, nullable=True) # e.g. ["pool", "gym"]
    
    # Contact Info
    city = Column(String, nullable=True)
    state = Column(String, nullable=True)
    zip_code = Column(String, nullable=True)
    address2 = Column(String, nullable=True)
    county = Column(String, nullable=True)
    
    # Point of Contact
    poc_name = Column(String, nullable=True)
    poc_email = Column(String, nullable=True)
    poc_phone = Column(String, nullable=True)

    phone = Column(String, nullable=True) # General Community Phone
    email = Column(String, nullable=True) # General Community Email

    # Advanced SaaS Settings
    subdomain = Column(String, unique=True, index=True, nullable=True)
    community_code = Column(String, unique=True, index=True, nullable=True) # Unique code for residents to join
    is_active = Column(Boolean, default=True)
    branding_settings = Column(JSON, default={}) # { "logo": "", "primary_color": "", "welcome_msg": "" }
    modules_enabled = Column(JSON, default={
        "finance": True,
        "arc": True,
        "voting": False,
        "violations": True,
        "documents": True,
        "calendar": True,
        "visitors": False,
        "elections": False
    })
    payment_gateway_id = Column(String, nullable=True)

    # Establish relationship to users
    users = relationship("User", back_populates="community")
