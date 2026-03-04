import sys
import os
from datetime import datetime

# Add root project dir to path to import backend modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from backend.core.database import SessionLocal
from backend.communication.models import MessageTemplate
from backend.community.models import Community
from backend.auth.models import User # Ensure User model is loaded for SQLAlchemy relationships

def seed_templates():
    db = SessionLocal()
    try:
        # Assuming we just attach these to all communities, or the first community for now.
        # In a real multi-tenant app, maybe system templates belong to a null community, 
        # or we duplicate them for each community. We will attach to community 1 for demonstration.
        community = db.query(Community).first()
        if not community:
            print("No community found. Run seed_db.py first.")
            return

        community_id = community.id

        templates = [
            {
                "name": "System: Annual Meeting Notice",
                "category": "Meetings",
                "is_system": True,
                "subject_template": "Notice of Annual Meeting - Action Required",
                "content_html": "<h2>Annual Association Meeting</h2><p>Dear {{first_name}},</p><p>Please join us for the annual community meeting, where we will discuss the year's achievements, upcoming projects, and vote on new board members.</p><p>Review the attached documents for the agenda.</p><br><p>Best regards,<br>The Board</p>"
            },
            {
                "name": "System: Quarterly Update",
                "category": "Meetings",
                "is_system": True,
                "subject_template": "Quarterly Community Update",
                "content_html": "<h2>Quarterly Update</h2><p>Hi {{first_name}},</p><p>Here is your quarterly community update. We've accomplished a lot this quarter!</p><br><p>Thanks,<br>Management Team</p>"
            },
            {
                "name": "System: Monthly Newsletter",
                "category": "Newsletter",
                "is_system": True,
                "subject_template": "Your Community Monthly Newsletter",
                "content_html": "<h2>Monthly Newsletter</h2><p>Welcome to this month's newsletter, {{first_name}}!</p><p>Catch up on the latest events and community news.</p>"
            },
            {
                "name": "System: Urgent Alert (Weather/Safety)",
                "category": "Alerts",
                "is_system": True,
                "subject_template": "URGENT: Community Safety & Weather Alert",
                "content_html": "<h2 style='color: red;'>URGENT ALERT</h2><p>Dear {{first_name}},</p><p>Please be advised of an urgent situation affecting the community. Your safety is our priority. See the details below and take appropriate action.</p>"
            },
            {
                "name": "System: Budget Update",
                "category": "Financial",
                "is_system": True,
                "subject_template": "Important: Budget & Financial Update",
                "content_html": "<h2>Budget & Financial Update</h2><p>Dear {{first_name}},</p><p>We are writing to provide you with the latest financial updates for our community, including the upcoming year's approved budget.</p><p>Please review the attached documents for a detailed breakdown.</p>"
            },
            {
                "name": "System: Vendor / Maintenance Notice",
                "category": "Maintenance",
                "is_system": True,
                "subject_template": "Notice: Upcoming Maintenance Work",
                "content_html": "<h2>Maintenance Notice</h2><p>Hi {{first_name}},</p><p>Please be advised that maintenance work will be occurring soon in the community. Expect potential disruptions or noise during the hours outlined.</p><p>Thank you for your patience.</p>"
            }
        ]

        for t_data in templates:
            existing = db.query(MessageTemplate).filter_by(
                name=t_data["name"], community_id=community_id
            ).first()
            if existing:
                print(f"Template '{t_data['name']}' already exists.")
            else:
                new_template = MessageTemplate(
                    name=t_data["name"],
                    category=t_data["category"],
                    is_system=t_data["is_system"],
                    subject_template=t_data["subject_template"],
                    content_html=t_data["content_html"],
                    community_id=community_id,
                    created_by_id=1 # Assuming user 1 is system/admin
                )
                db.add(new_template)
                print(f"Created template: {t_data['name']}")
        
        db.commit()
        print("Template seeding complete!")

    finally:
        db.close()

if __name__ == "__main__":
    seed_templates()
