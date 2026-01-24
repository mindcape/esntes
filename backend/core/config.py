
import os

class Settings:
    PROJECT_NAME: str = "ESNTES HOA Manager"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super-secret-key-please-change-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 1 week
    
    # Email Settings
    MAIL_USERNAME: str = os.getenv("MAIL_USERNAME")
    MAIL_PASSWORD: str = os.getenv("MAIL_PASSWORD")
    MAIL_FROM: str = os.getenv("MAIL_FROM", "noreply@esntes.com")
    MAIL_PORT: int = int(os.getenv("MAIL_PORT", 587))
    MAIL_SERVER: str = os.getenv("MAIL_SERVER", "smtp.gmail.com")
    MAIL_STARTTLS: bool = os.getenv("MAIL_STARTTLS", "True") == "True"
    MAIL_SSL_TLS: bool = os.getenv("MAIL_SSL_TLS", "False") == "True"
    USE_CREDENTIALS: bool = True
    VALIDATE_CERTS: bool = os.getenv("MAIL_VALIDATE_CERTS", "True") == "True"

    # Stripe
    STRIPE_SECRET_KEY: str = os.getenv("STRIPE_SECRET_KEY", "sk_test_placeholder")
    STRIPE_PUBLISHABLE_KEY: str = os.getenv("STRIPE_PUBLISHABLE_KEY", "pk_test_placeholder")
    STRIPE_WEBHOOK_SECRET: str = os.getenv("STRIPE_WEBHOOK_SECRET", "whsec_placeholder")

    # Frontend URL for Password Reset Links
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")
    
    # MFA Settings
    MFA_ISSUER_NAME: str = "ESNTES HOA"

settings = Settings()
