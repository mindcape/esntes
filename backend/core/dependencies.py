from fastapi import Depends, HTTPException, status
from backend.auth.dependencies import get_current_user
from backend.auth.models import User

def require_module(module_name: str):
    def module_checker(current_user: User = Depends(get_current_user)):
        # Super admin bypass
        if current_user.role == "super_admin":
            return current_user
            
        if not current_user.community:
             raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, 
                detail="User is not associated with any community"
            )

        modules = current_user.community.modules_enabled or {}
        # Default to False if module not found in config
        if not modules.get(module_name, False):
             raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, 
                detail=f"Module '{module_name}' is not enabled for this community"
            )
        return current_user
    return module_checker
