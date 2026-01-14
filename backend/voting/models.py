from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from backend.core.database import Base
from datetime import datetime

class Election(Base):
    __tablename__ = "elections"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(String)
    start_date = Column(DateTime)
    end_date = Column(DateTime)
    is_active = Column(Boolean, default=True)
    election_type = Column(String, default="single") # single, multi, vendor
    allowed_selections = Column(Integer, default=1)
    
    candidates = relationship("Candidate", back_populates="election", cascade="all, delete-orphan")
    votes = relationship("Vote", back_populates="election", cascade="all, delete-orphan")
    voter_records = relationship("VoterRecord", back_populates="election", cascade="all, delete-orphan")

class Candidate(Base):
    __tablename__ = "candidates"
    id = Column(Integer, primary_key=True, index=True)
    election_id = Column(Integer, ForeignKey("elections.id"))
    name = Column(String)
    bio = Column(String)
    photo_url = Column(String, nullable=True)
    
    election = relationship("Election", back_populates="candidates")
    votes = relationship("Vote", back_populates="candidate")

class Vote(Base):
    __tablename__ = "votes"
    id = Column(Integer, primary_key=True, index=True)
    election_id = Column(Integer, ForeignKey("elections.id"))
    candidate_id = Column(Integer, ForeignKey("candidates.id"))
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    election = relationship("Election", back_populates="votes")
    candidate = relationship("Candidate", back_populates="votes")

class VoterRecord(Base):
    __tablename__ = "voter_records"
    id = Column(Integer, primary_key=True, index=True)
    election_id = Column(Integer, ForeignKey("elections.id"))
    user_id = Column(Integer) # Assuming user ID from user table, keeping loose coupling for now
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    election = relationship("Election", back_populates="voter_records")
