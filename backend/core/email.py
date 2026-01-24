
import aiosmtplib
from email.message import EmailMessage
from typing import Optional
from backend.core.config import settings

async def send_email_async(to_email: str, subject: str, html_content: str) -> bool:
    """
    Send an email asynchronously using aiosmtplib.
    """
    if not settings.MAIL_USERNAME or not settings.MAIL_PASSWORD:
        print("Email credentials not set. Skipping email.")
        return False

    message = EmailMessage()
    message["From"] = settings.MAIL_FROM
    message["To"] = to_email
    message["Subject"] = subject
    message.set_content(html_content, subtype="html")

    try:
        await aiosmtplib.send(
            message,
            hostname=settings.MAIL_SERVER,
            port=settings.MAIL_PORT,
            username=settings.MAIL_USERNAME,
            password=settings.MAIL_PASSWORD,
            use_tls=settings.MAIL_SSL_TLS,
            start_tls=settings.MAIL_STARTTLS,
            validate_certs=settings.VALIDATE_CERTS,
        )
        print(f"Email sent successfully to {to_email}")
        return True
    except Exception as e:
        print(f"Failed to send email to {to_email}: {e}")
        return False

async def send_password_reset_email(to_email: str, token: str):
    """
    Send password reset email.
    """
    reset_link = f"{settings.FRONTEND_URL}/reset-password?token={token}"
    
    html = f"""
    <p>You have requested to reset your password.</p>
    <p>Click the link below to reset it:</p>
    <p><a href="{reset_link}">{reset_link}</a></p>
    <p>If you did not request this, please ignore this email.</p>
    """
    
    return await send_email_async(to_email, "Password Reset Request", html)

async def send_invitation_email(to_email: str, temp_password: Optional[str] = None):
    """
    Send invitation email with temporary password.
    """
    html = f"""
    <h3>Welcome to {settings.PROJECT_NAME}</h3>
    <p>You have been invited to join the platform.</p>
    """
    
    if temp_password:
        html += f"<p>Your temporary password is: <strong>{temp_password}</strong></p>"
        html += "<p>Please login and change your password immediately.</p>"
    
    return await send_email_async(to_email, f"Welcome to {settings.PROJECT_NAME}", html)
