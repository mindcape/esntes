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
    
    # Establish relationship to users
    users = relationship("User", back_populates="community")
