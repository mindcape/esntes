
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from backend.core.database import get_db
from backend.auth.models import User
from backend.auth.security import SECRET_KEY, ALGORITHM

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
        
    return user

def require_role(allowed_roles: list):
    def role_checker(current_user: User = Depends(get_current_user)):
        if not current_user.role or current_user.role.name not in allowed_roles:
            # Also allow Super Admin (role_id=3 or role_name='super_admin') globally? 
            # Ideally consistent string checks. Let's assume 'super_admin' is in allowed_roles if needed, or hardcode bypass.
            if current_user.role and current_user.role.name == 'super_admin':
                return current_user
            
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation not permitted. Requires role: {', '.join(allowed_roles)}"
            )
        return current_user
    return role_checker

def require_permission(permission_name: str):
    def permission_checker(current_user: User = Depends(get_current_user)):
        # 1. Super Admin Bypass
        if current_user.role and current_user.role.name == "super_admin":
            return current_user
            
        # 2. Check Permissions
        if current_user.role and current_user.role.permissions:
             for perm in current_user.role.permissions:
                 if perm.name == permission_name:
                     return current_user
        
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Operation not permitted. Requires permission: {permission_name}"
        )
    return permission_checker
