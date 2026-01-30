
import re
from sqlalchemy.orm import Session
from backend.auth.models import User

def generate_user_code(db: Session, role_name: str, address: str = None) -> str:
    """
    Generate a unique user code.
    - Admins: ADM1, ADM2...
    - Residents: Based on address (e.g. 5902 Park Creste Dr -> 5902PCD)
    """
    
    if role_name in ['admin', 'super_admin', 'board', 'treasurer', 'president', 'vice_president']:
        # Admin Scheme
        prefix = "ADM"
        # Find max ADM sequence
        # This is simple but allows gaps. Good enough?
        last_admin = db.query(User).filter(User.user_code.like(f"{prefix}%")).order_by(User.id.desc()).first()
        
        if last_admin and last_admin.user_code:
            try:
                num = int(last_admin.user_code.replace(prefix, ""))
                return f"{prefix}{num + 1}"
            except ValueError:
                return f"{prefix}1"
        return f"{prefix}1"
        
    else:
        # Resident Scheme (Address Based)
        if not address:
            # Fallback if no address provided?
            # Generate random or generic
            import uuid
            return f"R-{str(uuid.uuid4())[:6].upper()}"
            
        # Logic: Extract numbers + First letter of words
        # 1. Get number
        number_match = re.match(r"^\d+", address)
        number = number_match.group(0) if number_match else ""
        
        # 2. Get Street Words
        # Remove number
        rest = address[len(number):].strip()
        words = rest.split()
        
        # Take first letter of first 3 words
        initials = "".join([w[0].upper() for w in words[:3] if w[0].isalnum()])
        
        base_code = f"{number}{initials}"
        
        if not base_code:
             # Fallback
             import uuid
             return f"RES-{str(uuid.uuid4())[:6].upper()}"
             
        # Check Uniqueness
        existing = db.query(User).filter(User.user_code == base_code).first()
        if not existing:
            return base_code
            
        # Collision Handling
        counter = 1
        while True:
            new_code = f"{base_code}-{counter}"
            if not db.query(User).filter(User.user_code == new_code).first():
                return new_code
            counter += 1
