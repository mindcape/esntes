import requests
import os
import logging

# Configure logging
logger = logging.getLogger(__name__)

RECAPTCHA_SECRET_KEY = os.getenv("RECAPTCHA_SECRET_KEY")

def verify_captcha_token(token: str) -> bool:
    """
    Verifies the Google reCAPTCHA v2 token.
    Returns True if valid, False otherwise.
    """
    if not RECAPTCHA_SECRET_KEY:
        logger.error("reCAPTCHA misconfigured: Missing SECRET KEY")
        return False

    url = "https://www.google.com/recaptcha/api/siteverify"
    
    payload = {
        "secret": RECAPTCHA_SECRET_KEY,
        "response": token
    }
    
    try:
        response = requests.post(url, data=payload)
        response.raise_for_status()
        result = response.json()
        
        logger.info(f"reCAPTCHA v2 Result: {result}")

        if result.get("success"):
            return True
            
        logger.warning(f"Invalid CAPTCHA: {result.get('error-codes')}")
        return False
        
    except Exception as e:
        logger.error(f"Error verifying CAPTCHA: {e}")
        return False
