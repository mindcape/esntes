import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from backend.core.database import get_db
from backend.auth.models import User
from backend.community.models import Community
from backend.auth.security import verify_password, get_password_hash, create_access_token
from typing import Optional, Union
from backend.auth.captcha import verify_captcha_token

router = APIRouter()

# Schema for Login
class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    captcha_token: Optional[str] = None

class SetupAccountRequest(BaseModel):
    community_code: str
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict

@router.post("/login", response_model=Union[Token, dict])
def login(request: LoginRequest, db: Session = Depends(get_db)):
    import logging
    logger = logging.getLogger(__name__)
    
    # Find user by email
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        logger.warning(f"Login attempt failed: User not found for email {request.email}")
        # To prevent enumeration, we just return generic error. 
        # But for "failed attempts limiting", we technically need to track non-existent users too if we want to block IP.
        # However, requirement says "login fails after 2 tries", usually implies user account lock/captcha.
        # We will proceed with generic response but maybe random delay.
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    
    # Check Failed Attempts
    if user.failed_login_attempts >= 2:
        if not request.captcha_token:
            logger.info(f"Login attempt for {request.email}: CAPTCHA required (failed attempts: {user.failed_login_attempts})")
            # Tell frontend to show captcha
            return {
                "captcha_required": True,
                "message": "Too many failed attempts. Please complete CAPTCHA."
            }
        
        # Verify Captcha
        if not verify_captcha_token(request.captcha_token):
             logger.warning(f"Login attempt for {request.email}: Invalid CAPTCHA")
             raise HTTPException(status_code=400, detail="Invalid CAPTCHA")

    # Check password
    if not user.hashed_password or not verify_password(request.password, user.hashed_password):
        # Increment failed attempts
        user.failed_login_attempts += 1
        db.commit()
        
        logger.warning(f"Login attempt failed for {request.email}: Incorrect password (attempt {user.failed_login_attempts})")
        
        detail_msg = "Incorrect email or password"
        if user.failed_login_attempts >= 2:
            detail_msg = "Incorrect email or password. CAPTCHA required for next attempt."
            
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail_msg,
        )
    
    # Check if active
    if not user.is_active:
         logger.warning(f"Login attempt failed for {request.email}: User account is inactive")
         raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user",
        )

    # Success: Reset attempts
    user.failed_login_attempts = 0
    db.commit()

    # Check MFA
    if user.mfa_enabled:
        logger.info(f"Login for {request.email}: MFA verification required")
        return {
             "mfa_required": True,
             "email": user.email, 
             "message": "MFA code required"
        } 

    # Generate Token
    access_token = create_access_token(subject=user.id)
    
    # Return user info along with token
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
        user_data["community"] = {
            "name": user.community.name,
            "modules_enabled": user.community.modules_enabled if isinstance(user.community.modules_enabled, dict) else (
                json.loads(user.community.modules_enabled) if user.community.modules_enabled else {}
            )
        }
        
    # Vendor specific data
    if user.role and user.role.name == 'vendor':
        from backend.vendor.models import Vendor
        vendor_profile = db.query(Vendor).filter(Vendor.user_id == user.id).first()
        if vendor_profile:
            user_data["vendor_id"] = vendor_profile.id
    
    logger.info(f"Login successful for {request.email} (user_id: {user.id}, role: {user.role.name if user.role else 'resident'}, community_id: {user.community_id})")
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user": user_data
    }

@router.post("/setup-account", response_model=Token)
def setup_account(request: SetupAccountRequest, db: Session = Depends(get_db)):
    # 1. Validate Community Code
    community = db.query(Community).filter(Community.community_code == request.community_code).first()
    if not community:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid Community Code",
        )
    
    # 2. Find User by Email AND Community
    user = db.query(User).filter(
        User.email == request.email, 
        User.community_id == community.id
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found in this community. Please contact your board to be added.",
        )
    
    # 3. Check if already setup
    if user.is_setup_complete:
         raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account already setup. Please login.",
        )
        
    # 4. Set Password and Mark Complete
    user.hashed_password = get_password_hash(request.password)
    user.is_setup_complete = True
    db.commit()
    db.refresh(user)
    
    # 5. Generate Token and Login
    access_token = create_access_token(subject=user.id)
    
    user_data = {
        "id": user.id,
        "email": user.email,
        "name": user.full_name,
        "role": user.role.name if user.role else "resident",
        "community_id": user.community_id,
        "is_setup_complete": user.is_setup_complete,
         "community": {
            "name": community.name,
            "modules_enabled": community.modules_enabled
        }
    }

    return {
        "access_token": access_token, 
        "token_type": "bearer", 
        "user": user_data
    }

# --- Advanced Auth Endpoints ---

from datetime import datetime, timedelta
import uuid
import pyotp
from backend.core.email import send_password_reset_email
from backend.auth.dependencies import get_current_user

class ForgotPasswordRequest(BaseModel):
    email: EmailStr
    captcha_token: str # Mock captcha

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

class MFAVerifyRequest(BaseModel):
    code: str

@router.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):


    # 1. Verify Captcha
    if not request.captcha_token or not verify_captcha_token(request.captcha_token):
        raise HTTPException(status_code=400, detail="Invalid CAPTCHA")
    
    # 2. Find User
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        # Prevent email enumeration: return success even if not found
        return {"message": "If an account exists, a password reset email has been sent."}
    
    # 3. Generate Token
    token = str(uuid.uuid4())
    user.reset_token = token
    user.reset_token_expires = datetime.utcnow() + timedelta(hours=1)
    db.commit()
    
    # 4. Send Email
    await send_password_reset_email(user.email, token)
    
    return {"message": "If an account exists, a password reset email has been sent."}

@router.post("/reset-password")
async def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    # 1. Find User by Token
    user = db.query(User).filter(User.reset_token == request.token).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
        
    # 2. Check Expiry
    if user.reset_token_expires < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Token expired")
        
    # 3. Reset Password
    user.hashed_password = get_password_hash(request.new_password)
    user.reset_token = None
    user.reset_token_expires = None
    user.is_active = True # Re-activate if needed
    db.commit()
    
    return {"message": "Password has been reset successfully. Please login."}


