from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from backend.core.database import get_db
from backend.documents import models, schemas

router = APIRouter()

@router.get("/", response_model=List[schemas.Document])
async def get_documents(
    user_role: str = "resident", 
    category: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get accessible documents based on user role"""
    query = db.query(models.Document)
    
    if user_role != "board":
        query = query.filter(models.Document.access_level == models.AccessLevel.PUBLIC)
        
    if category:
        query = query.filter(models.Document.category == category)
        
    return query.all()

@router.post("/", response_model=schemas.Document)
async def upload_document(
    document: schemas.DocumentCreate,
    db: Session = Depends(get_db)
):
    """Upload new document (Board/Management only)"""
    # In a real app, check user permissions here or via dependency
    db_document = models.Document(
        **document.dict(), 
        uploaded_by="Board Admin" # In real app, get from auth context
    )
    db.add(db_document)
    db.commit()
    db.refresh(db_document)
    return db_document

@router.delete("/{document_id}")
async def delete_document(
    document_id: int,
    db: Session = Depends(get_db)
):
    """Delete document (Board/Management only)"""
    db_document = db.query(models.Document).filter(models.Document.id == document_id).first()
    if not db_document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    db.delete(db_document)
    db.commit()
    return {"message": "Document deleted successfully"}
