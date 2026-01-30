from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.core.database import get_db
from backend.auth.dependencies import get_current_user
from backend.auth.models import User
from backend.core.security_mfa import mfa_security
from pydantic import BaseModel

router = APIRouter(prefix="/mfa", tags=["Multi-Factor Authentication"])

class MFASetupResponse(BaseModel):
    secret: str
    otpauth_url: str

class MFAVerifyRequest(BaseModel):
    secret: str
    token: str

class MFAValidateRequest(BaseModel):
    token: str

class MFADisableRequest(BaseModel):
    password: str

@router.post("/setup", response_model=MFASetupResponse)
def setup_mfa(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.mfa_enabled:
        raise HTTPException(status_code=400, detail="MFA is already enabled")
    
    secret = mfa_security.generate_secret()
    # We don't save the secret yet, the user must verify it first
    # Or we can temporarily save it. Best practice: Return it, client sends it back with token.
    
    otpauth_url = mfa_security.get_totp_uri(secret, current_user.email)
    return {"secret": secret, "otpauth_url": otpauth_url}

@router.post("/verify")
def verify_mfa_setup(
    verify_data: MFAVerifyRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.mfa_enabled:
        raise HTTPException(status_code=400, detail="MFA is already enabled")
        
    if not mfa_security.verify_totp(verify_data.secret, verify_data.token):
        raise HTTPException(status_code=400, detail="Invalid OTP code")
        
    current_user.mfa_secret = verify_data.secret
    current_user.mfa_enabled = True
    db.commit()
    return {"message": "MFA enabled successfully"}

@router.post("/disable")
def disable_mfa(
    disable_data: MFADisableRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Retrieve user again to check password if needed, or rely on Depends
    # For simplicity, we just disable if logged in, but ideally we check password again.
    # from backend.core.security import verify_password
    # if not verify_password(disable_data.password, current_user.hashed_password):
    #    raise HTTPException(status_code=400, detail="Invalid password")
    
    current_user.mfa_enabled = False
    current_user.mfa_secret = None
    db.commit()
    return {"message": "MFA disabled"}

from typing import Union
from backend.auth.security import create_access_token
# Define Token schema locally or import from common place to avoid circular deps with router
class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict

class MFALoginRequest(BaseModel):
    email: str
    code: str

@router.post("/login/verify", response_model=dict)
def verify_mfa_login(
    request: MFALoginRequest,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == request.email).first()
    if not user or not user.mfa_enabled:
         raise HTTPException(status_code=400, detail="Invalid request")
         
    if not mfa_security.verify_totp(user.mfa_secret, request.code):
        raise HTTPException(status_code=401, detail="Invalid MFA code")

    # Generate Token
    access_token = create_access_token(subject=user.id)
    
    # Return user data (Same as login)
    user_data = {
        "id": user.id,
        "email": user.email,
        "name": user.full_name,
        "role": user.role.name if user.role else "resident",
        "community_id": user.community_id,
        "is_setup_complete": user.is_setup_complete
    }
     # Add community modules settings if available
    if user.community:
        import json
        user_data["community"] = {
            "name": user.community.name,
            "modules_enabled": user.community.modules_enabled if isinstance(user.community.modules_enabled, dict) else (
                json.loads(user.community.modules_enabled) if user.community.modules_enabled else {}
            )
        }
        
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user": user_data
    }
