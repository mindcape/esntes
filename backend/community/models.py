from sqlalchemy import Column, Integer, String, Boolean, JSON
from sqlalchemy.orm import relationship
from backend.core.database import Base

class Community(Base):
    __tablename__ = "communities"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    address = Column(String)
    units_count = Column(Integer, default=0)
    amenities = Column(JSON, nullable=True) # e.g. ["pool", "gym"]
    
    # Advanced SaaS Settings
    subdomain = Column(String, unique=True, index=True, nullable=True)
    branding_settings = Column(JSON, default={}) # { "logo": "", "primary_color": "", "welcome_msg": "" }
    modules_enabled = Column(JSON, default={
        "finance": True,
        "arc": True,
        "voting": True,
        "violations": True,
        "documents": True,
        "calendar": True
    })
    payment_gateway_id = Column(String, nullable=True)

    # Establish relationship to users
    users = relationship("User", back_populates="community")
