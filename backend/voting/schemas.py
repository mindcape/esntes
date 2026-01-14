from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class CandidateBase(BaseModel):
    name: str
    bio: str
    photo_url: Optional[str] = None

class CandidateCreate(CandidateBase):
    pass

class Candidate(CandidateBase):
    id: int
    election_id: int
    
    class Config:
        orm_mode = True

class ElectionBase(BaseModel):
    title: str
    description: str
    start_date: datetime
    end_date: datetime
    is_active: bool = True
    election_type: str = "single"
    allowed_selections: int = 1

class ElectionCreate(ElectionBase):
    candidates: List[CandidateCreate]

class Election(ElectionBase):
    id: int
    candidates: List[Candidate] = []
    has_voted: Optional[bool] = False # Computed field for current user
    vote_timestamp: Optional[datetime] = None # Computed field for current user
    
    class Config:
        orm_mode = True

class VoteCreate(BaseModel):
    election_id: int
    candidate_ids: List[int]

class ElectionResult(BaseModel):
    candidate_id: int
    candidate_name: str
    vote_count: int

class ElectionSummary(BaseModel):
    election_id: int
    election_title: str
    total_votes: int
    results: List[ElectionResult]
