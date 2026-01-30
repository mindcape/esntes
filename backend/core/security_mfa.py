import pyotp
from backend.core.config import settings

class MFASecurity:
    def generate_secret(self) -> str:
        """Generate a random base32 secret"""
        return pyotp.random_base32()

    def get_totp_uri(self, secret: str, user_email: str) -> str:
        """Generate the provisioning URI for QR codes"""
        return pyotp.totp.TOTP(secret).provisioning_uri(
            name=user_email,
            issuer_name=settings.MFA_ISSUER_NAME
        )

    def verify_totp(self, secret: str, token: str) -> bool:
        """Verify the token against the secret"""
        totp = pyotp.TOTP(secret)
        return totp.verify(token)

mfa_security = MFASecurity()
