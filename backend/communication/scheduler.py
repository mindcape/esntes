from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy.orm import Session
from backend.core.database import SessionLocal
from backend.communication.models import EmailQueue, EmailStatus, Campaign, CampaignStatus
from datetime import datetime
import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from backend.core.config import settings

logger = logging.getLogger(__name__)

scheduler = BackgroundScheduler()

def send_email_smtp(to_email: str, subject: str, html_body: str):
    """
    Synchronous SMTP send.
    In production, use settings for host/port/auth.
    """
    msg = MIMEMultipart()
    msg['From'] = settings.MAIL_FROM
    msg['To'] = to_email
    msg['Subject'] = subject
    msg.attach(MIMEText(html_body, 'html'))

    try:
        # Mocking or Actual Send based on config
        if not settings.MAIL_SERVER:
            print(f"MOCK EMAIL TO {to_email}: {subject}")
            return True

        with smtplib.SMTP(settings.MAIL_SERVER, settings.MAIL_PORT) as server:
            if settings.MAIL_STARTTLS:
                server.starttls()
            if settings.MAIL_USERNAME and settings.MAIL_PASSWORD:
                server.login(settings.MAIL_USERNAME, settings.MAIL_PASSWORD)
            server.send_message(msg)
        return True
    except Exception as e:
        logger.error(f"SMTP Error sending to {to_email}: {e}")
        return False

def process_email_queue():
    """
    Scheduled Job:
    1. Fetch PENDING emails from DB (Limit 50).
    2. Try to send.
    3. Update status.
    """
    db = SessionLocal()
    try:
        # 1. Fetch
        emails = db.query(EmailQueue).filter(
            EmailQueue.status == EmailStatus.PENDING
        ).limit(50).all()
        
        if not emails:
            return

        logger.info(f"Processing {len(emails)} emails from queue...")
        
        for email in emails:
            # 2. Send
            success = send_email_smtp(email.recipient_email, email.subject, email.body)
            
            # 3. Update
            if success:
                email.status = EmailStatus.SENT
                if email.campaign_id:
                     # Update Campaign Stats (Simple counter increment)
                     # Note: Prone to race conditions if high concurrency, but fine for single worker
                     campaign = db.query(Campaign).filter(Campaign.id == email.campaign_id).first()
                     if campaign:
                         campaign.sent_count = (campaign.sent_count or 0) + 1
            else:
                email.status = EmailStatus.FAILED
                email.attempts += 1
                if email.attempts < 3:
                     # Retry logic: Reset to PENDING if < max retries ? 
                     # For now, just mark FAILED or RETRY
                     email.status = EmailStatus.RETRY
                
                if email.campaign_id:
                     campaign = db.query(Campaign).filter(Campaign.id == email.campaign_id).first()
                     if campaign:
                         campaign.failed_count = (campaign.failed_count or 0) + 1

            email.updated_at = datetime.utcnow()
            db.commit()
            
    except Exception as e:
        logger.error(f"Error in process_email_queue: {e}")
    finally:
        db.close()

def init_scheduler():
    if not scheduler.running:
        # Add Job running every 60 seconds
        scheduler.add_job(process_email_queue, 'interval', seconds=60)
        scheduler.start()
        logger.info("APScheduler started.")
