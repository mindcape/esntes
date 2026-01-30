from sqlalchemy.orm import Session
from sqlalchemy import or_
from backend.communication.models import Campaign, CampaignStatus, EmailQueue, MessageTemplate
from backend.auth.models import User
from datetime import datetime
import json

class CampaignService:
    def __init__(self, db: Session):
        self.db = db

    def create_campaign(self, title: str, template_id: int, audience_filter: dict, scheduled_at: datetime, community_id: int, user_id: int):
        """Create a new campaign and queue emails if ready"""
        campaign = Campaign(
            title=title,
            template_id=template_id,
            audience_filter=audience_filter,
            scheduled_at=scheduled_at,
            community_id=community_id,
            created_by_id=user_id,
            status=CampaignStatus.SCHEDULED
        )
        self.db.add(campaign)
        self.db.commit()
        self.db.refresh(campaign)
        
        # Resolve Audience & Enqueue
        self._queue_emails(campaign)
        return campaign

    def _get_target_users(self, community_id: int, filters: dict):
        """Translate JSON filters to SQLAlchemy Query"""
        query = self.db.query(User).filter(User.community_id == community_id)
        
        # 1. Role Filter
        if filters.get("role"):
            # Assuming Role name join or if User has role_id, need to join Role table
            # For simplicity let's assume filters pass ID or exact name logic matching your User/Role model
            # Re-using User.role relationship if necessary
            from backend.auth.models import Role
            query = query.join(Role).filter(Role.name == filters["role"])
            
        # 2. Status Filters (e.g. Delinquent)
        if filters.get("is_delinquent"):
            # Pseudo-code: Join Delinquency table or check User.balance > 0 if field exists
            pass 
        
        # 3. Violation Filters
        if filters.get("has_violation"):
            pass

        return query.all()

    def _queue_emails(self, campaign: Campaign):
        """Generate EmailQueue items for each target user"""
        template = self.db.query(MessageTemplate).get(campaign.template_id)
        if not template:
            return 
            
        target_users = self._get_target_users(campaign.community_id, campaign.audience_filter)
        campaign.total_recipients = len(target_users)
        
        for user in target_users:
            # Render Template (Simple replace for now)
            # In production use Jinja2
            subject = template.subject_template.replace("{{first_name}}", user.full_name or "Resident")
            body = template.content_html.replace("{{first_name}}", user.full_name or "Resident")
            
            queue_item = EmailQueue(
                campaign_id=campaign.id,
                recipient_id=user.id,
                recipient_email=user.email,
                subject=subject,
                body=body,
                status="PENDING" 
            )
            self.db.add(queue_item)
            
        self.db.commit()
    
campaign_service = CampaignService
