from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from backend.core.database import get_db
from backend.voting import models, schemas

router = APIRouter()

# --- Elections ---

@router.get("/", response_model=List[schemas.Election])
async def get_elections(user_id: int = 1, db: Session = Depends(get_db)):
    """Get all elections. In a real app, user_id comes from auth token."""
    elections = db.query(models.Election).order_by(models.Election.start_date.desc()).all()
    
    # Check if user has voted for each election
    results = []
    for election in elections:
        voter_record = db.query(models.VoterRecord).filter(
            models.VoterRecord.election_id == election.id,
            models.VoterRecord.user_id == user_id
        ).first()
        
        election_data = schemas.Election.from_orm(election)
        if voter_record:
            election_data.has_voted = True
            election_data.vote_timestamp = voter_record.timestamp
        else:
            election_data.has_voted = False
            
        results.append(election_data)
        
    return results

@router.post("/", response_model=schemas.Election)
async def create_election(election: schemas.ElectionCreate, db: Session = Depends(get_db)):
    """Create a new election with candidates (Board Only)"""
    new_election = models.Election(
        title=election.title,
        description=election.description,
        start_date=election.start_date,
        end_date=election.end_date,
        is_active=election.is_active,
        election_type=election.election_type,
        allowed_selections=election.allowed_selections
    )
    db.add(new_election)
    db.commit()
    db.refresh(new_election)
    
    for candidate in election.candidates:
        new_candidate = models.Candidate(
            election_id=new_election.id,
            name=candidate.name,
            bio=candidate.bio,
            photo_url=candidate.photo_url
        )
        db.add(new_candidate)
    
    db.commit()
    db.refresh(new_election)
    return new_election

@router.post("/{election_id}/end")
async def end_election(election_id: int, user_id: int = 1, db: Session = Depends(get_db)):
    """End an election immediately (Board Only - user_id check mocked)."""
    # In real app verify user.role == 'board'
    
    election = db.query(models.Election).filter(models.Election.id == election_id).first()
    if not election:
        raise HTTPException(status_code=404, detail="Election not found")
        
    election.end_date = datetime.now()
    # election.is_active = False # Optional: explicitly mark inactive if logic depends on it, but date check should suffice
    
    db.commit()
    return {"message": "Election ended successfully"}

# --- Voting ---

@router.post("/vote")
async def cast_vote(vote: schemas.VoteCreate, user_id: int = 1, db: Session = Depends(get_db)):
    """Cast a vote for candidate(s). user_id should come from auth."""
    # 1. Check if election is active
    election = db.query(models.Election).filter(models.Election.id == vote.election_id).first()
    if not election:
        raise HTTPException(status_code=404, detail="Election not found")
    
    now = datetime.now()
    if now < election.start_date or now > election.end_date:
        raise HTTPException(status_code=400, detail="Election is not currently open for voting")

    # 2. Check if user already voted
    existing_record = db.query(models.VoterRecord).filter(
        models.VoterRecord.election_id == vote.election_id,
        models.VoterRecord.user_id == user_id
    ).first()
    
    if existing_record:
        raise HTTPException(status_code=400, detail="You have already cast a vote in this election")

    # 3. Validate selections
    if len(vote.candidate_ids) > election.allowed_selections:
        raise HTTPException(status_code=400, detail=f"You can only select up to {election.allowed_selections} candidates")

    if not vote.candidate_ids:
        raise HTTPException(status_code=400, detail="No candidates selected")

    # 4. Record the votes (Anonymous - not linked to user)
    for cid in vote.candidate_ids:
        new_vote = models.Vote(
            election_id=vote.election_id,
            candidate_id=cid
        )
        db.add(new_vote)
    
    # 5. Record the participation (Linked to user)
    voter_record = models.VoterRecord(
        election_id=vote.election_id,
        user_id=user_id
    )
    db.add(voter_record)
    
    db.commit()
    return {"message": "Vote cast successfully"}

# --- Results ---

@router.get("/{election_id}/results", response_model=schemas.ElectionSummary)
async def get_election_results(election_id: int, db: Session = Depends(get_db)):
    """Get results for a specific election."""
    election = db.query(models.Election).filter(models.Election.id == election_id).first()
    if not election:
        raise HTTPException(status_code=404, detail="Election not found")
        
    vote_counts = {}
    total_votes = 0
    
    # Initialize counts for all candidates
    for candidate in election.candidates:
        vote_counts[candidate.id] = {
            "name": candidate.name,
            "count": 0
        }
        
    # Count votes
    votes = db.query(models.Vote).filter(models.Vote.election_id == election_id).all()
    for vote in votes:
        if vote.candidate_id in vote_counts:
            vote_counts[vote.candidate_id]["count"] += 1
            total_votes += 1
            
    results = [
        schemas.ElectionResult(
            candidate_id=cid,
            candidate_name=data["name"],
            vote_count=data["count"]
        )
        for cid, data in vote_counts.items()
    ]
    
    return schemas.ElectionSummary(
        election_id=election.id,
        election_title=election.title,
        total_votes=total_votes,
        results=results
    )
