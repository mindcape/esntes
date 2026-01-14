from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from backend.documents.models import AccessLevel, DocumentCategory

class DocumentBase(BaseModel):
    title: str
    category: DocumentCategory
    access_level: AccessLevel
    description: Optional[str] = None
    file_url: Optional[str] = None

class DocumentCreate(DocumentBase):
    file_url: str

class Document(DocumentBase):
    id: int
    upload_date: datetime
    uploaded_by: str

    class Config:
        orm_mode = True
