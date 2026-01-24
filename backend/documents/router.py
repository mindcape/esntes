from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from backend.core.database import get_db
from backend.documents import models, schemas
from backend.auth.models import User
from backend.auth.dependencies import get_current_user
from backend.community.models import Community

router = APIRouter()

@router.get("/{community_id}/documents", response_model=List[schemas.Document])
async def get_documents(
    community_id: int,
    user_role: str = "resident", 
    category: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get accessible documents based on user role and community"""
    # Verify community
    community = db.query(Community).filter(Community.id == community_id).first()
    if not community:
        raise HTTPException(status_code=404, detail="Community not found")

    # Authorize access to community
    if current_user.community_id != community_id and current_user.role_id != 3: # 3 is Super Admin
         raise HTTPException(status_code=403, detail="Not a member of this community")

    query = db.query(models.Document).filter(
        models.Document.community_id == community_id
    )
    
    # Filtering based on role. If the provided role param mismatches actual role, defaults to safest (resident) logic?
    # Or just use current_user.role.name.
    # The user_role param is passed from frontend, but we should trust current_user more.
    # However, frontend logic might be simpler with param. Let's stick closer to previous logic but validated.
    
    # Check if user is board member
    is_board = (current_user.role and current_user.role.name in ['board', 'admin']) or current_user.role_id == 3
    
    if not is_board:
        query = query.filter(models.Document.access_level == models.AccessLevel.PUBLIC)
        
    if category and category != 'all':
        query = query.filter(models.Document.category == category)
        
    return query.all()

@router.post("/{community_id}/documents", response_model=schemas.Document)
async def upload_document(
    community_id: int,
    document: schemas.DocumentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Upload new document (Board/Management only)"""
    # Verify community
    community = db.query(Community).filter(Community.id == community_id).first()
    if not community:
        raise HTTPException(status_code=404, detail="Community not found")

    if current_user.community_id != community_id and current_user.role_id != 3:
         raise HTTPException(status_code=403, detail="Access denied")

    # Permission check
    if not (current_user.role and current_user.role.name in ['board', 'admin']) and current_user.role_id != 3:
        raise HTTPException(status_code=403, detail="Only board members can upload documents")

    db_document = models.Document(
        **document.dict(), 
        uploaded_by=current_user.full_name,
        community_id=community_id
    )
    db.add(db_document)
    db.commit()
    db.refresh(db_document)
    return db_document

@router.delete("/{community_id}/documents/{document_id}")
async def delete_document(
    community_id: int,
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete document (Board/Management only)"""
    # Verify community
    community = db.query(Community).filter(Community.id == community_id).first()
    if not community:
        raise HTTPException(status_code=404, detail="Community not found")

    if current_user.community_id != community_id and current_user.role_id != 3:
         raise HTTPException(status_code=403, detail="Access denied")
         
    # Permission check
    if not (current_user.role and current_user.role.name in ['board', 'admin']) and current_user.role_id != 3:
        raise HTTPException(status_code=403, detail="Only board members can delete documents")

    db_document = db.query(models.Document).filter(models.Document.id == document_id, models.Document.community_id == community_id).first()
    if not db_document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    db.delete(db_document)
    db.commit()
    return {"message": "Document deleted successfully"}
