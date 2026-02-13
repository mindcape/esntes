from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from backend.core.storage import storage
from backend.auth.dependencies import get_current_user
from backend.auth.models import User
import uuid
import os

router = APIRouter()

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """
    Generic file upload endpoint.
    Saves file to configured storage (Local or S3) and returns the URL/Key.
    """
    # Validate file type
    ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.pdf'}
    ALLOWED_CONTENT_TYPES = {'image/jpeg', 'image/png', 'application/pdf'}
    
    file_ext = os.path.splitext(file.filename)[1].lower()
    
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid file extension. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
        )
        
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        # Optional: strictly enforce content-type. 
        # Browsers might send different types, but for these standard formats it's usually safe.
        # To be safe against spoofing, we rely mostly on extension + maybe python-magic in future.
        # For now, let's warn or enforce if we are sure. 
        # Let's enforce for now as requested to avoid 'virus documents' (basic filter).
         raise HTTPException(
            status_code=400, 
            detail=f"Invalid content type. Allowed types: {', '.join(ALLOWED_CONTENT_TYPES)}"
        )

    # Validate file size (10MB limit)
    MAX_FILE_SIZE = 10 * 1024 * 1024 # 10MB
    
    # Seek to end to get size
    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0) # Reset cursor
    
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail="File size exceeds the 10MB limit."
        )

    # Generate unique filename to prevent collisions
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    
    # Determine folder based on community_id
    # If user is super_admin and no community_id, might go to 'common' or 'admin' folder?
    # For now, if no community_id, use 'public' or 'global'
    folder = f"community_{current_user.community_id}" if current_user.community_id else "global"
    
    try:
        # storage.save_file expects a file-like object
        saved_key = storage.save_file(file.file, unique_filename, sub_folder=folder)
        
        # Construct public URL
        # For local, it's /static/{saved_key} (as defined in adapter)
        
        url = storage.generate_presigned_url(saved_key)
        
        return {
            "filename": unique_filename,
            "key": saved_key,
            "url": url,
            "folder": folder
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File upload failed: {str(e)}")
